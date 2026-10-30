# Inventario Pintura - LM

**Versión estable:** v1.4.0-palets | **Última actualización:** 30/10/2026

Sistema de gestión de inventario jerárquico para tienda de pinturas. Control de stock por ubicaciones físicas (secciones, pasillos, armarios, cross, cajas y reserva con palets), escáner de código de barras, ajustes rápidos, métricas en tiempo real, usuarios con permisos granulares y exportación/impresión de informes.

- **Producción:** https://inventario-pintura-local.vercel.app
- **Repositorio:** https://github.com/recursos-email-pintureria/inventario-pintura-local
- **Release estable:** https://github.com/recursos-email-pintureria/inventario-pintura-local/releases/tag/v1.4.0-palets
- **Despliegues Vercel:** https://vercel.com/aritx26-3717/~/deployments
- **Supabase:** https://app.supabase.com

## 🛠️ Stack Tecnológico

| Capa         | Tecnología                                                    |
| ------------ | ------------------------------------------------------------- |
| Frontend     | React 18, TypeScript, TanStack Router, TanStack Query, Vite 8.1.5 |
| UI / Estilos | Tailwind CSS, shadcn/ui, Radix UI, Lucide React               |
| Backend / BD | Supabase (PostgreSQL con RLS, Auth, Storage)                  |
| Despliegue   | Vercel (CI/CD automático desde `main`)                        |
| Testing      | Vitest                                                        |
| Herramientas | Git, ESLint, Prettier, **npm** (no se usa Bun)                |

## 📂 Jerarquía de Ubicaciones (actualizada 30/10/2026)

```
Nivel 0: Sección (tabla ubicaciones)
├── Nivel 1: Pasillo   (hijo de Sección)
│   ├── Nivel 2: Armario  (hijo de Pasillo)
│   └── Nivel 2: Cross    (hijo de Pasillo)
├── Nivel 1: Reserva   (hijo de Sección)  ←  tiene Palets (tabla independiente)
└── Nivel 1: Caja      (hijo de Sección)
```

- El tipo `alto` **ya no existe**: se renombró a `armario` en la Fase 6.
- `palets` es una **tabla independiente, NO un nivel de ubicación**. Se relaciona con ubicaciones de tipo Reserva mediante `id_ubicacion`.
- "Padre" en la tabla siguiente se refiere a **otra ubicación** (la fila padre en `ubicaciones`), no a la tabla de secciones.

| Tipo    | Nivel | Icono (Lucide)  | Color     | Padre (ubicación) |
| ------- | ----- | --------------- | --------- | ----------------- |
| seccion | 0     | Building2       | Índigo    | Ninguno           |
| pasillo | 1     | ArrowLeftRight  | Azul      | Sección           |
| reserva | 1     | Warehouse       | Gris      | Sección           |
| caja    | 1     | Package         | Rosa      | Sección           |
| armario | 2     | Archive         | Esmeralda | Pasillo           |
| cross   | 2     | Shuffle         | Púrpura   | Pasillo           |

Los armarios tienen el campo `posicion_lateral` (`'derecha'` o `'izquierda'`). Los colores e iconos se centralizan en `src/lib/tiposUbicacion.ts` y se muestran con `BadgeTipoUbicacion`.

## 🏗️ Arquitectura de Stock (CRÍTICO)

**El cliente NUNCA escribe directamente en la tabla `stock`** (solo tiene `GRANT SELECT` para usuarios autenticados). Toda modificación se hace así:

1. `INSERT` en la tabla `movimientos` (tipos: `entrada`, `salida`, `reposicion`, `ajuste`).
2. El trigger `actualizar_stock` de PostgreSQL actualiza `stock` automáticamente (también para filas asociadas a un palet).
3. Para palets, la reposición usa la RPC transaccional `reponer_producto_palet`.

| Tipo       | Efecto en stock                   | Caso de uso              |
| ---------- | --------------------------------- | ------------------------ |
| entrada    | stock + cantidad                  | Recepción de mercancía   |
| salida     | stock - cantidad                  | Venta, merma, traslado   |
| reposicion | stock + cantidad                  | Repuesto de lineal       |
| ajuste     | stock = cantidad (valor absoluto) | Corrección de inventario |

El trigger rechaza `cantidad <= 0`. Para ajustar a 0, el sistema convierte el ajuste en una `salida` por la cantidad total actual.

## 🗄️ Tablas principales

| Tabla                  | Descripción                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `ubicaciones`          | Jerarquía física (incluye secciones)                          |
| `productos`            | Catálogo                                                      |
| `stock`                | Relación producto-ubicación (incluye `id_palet`). Solo lectura desde el cliente |
| `movimientos`          | Historial; única vía de modificación de stock                 |
| `palets`               | Contenedores dentro de una Reserva (tabla independiente)      |
| `categorias`           | Categorías de producto                                        |
| `producto_ubicaciones` | Asociación producto-ubicación                                 |
| `perfiles_usuario`     | Perfiles y roles                                              |
| `permisos_usuario`     | Permisos granulares por usuario                               |

RLS activo en todas las tablas.

## 📍 Estado Actual: Sección Pintura (30/10/2026)

**6 Pasillos, 94 Armarios (E651-E744), 1 Reserva.** Cajas y Cross: pendientes de crear.

| Pasillo | Contenido                         | Derecha          | Izquierda        | Armarios |
| ------- | --------------------------------- | ---------------- | ---------------- | -------- |
| 12      | Pintura exterior                  | E651-E658 (8)    | E659-E670 (12)   | 20       |
| 14      | Adhesivos Droguería               | E671-E683 (13)   | E684-E697 (14)   | 27       |
| 16      | Pint Blc y Rodillos               | E698-E710 (13)   | E711-E716 (6)    | 19       |
| 18      | Esmaltes, Spray, Pintura hierro   | E717-E728 (12)   | E729-E734 (6)    | 18       |
| 20      | Pintura Mural, Efectos (vacío)    | -                | -                | 0        |
| Perimetral | Herramientas                   | E735-E744 (10)   | -                | 10       |

Script de migración: `sql/fase6_reestructurar_ubicaciones.sql`.

## 🧩 Sistema de Palets

- Tabla `palets` independiente, ligada a ubicaciones tipo Reserva por `id_ubicacion`; `stock.id_palet` asocia productos al palet.
- Creación manual con código de barras automático (`PAL-###-Usuario-Fecha`).
- Gestión de productos dentro del palet (igual que armarios).
- Autodestrucción automática con alerta de seguridad cuando el stock llega a 0.
- Impresión de etiquetas con código de barras y listado A4.
- Componentes: `src/components/inventario/PaletsReserva.tsx` (palets en reserva) y `src/components/inventario/ModalProductosPalet.tsx` (productos del palet).
- Lógica y queries: `src/lib/palets.ts`.
- Impresión global reutilizable: `src/components/ui/print-preview-dialog.tsx` (sin librerías externas; usa `window.print()`).

## 📁 Estructura de Carpetas (`src/`)

```
src/
├── router.tsx, routeTree.gen.ts, server.ts, start.ts, styles.css
├── components/
│   ├── auth/         AuthLayout.tsx
│   ├── inventario/   BadgeTipoUbicacion.tsx, Escaner.tsx, EstadoInventario.tsx,
│   │                 ModalProductosPalet.tsx, PaletsReserva.tsx
│   ├── layout/       AppLayout.tsx
│   └── ui/           componentes shadcn + print-preview-dialog.tsx
├── contexts/         AuthContext.tsx
├── hooks/            use-mobile.tsx, usePermissions.ts
├── lib/              error-capture.ts, error-page.ts, getCategorias.ts, inventario.ts,
│                     lovable-error-reporting.ts, meta.ts, palets.ts, queryClient.ts,
│                     supabase.ts, tipos.ts, tiposUbicacion.ts, ubicaciones.ts,
│                     usuarios.ts, utils.ts
│   └── queries/      dashboard.ts
├── pages/            ForgotPassword.tsx, Login.tsx, Register.tsx,
│                     ResetPassword.tsx, VerifyEmail.tsx
├── routes/           __root.tsx, index.tsx, login.tsx, register.tsx, forgot-password.tsx,
│   │                 reset-password.tsx, verify-email.tsx, README.md
│   └── _authenticated/  route.tsx, dashboard.tsx, categorias.tsx, configuracion.tsx,
│                        movimientos.tsx, productos.tsx, ubicaciones.tsx, usuarios.tsx
└── test/             app-routing.test.tsx, inventario-sql.test.ts, palets.test.ts,
                      setup.ts, usuarios.test.ts
```

## 🧱 Migraciones SQL (carpeta `sql/`)

Ejecutar en el SQL Editor de Supabase, en este orden:

1. `sql/fase5_4b_stock_palets.sql`: columna `id_palet` en `stock` y permisos RLS.
2. `sql/fase5_5_movimientos_palets.sql`: revoca escrituras directas a `stock`, amplía el trigger `actualizar_stock` para filas con palet y crea la RPC `reponer_producto_palet`.
3. `sql/fase6_reestructurar_ubicaciones.sql`: reestructura de ubicaciones (`alto` → `armario`, nueva jerarquía).

## ✅ Fases Completadas

### Fase 1: Estructura base y autenticación
- [x] Supabase con RLS, autenticación con roles
- [x] Tablas `perfiles_usuario`, `permisos_usuario`, `categorias`, `productos`

### Fase 2: Ubicaciones jerárquicas
- [x] Tablas `ubicaciones`, `stock`, `movimientos`, `producto_ubicaciones`
- [x] Triggers de actualización de stock y políticas RLS

### Fase 3: Dashboard y métricas
- [x] KPIs: total productos, stock bajo, movimientos hoy, ubicaciones activas
- [x] Gráficos de actividad y top ubicaciones
- [x] Exportación de movimientos a Excel y PDF

### Fase 4: Interfaz jerárquica completa
- [x] Vista de árbol expandible, badges de colores por tipo
- [x] Gestión de productos por ubicación (añadir, editar, eliminar)
- [x] Escáner de código de barras con cámara
- [x] Autocompletado con búsqueda flexible, ajuste rápido y limpieza de lineales

### Fase 4.5: Corrección de bugs críticos (v1.0.0-stable)
- [x] Eliminada la escritura directa en `stock` desde el cliente
- [x] Stock por ubicación calculado desde `data.stock`
- [x] Desglose expandible por armario/pasillo
- [x] Escáner y ajuste rápido migrados a `Dialog` de Radix
- [x] Mensajes de error RLS claros y específicos

### Fase 4.6: Gestión de usuarios y permisos (v1.1.0)
- [x] Página `/usuarios` con edición de permisos por toggles
- [x] Protección contra auto-desprivilegio y confirmación para cambios críticos
- [x] Menú visible según `isAdmin` o `puede_gestionar_usuarios`

### Fase 4.7: Confirmaciones para acciones críticas (v1.1.5)
- [x] `AlertDialog` en eliminar producto, ajustar a 0, desactivar/borrar ubicación y limpiar stock masivo
- [x] Sustituido `window.confirm` por `AlertDialog` de shadcn/ui

### Fase 4.8: Mejoras visuales y UX (v1.2.0-visual)
- [x] Iconos y colores por tipo de ubicación, `BadgeTipoUbicacion` (sm, md, lg)
- [x] Configuración centralizada en `tiposUbicacion.ts`
- [x] Árbol con indentación y líneas conectoras

### Fase 4.9: Informe detallado imprimible (v1.3.0-informe-imprimible)
- [x] Vista Listado con filtros en cascada (Tipo, Sección, Pasillo) y "Solo con stock"
- [x] Informe jerárquico A4 con carga bajo demanda y vista previa antes de imprimir
- [x] Estilos de impresión sin cortes entre páginas

### Fase 5: Sistema de palets (v1.4.0-palets)
- [x] Tabla `palets` con RLS y columna `id_palet` en `stock`
- [x] Librería `src/lib/palets.ts` con CRUD y autodestrucción
- [x] UI de gestión (`PaletsReserva.tsx`) y modal de productos (`ModalProductosPalet.tsx`)
- [x] Impresión de etiqueta y listado A4 con `PrintPreviewDialog`
- [x] Expandir/colapsar palets en la Vista Listado
- [x] Movimientos para entradas, ajustes y reposiciones en palets

### Fase 6: Reestructuración de ubicaciones
- [x] Tipo `alto` renombrado a `armario`
- [x] Nueva jerarquía (Sección → Pasillo/Reserva/Caja → Armario/Cross)
- [x] Sección Pintura cargada: 6 pasillos, 94 armarios, 1 Reserva

## 🐛 Bugs Críticos Corregidos

| #   | Bug                                            | Causa raíz                                                    | Solución                                       |
| --- | ---------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Error 42501 al guardar cantidad                | Cliente escribía directo en `stock` (RLS bloquea)             | Delegar al trigger vía INSERT en `movimientos` |
| 2   | Totales de stock incorrectos en Movimientos    | Reconstrucción desde movimientos                              | Usar `data.stock` como fuente de verdad        |
| 3   | Escáner de cámara no funcionaba en Ubicaciones | `div` casero bloqueado por Dialog padre de Radix              | Envolver en `<Dialog>` oficial de Radix UI     |
| 4   | Botón "Ajuste rápido" no respondía             | Mini-modal bajo `pointer-events: none` del Dialog padre       | Convertir a `<Dialog>` oficial con portal DOM  |
| 5   | Autocompletado sin todos los productos         | Catálogo en caché obsoleto                                    | Recargar al abrir modal "Añadir"               |
| 6   | Mensaje genérico de permisos                   | `errorInventario()` no diferenciaba 42501/PGRST116            | Mensajes específicos según contexto            |

## 🏷️ Versión estable y recuperación de emergencia

**Versión estable actual:** [v1.4.0-palets](https://github.com/recursos-email-pintureria/inventario-pintura-local/releases/tag/v1.4.0-palets)
**Estado:** ✅ Producción en Vercel

### 🚨 Cómo recuperar esta versión en caso de error crítico

```bash
# 1. Asegúrate de estar en la rama principal
git checkout main

# 2. Restablece el código local al estado de la versión estable
git reset --hard v1.4.0-palets

# 3. Fuerza la actualización en GitHub
# ⚠️ ATENCIÓN: esto sobrescribe el historial remoto
git push origin main --force
```

## 🔐 Seguridad y credenciales

Variables de entorno (`.env.example`). **Nunca subir `.env` al repositorio.**

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

- ✅ La clave `anon` de Supabase es pública por diseño (segura en frontend).
- ✅ RLS activo en todas las tablas; permisos granulares en `permisos_usuario`.
- ✅ Protección contra auto-desprivilegio en gestión de usuarios.
- 🚫 NUNCA subir tokens personales de GitHub (PAT) al código o chats.
- 🚫 NUNCA escribir directamente en tablas protegidas desde el cliente.

Si un token se expone: GitHub Settings → Tokens → revocarlo de inmediato y generar uno nuevo con permisos mínimos.

## 🚀 Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm test             # Tests (Vitest)
npx tsc --noEmit     # Verificar tipos

git status
git log --oneline -5
git tag
git fetch --prune
git push origin main # Vercel despliega automáticamente
```

## 📋 Próximas fases planificadas

### Fase 7: Automatización de datos (Leroy Merlin)
- Script para extraer Ref/SKU y descripción desde la web de Leroy Merlin
- Integración con el formulario de creación de productos
- Validación automática de códigos de barras

### Fase 8: Mejoras visuales adicionales
- Dashboard con KPIs con semáforo de colores
- Badges de colores por tipo de movimiento y gráfico de los últimos 7 días
- Filtros en la tabla de actividad (tipo, fecha, ubicación)
- Modo oscuro/claro y atajos de teclado

### Fase 9: Reportes y analítica avanzada
- Dashboard de rotación de stock
- Alertas automáticas de stock bajo por email
- Historial de movimientos por producto con gráficos
- Comparativa de inventarios entre fechas

## 👥 Contribución

1. Crea una rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Commits con el patrón `tipo: descripción corta` (`feat`, `fix`, `docs`, `style`)
3. Abre un Pull Request describiendo los cambios

## 📄 Licencia

Propietario. Uso interno para gestión de inventario de la tienda.

_Última actualización: 30/10/2026 · Versión: v1.4.0-palets_