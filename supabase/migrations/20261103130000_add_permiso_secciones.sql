BEGIN;

ALTER TABLE public.permisos_usuario
  ADD COLUMN puede_gestionar_secciones boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS secciones_all ON public.secciones;
DROP POLICY IF EXISTS secciones_auth_policy ON public.secciones;

CREATE POLICY secciones_leer_autenticados
  ON public.secciones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfiles_usuario AS perfil
      WHERE perfil.id = (SELECT auth.uid())
        AND perfil.activo = true
    )
  );

CREATE POLICY secciones_insertar_autorizados
  ON public.secciones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    activo = true
    AND EXISTS (
      SELECT 1
      FROM public.perfiles_usuario AS perfil
      LEFT JOIN public.permisos_usuario AS permiso
        ON permiso.id_usuario = perfil.id
      WHERE perfil.id = (SELECT auth.uid())
        AND perfil.activo = true
        AND (
          perfil.rol = 'admin'
          OR permiso.puede_gestionar_secciones = true
        )
    )
  );

CREATE POLICY secciones_actualizar_autorizados
  ON public.secciones
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.perfiles_usuario AS perfil
      LEFT JOIN public.permisos_usuario AS permiso
        ON permiso.id_usuario = perfil.id
      WHERE perfil.id = (SELECT auth.uid())
        AND perfil.activo = true
        AND (
          perfil.rol = 'admin'
          OR permiso.puede_gestionar_secciones = true
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.perfiles_usuario AS perfil
      LEFT JOIN public.permisos_usuario AS permiso
        ON permiso.id_usuario = perfil.id
      WHERE perfil.id = (SELECT auth.uid())
        AND perfil.activo = true
        AND (
          perfil.rol = 'admin'
          OR permiso.puede_gestionar_secciones = true
        )
    )
  );

REVOKE INSERT, UPDATE, DELETE ON public.secciones FROM authenticated;
GRANT SELECT ON public.secciones TO authenticated;
GRANT INSERT (nombre, descripcion, activo) ON public.secciones TO authenticated;
GRANT UPDATE (activo) ON public.secciones TO authenticated;

COMMIT;