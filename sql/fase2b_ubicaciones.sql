-- Ejecutar completo en el SQL Editor del proyecto existente.
BEGIN;

CREATE TABLE public.ubicaciones (
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

CREATE POLICY ubicaciones_leer_activas ON public.ubicaciones
FOR SELECT TO authenticated USING (activo = true);

-- Quienes gestionan ubicaciones también pueden leer las desactivadas.
-- Esto permite actualizar/desactivar sin perder el acceso a la fila.
CREATE POLICY ubicaciones_gestor_leer ON public.ubicaciones
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true)
);

CREATE POLICY ubicaciones_insertar ON public.ubicaciones
FOR INSERT TO authenticated WITH CHECK (
  creado_por = (SELECT auth.uid()) AND
  EXISTS (SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true)
);

CREATE POLICY ubicaciones_actualizar ON public.ubicaciones
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true)
);

CREATE POLICY ubicaciones_eliminar ON public.ubicaciones
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = (SELECT auth.uid()) AND p.puede_crear_ubicaciones = true)
);

COMMIT;