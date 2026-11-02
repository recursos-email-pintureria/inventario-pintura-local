---
author: Javier
branch: main
status: in-progress
---

# Corregir logout y acceso a Configuración

## Intent

Evitar que una sesión cerrada deje la aplicación en carga y asegurar que admins activos puedan abrir Configuración.

## Scope

Incluye navegación tras cerrar sesión, cancelación de emails pendientes al invalidarse la sesión y consistencia del permiso de Configuración entre menú y ruta. No incluye cambios al flujo de email ni a otros permisos.

## Checklist

- [ ] Reproducir el spinner tras logout y la pestaña oculta con pruebas que fallen antes del arreglo.
- [ ] Hacer logout local, redirigir al login y abortar solicitudes de email cuando termine la sesión; no encadenar el email de reset con un JWT de usuario.
- [ ] Permitir Configuración a admins activos en el menú y en la ruta; mantener el permiso para el resto.
- [ ] Ejecutar pruebas, lint y build; registrar resultados.

## Evidence

La ruta `/_authenticated/configuracion` y su componente existen y están registrados en `routeTree.gen.ts`. El menú y la ruta exigían el permiso individual, sin aceptar el rol de admin. `useMyProfile` queda pendiente sin usuario y `AppLayout` mostraba el spinner indefinidamente porque no redirigía al perder la sesión. Las pruebas nuevas reprodujeron ambos errores y el email pendiente sin cancelación.

La Edge Function `reset-password-admin` también reenviaba el JWT del admin a `enviar-email`, que valida ese token con `getUser()`. Si el token caduca entre ambas llamadas, el email devuelve 401. El reset ahora envía directo a Resend con el secreto de servidor. Las llamadas manuales de email abortan al recibir `SIGNED_OUT`.

## Next

Completar validación con pruebas, lint y build.
