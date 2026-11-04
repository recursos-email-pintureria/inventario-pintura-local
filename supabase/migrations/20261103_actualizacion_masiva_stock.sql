-- ==============================================================================
-- MIGRACIÓN: ACTUALIZACIÓN MASIVA DE STOCK POR EXCEL
-- Archivo: supabase/migrations/20261103_actualizacion_masiva_stock.sql
-- ==============================================================================
-- NOTA: NO APLICAR DIRECTAMENTE EN PRODUCCIÓN SIN PRUEBAS PREVIAS.
-- Para probar en local o en una BD de pruebas:
--   psql -h localhost -U postgres -d postgres -f supabase/migrations/20261103_actualizacion_masiva_stock.sql
-- O pegar en el SQL Editor del panel de Supabase.

BEGIN;

-- 1. Añadir columna import_batch_id a la tabla movimientos para trazabilidad de lotes
ALTER TABLE public.movimientos
ADD COLUMN IF NOT EXISTS import_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_movimientos_import_batch_id ON public.movimientos(import_batch_id);

-- 2. Función RPC para aplicar actualización masiva en una sola transacción atómica
CREATE OR REPLACE FUNCTION public.aplicar_actualizacion_masiva_stock(
  p_lote JSONB,
  p_usuario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_batch_id UUID := gen_random_uuid();
  v_item JSONB;
  v_prod_id UUID;
  v_ubi_id UUID;
  v_cant_nueva INTEGER;
  v_cant_base INTEGER;
  v_stock_actual INTEGER;
  v_tipo TEXT;
  v_cant_mov INTEGER;
  v_notas TEXT;
  v_filas_modificadas INTEGER := 0;
  v_is_admin BOOLEAN := false;
  v_puede_editar BOOLEAN := false;
BEGIN
  -- A. Validar que el usuario que ejecuta tenga permisos de administración o edición
  SELECT (rol = 'admin' AND activo = true) INTO v_is_admin
  FROM public.perfiles_usuario
  WHERE id = p_usuario_id;

  SELECT (puede_crear_productos = true OR puede_editar_productos = true) INTO v_puede_editar
  FROM public.permisos_usuario
  WHERE id_usuario = p_usuario_id;

  IF NOT (COALESCE(v_is_admin, false) OR COALESCE(v_puede_editar, false)) THEN
    RAISE EXCEPTION 'Acceso denegado: Se requieren permisos de administrador o gestor para actualizar stock masivamente'
      USING ERRCODE = '42501';
  END IF;

  -- B. Validar payload
  IF p_lote IS NULL OR jsonb_array_length(p_lote) = 0 THEN
    RAISE EXCEPTION 'El lote de actualización no contiene datos válidos';
  END IF;

  -- C. Iterar cada fila del lote de forma transaccional
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_lote)
  LOOP
    v_prod_id := (v_item->>'id_producto')::UUID;
    v_ubi_id := (v_item->>'id_ubicacion')::UUID;
    v_cant_nueva := (v_item->>'cantidad_nueva')::INTEGER;
    v_cant_base := (v_item->>'cantidad_base')::INTEGER;

    IF v_cant_nueva < 0 THEN
      RAISE EXCEPTION 'La cantidad nueva no puede ser negativa para el producto % en ubicación %', v_prod_id, v_ubi_id;
    END IF;

    -- Asegurar existencia de fila en stock y bloquearla para concurrencia
    INSERT INTO public.stock (id_producto, id_ubicacion, cantidad)
      VALUES (v_prod_id, v_ubi_id, 0)
      ON CONFLICT DO NOTHING;

    SELECT cantidad INTO v_stock_actual
    FROM public.stock
    WHERE id_producto = v_prod_id AND id_ubicacion = v_ubi_id
    FOR UPDATE;

    -- Validar conflicto de concurrencia si se especificó cantidad base
    IF v_cant_base IS NOT NULL AND v_cant_base != v_stock_actual THEN
      IF (v_item->>'forzar')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'Conflicto de concurrencia detectado en producto % (esperado %, actual %)',
          v_prod_id, v_cant_base, v_stock_actual
          USING ERRCODE = '40001';
      END IF;
    END IF;

    -- Si la cantidad nueva es exactamente la que ya hay, no se genera movimiento
    IF v_stock_actual = v_cant_nueva THEN
      CONTINUE;
    END IF;

    -- Determinar tipo y cantidad de movimiento respetando la restricción CHECK (cantidad > 0)
    IF v_cant_nueva = 0 THEN
      v_tipo := 'salida';
      v_cant_mov := v_stock_actual;
    ELSE
      v_tipo := 'ajuste';
      v_cant_mov := v_cant_nueva;
    END IF;

    v_notas := format('[LOTE: %s] Importación Excel. Anterior: %s, Nuevo: %s, Dif: %+d. Obs: %s',
      v_batch_id,
      v_stock_actual,
      v_cant_nueva,
      (v_cant_nueva - v_stock_actual),
      COALESCE(v_item->>'observaciones', 'Actualización masiva')
    );

    -- Registrar el movimiento (el trigger de PostgreSQL sincroniza public.stock)
    INSERT INTO public.movimientos (
      id_producto,
      id_ubicacion,
      tipo,
      cantidad,
      precio_unitario,
      notas,
      realizado_por,
      import_batch_id
    ) VALUES (
      v_prod_id,
      v_ubi_id,
      v_tipo,
      v_cant_mov,
      0,
      v_notas,
      p_usuario_id,
      v_batch_id
    );

    v_filas_modificadas := v_filas_modificadas + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'exito', true,
    'batch_id', v_batch_id,
    'filas_modificadas', v_filas_modificadas
  );
END;
$$;

-- 3. Función RPC para revertir un lote completo de importación
CREATE OR REPLACE FUNCTION public.revertir_lote_stock(
  p_batch_id UUID,
  p_usuario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_reversion_batch_id UUID := gen_random_uuid();
  v_mov RECORD;
  v_stock_actual INTEGER;
  v_filas_revertidas INTEGER := 0;
  v_stock_objetivo_anterior INTEGER;
  v_match TEXT[];
BEGIN
  -- Solo administradores pueden revertir
  SELECT (rol = 'admin' AND activo = true) INTO v_is_admin
  FROM public.perfiles_usuario
  WHERE id = p_usuario_id;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden revertir lotes de importación'
      USING ERRCODE = '42501';
  END IF;

  -- Comprobar si ya fue revertido previamente
  IF EXISTS (
    SELECT 1 FROM public.movimientos
    WHERE notas LIKE format('%%[REVERSIÓN DE LOTE: %s]%%', p_batch_id)
  ) THEN
    RAISE EXCEPTION 'El lote % ya ha sido revertido con anterioridad', p_batch_id;
  END IF;

  -- Iterar movimientos del lote original
  FOR v_mov IN
    SELECT * FROM public.movimientos
    WHERE import_batch_id = p_batch_id
    ORDER BY fecha_movimiento DESC
  LOOP
    -- Extraer el stock anterior desde las notas guardadas
    -- Formato: "[LOTE: ...] Importación Excel. Anterior: 10, Nuevo: ..."
    v_match := regexp_match(v_mov.notas, 'Anterior:\s*(-?[0-9]+)');
    IF v_match IS NULL OR v_match[1] IS NULL THEN
      RAISE EXCEPTION 'No se pudo recuperar el stock anterior para el movimiento %', v_mov.id;
    END IF;
    v_stock_objetivo_anterior := v_match[1]::INTEGER;

    -- Bloquear y comprobar stock actual
    SELECT cantidad INTO v_stock_actual
    FROM public.stock
    WHERE id_producto = v_mov.id_producto AND id_ubicacion = v_mov.id_ubicacion
    FOR UPDATE;

    -- Registrar movimiento compensatorio de reversión
    INSERT INTO public.movimientos (
      id_producto,
      id_ubicacion,
      tipo,
      cantidad,
      precio_unitario,
      notas,
      realizado_por,
      import_batch_id
    ) VALUES (
      v_mov.id_producto,
      v_mov.id_ubicacion,
      CASE WHEN v_stock_objetivo_anterior = 0 THEN 'salida' ELSE 'ajuste' END,
      CASE WHEN v_stock_objetivo_anterior = 0 THEN v_stock_actual ELSE v_stock_objetivo_anterior END,
      0,
      format('[REVERSIÓN DE LOTE: %s] Restablecido valor anterior: %s (actual era %s)',
        p_batch_id, v_stock_objetivo_anterior, v_stock_actual),
      p_usuario_id,
      v_reversion_batch_id
    );

    v_filas_revertidas := v_filas_revertidas + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'exito', true,
    'reversion_batch_id', v_reversion_batch_id,
    'filas_revertidas', v_filas_revertidas
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.aplicar_actualizacion_masiva_stock(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revertir_lote_stock(UUID, UUID) TO authenticated;

COMMIT;
