-- ==============================================================================
-- FASE 5.1: SISTEMA DE PALETS - BASE DE DATOS Y RLS
-- ==============================================================================
-- Ejecutar en el SQL Editor de Supabase.

BEGIN;

-- 1. Crear tabla de palets
CREATE TABLE IF NOT EXISTS public.palets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_reserva UUID NOT NULL REFERENCES public.ubicaciones(id) ON DELETE CASCADE,
  numero_palet INTEGER NOT NULL,
  codigo_barras TEXT UNIQUE NOT NULL,
  generado_por TEXT NOT NULL,
  generado_en TIMESTAMPTZ DEFAULT NOW(),
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_numero_por_reserva UNIQUE (id_reserva, numero_palet)
);

-- 2. Crear índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_palets_reserva ON public.palets(id_reserva);
CREATE INDEX IF NOT EXISTS idx_palets_codigo ON public.palets(codigo_barras);

-- 3. Permisos básicos a roles de Supabase
GRANT SELECT, INSERT, UPDATE ON public.palets TO authenticated;
GRANT ALL ON public.palets TO service_role;
REVOKE DELETE ON public.palets FROM authenticated;

-- 4. Activar Row Level Security (RLS)
ALTER TABLE public.palets ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
DROP POLICY IF EXISTS palets_select_policy ON public.palets;
CREATE POLICY palets_select_policy ON public.palets
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS palets_insert_policy ON public.palets;
CREATE POLICY palets_insert_policy ON public.palets
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = auth.uid()
      AND (p.puede_crear_ubicaciones = true OR p.puede_editar_ubicaciones = true)
  ) OR EXISTS (
    SELECT 1 FROM public.perfiles_usuario u
    WHERE u.id = auth.uid() AND u.rol = 'admin'
  )
);

DROP POLICY IF EXISTS palets_update_policy ON public.palets;
CREATE POLICY palets_update_policy ON public.palets
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = auth.uid()
      AND (p.puede_crear_ubicaciones = true OR p.puede_editar_ubicaciones = true)
  ) OR EXISTS (
    SELECT 1 FROM public.perfiles_usuario u
    WHERE u.id = auth.uid() AND u.rol = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permisos_usuario p
    WHERE p.id_usuario = auth.uid()
      AND (p.puede_crear_ubicaciones = true OR p.puede_editar_ubicaciones = true)
  ) OR EXISTS (
    SELECT 1 FROM public.perfiles_usuario u
    WHERE u.id = auth.uid() AND u.rol = 'admin'
  )
);

-- 6. Función para obtener el siguiente número consecutivo de palet por reserva
CREATE OR REPLACE FUNCTION public.get_siguiente_numero_palet(p_id_reserva UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_siguiente INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_palet), 0) + 1
  INTO v_siguiente
  FROM public.palets
  WHERE id_reserva = p_id_reserva;

  RETURN v_siguiente;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_siguiente_numero_palet(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_siguiente_numero_palet(UUID) TO service_role;

-- 7. Trigger para mantener actualizado_en
CREATE OR REPLACE FUNCTION public.set_palets_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_palets_actualizado_en ON public.palets;
CREATE TRIGGER trigger_palets_actualizado_en
BEFORE UPDATE ON public.palets
FOR EACH ROW
EXECUTE FUNCTION public.set_palets_actualizado_en();

COMMIT;
