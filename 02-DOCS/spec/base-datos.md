# Base de Datos - Supabase (PostgreSQL)

> **Motor:** PostgreSQL 15+ vía Supabase  
> **Seguridad:** Row Level Security (RLS) activo en todas las tablas  
> **Última actualización:** 10/11/2026

## 1. Principio Fundamental del Stock

⚠️ **REGLA DE ORO:** El frontend **NUNCA** escribe directamente en la tabla `stock`.

- La tabla `stock` tiene permisos `GRANT SELECT` para usuarios autenticados.
- Toda modificación de inventario se realiza mediante `INSERT` en la tabla `movimientos`.
- Un **trigger en PostgreSQL** (`actualizar_stock`) calcula y actualiza el stock de forma atómica.
┌──────────────┐ INSERT ┌──────────────┐ TRIGGER ┌──────────────┐
│ Frontend │ ──────────────► │ movimientos │ ────────────► │ stock │
│ (React app) │ │ (historial) │ │ (actual) │
└──────────────┘ └──────────────┘ └──────────────┘

## 2. Esquema de Tablas Principales

### `productos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `codigo_barras` | TEXT | Código EAN-13 |
| `sku` | TEXT | Referencia interna |
| `nombre` | TEXT | Nombre del producto |
| `categoria_id` | UUID | FK → categorias |

### `categorias`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `nombre` | TEXT | Nombre de la categoría |
| `color` | TEXT | Color hex para UI |

### `secciones`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `nombre` | TEXT | Nombre de la sección (ej: "Pintura Mural") |
| `orden` | INTEGER | Orden de visualización |

### `ubicaciones`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `codigo` | TEXT | Código único (ej: "E651") |
| `seccion_id` | UUID | FK → secciones |
| `tipo` | TEXT | pasillo, armario, alto, cross, caja, reserva |
| `padre_id` | UUID | FK → ubicaciones (jerarquía) |

### `stock`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `producto_id` | UUID | FK → productos |
| `ubicacion_id` | UUID | FK → ubicaciones |
| `cantidad` | INTEGER | Stock actual (gestionado por trigger) |

### `movimientos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `producto_id` | UUID | FK → productos |
| `ubicacion_id` | UUID | FK → ubicaciones |
| `cantidad` | INTEGER | Positivo (entrada) o negativo (salida) |
| `tipo` | TEXT | ajuste, venta, importacion, revertir |
| `fecha` | TIMESTAMPTZ | Fecha del movimiento |
| `usuario_id` | UUID | FK → auth.users |
| `lote_id` | UUID | FK → palets (si es importación) |

### `palets`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `nombre` | TEXT | Nombre del lote |
| `fecha_importacion` | TIMESTAMPTZ | Fecha de importación CSV |
| `usuario_id` | UUID | FK → auth.users |

### `producto_ubicaciones`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `producto_id` | UUID | FK → productos |
| `ubicacion_id` | UUID | FK → ubicaciones |

### `perfiles_usuario` y `permisos_usuario`
Gestión de roles: admin, vendedor, soporte.

## 3. Triggers y Funciones

### `actualizar_stock`
- **Evento:** AFTER INSERT ON movimientos
- **Acción:** Suma/resta `cantidad` en `stock` para el par (producto_id, ubicacion_id).
- **Idempotente:** Si no existe fila en stock, la crea.

### `revertir_lote_importacion(lote_id UUID)`
- Función SQL que genera movimientos compensatorios.
- No borra el historial original.
- Usada desde `ModalRevertirLote.tsx`.

## 4. Row Level Security (RLS)

Todas las tablas tienen RLS activado. Políticas típicas:
- `SELECT`: usuarios autenticados pueden leer.
- `INSERT/UPDATE/DELETE`: solo roles `admin` o propietarios del registro.
- Tabla `stock`: solo `SELECT` permitido.

## 5. Migraciones

Las migraciones SQL viven en la carpeta `sql/` del repositorio. Se ejecutan manualmente en el SQL Editor de Supabase.