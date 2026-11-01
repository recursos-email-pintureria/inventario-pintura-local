BEGIN;

DO $$
DECLARE
  perimeter_id uuid;
BEGIN
  SELECT id
  INTO perimeter_id
  FROM public.ubicaciones
  WHERE nombre = 'Perimetral (Herramientas)'
    AND tipo = 'pasillo'
    AND activo = true;

  IF perimeter_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el pasillo perimetral activo "Perimetral (Herramientas)"';
  END IF;

  INSERT INTO public.ubicaciones (
    nombre,
    tipo,
    descripcion,
    activo,
    id_ubicacion_padre
  )
  SELECT
    armory_name,
    'armario',
    'Armario del pasillo perimetral',
    true,
    perimeter_id
  FROM unnest(ARRAY[
    'E735',
    'E736',
    'E737',
    'E738',
    'E739',
    'E740',
    'E741',
    'E742',
    'E743',
    'E744'
  ]::text[]) AS armories(armory_name)
  ON CONFLICT (nombre) DO NOTHING;
END;
$$;

COMMIT;