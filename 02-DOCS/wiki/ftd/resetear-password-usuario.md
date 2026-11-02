---
author: Javier
branch: main
status: in-progress
---

# Resetear contraseña de usuario

## Intent

Permitir a un administrador restablecer la contraseña de un usuario y notificarle por email sin exponer claves privilegiadas ni la contraseña temporal al navegador.

## Scope

Incluye un botón por usuario, generación y aplicación segura de contraseña temporal, envío de email, cambio obligatorio opcional al siguiente acceso y registro de auditoría. No incluye cambios a otros permisos o flujos de autenticación.

## Checklist

- [ ] Crear la Edge Function de reset y completar cambio obligatorio; comprobar autorización, generación segura, envío, actualización y errores.
- [ ] Añadir migración para la marca de cambio obligatorio y el registro de auditoría; comprobar RLS y permisos.
- [ ] Añadir la acción de reset en Usuarios con confirmación; comprobar estados y manejo de errores.
- [ ] Bloquear el uso normal de la aplicación hasta completar el cambio obligatorio; comprobar que se libera al guardar.
- [x] Ejecutar pruebas y build aplicables; registrar la salida observada.

## Evidence

Inspeccionados la pantalla de Usuarios, su consulta de perfiles, el contexto de autenticación y la Edge Function `enviar-email`. El envío existente valida JWT y permite a admins activos enviar a otros destinatarios. El changelog de Supabase consultado no muestra cambios incompatibles pertinentes.

`npm run lint` terminó sin errores; mostró la advertencia existente sobre `.eslintignore`. `npm test` pasó 61/61 pruebas. `npm run build` completó las tres compilaciones. No se ejecutaron las Edge Functions contra un proyecto Supabase ni se aplicó la migración.

## Next

Aplicar la migración y desplegar ambas Edge Functions en un entorno de prueba; comprobar permisos, entrega de email, bloqueo y desbloqueo.
