---
author: Javier
branch: main
status: in-progress
---
# Activar secciones y filtrar ubicaciones Cross

## Intent

Permitir ocultar secciones sin borrarlas y agilizar la búsqueda de ubicaciones Cross.

## Scope

Añadir el estado `activo` a `secciones`, usar las consultas activas existentes en los selectores y el árbol, y ofrecer un filtro rápido Cross. No desactiva secciones automáticamente ni cambia permisos o datos remotos.

## Checklist

- [x] Crear la migración con `activo` no nulo, activo por defecto, y activar los registros existentes; verificarla en Postgres aislado.
- [x] Confirmar que los selectores de secciones usan `activo = true` y comprobar si el Dashboard tiene filtros de secciones.
- [x] Añadir el control rápido Cross y verificar lint, pruebas, tipos y compilación.

## Evidence

La migración `20261103122557_add_activo_to_secciones.sql` añade `activo boolean NOT NULL DEFAULT true` y activa todas las secciones existentes. Una prueba con PGlite verificó filas existentes, el valor por defecto y la restricción `NOT NULL`. No se desactivaron secciones; el cambio mantiene los datos actuales y permite que un administrador las desactive manualmente más adelante.

`getSecciones` en `src/lib/inventario.ts` y `src/lib/ubicaciones.ts` ya filtra `activo = true`; Ubicaciones reutiliza esa consulta para el selector y el árbol. La sincronización inicial mantiene su lectura de todas las secciones para evitar duplicar las que un administrador desactive. No se encontraron consultas de secciones en el Dashboard.

El botón «Mostrar solo ubicaciones tipo Cross» reutiliza `filtroTipo = "cross"`, por lo que filtra tanto el árbol jerárquico como la lista y conserva los pasillos/secciones que contienen esos Cross.

`npm run lint` pasó con 0 errores y 9 advertencias preexistentes. `npm test` pasó 70/70 pruebas. `tsc --noEmit`, `npm run build` y `git diff --check` pasaron. `src/components/ui/barcode-scanner.tsx` permanece intacto. La migración no se ha aplicado a una base local ni remota.

## Next

Revisar la migración y aplicarla al entorno Supabase elegido cuando se autorice el despliegue.
