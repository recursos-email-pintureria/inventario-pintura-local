-- Configuración global de Inventario LM.
-- Ejecutar una vez en el SQL Editor de Supabase.
-- Si existe el esquema anterior, conserva sus valores y los migra al formato clave/valor.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.configuracion_sistema') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'configuracion_sistema'
         AND column_name = 'store_name'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'configuracion_sistema'
         AND column_name = 'clave'
     ) THEN
    IF to_regclass('public.configuracion_sistema_legacy') IS NOT NULL THEN
      RAISE EXCEPTION
        'Existe public.configuracion_sistema_legacy; revisa la migración antes de continuar.';
    END IF;

    ALTER TABLE public.configuracion_sistema
      RENAME TO configuracion_sistema_legacy;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT NOT NULL UNIQUE CHECK (length(trim(clave)) > 0),
  valor JSONB NOT NULL,
  categoria TEXT NOT NULL CHECK (length(trim(categoria)) > 0),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.configuracion_sistema FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracion_sistema TO authenticated;
GRANT ALL ON public.configuracion_sistema TO service_role;

DROP POLICY IF EXISTS configuracion_sistema_select ON public.configuracion_sistema;
CREATE POLICY configuracion_sistema_select
ON public.configuracion_sistema
FOR SELECT TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS configuracion_sistema_insert ON public.configuracion_sistema;
CREATE POLICY configuracion_sistema_insert
ON public.configuracion_sistema
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.permisos_usuario AS permiso
    WHERE permiso.id_usuario = (SELECT auth.uid())
      AND permiso.puede_gestionar_usuarios = TRUE
  )
  AND actualizado_por = (SELECT auth.uid())
);

DROP POLICY IF EXISTS configuracion_sistema_update ON public.configuracion_sistema;
CREATE POLICY configuracion_sistema_update
ON public.configuracion_sistema
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.permisos_usuario AS permiso
    WHERE permiso.id_usuario = (SELECT auth.uid())
      AND permiso.puede_gestionar_usuarios = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.permisos_usuario AS permiso
    WHERE permiso.id_usuario = (SELECT auth.uid())
      AND permiso.puede_gestionar_usuarios = TRUE
  )
  AND actualizado_por = (SELECT auth.uid())
);

DROP POLICY IF EXISTS configuracion_sistema_delete ON public.configuracion_sistema;
CREATE POLICY configuracion_sistema_delete
ON public.configuracion_sistema
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.permisos_usuario AS permiso
    WHERE permiso.id_usuario = (SELECT auth.uid())
      AND permiso.puede_gestionar_usuarios = TRUE
  )
);

INSERT INTO public.configuracion_sistema (clave, valor, categoria)
VALUES
  ('store_name', '"Inventario LM"'::JSONB, 'general'),
  ('store_address', '""'::JSONB, 'general'),
  ('contact_email', '""'::JSONB, 'general'),
  ('time_zone', '"Europe/Madrid"'::JSONB, 'general'),
  ('currency', '"EUR"'::JSONB, 'general'),
  ('critical_stock_alert', 'true'::JSONB, 'stock'),
  ('critical_stock_threshold', '20'::JSONB, 'stock'),
  ('block_dispatch_at_zero', 'true'::JSONB, 'stock'),
  ('allow_negative_stock', 'false'::JSONB, 'stock'),
  ('default_minimum_stock', '0'::JSONB, 'stock'),
  ('active_tinting_machine', '""'::JSONB, 'tintometria'),
  ('color_catalogs', '["NCS","RAL"]'::JSONB, 'tintometria'),
  ('delta_e_tolerance', '1'::JSONB, 'tintometria'),
  ('scanner_enabled', 'true'::JSONB, 'dispositivos'),
  ('scanner_format', '"CODE_128"'::JSONB, 'dispositivos')
ON CONFLICT (clave) DO NOTHING;

DO $$
BEGIN
  IF to_regclass('public.configuracion_sistema_legacy') IS NOT NULL THEN
    INSERT INTO public.configuracion_sistema (
      clave,
      valor,
      categoria,
      actualizado_en,
      actualizado_por
    )
    SELECT
      config.clave,
      config.valor,
      config.categoria,
      legacy.updated_at,
      legacy.updated_by
    FROM public.configuracion_sistema_legacy AS legacy
    CROSS JOIN LATERAL (
      VALUES
        ('store_name', COALESCE(to_jsonb(legacy.store_name), '""'::JSONB), 'general'),
        ('store_address', COALESCE(to_jsonb(legacy.store_address), '""'::JSONB), 'general'),
        ('contact_email', COALESCE(to_jsonb(legacy.contact_email), '""'::JSONB), 'general'),
        ('time_zone', COALESCE(to_jsonb(legacy.time_zone), '"Europe/Madrid"'::JSONB), 'general'),
        ('currency', COALESCE(to_jsonb(legacy.currency), '"EUR"'::JSONB), 'general'),
        ('critical_stock_alert', COALESCE(to_jsonb(legacy.critical_stock_alert), 'true'::JSONB), 'stock'),
        ('critical_stock_threshold', COALESCE(to_jsonb(legacy.critical_stock_threshold), '20'::JSONB), 'stock'),
        ('block_dispatch_at_zero', COALESCE(to_jsonb(legacy.block_dispatch_at_zero), 'true'::JSONB), 'stock'),
        ('allow_negative_stock', COALESCE(to_jsonb(legacy.allow_negative_stock), 'false'::JSONB), 'stock'),
        ('default_minimum_stock', COALESCE(to_jsonb(legacy.default_minimum_stock), '0'::JSONB), 'stock'),
        ('active_tinting_machine', COALESCE(to_jsonb(legacy.active_tinting_machine), '""'::JSONB), 'tintometria'),
        ('color_catalogs', COALESCE(to_jsonb(legacy.color_catalogs), '["NCS","RAL"]'::JSONB), 'tintometria'),
        ('delta_e_tolerance', COALESCE(to_jsonb(legacy.delta_e_tolerance), '1'::JSONB), 'tintometria'),
        ('scanner_enabled', COALESCE(to_jsonb(legacy.scanner_enabled), 'true'::JSONB), 'dispositivos'),
        ('scanner_format', COALESCE(to_jsonb(legacy.scanner_format), '"CODE_128"'::JSONB), 'dispositivos')
    ) AS config(clave, valor, categoria)
    ON CONFLICT (clave) DO UPDATE
    SET valor = EXCLUDED.valor,
        categoria = EXCLUDED.categoria,
        actualizado_en = EXCLUDED.actualizado_en,
        actualizado_por = EXCLUDED.actualizado_por;

    DROP TABLE public.configuracion_sistema_legacy;
  END IF;
END;
$$;

COMMIT;
