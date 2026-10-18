BEGIN;

CREATE TABLE IF NOT EXISTS public.ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pasillo', 'alto', 'armario')),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  creado_por UUID REFERENCES auth.users(id),
  creado_en TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ubicaciones TO authenticated;
GRANT ALL ON public.ubicaciones TO service_role;
ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT, activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_barras TEXT UNIQUE NOT NULL, sku TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL, descripcion TEXT,
  id_categoria UUID REFERENCES public.categorias(id),
  precio_unitario DECIMAL(10,2) CHECK (precio_unitario >= 0),
  activo BOOLEAN DEFAULT true, creado_por UUID REFERENCES auth.users(id),
  creado_en TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productos TO authenticated;
GRANT ALL ON public.productos TO service_role;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_producto UUID NOT NULL REFERENCES public.productos(id),
  id_ubicacion UUID NOT NULL REFERENCES public.ubicaciones(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'reposicion', 'ajuste')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) CHECK (precio_unitario >= 0),
  precio_total DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  notas TEXT, realizado_por UUID REFERENCES auth.users(id),
  fecha_movimiento TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT ON public.movimientos TO authenticated;
GRANT ALL ON public.movimientos TO service_role;
ALTER TABLE public.movimientos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.stock (
  id_producto UUID REFERENCES public.productos(id),
  id_ubicacion UUID REFERENCES public.ubicaciones(id),
  cantidad INTEGER DEFAULT 0 CHECK (cantidad >= 0),
  actualizado_en TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id_producto, id_ubicacion)
);
GRANT SELECT ON public.stock TO authenticated;
GRANT ALL ON public.stock TO service_role;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- No modifica perfiles, roles ni permisos existentes.
DROP POLICY IF EXISTS ubicaciones_leer_activas ON public.ubicaciones;
CREATE POLICY ubicaciones_leer_activas ON public.ubicaciones
FOR SELECT TO authenticated USING (activo = true);
DROP POLICY IF EXISTS ubicaciones_gestor_leer ON public.ubicaciones;
CREATE POLICY ubicaciones_gestor_leer ON public.ubicaciones
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.permisos_usuario p
  WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true
));
DROP POLICY IF EXISTS ubicaciones_insertar ON public.ubicaciones;
CREATE POLICY ubicaciones_insertar ON public.ubicaciones
FOR INSERT TO authenticated WITH CHECK (
  creado_por = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true
  )
);
DROP POLICY IF EXISTS ubicaciones_actualizar ON public.ubicaciones;
CREATE POLICY ubicaciones_actualizar ON public.ubicaciones
FOR UPDATE TO authenticated USING (EXISTS (
  SELECT 1 FROM public.permisos_usuario p
  WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true
)) WITH CHECK (EXISTS (
  SELECT 1 FROM public.permisos_usuario p
  WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true
));
DROP POLICY IF EXISTS ubicaciones_eliminar ON public.ubicaciones;
CREATE POLICY ubicaciones_eliminar ON public.ubicaciones
FOR DELETE TO authenticated USING (EXISTS (
  SELECT 1 FROM public.permisos_usuario p
  WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true
));

DROP POLICY IF EXISTS categorias_leer ON public.categorias;
CREATE POLICY categorias_leer ON public.categorias FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS categorias_escribir ON public.categorias;
CREATE POLICY categorias_escribir ON public.categorias FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.permisos_usuario p WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_productos = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.permisos_usuario p WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_productos = true));

DROP POLICY IF EXISTS productos_leer ON public.productos;
CREATE POLICY productos_leer ON public.productos FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS productos_escribir ON public.productos;
CREATE POLICY productos_escribir ON public.productos FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.permisos_usuario p WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_productos = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.permisos_usuario p WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_productos = true));

DROP POLICY IF EXISTS movimientos_leer ON public.movimientos;
CREATE POLICY movimientos_leer ON public.movimientos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.permisos_usuario p WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_ver_movimientos = true));
DROP POLICY IF EXISTS movimientos_insertar ON public.movimientos;
CREATE POLICY movimientos_insertar ON public.movimientos FOR INSERT TO authenticated
WITH CHECK (realizado_por = (SELECT auth.uid()) AND EXISTS (
  SELECT 1 FROM public.permisos_usuario p WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_productos = true
));
DROP POLICY IF EXISTS stock_leer ON public.stock;
CREATE POLICY stock_leer ON public.stock FOR SELECT TO authenticated USING (true);

-- El stock solo cambia mediante movimientos. Bloqueo por producto/ubicación
-- para que dos salidas simultáneas no puedan consumir las mismas unidades.
CREATE OR REPLACE FUNCTION public.actualizar_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE disponible INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NEW.realizado_por IS DISTINCT FROM auth.uid() OR NOT EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = auth.uid() AND p.puede_crear_productos = true
  ) THEN RAISE EXCEPTION 'Sin permiso para registrar movimientos' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.productos WHERE id = NEW.id_producto AND activo = true)
    OR NOT EXISTS (SELECT 1 FROM public.ubicaciones WHERE id = NEW.id_ubicacion AND activo = true)
  THEN RAISE EXCEPTION 'El producto y la ubicación deben estar activos'; END IF;
  INSERT INTO public.stock (id_producto, id_ubicacion, cantidad)
    VALUES (NEW.id_producto, NEW.id_ubicacion, 0) ON CONFLICT DO NOTHING;
  SELECT cantidad INTO disponible FROM public.stock
    WHERE id_producto = NEW.id_producto AND id_ubicacion = NEW.id_ubicacion FOR UPDATE;
  IF NEW.tipo = 'salida' AND disponible < NEW.cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente: disponibles %, solicitadas %', disponible, NEW.cantidad;
  END IF;
  UPDATE public.stock SET cantidad = CASE
    WHEN NEW.tipo = 'entrada' THEN disponible + NEW.cantidad
    WHEN NEW.tipo = 'salida' THEN disponible - NEW.cantidad
    -- Reposición y ajuste representan un recuento absoluto.
    ELSE NEW.cantidad END, actualizado_en = now()
    WHERE id_producto = NEW.id_producto AND id_ubicacion = NEW.id_ubicacion;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.actualizar_stock() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS movimientos_actualizar_stock ON public.movimientos;
CREATE TRIGGER movimientos_actualizar_stock AFTER INSERT ON public.movimientos
FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock();

COMMIT;
