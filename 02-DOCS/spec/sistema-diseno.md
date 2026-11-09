# Sistema de Diseño

> **Última actualización:** 10/11/2026  
> **Versión:** 1.3.0-semanticos

## 1. Filosofía

Usamos **variables semánticas de shadcn/ui** en lugar de colores Tailwind hardcodeados. Esto garantiza:
- Consistencia visual en toda la app.
- Soporte nativo para modo claro/oscuro.
- Accesibilidad WCAG AA garantizada.

## 2. Color Primario: Ámbar

| Variable | Modo Claro | Modo Oscuro |
|----------|-----------|-------------|
| `--primary` | `oklch(0.77 0.17 75)` (ámbar) | `oklch(0.77 0.17 75)` |
| `--primary-foreground` | Oscuro (contraste WCAG AA) | Oscuro |

**Decisión:** El ámbar se eligió por su visibilidad y coherencia con la identidad de tienda de pinturas.

## 3. Variables Semánticas Principales

| Variable | Uso | Ejemplo |
|----------|-----|---------|
| `bg-card` | Fondos de tarjetas | Cards, modales |
| `bg-muted` | Fondos secundarios | Paneles laterales |
| `bg-destructive` | Acciones peligrosas | Botón eliminar |
| `text-foreground` | Texto principal | Títulos, párrafos |
| `text-muted-foreground` | Texto secundario | Descripciones |
| `border` | Bordes | Inputs, divisores |

## 4. Modo Oscuro

Todas las variables tienen variante `dark:` definida en `src/styles.css`. Los componentes usan clases como:tsx
<div className="bg-card dark:bg-slate-800">
## 5. Colores con Significado

| Color | Uso | Clase Tailwind |
|-------|-----|----------------|
| Azul | Información | `text-blue-600 dark:text-blue-400` |
| Verde/Esmeralda | Éxito | `text-emerald-600 dark:text-emerald-400` |
| Ámbar | Advertencia | `text-amber-600 dark:text-amber-400` |
| Rojo/Rosa | Error/Peligro | `text-rose-600 dark:text-rose-400` |

## 6. Componentes UI

Usamos **shadcn/ui** como base:
- `Button`, `Card`, `Dialog`, `AlertDialog`
- `Tabs`, `Table`, `Badge`
- `Switch`, `Select`, `Input`

Todos los componentes respetan las variables semánticas.

## 7. Decisiones de Diseño

- **No usar colores hex hardcodeados** salvo casos excepcionales (ej: colores de categorías específicos).
- **No crear tokens personalizados** si ya existe una variable semántica equivalente.
- **Contraste mínimo WCAG AA** (4.5:1 para texto normal).