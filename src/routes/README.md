# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File                     | URL                                                     |
| ------------------------ | ------------------------------------------------------- |
| `index.tsx`              | `/`                                                     |
| `about.tsx`              | `/about`                                                |
| `users/index.tsx`        | `/users`                                                |
| `users/$id.tsx`          | `/users/:id` (dynamic — bare `$`, no curly braces)      |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment)                  |
| `files/$.tsx`            | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx`            | layout route (renders children via `<Outlet />`)        |
| `__root.tsx`             | app shell — wraps every page; preserve `<Outlet />`     |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.
Add-Content -Path "README.md" -Value @"

## 📍 Estado Actual: Ubicaciones Sección Pintura (Actualizado 31/10/2026)

### Estructura jerárquica:
- **Nivel 0**: Sección "Pintura"
- **Nivel 1**: 6 Pasillos + Reserva + Cajas (pendientes)
- **Nivel 2**: 94 Armarios (códigos E651-E744) + Cross (pendientes)

### Pasillos y armarios:

| Pasillo | Lado | Códigos | Total |
|---------|------|---------|-------|
| **12 (Pintura exterior)** | Derecha | E651-E658 | 8 |
| **12 (Pintura exterior)** | Izquierda | E659-E670 | 12 |
| **14 (Adhesivos Droguería)** | Derecha | E671-E683 | 13 |
| **14 (Adhesivos Droguería)** | Izquierda | E684-E697 | 14 |
| **16 (Pint Blc y Rodillos)** | Derecha | E698-E710 | 13 |
| **16 (Pint Blc y Rodillos)** | Izquierda | E711-E716 | 6 |
| **18 (Esmaltes, Spray, Pintura hierro)** | Derecha | E717-E728 | 12 |
| **18 (Esmaltes, Spray, Pintura hierro)** | Izquierda | E729-E734 | 6 |
| **20 (Pintura Mural, Efectos)** | - | Vacío | 0 |
| **Perimetral (Herramientas)** | Derecha | E735-E744 | 10 |
| **TOTAL** | | | **94** |

### Tipos de ubicación:
- \`seccion\` (Nivel 0) - Raíz
- \`pasillo\` (Nivel 1) - Hijo de sección
- \`reserva\` (Nivel 1) - Independiente
- \`caja\` (Nivel 1) - Independiente (NO CREADA AÚN)
- \`armario\` (Nivel 2) - Dentro de pasillos, con \`posicion_lateral\`
- \`cross\` (Nivel 2) - Dentro de pasillos, principio/fin (NO CREADO AÚN)

### Campo \`posicion_lateral\`:
- Valores: \`'derecha'\`, \`'izquierda'\`, \`null\`
- Usado para diferenciar visualmente los lados de cada pasillo
- Todos los armarios E651-E744 tienen este campo definido

### Script de migración:
Ver archivo: \`sql/fase6_reestructurar_ubicaciones.sql\`
"@