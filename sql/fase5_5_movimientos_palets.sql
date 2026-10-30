-- Mantiene el contenido de los palets en stock, pero fuerza todos los cambios
-- a pasar por movimientos y el trigger actualizar_stock.
BEGIN;

ALTER TABLE public.stock
  ADD COLUMN IF NOT EXISTS id_palet UUID REFERENCES public.palets(id) ON DELETE CASCADE;

ALTER TABLE public.movimientos
  ADD COLUMN IF NOT EXISTS id_palet UUID REFERENCES public.palets(id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_pkey'
      AND table_name = 'stock'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.stock DROP CONSTRAINT stock_pkey;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_producto_ubicacion_sin_palet
  ON public.stock(id_producto, id_ubicacion)
  WHERE id_palet IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_producto_palet
  ON public.stock(id_producto, id_palet)
  WHERE id_palet IS NOT NULL;

REVOKE INSERT, UPDATE, DELETE ON public.stock FROM authenticated;

CREATE OR REPLACE FUNCTION public.actualizar_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  disponible INTEGER;
  reserva_palet UUID;
BEGIN
  IF auth.uid() IS NULL
    OR NEW.realizado_por IS DISTINCT FROM auth.uid()
    OR NOT EXISTS (
      SELECT 1
      FROM public.permisos_usuario p
      WHERE p.id_usuario = auth.uid()
        AND p.puede_crear_productos = true
    )
  THEN
    RAISE EXCEPTION 'Sin permiso para registrar movimientos' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.productos WHERE id = NEW.id_producto AND activo = true
  ) OR NOT EXISTS (
    SELECT 1 FROM public.ubicaciones WHERE id = NEW.id_ubicacion AND activo = true
  ) THEN
    RAISE EXCEPTION 'El producto y la ubicación deben estar activos';
  END IF;

  IF NEW.id_palet IS NOT NULL THEN
    IF NEW.tipo NOT IN ('entrada', 'salida') THEN
      RAISE EXCEPTION 'Los movimientos de palet deben ser entrada o salida';
    END IF;

    SELECT id_reserva
    INTO reserva_palet
    FROM public.palets
    WHERE id = NEW.id_palet AND activo = true;

    IF reserva_palet IS NULL OR NEW.id_ubicacion IS DISTINCT FROM reserva_palet THEN
      RAISE EXCEPTION 'El palet debe estar activo y el movimiento debe usar su reserva';
    END IF;

    INSERT INTO public.stock (id_producto, id_ubicacion, id_palet, cantidad)
    VALUES (NEW.id_producto, NEW.id_ubicacion, NEW.id_palet, 0)
    ON CONFLICT DO NOTHING;

    SELECT cantidad
    INTO disponible
    FROM public.stock
    WHERE id_producto = NEW.id_producto AND id_palet = NEW.id_palet
    FOR UPDATE;

    IF NEW.tipo = 'salida' AND disponible < NEW.cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente en el palet: disponibles %, solicitadas %',
        disponible, NEW.cantidad;
    END IF;

    UPDATE public.stock
    SET cantidad = CASE
      WHEN NEW.tipo = 'entrada' THEN disponible + NEW.cantidad
      ELSE disponible - NEW.cantidad
    END,
    actualizado_en = now()
    WHERE id_producto = NEW.id_producto AND id_palet = NEW.id_palet;

    RETURN NEW;
  END IF;

  INSERT INTO public.stock (id_producto, id_ubicacion, cantidad)
  VALUES (NEW.id_producto, NEW.id_ubicacion, 0)
  ON CONFLICT DO NOTHING;

  SELECT cantidad
  INTO disponible
  FROM public.stock
  WHERE id_producto = NEW.id_producto
    AND id_ubicacion = NEW.id_ubicacion
    AND id_palet IS NULL
  FOR UPDATE;

  IF NEW.tipo = 'salida' AND disponible < NEW.cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente: disponibles %, solicitadas %',
      disponible, NEW.cantidad;
  END IF;

  UPDATE public.stock
  SET cantidad = CASE
    WHEN NEW.tipo = 'entrada' THEN disponible + NEW.cantidad
    WHEN NEW.tipo = 'salida' THEN disponible - NEW.cantidad
    ELSE NEW.cantidad
  END,
  actualizado_en = now()
  WHERE id_producto = NEW.id_producto
    AND id_ubicacion = NEW.id_ubicacion
    AND id_palet IS NULL;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_stock() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reponer_producto_palet(
  p_id_palet UUID,
  p_id_producto UUID,
  p_id_ubicacion_destino UUID,
  p_cantidad INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  reserva_palet UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Se requiere una sesión autenticada' USING ERRCODE = '42501';
  END IF;
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor que 0';
  END IF;

  SELECT id_reserva
  INTO reserva_palet
  FROM public.palets
  WHERE id = p_id_palet AND activo = true;

  IF reserva_palet IS NULL THEN
    RAISE EXCEPTION 'El palet no existe o está inactivo';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.ubicaciones
    WHERE id = p_id_ubicacion_destino
      AND activo = true
      AND tipo IN ('pasillo', 'armario', 'alto')
  ) THEN
    RAISE EXCEPTION 'Selecciona una ubicación de tienda activa';
  END IF;

  INSERT INTO public.movimientos (
    id_producto, id_ubicacion, tipo, cantidad, notas, realizado_por, id_palet
  ) VALUES (
    p_id_producto, reserva_palet, 'salida', p_cantidad,
    'Reposición desde palet a tienda', auth.uid(), p_id_palet
  );

  INSERT INTO public.movimientos (
    id_producto, id_ubicacion, tipo, cantidad, notas, realizado_por
  ) VALUES (
    p_id_producto, p_id_ubicacion_destino, 'entrada', p_cantidad,
    'Reposición desde palet a tienda', auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reponer_producto_palet(UUID, UUID, UUID, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reponer_producto_palet(UUID, UUID, UUID, INTEGER)
  TO authenticated;

COMMIT;
