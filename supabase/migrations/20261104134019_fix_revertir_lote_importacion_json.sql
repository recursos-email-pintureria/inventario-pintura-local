CREATE OR REPLACE FUNCTION public.revertir_lote_importacion(p_lote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_movimiento record;
  v_cantidad_compensar integer;
  v_tipo_compensario text;
  v_resumen jsonb := jsonb_build_object(
    'movimientos_compensatorios', 0,
    'conflictos', 0
  );
  v_auditoria jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Se requiere sesión autenticada' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.perfiles_usuario
    WHERE id = v_actor AND rol = 'admin' AND activo = true
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden revertir lotes' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.movimientos
    WHERE notas LIKE 'Importación CSV Lote: ' || p_lote_id::text || '%'
  ) THEN
    RAISE EXCEPTION 'No se encontró el lote especificado' USING ERRCODE = '22023';
  END IF;

  FOR v_movimiento IN
    SELECT m.*
    FROM public.movimientos m
    WHERE m.notas LIKE 'Importación CSV Lote: ' || p_lote_id::text || '%'
    ORDER BY m.fecha_movimiento ASC
  LOOP
    -- Extracción segura del JSON usando split_part por el separador ' | '
    BEGIN
      v_auditoria := split_part(v_movimiento.notas, ' | ', 2)::jsonb;
    EXCEPTION WHEN OTHERS THEN
      v_auditoria := NULL;
    END;

    IF v_auditoria IS NULL OR (v_auditoria->>'origen') != 'importacion' THEN
      v_resumen := jsonb_set(v_resumen, '{conflictos}', to_jsonb((v_resumen->>'conflictos')::integer + 1));
      CONTINUE;
    END IF;

    IF v_movimiento.tipo = 'entrada' THEN
      v_tipo_compensario := 'salida';
      v_cantidad_compensar := v_movimiento.cantidad;
    ELSIF v_movimiento.tipo = 'ajuste' THEN
      v_tipo_compensario := 'ajuste';
      v_cantidad_compensar := (v_auditoria->>'cantidad_anterior')::integer;
    ELSE
      CONTINUE;
    END IF;

    IF v_cantidad_compensar <= 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO public.movimientos (
      id_producto, id_ubicacion, tipo, cantidad, notas, realizado_por, id_palet
    ) VALUES (
      v_movimiento.id_producto,
      v_movimiento.id_ubicacion,
      v_tipo_compensario,
      v_cantidad_compensar,
      'Reversión lote: ' || p_lote_id::text || ' | ' || jsonb_build_object(
        'origen', 'reversion',
        'lote_original', p_lote_id::text,
        'movimiento_original_id', v_movimiento.id::text,
        'tipo_original', v_movimiento.tipo,
        'cantidad_original', v_movimiento.cantidad,
        'cantidad_compensada', v_cantidad_compensar
      )::text,
      v_actor,
      NULL
    );

    v_resumen := jsonb_set(
      v_resumen,
      '{movimientos_compensatorios}',
      to_jsonb((v_resumen->>'movimientos_compensatorios')::integer + 1)
    );
  END LOOP;

  RETURN v_resumen;
END;
$function$;
