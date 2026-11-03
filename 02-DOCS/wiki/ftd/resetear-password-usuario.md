---
author: Javier
branch: main
status: in-progress
---

# Resetear contraseña de usuario

## Intent

Permitir a un administrador restablecer la contraseña de un usuario en una tienda física, comunicarle la contraseña temporal en persona y obligar al usuario a cambiarla al iniciar sesión.

## Scope

Incluye generación y aplicación segura de contraseña temporal en la Edge Function, entrega al frontend solo después de completar el reset, modal con opción de copiar, cambio obligatorio en el siguiente acceso y registro de auditoría. No se envían emails ni se modifica el servicio general de correo.

## Checklist

- [x] Confirmar que la Edge Function valida al administrador, cambia la contraseña, fuerza el cambio obligatorio, completa la auditoría y no envía emails.
- [x] Entregar la contraseña temporal en un modal con opción de copiar y limpiar el valor al cerrar.
- [x] Confirmar que la aplicación bloquea el uso normal hasta completar el cambio obligatorio.
- [x] Ejecutar pruebas, lint y build aplicables; registrar la salida observada.

## Evidence

La Edge Function valida JWT y administrador activo, genera una contraseña segura, actualiza Auth y `debe_cambiar_password` a `true`, marca la auditoría como completada y responde con `password_temporal`. No contiene llamadas a Resend ni lee sus secretos. La pantalla muestra el secreto en un diálogo con copia al portapapeles y lo elimina al cerrarlo. `AppLayout` bloquea el uso normal mientras el indicador esté activo, y `completar-cambio-password` lo desactiva al guardar la nueva contraseña.

Vitest pasó 68/68 pruebas. ESLint pasó en los archivos TypeScript modificados; mostró la advertencia existente sobre `.eslintignore`. `tsc --noEmit` terminó sin errores. `npm run build` completó las compilaciones de cliente, SSR y Nitro. `git diff --check` no encontró errores de espacios; Git mostró advertencias de conversión LF/CRLF.

La función `reset-password-admin` se desplegó al proyecto Supabase `inventario-pintura` y la consulta de funciones confirmó estado `ACTIVE`, versión 6.

## Next

Probar el flujo completo con una cuenta de prueba autorizada. No se restableció ninguna cuenta real durante la verificación.
