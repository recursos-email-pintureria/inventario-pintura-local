BEGIN;

ALTER TABLE public.secciones
  ADD COLUMN activo boolean NOT NULL DEFAULT true;

UPDATE public.secciones
SET activo = true;

COMMIT;