-- ====================================================================
-- Migración: Importación de Listas de Productos en Armarios desde CSV
-- Fecha: 2026-11-03
-- ====================================================================
-- Añade funciones RPC seguras para aplicar y revertir importaciones
-- de productos masivos a ubicaciones específicas (armarios).
-- ====================================================================

-- 1. Asegurar columna import_batch_id en public.movimientos si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'movimientos' 
      AND column_name = 'import_batch_id'
  ) THEN
    ALTER TABLE public.movimientos ADD COLUMN import_batch_id UUID NULL;
    CREATE INDEX IF NOT EXISTS idx_movimientos_import_batch_id ON public.movimientos(import_batch_id);
  END IF;
END $$;

-- 2. Función RPC para procesar e importar la lista a un armario
CREATE OR REPLACE FUNCTION public.aplicar_importacion_lista_armario(
  p_id_ubicacion UUID,
  p_modo TEXT, -- 'sumar' o 'establecer'
  p_filas JSONB,
  p_usuario_id UUID,
  p_lote_id UUID DEFAULT gen_random_uuid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_es_admin BOOLEAN;
  v_fila JSONB;
  v_sku TEXT;
  v_ean TEXT;
  v_nombre TEXT;
  v_cantidad INTEGER;
  v_prod_id UUID;
  v_prod_creado BOOLEAN;
  v_stock_actual INTEGER;
  v_stock_nuevo INTEGER;
  v_tipo_mov TEXT;
  v_cant_mov INTEGER;
  v_filas_procesadas INTEGER := 0;
  v_prods_creados INTEGER := 0;
  v_movimientos_creados INTEGER := 0;
BEGIN
  -- Verificar permisos: solo usuarios administradores o autorizados
  SELECT (rol = 'admin' AND activo = true) INTO v_es_admin
  FROM public.perfiles_usuario
  WHERE id = p_usuario_id;

  IF v_es_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden importar listas a armarios.'
      USING ERRCODE = '42501';
  END IF;

  -- Validar que la ubicación existe y está activa
  IF NOT EXISTS (SELECT 1 FROM public.ubicaciones WHERE id = p_id_ubicacion AND activo = true) THEN
    RAISE EXCEPTION 'La ubicación destino no existe o está desactivada.'
      USING ERRCODE = 'P0002';
  END IF;

  -- Procesar cada fila del lote de forma atómica
  FOR v_fila IN SELECT * FROM jsonb_array_elements(p_filas)
  LOOP
    v_sku := trim(v_fila->>'sku');
    v_ean := trim(v_fila->>'codigo_barras');
    v_nombre := trim(v_fila->>'nombre');
    v_cantidad := (v_fila->>'cantidad')::INTEGER;
    v_prod_creado := false;

    -- Saltar filas sin sku o sin nombre
    IF v_sku IS NULL OR v_sku = '' OR v_nombre IS NULL OR v_nombre = '' THEN
      CONTINUE;
    END IF;

    -- 1. Buscar producto existente por SKU
    SELECT id INTO v_prod_id FROM public.productos WHERE sku = v_sku;

    -- Si no existe por SKU, verificar que el EAN no esté ocupado por otro producto
    IF v_prod_id IS NULL THEN
      IF v_ean IS NOT NULL AND v_ean <> '' THEN
        IF EXISTS (SELECT 1 FROM public.productos WHERE codigo_barras = v_ean) THEN
          RAISE EXCEPTION 'Conflicto: El código de barras % ya pertenece a otro producto en el catálogo.', v_ean
            USING ERRCODE = '23505';
        END IF;
      END IF;

      -- Crear producto nuevo con valores por defecto seguros
      INSERT INTO public.productos (
        sku,
        codigo_barras,
        nombre,
        descripcion,
        precio_unitario,
        activo,
        creado_por,
        creado_en
      ) VALUES (
        v_sku,
        COALESCE(NULLIF(v_ean, ''), v_sku),
        v_nombre,
        'Importado lista CSV',
        0.00,
        true,
        p_usuario_id,
        now()
      )
      RETURNING id INTO v_prod_id;

      v_prods_creados := v_prods_creados + 1;
      v_prod_creado := true;
    END IF;

    -- 2. Obtener el stock actual en la ubicación seleccionada
    SELECT COALESCE(cantidad, 0) INTO v_stock_actual
    FROM public.stock
    WHERE id_producto = v_prod_id AND id_ubicacion = p_id_ubicacion;

    IF v_stock_actual IS NULL THEN
      v_stock_actual := 0;
    END IF;

    -- 3. Calcular la nueva cantidad según el modo
    IF p_modo = 'sumar' THEN
      v_stock_nuevo := v_stock_actual + v_cantidad;
      v_tipo_mov := 'entrada';
      v_cant_mov := v_cantidad;
    ELSE -- modo 'establecer'
      v_stock_nuevo := v_cantidad;
      IF v_stock_nuevo = v_stock_actual THEN
        -- Sin cambios, continuar
        v_filas_procesadas := v_filas_procesadas + 1;
        CONTINUE;
      ELSIF v_stock_nuevo = 0 THEN
        v_tipo_mov := 'salida';
        v_cant_mov := v_stock_actual;
      ELSE
        v_tipo_mov := 'ajuste';
        v_cant_mov := v_stock_nuevo;
      END IF;
    END IF;

    -- 4. Registrar movimiento si hay unidades a operar
    IF v_cant_mov > 0 THEN
      INSERT INTO public.movimientos (
        id_producto,
        id_ubicacion,
        tipo,
        cantidad,
        notas,
        realizado_por,
        import_batch_id,
        fecha_movimiento
      ) VALUES (
        v_prod_id,
        p_id_ubicacion,
        v_tipo_mov,
        v_cant_mov,
        format('Importación lista armario | Modo: %s | Lote: %s | Stock anterior: %s, nuevo: %s', p_modo, p_lote_id, v_stock_actual, v_stock_nuevo),
        p_usuario_id,
        p_lote_id,
        now()
      );
      v_movimientos_creados := v_movimientos_creados + 1;
    END IF;

    v_filas_procesadas := v_filas_procesadas + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'exito', true,
    'lote_id', p_lote_id,
    'modo', p_modo,
    'filas_procesadas', v_filas_procesadas,
    'productos_creados', v_prods_creados,
    'movimientos_creados', v_movimientos_creados
  );
END;
$$;

-- 3. Función RPC para revertir un lote de importación
CREATE OR REPLACE FUNCTION public.revertir_lote_lista_armario(
  p_lote_id UUID,
  p_usuario_id UUID,
  p_desactivar_prods_nuevos BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_es_admin BOOLEAN;
  v_mov RECORD;
  v_stock_actual INTEGER;
  v_prods_creados_lote UUID[];
  v_conflictos_detectados INTEGER := 0;
  v_movimientos_revertidos INTEGER := 0;
  v_prods_desactivados INTEGER := 0;
BEGIN
  -- Verificar permisos
  SELECT (rol = 'admin' AND activo = true) INTO v_es_admin
  FROM public.perfiles_usuario
  WHERE id = p_usuario_id;

  IF v_es_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden revertir lotes.'
      USING ERRCODE = '42501';
  END IF;

  -- Verificar si el lote ya fue revertido
  IF EXISTS (
    SELECT 1 FROM public.movimientos 
    WHERE notas LIKE format('%%Reversión lote %s%%', p_lote_id)
  ) THEN
    RAISE EXCEPTION 'Este lote ya ha sido revertido previamente.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Comprobar que existen movimientos asociados a este lote
  IF NOT EXISTS (SELECT 1 FROM public.movimientos WHERE import_batch_id = p_lote_id) THEN
    RAISE EXCEPTION 'No se encontraron movimientos registrados para el lote especificado.'
      USING ERRCODE = 'P0002';
  END IF;

  -- Reversión de cada movimiento
  FOR v_mov IN 
    SELECT m.id, m.id_producto, m.id_ubicacion, m.tipo, m.cantidad, m.notas, m.fecha_movimiento
    FROM public.movimientos m
    WHERE m.import_batch_id = p_lote_id
  LOOP
    SELECT COALESCE(cantidad, 0) INTO v_stock_actual
    FROM public.stock
    WHERE id_producto = v_mov.id_producto AND id_ubicacion = v_mov.id_ubicacion;

    -- Si fue entrada, compensamos con salida
    IF v_mov.tipo = 'entrada' THEN
      IF v_stock_actual < v_mov.cantidad THEN
        v_conflictos_detectados := v_conflictos_detectados + 1;
      ELSE
        INSERT INTO public.movimientos (
          id_producto, id_ubicacion, tipo, cantidad, notas, realizado_por, fecha_movimiento
        ) VALUES (
          v_mov.id_producto,
          v_mov.id_ubicacion,
          'salida',
          v_mov.cantidad,
          format('Reversión compensatoria de entrada | Reversión lote %s', p_lote_id),
          p_usuario_id,
          now()
        );
        v_movimientos_revertidos := v_movimientos_revertidos + 1;
      END IF;
    END IF;
  END LOOP;

  -- Desactivar productos nuevos del lote si se solicitó y no tienen más movimientos
  IF p_desactivar_prods_nuevos THEN
    UPDATE public.productos p
    SET activo = false
    WHERE p.id IN (
      SELECT DISTINCT m.id_producto 
      FROM public.movimientos m 
      WHERE m.import_batch_id = p_lote_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.movimientos m2 
      WHERE m2.id_producto = p.id AND (m2.import_batch_id IS DISTINCT FROM p_lote_id)
    );
    GET DIAGNOSTICS v_prods_desactivados = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'exito', true,
    'lote_id', p_lote_id,
    'movimientos_revertidos', v_movimientos_revertidos,
    'conflictos_detectados', v_conflictos_detectados,
    'productos_desactivados', v_prods_desactivados
  );
END;
$$;
