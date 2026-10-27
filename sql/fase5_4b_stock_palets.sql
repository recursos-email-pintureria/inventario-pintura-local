-- ==============================================================================
-- FASE 5.4B: ASOCIACIÓN DE PRODUCTOS A PALETS EN LA TABLA STOCK
-- ==============================================================================
-- Ejecutar en el SQL Editor de Supabase.

BEGIN;

-- 1. Añadir columna id_palet a la tabla stock
ALTER TABLE public.stock 
ADD COLUMN IF NOT EXISTS id_palet UUID REFERENCES public.palets(id) ON DELETE CASCADE;

-- 2. Crear índice para mejorar el rendimiento de las consultas por palet
CREATE INDEX IF NOT EXISTS idx_stock_id_palet ON public.stock(id_palet);

-- 3. Adaptar la restricción de unicidad para permitir múltiples palets por reserva:
-- Si existía la clave primaria fija en (id_producto, id_ubicacion), la sustituimos
-- por índices únicos condicionales para productos sueltos y productos en palets.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stock_pkey' 
      AND table_name = 'stock' 
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.stock DROP CONSTRAINT stock_pkey;
  END IF;
END $$;

-- Índice único para stock normal en ubicaciones (sin palet asignado)
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_producto_ubicacion_sin_palet 
ON public.stock(id_producto, id_ubicacion) 
WHERE id_palet IS NULL;

-- Índice único para productos dentro de un palet específico
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_producto_palet 
ON public.stock(id_producto, id_palet) 
WHERE id_palet IS NOT NULL;

-- 4. Otorgar permisos a los roles de Supabase para operaciones de stock
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock TO authenticated;
GRANT ALL ON public.stock TO service_role;

-- 5. Asegurar políticas RLS en la tabla stock
-- Permitir lectura general de stock autenticado
DROP POLICY IF EXISTS stock_leer ON public.stock;
DROP POLICY IF EXISTS stock_select_policy ON public.stock;
CREATE POLICY stock_select_policy ON public.stock 
FOR SELECT TO authenticated 
USING (true);

-- Permitir inserción en stock para usuarios con permisos o admin
DROP POLICY IF EXISTS stock_insert_policy ON public.stock;
CREATE POLICY stock_insert_policy ON public.stock
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = auth.uid()
      AND (
        p.puede_crear_productos = true 
        OR p.puede_crear_ubicaciones = true 
        OR p.puede_editar_ubicaciones = true
      )
  ) OR EXISTS (
    SELECT 1 FROM public.perfiles_usuario u
    WHERE u.id = auth.uid() AND u.rol = 'admin'
  )
);

-- Permitir actualización de stock para usuarios con permisos o admin
DROP POLICY IF EXISTS stock_update_policy ON public.stock;
CREATE POLICY stock_update_policy ON public.stock
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = auth.uid()
      AND (
        p.puede_crear_productos = true 
        OR p.puede_crear_ubicaciones = true 
        OR p.puede_editar_ubicaciones = true
      )
  ) OR EXISTS (
    SELECT 1 FROM public.perfiles_usuario u
    WHERE u.id = auth.uid() AND u.rol = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = auth.uid()
      AND (
        p.puede_crear_productos = true 
        OR p.puede_crear_ubicaciones = true 
        OR p.puede_editar_ubicaciones = true
      )
  ) OR EXISTS (
    SELECT 1 FROM public.perfiles_usuario u
    WHERE u.id = auth.uid() AND u.rol = 'admin'
  )
);

-- Permitir eliminación en stock para usuarios con permisos o admin (ej. al retirar un producto o vaciar palet)
DROP POLICY IF EXISTS stock_delete_policy ON public.stock;
CREATE POLICY stock_delete_policy ON public.stock
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = auth.uid()
      AND (
        p.puede_crear_productos = true 
        OR p.puede_crear_ubicaciones = true 
        OR p.puede_editar_ubicaciones = true
      )
  ) OR EXISTS (
    SELECT 1 FROM public.perfiles_usuario u
    WHERE u.id = auth.uid() AND u.rol = 'admin'
  )
);

COMMIT;
