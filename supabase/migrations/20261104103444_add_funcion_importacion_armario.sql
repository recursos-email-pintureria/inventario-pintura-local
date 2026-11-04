CREATE OR REPLACE FUNCTION public.importar_lista_a_armario(
  p_items jsonb,
  p_ubicacion_id uuid,
  p_modo text,
  p_duplicados text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_actor uuid;
  v_lote_id uuid := pg_catalog.gen_random_uuid();
  v_item jsonb;
  v_fila bigint;
  v_sku text;
  v_codigo_barras text;
  v_nombre text;
  v_cantidad_texto text;
  v_cantidad numeric;
  v_cantidad_movimiento numeric;
  v_stock_actual integer;
  v_stock_resultante numeric;
  v_id_producto_sku uuid;
  v_id_producto_ean uuid;
  v_id_producto uuid;
  v_producto_activo boolean;
  v_es_nuevo boolean;
  v_aviso text;
  v_clave text;
  v_claves_procesadas text[] := ARRAY[]::text[];
  v_duplicados_grupo integer;
  v_resumen jsonb := pg_catalog.jsonb_build_object(
    'creados', 0,
    'actualizados', 0,
    'omitidos', 0,
    'errores', 0,
    'conflictos', 0
  );
  v_detalles jsonb := '[]'::jsonb;
  v_items_prevalidados jsonb := '[]'::jsonb;
  v_detalles_prevalidacion jsonb := '[]'::jsonb;
  v_detalle jsonb;
  v_estado text;
  v_motivo text;
  v_items_procesados_prevalidacion text[] := ARRAY[]::text[];
  v_error_count integer := 0;
  v_conflicto_count integer := 0;
  v_omitido_count integer := 0;
BEGIN
  v_actor := auth.uid();

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Se requiere una sesión autenticada'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.perfiles_usuario AS perfil
    WHERE perfil.id = v_actor
      AND perfil.rol = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo un administrador puede importar listas a armarios'
      USING ERRCODE = '42501';
  END IF;

  IF p_modo IS NULL OR p_modo NOT IN ('sumar', 'establecer') THEN
    RAISE EXCEPTION 'Modo inválido: debe ser sumar o establecer'
      USING ERRCODE = '22023';
  END IF;

  IF p_duplicados IS NULL OR p_duplicados NOT IN ('sumar', 'rechazar') THEN
    RAISE EXCEPTION 'Opción de duplicados inválida: debe ser sumar o rechazar'
      USING ERRCODE = '22023';
  END IF;

  IF pg_catalog.jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_items debe ser un array JSON'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.ubicaciones AS ubicacion
    WHERE ubicacion.id = p_ubicacion_id
      AND ubicacion.tipo = 'armario'
      AND ubicacion.activo = true
  ) THEN
    RAISE EXCEPTION 'El destino debe ser un armario activo'
      USING ERRCODE = '22023';
  END IF;

  -- actualizar_stock exige este permiso además de la identidad del usuario.
  IF NOT EXISTS (
    SELECT 1
    FROM public.permisos_usuario AS permiso
    WHERE permiso.id_usuario = v_actor
      AND permiso.puede_crear_productos = true
  ) THEN
    RAISE EXCEPTION
      'El trigger actualizar_stock requiere puede_crear_productos=true para registrar movimientos'
      USING ERRCODE = '42501';
  END IF;

  -- Fase 1a: validar y normalizar todas las filas sin modificar tablas.
  FOR v_item, v_fila IN
    SELECT item.value, item.ordinality
    FROM pg_catalog.jsonb_array_elements(p_items)
      WITH ORDINALITY AS item(value, ordinality)
  LOOP
    v_sku := NULLIF(pg_catalog.btrim(COALESCE(v_item ->> 'sku', v_item ->> 'referencia', '')), '');
    v_codigo_barras := NULLIF(
      pg_catalog.btrim(COALESCE(v_item ->> 'codigo_barras', v_item ->> 'ean', '')),
      ''
    );
    v_nombre := NULLIF(pg_catalog.btrim(COALESCE(v_item ->> 'nombre', '')), '');
    v_cantidad_texto := NULLIF(pg_catalog.btrim(COALESCE(v_item ->> 'cantidad', '')), '');

    IF v_sku IS NULL OR v_codigo_barras IS NULL OR v_nombre IS NULL THEN
      v_error_count := v_error_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'estado', 'error',
        'motivo', 'La fila debe incluir REFERENCIA, EAN y NOMBRE'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF v_cantidad_texto IS NULL THEN
      v_omitido_count := v_omitido_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'estado', 'omitida',
        'motivo', 'La cantidad está vacía o es cero'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF pg_catalog.length(v_cantidad_texto) > 22
      OR v_cantidad_texto !~ '^[0-9]{1,10}([.,][0-9]{1,10})?$'
    THEN
      v_error_count := v_error_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'estado', 'error',
        'motivo', 'La cantidad no es un número válido'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    v_cantidad := pg_catalog.replace(v_cantidad_texto, ',', '.')::numeric;
    IF v_cantidad <> pg_catalog.floor(v_cantidad) THEN
      v_error_count := v_error_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad,
        'estado', 'error',
        'motivo', 'La cantidad debe ser un número entero'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF v_cantidad = 0 THEN
      v_omitido_count := v_omitido_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', 0,
        'estado', 'omitida',
        'motivo', 'La cantidad es cero'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    v_items_prevalidados := v_items_prevalidados || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'nombre', v_nombre,
        'cantidad', v_cantidad
      )
    );
  END LOOP;

  -- Fase 1b: detectar conflictos, comprobar productos/stock y proyectar
  -- cantidades. Esta fase sigue siendo solo de lectura.
  FOR v_item IN
    SELECT item.value
    FROM pg_catalog.jsonb_array_elements(v_items_prevalidados) AS item(value)
  LOOP
    v_fila := (v_item ->> 'fila')::bigint;
    v_sku := v_item ->> 'sku';
    v_codigo_barras := v_item ->> 'codigo_barras';
    v_nombre := v_item ->> 'nombre';
    v_cantidad := (v_item ->> 'cantidad')::numeric;
    v_clave := pg_catalog.md5(
      pg_catalog.jsonb_build_array(v_sku, v_codigo_barras)::text
    );

    IF EXISTS (
      SELECT 1
      FROM pg_catalog.jsonb_array_elements(v_items_prevalidados) AS item(value)
      WHERE (
        (
          item.value ->> 'sku' = v_sku
          AND item.value ->> 'codigo_barras' IS DISTINCT FROM v_codigo_barras
        )
        OR (
          item.value ->> 'codigo_barras' = v_codigo_barras
          AND item.value ->> 'sku' IS DISTINCT FROM v_sku
        )
      )
    ) THEN
      v_conflicto_count := v_conflicto_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad,
        'estado', 'conflicto',
        'motivo', 'La misma REFERENCIA o el mismo EAN aparece asociado a otro valor en el CSV'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    SELECT pg_catalog.count(*)
    INTO v_duplicados_grupo
    FROM pg_catalog.jsonb_array_elements(v_items_prevalidados) AS item(value)
    WHERE item.value ->> 'sku' = v_sku
      AND item.value ->> 'codigo_barras' = v_codigo_barras;

    IF v_duplicados_grupo > 1 AND p_duplicados = 'rechazar' THEN
      v_conflicto_count := v_conflicto_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad,
        'estado', 'conflicto',
        'motivo', 'La combinación de REFERENCIA y EAN está duplicada en el CSV'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF p_duplicados = 'sumar' AND v_clave = ANY(v_items_procesados_prevalidacion) THEN
      CONTINUE;
    END IF;

    v_cantidad_movimiento := v_cantidad;
    IF p_duplicados = 'sumar' AND v_duplicados_grupo > 1 THEN
      SELECT pg_catalog.sum((item.value ->> 'cantidad')::numeric)
      INTO v_cantidad_movimiento
      FROM pg_catalog.jsonb_array_elements(v_items_prevalidados) AS item(value)
      WHERE item.value ->> 'sku' = v_sku
        AND item.value ->> 'codigo_barras' = v_codigo_barras;
    END IF;

    IF v_cantidad_movimiento > 2147483647 THEN
      v_error_count := v_error_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad_movimiento,
        'estado', 'error',
        'motivo', 'La cantidad total supera el máximo permitido'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    SELECT producto.id
    INTO v_id_producto_sku
    FROM public.productos AS producto
    WHERE producto.sku = v_sku;

    SELECT producto.id
    INTO v_id_producto_ean
    FROM public.productos AS producto
    WHERE producto.codigo_barras = v_codigo_barras;

    IF (
      v_id_producto_sku IS NOT NULL
      AND v_id_producto_ean IS NOT NULL
      AND v_id_producto_sku IS DISTINCT FROM v_id_producto_ean
    ) OR (
      v_id_producto_sku IS NULL
      AND v_id_producto_ean IS NOT NULL
    ) THEN
      v_conflicto_count := v_conflicto_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad_movimiento,
        'estado', 'conflicto',
        'motivo', 'La REFERENCIA y el EAN pertenecen a productos distintos'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    v_id_producto := v_id_producto_sku;
    IF v_id_producto IS NOT NULL THEN
      SELECT producto.activo
      INTO v_producto_activo
      FROM public.productos AS producto
      WHERE producto.id = v_id_producto;

      IF v_producto_activo IS DISTINCT FROM true THEN
        v_error_count := v_error_count + 1;
        v_detalle := pg_catalog.jsonb_build_object(
          'fila', v_fila,
          'sku', v_sku,
          'codigo_barras', v_codigo_barras,
          'cantidad', v_cantidad_movimiento,
          'estado', 'error',
          'motivo', 'El producto existente está inactivo'
        );
        v_detalles_prevalidacion :=
          v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
        CONTINUE;
      END IF;
    END IF;

    v_stock_actual := 0;
    IF v_id_producto IS NOT NULL THEN
      SELECT COALESCE(stock.cantidad, 0)
      INTO v_stock_actual
      FROM public.stock AS stock
      WHERE stock.id_producto = v_id_producto
        AND stock.id_ubicacion = p_ubicacion_id
        AND stock.id_palet IS NULL
      FOR UPDATE;
      v_stock_actual := COALESCE(v_stock_actual, 0);
    END IF;

    v_stock_resultante := CASE
      WHEN p_modo = 'sumar' THEN v_stock_actual::numeric + v_cantidad_movimiento
      ELSE v_cantidad_movimiento
    END;

    IF v_stock_resultante > 2147483647 THEN
      v_error_count := v_error_count + 1;
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad_movimiento,
        'stock_actual', v_stock_actual,
        'stock_resultante', v_stock_resultante,
        'estado', 'error',
        'motivo', 'El stock resultante supera el máximo permitido'
      );
      v_detalles_prevalidacion :=
        v_detalles_prevalidacion || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    v_items_procesados_prevalidacion :=
      pg_catalog.array_append(v_items_procesados_prevalidacion, v_clave);
  END LOOP;

  IF v_error_count > 0 OR v_conflicto_count > 0 THEN
    RETURN pg_catalog.jsonb_build_object(
      'lote_id', v_lote_id,
      'aplicado', false,
      'resumen', pg_catalog.jsonb_build_object(
        'creados', 0,
        'actualizados', 0,
        'omitidos', v_omitido_count,
        'errores', v_error_count,
        'conflictos', v_conflicto_count
      ),
      'detalles', v_detalles_prevalidacion
    );
  END IF;

  -- Fase 2: solo se llega aquí cuando la validación completa no encontró
  -- errores ni conflictos. Los fallos de escritura revierten la RPC entera.
  v_resumen := pg_catalog.jsonb_build_object(
    'creados', 0,
    'actualizados', 0,
    'omitidos', 0,
    'errores', 0,
    'conflictos', 0
  );

  FOR v_item, v_fila IN
    SELECT item.value, item.ordinality
    FROM pg_catalog.jsonb_array_elements(p_items)
      WITH ORDINALITY AS item(value, ordinality)
  LOOP
    v_sku := NULLIF(pg_catalog.btrim(COALESCE(v_item ->> 'sku', v_item ->> 'referencia', '')), '');
    v_codigo_barras := NULLIF(
      pg_catalog.btrim(COALESCE(v_item ->> 'codigo_barras', v_item ->> 'ean', '')),
      ''
    );
    v_nombre := NULLIF(pg_catalog.btrim(COALESCE(v_item ->> 'nombre', '')), '');
    v_cantidad_texto := NULLIF(pg_catalog.btrim(COALESCE(v_item ->> 'cantidad', '')), '');
    v_estado := NULL;
    v_motivo := NULL;
    v_aviso := NULL;

    IF v_sku IS NULL OR v_codigo_barras IS NULL OR v_nombre IS NULL THEN
      v_estado := 'error';
      v_motivo := 'La fila debe incluir REFERENCIA, EAN y NOMBRE';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{errores}',
        pg_catalog.to_jsonb((v_resumen ->> 'errores')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF v_cantidad_texto IS NULL THEN
      v_estado := 'omitida';
      v_motivo := 'La cantidad está vacía o es cero';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{omitidos}',
        pg_catalog.to_jsonb((v_resumen ->> 'omitidos')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF pg_catalog.length(v_cantidad_texto) > 22
      OR v_cantidad_texto !~ '^[0-9]{1,10}([.,][0-9]{1,10})?$'
    THEN
      v_estado := 'error';
      v_motivo := 'La cantidad no es un número válido';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{errores}',
        pg_catalog.to_jsonb((v_resumen ->> 'errores')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    v_cantidad := pg_catalog.replace(v_cantidad_texto, ',', '.')::numeric;
    IF v_cantidad <> pg_catalog.floor(v_cantidad) THEN
      v_estado := 'error';
      v_motivo := 'La cantidad debe ser un número entero';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{errores}',
        pg_catalog.to_jsonb((v_resumen ->> 'errores')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF v_cantidad = 0 THEN
      v_estado := 'omitida';
      v_motivo := 'La cantidad es cero';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{omitidos}',
        pg_catalog.to_jsonb((v_resumen ->> 'omitidos')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', 0,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    v_clave := pg_catalog.md5(
      pg_catalog.jsonb_build_array(v_sku, v_codigo_barras)::text
    );

    SELECT pg_catalog.count(*)
    INTO v_duplicados_grupo
    FROM pg_catalog.jsonb_array_elements(v_items_prevalidados) AS item(value)
    WHERE item.value ->> 'sku' = v_sku
      AND item.value ->> 'codigo_barras' = v_codigo_barras;

    -- El mismo SKU con otro EAN, o el mismo EAN con otro SKU, es conflicto
    -- independientemente de la política seleccionada para duplicados exactos.
    IF EXISTS (
      SELECT 1
      FROM pg_catalog.jsonb_array_elements(v_items_prevalidados) AS item(value)
      WHERE (
        (item.value ->> 'sku' = v_sku
          AND item.value ->> 'codigo_barras' IS DISTINCT FROM v_codigo_barras)
        OR (item.value ->> 'codigo_barras' = v_codigo_barras
          AND item.value ->> 'sku' IS DISTINCT FROM v_sku)
      )
    ) THEN
      v_estado := 'conflicto';
      v_motivo := 'La misma REFERENCIA o el mismo EAN aparece asociado a otro valor en el CSV';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{conflictos}',
        pg_catalog.to_jsonb((v_resumen ->> 'conflictos')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF v_duplicados_grupo > 1 AND p_duplicados = 'rechazar' THEN
      v_estado := 'conflicto';
      v_motivo := 'La combinación de REFERENCIA y EAN está duplicada en el CSV';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{conflictos}',
        pg_catalog.to_jsonb((v_resumen ->> 'conflictos')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF p_duplicados = 'sumar' AND v_clave = ANY(v_claves_procesadas) THEN
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad,
        'estado', 'sumada',
        'motivo', 'Cantidad agregada al movimiento de la primera fila del grupo'
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    v_cantidad_movimiento := v_cantidad;
    IF p_duplicados = 'sumar' AND v_duplicados_grupo > 1 THEN
      SELECT COALESCE(
        pg_catalog.sum(
          CASE
            WHEN pg_catalog.length(
              NULLIF(pg_catalog.btrim(COALESCE(item.value ->> 'cantidad', '')), '')
            ) <= 22
              AND NULLIF(pg_catalog.btrim(COALESCE(item.value ->> 'cantidad', '')), '')
                ~ '^[0-9]{1,10}([.,][0-9]{1,10})?$'
            THEN pg_catalog.replace(
              pg_catalog.btrim(item.value ->> 'cantidad'),
              ',',
              '.'
            )::numeric
            ELSE 0
          END
        ),
        0
      )
      INTO v_cantidad_movimiento
      FROM pg_catalog.jsonb_array_elements(v_items_prevalidados) AS item(value)
      WHERE item.value ->> 'sku' = v_sku
        AND item.value ->> 'codigo_barras' = v_codigo_barras;
    END IF;

    IF v_cantidad_movimiento > 2147483647 THEN
      v_estado := 'error';
      v_motivo := 'La cantidad total supera el máximo permitido';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{errores}',
        pg_catalog.to_jsonb((v_resumen ->> 'errores')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', v_cantidad_movimiento,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    IF v_cantidad_movimiento = 0 THEN
      v_estado := 'omitida';
      v_motivo := 'No hay cantidades positivas para importar en el grupo';
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{omitidos}',
        pg_catalog.to_jsonb((v_resumen ->> 'omitidos')::integer + 1)
      );
      v_detalle := pg_catalog.jsonb_build_object(
        'fila', v_fila,
        'sku', v_sku,
        'codigo_barras', v_codigo_barras,
        'cantidad', 0,
        'estado', v_estado,
        'motivo', v_motivo
      );
      v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
      CONTINUE;
    END IF;

    -- Evita que REFERENCIA y EAN identifiquen productos distintos.
    SELECT producto.id
    INTO v_id_producto_sku
    FROM public.productos AS producto
    WHERE producto.sku = v_sku;

    SELECT producto.id
    INTO v_id_producto_ean
    FROM public.productos AS producto
    WHERE producto.codigo_barras = v_codigo_barras;

    IF v_id_producto_sku IS NOT NULL
      AND v_id_producto_ean IS NOT NULL
      AND v_id_producto_sku IS DISTINCT FROM v_id_producto_ean
    THEN
      RAISE EXCEPTION 'Conflicto de producto detectado durante la aplicación, fila %', v_fila
        USING ERRCODE = '23505';
    END IF;

    IF v_id_producto_sku IS NULL AND v_id_producto_ean IS NOT NULL THEN
      RAISE EXCEPTION 'El EAN ya pertenece a otro producto, fila %', v_fila
        USING ERRCODE = '23505';
    END IF;

    v_es_nuevo := v_id_producto_sku IS NULL;
    v_id_producto := v_id_producto_sku;

    IF v_es_nuevo THEN
      INSERT INTO public.productos (
        sku,
        codigo_barras,
        nombre,
        activo,
        creado_por
      )
      VALUES (
        v_sku,
        v_codigo_barras,
        v_nombre,
        true,
        v_actor
      )
      RETURNING id INTO v_id_producto;
    ELSE
      SELECT producto.nombre,
             producto.codigo_barras,
             producto.activo
      INTO v_motivo, v_aviso, v_producto_activo
      FROM public.productos AS producto
      WHERE producto.id = v_id_producto;

      IF v_producto_activo IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'El producto se desactivó durante la importación, fila %', v_fila
          USING ERRCODE = '23514';
      END IF;

      IF v_motivo IS DISTINCT FROM v_nombre THEN
        v_aviso := 'El nombre del CSV difiere del producto existente';
      ELSE
        v_aviso := NULL;
      END IF;

      IF (
        SELECT producto.codigo_barras
        FROM public.productos AS producto
        WHERE producto.id = v_id_producto
      ) IS DISTINCT FROM v_codigo_barras THEN
        v_aviso := pg_catalog.concat_ws(
          '; ',
          v_aviso,
          'El EAN del CSV difiere del producto existente'
        );
      END IF;
    END IF;

    SELECT COALESCE(stock.cantidad, 0)
    INTO v_stock_actual
    FROM public.stock AS stock
    WHERE stock.id_producto = v_id_producto
      AND stock.id_ubicacion = p_ubicacion_id
      AND stock.id_palet IS NULL
    FOR UPDATE;
    v_stock_actual := COALESCE(v_stock_actual, 0);

    v_stock_resultante := CASE
      WHEN p_modo = 'sumar' THEN v_stock_actual::numeric + v_cantidad_movimiento
      ELSE v_cantidad_movimiento
    END;

    IF v_stock_resultante > 2147483647 THEN
      RAISE EXCEPTION 'El stock resultante supera el máximo permitido, fila %', v_fila
        USING ERRCODE = '22003';
    END IF;

    INSERT INTO public.movimientos (
      id_producto,
      id_ubicacion,
      tipo,
      cantidad,
      notas,
      realizado_por
    )
    VALUES (
      v_id_producto,
      p_ubicacion_id,
      CASE WHEN p_modo = 'sumar' THEN 'entrada' ELSE 'ajuste' END,
      v_cantidad_movimiento::integer,
      'Importación CSV Lote: ' || v_lote_id::text || ' | ' ||
      pg_catalog.jsonb_build_object(
        'origen', 'importacion',
        'modo', p_modo,
        'fila', v_fila,
        'sku', v_sku,
        'ean', v_codigo_barras,
        'cantidad_csv', v_cantidad_movimiento,
        'cantidad_anterior', v_stock_actual,
        'cantidad_nueva', v_stock_resultante,
        'diferencia', v_stock_resultante - v_stock_actual,
        'tipo_movimiento', CASE
          WHEN p_modo = 'sumar' THEN 'entrada'
          ELSE 'ajuste'
        END
      )::text,
      v_actor
    );

    IF v_es_nuevo THEN
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{creados}',
        pg_catalog.to_jsonb((v_resumen ->> 'creados')::integer + 1)
      );
    ELSE
      v_resumen := pg_catalog.jsonb_set(
        v_resumen,
        '{actualizados}',
        pg_catalog.to_jsonb((v_resumen ->> 'actualizados')::integer + 1)
      );
    END IF;

    IF p_duplicados = 'sumar' THEN
      v_claves_procesadas := pg_catalog.array_append(v_claves_procesadas, v_clave);
    END IF;

    v_estado := CASE
      WHEN v_aviso IS NOT NULL THEN 'aviso'
      WHEN v_es_nuevo THEN 'creada'
      ELSE 'actualizada'
    END;
    v_detalle := pg_catalog.jsonb_build_object(
      'fila', v_fila,
      'sku', v_sku,
      'codigo_barras', v_codigo_barras,
      'cantidad', v_cantidad_movimiento,
      'producto_id', v_id_producto,
      'stock_actual', v_stock_actual,
      'stock_resultante', v_stock_resultante,
      'estado', v_estado,
      'aviso', v_aviso
    );
    v_detalles := v_detalles || pg_catalog.jsonb_build_array(v_detalle);
  END LOOP;

  RETURN pg_catalog.jsonb_build_object(
    'lote_id', v_lote_id,
    'aplicado', true,
    'resumen', v_resumen,
    'detalles', v_detalles
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.importar_lista_a_armario(jsonb, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.importar_lista_a_armario(jsonb, uuid, text, text)
  TO authenticated;
