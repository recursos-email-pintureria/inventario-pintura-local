---
author: Javier
branch: main
status: in-progress
---
# Configuración para usuarios activos

## Intent

Hacer Configuración accesible a cualquier usuario activo, con Mi Cuenta, Apariencia y Soporte para todos, y controles administrativos solo para admins.

## Scope

Incluye el acceso a la ruta, secciones por rol, cambio de contraseña con verificación de la contraseña actual y eliminación del email de prueba. No cambia permisos de otras páginas, lógica de email de incidencias ni la Edge Function de reset.

## Checklist

- [x] Permitir el acceso de usuarios activos y mantener controles del sistema solo para admins; probar acceso de vendedor e inactivo.
- [x] Mostrar Mi Cuenta, Apariencia y Soporte para todos; validar contraseña actual y eliminar el formulario de email de prueba.
- [x] Ejecutar lint, todas las pruebas y build; corregir los errores de formato fuera del componente UI protegido y registrar el bloqueo restante.

## Evidence

La ruta ahora permite cualquier perfil activo sin consultar permisos individuales. El menú refleja el mismo acceso. Mi Cuenta, Apariencia y Soporte están disponibles para todos; Administración y la lectura completa de ajustes solo se cargan para admins. Los demás usuarios leen solo el correo de contacto. RLS permite a `authenticated` leer la tabla de configuración; las escrituras existentes siguen requiriendo `puede_gestionar_usuarios`. La actualización de contraseña valida primero la contraseña actual y luego llama a `auth.updateUser`. El formulario de reportar incidencia conserva `useEnviarEmail`; se eliminó la prueba de email.

ESLint dirigido a los archivos modificados pasó. `npm test` pasó 69/69 pruebas. `npm run build` completó las compilaciones de cliente, SSR y Nitro. `tsc --noEmit` y `git diff --check` también pasaron.

El lint global incluía copias locales de herramientas y respaldos porque ESLint 9 ya no aplica `.eslintignore`. Las exclusiones se migraron a `eslint.config.js`, se retiró `.eslintignore` y se corrigió el formato de los archivos versionados con errores. El último `npm run lint` aún falla por 330 errores de formato en `src/components/ui/barcode-scanner.tsx` y muestra 9 advertencias. Ese componente se dejó intacto por la regla del proyecto de no modificar `src/components/ui/` y por decisión del usuario.

## Next

El único bloqueo del lint global queda en `src/components/ui/barcode-scanner.tsx`. Mantenerlo sin cambios mientras siga vigente la regla de no modificar `src/components/ui/`.
