BEGIN;

ALTER TABLE public.perfiles_usuario
  ADD COLUMN debe_cambiar_password boolean NOT NULL DEFAULT false;

CREATE TABLE public.auditoria_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_admin uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  accion text NOT NULL CHECK (accion = 'reset_password'),
  id_usuario_afectado uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  forzar_cambio boolean NOT NULL,
  estado text NOT NULL CHECK (estado IN ('iniciado', 'fallido', 'completado', 'email_fallido')),
  fecha timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auditoria_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los admins activos pueden consultar la auditoría"
  ON public.auditoria_admin
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfiles_usuario
      WHERE id = (SELECT auth.uid())
        AND rol = 'admin'
        AND activo = true
    )
  );

REVOKE ALL ON public.auditoria_admin FROM anon, authenticated;
GRANT SELECT ON public.auditoria_admin TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.auditoria_admin TO service_role;

COMMIT;
