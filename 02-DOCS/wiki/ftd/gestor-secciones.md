---
author: Javier
branch: main
status: in-progress
---
# Gestión móvil de secciones

## Intent

Permitir crear secciones y activar o desactivar las existentes desde Ubicaciones, con controles de acceso específicos y un panel adaptable a móvil.

## Scope

Añadir `puede_gestionar_secciones`, proteger las mutaciones de secciones con RLS, crear un Sheet con Switch y formulario de alta, y mostrar su acceso solo a perfiles autorizados. No incluye auditoría ni cambio de permisos de otras funciones.

## Checklist

- [x] Crear la migración solicitada y comprobar su SQL y compatibilidad con las políticas conocidas.
- [x] Construir el gestor con TanStack Query, validación de errores y controles de permiso.
- [x] Integrarlo en Ubicaciones con autorización coherente de interfaz y base de datos.
- [x] Ejecutar lint, pruebas, tipos y build; no desplegar la migración remota.

## Evidence

- La simulación local con PGlite ejecutó la migración y confirmó inserción/activación autorizadas, denegación de escrituras sin permiso, límite de actualización a `activo` y bloqueo de lectura para perfiles inactivos.
- `npm run lint`: 0 errores; quedan 9 advertencias preexistentes.
- `npm test`: 74 pruebas aprobadas.
- `npx tsc --noEmit`: aprobado.
- `npm run build`: aprobado.
- No se aplicó la migración en Supabase. La conexión de comprobación falló por autenticación de la contraseña de PostgreSQL.

## Next

Aplicar la migración al proyecto remoto con credenciales válidas y comprobar allí las columnas y políticas antes de habilitar el cambio para usuarios.
