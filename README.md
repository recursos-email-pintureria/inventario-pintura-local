# Inventario Pintura - LM

Sistema profesional de gestión de inventario jerárquico para tienda de pinturas. Permite el control de stock por ubicaciones específicas (secciones, pasillos, armarios, cross, cajas y reserva), con escáner de código de barras, ajustes rápidos, métricas en tiempo real, gestión de usuarios con permisos granulares, sistema de palets y exportación a Excel/PDF.

**🌐 Aplicación en producción:** [https://inventario-pintura-local.vercel.app](https://inventario-pintura-local.vercel.app)
**📦 Repositorio GitHub:** [https://github.com/recursos-email-pintureria/inventario-pintura-local](https://github.com/recursos-email-pintureria/inventario-pintura-local)
**🏷️ Versión estable actual:** [v1.4.0-palets](https://github.com/recursos-email-pintureria/inventario-pintura-local/releases/tag/v1.4.0-palets)
**📋 Panel de despliegues Vercel:** [https://vercel.com/aritx26-3717/~/deployments](https://vercel.com/aritx26-3717/~/deployments)
**🗄️ Panel de Supabase:** [https://app.supabase.com](https://app.supabase.com)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Enlace |
| --- | --- | --- |
| **Frontend** | React 18, TypeScript, TanStack Router, TanStack Query | [react.dev](https://react.dev) · [tanstack.com](https://tanstack.com) |
| **UI/Estilos** | Tailwind CSS, Radix UI, Lucide React, shadcn/ui | [tailwindcss.com](https://tailwindcss.com) · [radix-ui.com](https://radix-ui.com) |
| **Backend/BD** | Supabase (PostgreSQL con Row Level Security) | [supabase.com](https://supabase.com) |
| **Despliegue** | Vercel (CI/CD automático desde `main`) | [vercel.com](https://vercel.com) |
| **Testing** | Vitest | [vitest.dev](https://vitest.dev) |
| **Herramientas** | Git, ESLint, Prettier, Bun, **Agent Skills** | [git-scm.com](https://git-scm.com) · [bun.sh](https://bun.sh) |

---

## 📂 Estructura Jerárquica de Ubicaciones

El sistema soporta una jerarquía estricta de 3 niveles (actualizada en Fase 6):

🏷️ **Sección** (Ej: Pintura Exterior, Droguería) - Nivel 0
└── ↔️ **Pasillo** / 🏭 **Reserva** / 📦 **Caja** - Nivel 1 (Padre = Sección)
    └── 🗄️ **Armario** / 🔀 **Cross** - Nivel 2 (Padre = Pasillo)
        └── Productos con stock

### Tipos de ubicación y sus reglas:

| Tipo | Nivel | Icono | Color | Requiere padre | Posición lateral | Posición longitudinal | Sección origen |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `seccion` | 0 | 🏢 Building2 | Índigo | ❌ No | ❌ No | ❌ No | ❌ No |
| `pasillo` | 1 | ↔️ ArrowLeftRight | Azul | ❌ No | ❌ No | ❌ No | ❌ No |
| `reserva` | 1 | 🏭 Warehouse | Gris | ❌ No | ❌ No | ❌ No | ❌ No |
| `caja` | 1 | 📦 Package | Rosa | ✅ Sí (Sección) | ❌ No | ❌ No | ❌ No |
| `armario` | 2 | 🗄️ Archive | Esmeralda | ✅ Sí (Pasillo) | ✅ Sí (`derecha`/`izquierda`) | ❌ No | ❌ No (hereda) |
| `cross` | 2 | 🔀 Shuffle | Púrpura | ✅ Sí (Pasillo) | ✅ Sí | ✅ Sí | ✅ Sí |

> ⚠️ **Nota:** El tipo `alto` fue **eliminado** en la Fase 6. Los armarios ahora se agrupan visualmente por `posicion_lateral` (Lado Derecho / Lado Izquierda).

---

## ⚙️ Arquitectura de Stock (CRÍTICO)

**Principio fundamental:** El cliente (frontend) **NUNCA** escribe directamente en la tabla `stock`.
La tabla `stock` tiene `GRANT SELECT` para usuarios autenticados. Toda modificación se realiza mediante:

1. `INSERT` en la tabla `movimientos` (entrada, salida, reposicion, ajuste).
2. El trigger `actualizar_stock` en PostgreSQL que:
   - Valida que el usuario tenga `puede_crear_productos = true`.
   - Valida que `realizado_por` coincida con `auth.uid()`.
   - Bloquea la fila con `FOR UPDATE` para evitar race conditions.
   - Calcula el nuevo stock según el tipo de movimiento.
   - Actualiza/inserta/elimina la fila en `stock`.
   - Libera el bloqueo.

### Nombres de campos REALES en `movimientos`:
- `id_producto` (❌ NO usar `producto_id`)
- `id_ubicacion` (❌ NO usar `ubicacion_id`)
- `realizado_por` (❌ NO usar `creado_por`)
- `id_palet` (nullable)
- `cantidad`
- `tipo`

### Tipos de movimiento y comportamiento REAL del trigger:

| Tipo | Efecto en stock | Caso de uso | Restricciones |
| --- | --- | --- | --- |
| `entrada` | `stock + cantidad` (suma) | Recepción de mercancía | Permitido en palets |
| `salida` | `stock - cantidad` (resta) | Venta, merma, traslado | Permitido en palets (valida stock suficiente) |
| `reposicion` | `stock = cantidad` (**FIJA valor absoluto**) | Repuesto de lineal | ❌ **NO permitido en palets** |
| `ajuste` | `stock = cantidad` (**FIJA valor absoluto**) | Corrección de inventario | ❌ **NO permitido en palets** |

> ⚠️ **IMPORTANTE sobre `reposicion`:** NO suma. Si el stock actual es 5 y quieres que quede en 15, debes enviar `cantidad: 15` (no 10).
> ⚠️ **IMPORTANTE sobre palets:** Para movimientos con `id_palet`, el trigger **SOLO** permite los tipos `entrada` y `salida`. La `id_ubicacion` debe coincidir con la `id_reserva` del palet.

---

## ✅ Fases Completadas

### Fase 1: Estructura base y autenticación
- [x] Configuración de Supabase con RLS
- [x] Sistema de autenticación con roles
- [x] Tablas: `perfiles_usuario`, `permisos_usuario`, `categorias`, `productos`

### Fase 2: Ubicaciones jerárquicas
- [x] Tablas: `ubicaciones`, `stock`, `movimientos`, `producto_ubicaciones`
- [x] Triggers de actualización de stock (`actualizar_stock`)
- [x] Políticas RLS para todas las tablas

### Fase 3: Dashboard y métricas
- [x] KPIs: Total productos, stock bajo, movimientos hoy, ubicaciones activas
- [x] Gráficos de actividad y top ubicaciones
- [x] Exportación de movimientos a Excel y PDF

### Fase 4: Interfaz jerárquica completa
- [x] Vista de árbol expandible
- [x] Badges de colores por tipo de ubicación
- [x] Gestión de productos por ubicación (añadir, editar, eliminar)
- [x] Escáner de código de barras con cámara
- [x] Autocompletado de productos con búsqueda flexible
- [x] Ajuste rápido de stock
- [x] Limpieza de stock de lineales

### Fase 4.5 - 4.8: Estabilización y UX (v1.0.0 a v1.2.0)
- [x] Eliminación de escritura directa en `stock` desde el cliente
- [x] Gestión de usuarios con permisos granulares y protección contra auto-desprivilegio
- [x] Confirmaciones visuales (AlertDialog) para todas las acciones críticas
- [x] Iconos y colores distintivos por tipo de ubicación

### Fase 5: Sistema de Palets (v1.3.0)
- [x] Tabla independiente `palets` vinculada a ubicaciones de tipo `reserva`
- [x] Restricción de trigger: solo `entrada` y `salida` para movimientos de palets
- [x] Generación automática de códigos de palet
- [x] Vista y gestión de stock por palet

### Fase 6: Reestructuración de Ubicaciones (v1.4.0-palets)
- [x] **Eliminación total del tipo `alto`** (renombrado/absorbido por `armario`)
- [x] Agrupación visual de armarios por `posicion_lateral` (Lado Derecho / Lado Izquierda)
- [x] Creación masiva de 94 armarios (E651-E744) siguiendo el plano físico real
- [x] Actualización de documentación y Agent Skills para reflejar la arquitectura real

### Fase 7: Agent Skills para IA (v1.4.0-palets)
- [x] Instalación de skills oficiales de Supabase (`.agents/skills/`)
- [x] Creación de skill personalizada `inventario-lm` con reglas críticas, esquema real y queries de ejemplo
- [x] Validación de que Copilot/Cursor usa los nombres de campo reales y el comportamiento correcto del trigger

---

## 🐛 Bugs Críticos Corregidos

| # | Bug | Causa raíz | Solución |
| --- | --- | --- | --- |
| 1 | Error 42501 al guardar cantidad | Cliente escribía directo en `stock` (RLS bloquea) | Delegar al trigger vía `INSERT` en `movimientos` |
| 2 | Nombres de campo incorrectos en docs | Documentación desactualizada vs trigger real | Actualizado a `id_producto`, `id_ubicacion`, `realizado_por` |
| 3 | Lógica de reposición errónea en docs | Decía que sumaba, pero el trigger fija el valor | Corregido en README y Agent Skills |
| 4 | Escáner de cámara no funcionaba | `div` casero bloqueado por `Dialog` padre de Radix | Envolver en `<Dialog>` oficial de Radix UI |
| 5 | Mensaje genérico de permisos | `errorInventario()` no diferenciaba 42501/PGRST116 | Mensajes específicos según contexto |

---

## 🏷️ Versiones y Recuperación de Emergencia

**Versión Actual Estable:** `v1.4.0-palets`
**Fecha:** 01/11/2026
**Estado:** ✅ Producción en Vercel
**Tag:** [v1.4.0-palets](https://github.com/recursos-email-pintureria/inventario-pintura-local/releases/tag/v1.4.0-palets)

### 🚨 Cómo recuperar esta versión en caso de error crítico futuro
```bash
# 1. Asegúrate de estar en la rama principal
git checkout main

# 2. Restablece el código local al estado de la versión estable
git reset --hard v1.4.0-palets

# 3. Fuerza la actualización en GitHub
# ⚠️ ATENCIÓN: Esto sobrescribe el historial remoto
git push origin main --force

# Alternativa segura (solo inspección, sin alterar main):
git checkout v1.4.0-palets
# Para volver al presente:
git checkout main
🔐 Seguridad y Credenciales
Variables de entorno
El archivo .env.example contiene las variables necesarias. Nunca subir .env al repositorio.
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
Reglas de seguridad
✅ La clave anon de Supabase es pública por diseño (segura en frontend).
✅ RLS (Row Level Security) activo en todas las tablas.
✅ Permisos granulares por usuario en permisos_usuario.
✅ Protección contra auto-desprivilegio en gestión de usuarios.
✅ NUNCA escribir directamente en tablas protegidas (stock) desde el cliente.
🚀 Comandos Útiles
# Desarrollo local
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar para producción
npm test                 # Ejecutar tests (Vitest)
npx tsc --noEmit         # Verificar tipos TypeScript

# Git básico
git status               # Estado del repositorio
git log --oneline -5     # Últimos 5 commits
git tag                  # Listar etiquetas

# Despliegue
git push origin main     # Vercel despliega automáticamente
📋 Próximas Fases Planificadas
Fase 8: Automatización de datos (Leroy Merlin)
Script para extraer Ref/SKU y descripción desde web de Leroy Merlin
Integración con el formulario de creación de productos
Validación automática de códigos de barras
Fase 9: Mejoras visuales adicionales
Rediseño del Dashboard con KPIs con semáforo de colores
Modo oscuro/claro
Atajos de teclado para operaciones frecuentes
Fase 10: Reportes y analítica avanzada
Dashboard de rotación de stock
Alertas automáticas de stock bajo por email
👥 Contribución
Este proyecto fue desarrollado para gestión interna. Si necesitas colaborar:
Crea una rama desde main: git checkout -b feature/nueva-funcionalidad
Haz commits descriptivos siguiendo el patrón: tipo: descripción corta
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: cambios de formato (sin afectar lógica)
Abre un Pull Request describiendo los cambios.
Licencia: Propietario. Uso interno para gestión de inventario de la tienda.
Última actualización: 01/11/2026 · Versión v1.4.0-palets

### 📋 Pasos para aplicar:
1. Abre `README.md` en VS Code.
2. Selecciona todo (`Ctrl + A`) y borra.
3. Haz clic en **"Copy"** en la esquina superior derecha del bloque de arriba.
4. Pega (`Ctrl + V`) y guarda (`Ctrl + S`).
5. Ejecuta en la terminal:
   ```powershell
   git add README.md
   git commit -m "docs: actualizar README a v1.4.0-palets, alineado con trigger real y Fase 6"
   git push origin main
   