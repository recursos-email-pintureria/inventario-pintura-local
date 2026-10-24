# 🎨 Inventario Pintura - LM

Sistema profesional de gestión de inventario jerárquico para tienda de pinturas. Permite el control de stock por ubicaciones específicas (secciones, pasillos, armarios, altos, cross, cajas y reserva), con escáner de código de barras, ajustes rápidos, métricas en tiempo real y exportación a Excel/PDF.

**🌐 Aplicación en producción:** [https://inventario-pintura-local.vercel.app](https://inventario-pintura-local.vercel.app)

**📦 Repositorio GitHub:** [https://github.com/recursos-email-pintureria/inventario-pintura-local](https://github.com/recursos-email-pintureria/inventario-pintura-local)

**🏷️ Versión estable actual:** [v1.0.0-stable](https://github.com/recursos-email-pintureria/inventario-pintura-local/tree/v1.0.0-stable)

** Panel de despliegues Vercel:** [https://vercel.com/aritx26-3717/~/deployments](https://vercel.com/aritx26-3717/~/deployments)

**🗄️ Panel de Supabase:** [https://app.supabase.com](https://app.supabase.com)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Enlace |
|------|-----------|--------|
| **Frontend** | React 18, TypeScript, TanStack Router, TanStack Query | [react.dev](https://react.dev) · [tanstack.com](https://tanstack.com) |
| **UI/Estilos** | Tailwind CSS, Radix UI, Lucide React, shadcn/ui | [tailwindcss.com](https://tailwindcss.com) · [radix-ui.com](https://radix-ui.com) · [lucide.dev](https://lucide.dev) · [ui.shadcn.com](https://ui.shadcn.com) |
| **Backend/BD** | Supabase (PostgreSQL con Row Level Security) | [supabase.com](https://supabase.com) |
| **Despliegue** | Vercel (CI/CD automático desde `main`) | [vercel.com](https://vercel.com) |
| **Testing** | Vitest | [vitest.dev](https://vitest.dev) |
| **Herramientas** | Git, ESLint, Prettier, Bun | [git-scm.com](https://git-scm.com) · [bun.sh](https://bun.sh) |

---

## 📂 Estructura Jerárquica de Ubicaciones

El sistema soporta una jerarquía estricta de 3 niveles:

🏷️ Sección (Ej: Pintura Exterior, Droguería)
└── ️ Pasillo / 🏭 Reserva (Nivel 1 - Padre)
└── 🗄️ Armario / 📦 Alto / 🔄 Cross / 💳 Caja (Nivel 2 - Hijo)
└── Productos con stock


**Tipos de ubicación y sus reglas:**

| Tipo | Nivel | Requiere padre | Posición lateral | Posición longitudinal | Sección origen |
|------|-------|----------------|------------------|----------------------|----------------|
| `pasillo` | 1 | ❌ No | ❌ No | ❌ No | ❌ No |
| `reserva` | 1 | ❌ No | ❌ No | ❌ No | ❌ No |
| `armario` | 2 | ✅ Sí | ✅ Sí | ❌ No | ❌ No (hereda) |
| `alto` | 2 | ✅ Sí | ✅ Sí |  No | ❌ No (hereda) |
| `caja` | 2 | ✅ Sí | ✅ Sí | ❌ No | ❌ No (hereda) |
| `cross` | 2 | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |

---

## 🏗️ Arquitectura de Stock (CRÍTICO)

### Principio fundamental: **El cliente NUNCA escribe directamente en la tabla `stock`**

La tabla `stock` tiene `GRANT SELECT` para usuarios autenticados. Toda modificación se realiza mediante:

1. **INSERT en tabla `movimientos`** (entrada, salida, reposición, ajuste)
2. **Trigger `actualizar_stock`** en PostgreSQL que:
   - Bloquea la fila con `FOR UPDATE`
   - Calcula el nuevo stock según el tipo de movimiento
   - Actualiza/inserta/elimina la fila en `stock`
   - Libera el bloqueo

### Tipos de movimiento

| Tipo | Efecto en stock | Caso de uso |
|------|----------------|-------------|
| `entrada` | `stock + cantidad` | Recepción de mercancía |
| `salida` | `stock - cantidad` | Venta, merma, traslado |
| `reposicion` | `stock + cantidad` | Repuesto de lineal |
| `ajuste` | `stock = cantidad` (valor absoluto) | Corrección de inventario |

**Nota:** El trigger rechaza `cantidad <= 0` en movimientos. Para ajustar a 0, el sistema convierte automáticamente el ajuste en una `salida` por la cantidad total actual.

---

## ✅ Fases Completadas

### Fase 1: Estructura base y autenticación
- [x] Configuración de Supabase con RLS
- [x] Sistema de autenticación con roles
- [x] Tablas: `perfiles_usuario`, `permisos_usuario`, `categorias`, `productos`

### Fase 2: Ubicaciones jerárquicas
- [x] Tablas: `secciones`, `ubicaciones`, `stock`, `movimientos`, `producto_ubicaciones`
- [x] Triggers de actualización de stock
- [x] Políticas RLS para todas las tablas

### Fase 3: Dashboard y métricas
- [x] KPIs: Total productos, stock bajo, movimientos hoy, ubicaciones activas
- [x] Gráficos de actividad y top ubicaciones
- [x] Exportación de movimientos a Excel y PDF

### Fase 4: Interfaz jerárquica completa
- [x] Vista de árbol expandible (pasillos → armarios/altos)
- [x] Badges de colores por tipo de ubicación
- [x] Gestión de productos por ubicación (añadir, editar, eliminar)
- [x] Escáner de código de barras con cámara
- [x] Autocompletado de productos con búsqueda flexible
- [x] Ajuste rápido de stock
- [x] Limpieza de stock de lineales

### Fase 5 (parcial): Corrección de bugs críticos
- [x] Eliminación de escritura directa en `stock` desde el cliente
- [x] Cálculo real de stock por ubicación usando `data.stock`
- [x] Desglose expandible de productos por armario/pasillo
- [x] Estabilización del escáner con `useRef` y `Dialog` de Radix
- [x] Modal de ajuste rápido convertido a `Dialog` oficial
- [x] Mensajes de error RLS claros y específicos

---

## 🐛 Bugs Críticos Corregidos en v1.0.0-stable

| # | Bug | Causa raíz | Solución |
|---|-----|-----------|----------|
| 1 | Error 42501 al guardar cantidad | Cliente escribía directo en `stock` (RLS bloquea) | Delegar al trigger vía INSERT en `movimientos` |
| 2 | Totales de stock incorrectos en Movimientos | Reconstrucción desde movimientos (no distinguía productos) | Usar `data.stock` como fuente de verdad |
| 3 | Escáner de cámara no funcionaba en Ubicaciones | `div` casero bloqueado por Dialog padre de Radix | Envolver en `<Dialog>` oficial de Radix UI |
| 4 | Botón  Ajuste rápido no respondía a clicks | Mini-modal `div` bajo `pointer-events: none` del Dialog padre | Convertir a `<Dialog>` oficial con portal DOM |
| 5 | Autocompletado no mostraba todos los productos | Catálogo en caché obsoleto | Recargar al abrir modal "Añadir" |
| 6 | Mensaje genérico de permisos | `errorInventario()` no diferenciaba 42501/PGRST116 | Mensajes específicos según contexto |

---

## 🏷️ Versiones y Recuperación de Emergencia

### Versión Actual Estable: `v1.0.0-stable`

**Commit:** [`853715c`](https://github.com/recursos-email-pintureria/inventario-pintura-local/commit/853715c)  
**Fecha:** 24/10/2026  
**Estado:** ✅ Producción en Vercel  
**Tag:** [v1.0.0-stable](https://github.com/recursos-email-pintureria/inventario-pintura-local/releases/tag/v1.0.0-stable)

**Incluye:**
- Corrección total de escritura de stock (delegada a triggers de BD)
- Cálculo real de stock por ubicación con desglose expandible
- Escáner de cámara estable y modal de "Ajuste Rápido" funcional
- Limpieza de ramas y cierre de PRs obsoletos
- 31 tests unitarios pasando

### 🚨 Cómo recuperar esta versión en caso de error crítico futuro

```bash
# 1. Asegúrate de estar en la rama principal
git checkout main

# 2. Restablece el código local al estado de la versión estable
git reset --hard v1.0.0-stable

# 3. Fuerza la actualización en GitHub
# ⚠️ ATENCIÓN: Esto sobrescribe el historial remoto
git push origin main --force

Alternativa segura (solo inspección, sin alterar main):
git checkout v1.0.0-stable
# Para volver al presente:
git checkout main

🔐 Seguridad y Credenciales
Variables de entorno
El archivo .env.example contiene las variables necesarias. Nunca subir .env al repositorio.
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
Reglas de seguridad
✅ La clave anon de Supabase es pública por diseño (segura en frontend)
✅ RLS (Row Level Security) activo en todas las tablas
✅ Permisos granulares por usuario en permisos_usuario
❌ NUNCA subir tokens personales de GitHub (PAT) al código o chats
❌ NUNCA escribir directamente en tablas protegidas desde el cliente
Si un token se expone
Ir a GitHub Settings → Tokens
Revocar el token inmediatamente (botón "Delete")
Generar uno nuevo con los permisos mínimos necesarios
# Desarrollo local
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar para producción
npm test                 # Ejecutar tests (Vitest)
npx tsc --noEmit         # Verificar tipos TypeScript

# Git básico
git status               # Estado del repositorio
git log --oneline -5     # Últimos 5 commits
git tag                  # Listar etiquetas
git fetch --prune        # Limpiar referencias remotas obsoletas

# Despliegue
git push origin main     # Vercel despliega automáticamente
Última actualización: 24/10/2026 · Versión v1.0.0-stable

---

## 📋 Instrucciones para aplicarlo

1. En VS Code, con el archivo `README.md` abierto, pulsa **`Ctrl + A`** (seleccionar todo).
2. Pulsa **`Supr`** o **`Delete`** para borrar el contenido actual.
3. **Copia el bloque completo de arriba** (desde `# 🎨 Inventario Pintura - LM` hasta el final).
4. Pégalo en el archivo (`Ctrl + V`).
5. Guarda con **`Ctrl + S`**.

---

## 💾 Subir a GitHub

En tu terminal de VS Code ejecuta:

```bash
git add README.md
git commit -m "docs: README completo con arquitectura, fases, bugs corregidos y guía de recuperación v1.0.0-stable"
git push origin main