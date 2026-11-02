---
type: constitution
title: inventario-pintura-local — Constitution
description: The non-negotiable principles, business invariants, and merge floor for Inventario Pintura LM.
tags: [sdd, constitution, principles]
timestamp: 2026-11-02T17:55:00Z
topic: sdd
version: v1.0.0
---

# inventario-pintura-local — Constitution

> Version: v1.0.0 · Ratified: 2026-11-02 · Last amended: 2026-11-02
> The non-negotiable principles every rsc-sdd phase obeys. Stack mechanics live in
> `02-DOCS/wiki/stack/*` and `BUSINESS_RULES.md`; this file ratifies the principles and links the detail.

## 1. Stack canon

1. **Lenguajes y runtime:** TypeScript (estricto, ES2022+), React 18, Vite. Node.js runtime. Gestor de paquetes: `npm` con `package-lock.json` comprometido.
2. **Frameworks & UI:** TanStack Router para enrutamiento, TanStack Query para estado de servidor y caché, Tailwind CSS y componentes shadcn/ui (Radix UI). Iconos exclusivamente de `lucide-react`.
3. **Backend & Base de datos:** Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security). Modificaciones de esquema únicamente mediante migraciones en `supabase/migrations/`.

## 2. Quality bar & Integridad de Datos

4. **Calidad de código y tests:** `npm run build` y `npm test` (Vitest) deben pasar sin errores ni fallos antes de dar por completada cualquier tarea o merge.
5. **Tipado TypeScript estricto:** Prohibido el uso de `any` no justificado; la verificación de tipos (`tsc --noEmit`) debe compilar en limpio.
6. **PROHIBIDA la escritura directa en `stock`:** El cliente jamás realiza `INSERT`, `UPDATE` o `DELETE` directamente en la tabla `stock`. Toda variación de inventario DEBE registrarse insertando en `movimientos` (`entrada`, `salida`, `reposicion`, `ajuste`). El trigger PostgreSQL `actualizar_stock` es la única fuente de mutación.
7. **Fuente de verdad de inventario:** El stock real se lee de la base de datos (calculado por triggers). Tras cualquier movimiento o ajuste, se debe invalidar la caché de TanStack Query (`invalidateQueries`).
8. **Acciones destructivas confirmadas:** Prohibido el uso de `window.confirm()`. Toda acción irreversible (baja de palet, eliminación de producto/ubicación, ajuste a cero) DEBE utilizar `AlertDialog` de shadcn/ui.
9. **Eliminación lógica de palets:** Los palets no se eliminan físicamente de la base de datos; se realiza soft delete (`UPDATE palets SET activo = FALSE`). Los palets son exclusivos de ubicaciones tipo `reserva` y mantienen su formato de código `PAL-{000}-{usuario}-{ddmmaaaa}`.

## 3. Conventions

10. **Estructura modular:** Componentes UI en `src/components/`, rutas en `src/routes/`, hooks en `src/hooks/`, utilidades en `src/lib/`, migraciones SQL en `supabase/migrations/`. No crear componentes tipo `div` caseros cuando exista un componente Radix UI correspondiente (ej. Dialog, AlertDialog, Popover).
11. **Formato de commits:** Conventional Commits obligatorio (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`).

## 4. Branching & shipping

12. **Flujo de trabajo:** Cambios directos a la rama principal `main` (según flujo acordado para desarrollo ágil/local).
13. **Git authorship is the human's:** Todo commit y cambio en git pertenece al usuario humano (Aritx / propietario del repositorio). Prohibido añadir `Co-Authored-By` de IA o pie "generated with AI".

## 5. Security & privacy floor

14. **Row Level Security (RLS) mandatorio:** Toda tabla nueva o modificada DEBE tener RLS activado (`ENABLE ROW LEVEL SECURITY`) y políticas explícitas de acceso antes de ser utilizada.
15. **Gestión de credenciales y secretos:** Ninguna clave privada o secreto se compromete en git. Las variables se gestionan a través de `.env` (ignorado en `.gitignore`).

## 6. UX / accessibility & Responsive floor

16. **Experiencia móvil y accesibilidad:** Las vistas de almacén (escaneo de códigos de barra, selección de ubicaciones, conteo físico) deben ser 100% responsive y funcionales en dispositivos móviles. Modales y componentes interactivos deben cumplir navegación por teclado y foco visible según los estándares de Radix UI.
17. **Reglas de impresión (@media print):** Toda vista imprimible (etiquetas de palet, códigos de barra, albaranes) debe respetar los estilos `@media print` para ocultar overlays y ajustar colores de fondo exactos.

## 7. Knowledge & decisions

18. **Trazabilidad de decisiones:** Toda decisión arquitectónica o de negocio relevante debe quedar registrada en `02-DOCS/wiki/harness/decisions.md` y alineada con `BUSINESS_RULES.md`.

## Definition of Done (the merge bar `verify` runs against)

Una tarea o funcionalidad se considera terminada únicamente cuando se cumplen todos los siguientes puntos:

- [ ] `npm run build` compila sin errores.
- [ ] `npm test` pasa completamente en verde.
- [ ] Se respeta la regla de oro: sin mutaciones directas en `stock` (sólo vía `movimientos`).
- [ ] Políticas RLS verificadas en tablas creadas o alteradas.
- [ ] Se usa `AlertDialog` para cualquier confirmación destructiva.
- [ ] Se respetan las convenciones de UI (shadcn/ui, iconos Lucide, diseño móvil).
- [ ] Formato de commits Conventional Commits y autoría humana en git.
- [ ] Decisiones registradas en `02-DOCS/wiki/` y `BUSINESS_RULES.md`.

## Amendment log (append-only)

| Date | Version | Change | Why |
|------|---------|--------|-----|
| 2026-11-02 | v1.0.0 | Ratified initial constitution. | Formalización de reglas no negociables de Inventario Pintura LM tras adopción de rsc-harness. |
