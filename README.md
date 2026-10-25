# Inventario Pintura - LM
Sistema profesional de gestión de inventario jerárquico para tienda de pinturas. Permite el control de stock por ubicaciones específicas (secciones, pasillos, armarios, altos, cross, cajas y reserva), con escáner de código de barras, ajustes rápidos, métricas en tiempo real, gestión de usuarios con permisos granulares y exportación a Excel/PDF.

** Aplicación en producción:** [https://inventario-pintura-local.vercel.app](https://inventario-pintura-local.vercel.app)
 **Repositorio GitHub:** [https://github.com/recursos-email-pintureria/inventario-pintura-local](https://github.com/recursos-email-pintureria/inventario-pintura-local)
🏷️ **Versión estable actual:** [v1.3.0-informe-imprimible](https://github.com/recursos-email-pintureria/inventario-pintura-local/releases/tag/v1.3.0-informe-imprimible)
📋 **Panel de despliegues Vercel:** [https://vercel.com/aritx26-3717/~/deployments](https://vercel.com/aritx26-3717/~/deployments)
🗄️ **Panel de Supabase:** [https://app.supabase.com](https://app.supabase.com)

## ️ Stack Tecnológico
| Capa | Tecnología | Enlace |
| --- | --- | --- |
| Frontend | React 18, TypeScript, TanStack Router, TanStack Query | [react.dev](https://react.dev) · [tanstack.com](https://tanstack.com) |
| UI/Estilos | Tailwind CSS, Radix UI, Lucide React, shadcn/ui | [tailwindcss.com](https://tailwindcss.com) · [radix-ui.com](https://radix-ui.com) · [lucide.dev](https://lucide.dev) · [ui.shadcn.com](https://ui.shadcn.com) |
| Backend/BD | Supabase (PostgreSQL con Row Level Security) | [supabase.com](https://supabase.com) |
| Despliegue | Vercel (CI/CD automático desde `main`) | [vercel.com](https://vercel.com) |
| Testing | Vitest | [vitest.dev](https://vitest.dev) |
| Herramientas | Git, ESLint, Prettier, Bun | [git-scm.com](https://git-scm.com) · [bun.sh](https://bun.sh) |

## 📂 Estructura Jerárquica de Ubicaciones
El sistema soporta una jerarquía estricta de 3 niveles:
️ **Sección** (Ej: Pintura Exterior, Droguería)
└── ↔️ **Pasillo** / 🏭 **Reserva** (Nivel 1 - Padre)
    └── 🗄️ **Armario** / 📚 **Alto** / 🔀 **Cross** / 📦 **Caja** (Nivel 2 - Hijo)
        └── Productos con stock

Tipos de ubicación y sus reglas:
| Tipo | Nivel | Icono | Color | Requiere padre | Posición lateral | Posición longitudinal | Sección origen |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seccion | 0 | 🏢 Building2 | Índigo | ❌ No | No | ❌ No | ❌ No |
| pasillo | 1 | ↔️ ArrowLeftRight | Azul |  No | ❌ No | ❌ No |  No |
| reserva | 1 |  Warehouse | Gris | ❌ No |  No | ❌ No | ❌ No |
| armario | 2 | 🗄️ Archive | Esmeralda | ✅ Sí | ✅ Sí |  No | ❌ No (hereda) |
| alto | 2 | 📚 Layers | Ámbar | ✅ Sí | ✅ Sí |  No | ❌ No (hereda) |
| caja | 2 | 📦 Package | Rosa | ✅ Sí | ✅ Sí |  No | ❌ No (hereda) |
| cross | 2 | 🔀 Shuffle | Púrpura | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |

## 🏗️ Arquitectura de Stock (CRÍTICO)
**Principio fundamental:** El cliente NUNCA escribe directamente en la tabla `stock`

La tabla `stock` tiene `GRANT SELECT` para usuarios autenticados. Toda modificación se realiza mediante:
1. `INSERT` en tabla `movimientos` (entrada, salida, reposición, ajuste)
2. Trigger `actualizar_stock` en PostgreSQL que:
   - Bloquea la fila con `FOR UPDATE`
   - Calcula el nuevo stock según el tipo de movimiento
   - Actualiza/inserta/elimina la fila en `stock`
   - Libera el bloqueo

**Tipos de movimiento:**
| Tipo | Efecto en stock | Caso de uso |
| --- | --- | --- |
| entrada | stock + cantidad | Recepción de mercancía |
| salida | stock - cantidad | Venta, merma, traslado |
| reposicion | stock + cantidad | Repuesto de lineal |
| ajuste | stock = cantidad (valor absoluto) | Corrección de inventario |

*Nota: El trigger rechaza `cantidad <= 0` en movimientos. Para ajustar a 0, el sistema convierte automáticamente el ajuste en una `salida` por la cantidad total actual.*

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

### Fase 4.5: Corrección de bugs críticos (v1.0.0-stable)
- [x] Eliminación de escritura directa en `stock` desde el cliente
- [x] Cálculo real de stock por ubicación usando `data.stock`
- [x] Desglose expandible de productos por armario/pasillo
- [x] Estabilización del escáner con `useRef` y `Dialog` de Radix
- [x] Modal de ajuste rápido convertido a `Dialog` oficial
- [x] Mensajes de error RLS claros y específicos

### Fase 4.6: Gestión de Usuarios y Permisos (v1.1.0)
- [x] Página `/usuarios` con lista de usuarios y permisos
- [x] Modal de edición con toggles individuales por permiso
- [x] Protección contra auto-desprivilegio (no puedes quitarte el rol admin)
- [x] Toasts de éxito/advertencia en operaciones
- [x] Modal de confirmación (AlertDialog) para cambios críticos
- [x] Visibilidad del menú condicionada a `isAdmin` o `puede_gestionar_usuarios`

### Fase 4.7: Confirmaciones para acciones críticas (v1.1.5)
- [x] AlertDialog al eliminar producto de ubicación
- [x] AlertDialog al ajustar stock a 0 (ajuste rápido y edición)
- [x] AlertDialog al desactivar/borrar ubicación
- [x] AlertDialog al limpiar stock masivo de lineales
- [x] Sustitución completa de `window.confirm` por AlertDialog de shadcn/ui

### Fase 4.8: Mejoras visuales y UX (v1.2.0-visual)
- [x] Iconos específicos por tipo de ubicación (Lucide React)
- [x] Paleta de colores distintiva por tipo (índigo, azul, esmeralda, ámbar, púrpura, rosa, gris)
- [x] Componente reutilizable `BadgeTipoUbicacion` con 3 tamaños (sm, md, lg)
- [x] Archivo de configuración `tiposUbicacion.ts` centralizado
- [x] Hover effects suaves en filas de ubicaciones
- [x] Vista de árbol con indentación y líneas conectoras

### Fase 4.9: Informe Detallado Imprimible (v1.3.0-informe-imprimible)
- [x] Vista Listado con 3 filtros en cascada (Tipo, Sección, Pasillo)
- [x] Checkbox "Solo con stock" para filtrar ubicaciones vacías
- [x] Informe jerárquico A4 (Pasillo → Armario → Productos)
- [x] Carga bajo demanda con query JOIN optimizada a Supabase
- [x] Vista previa antes de imprimir (modal Dialog)
- [x] Estilos de impresión optimizados (sin cortes entre páginas)
- [x] Botones "Vista previa" e "Imprimir informe"
- [x] Corrección de imports faltantes (Dialog, Button, Eye, Loader2)
   - [x] **Fase 5: Sistema de Palets (v1.4.0-palets)**
     - [x] Tabla `palets` en Supabase con RLS y columna `id_palet` en `stock`.
     - [x] Librería `src/lib/palets.ts` con funciones CRUD y autodestrucción.
     - [x] UI de gestión de palets en reservas (`PaletsReserva.tsx`).
     - [x] Modal de productos por palet (`ModalProductosPalet.tsx`) con impresión de etiqueta y listado A4.
     - [x] Badge de productos en reservas como elemento inactivo (cursor-default).
     - [x] Expandir/colapsar palets al hacer clic en fila de reserva (Vista Listado).
     - [x] Corrección de permisos RLS para tabla `stock` con `id_palet`.
## 🐛 Bugs Críticos Corregidos
| # | Bug | Causa raíz | Solución |
| --- | --- | --- | --- |
| 1 | Error 42501 al guardar cantidad | Cliente escribía directo en `stock` (RLS bloquea) | Delegar al trigger vía INSERT en `movimientos` |
| 2 | Totales de stock incorrectos en Movimientos | Reconstrucción desde movimientos (no distinguía productos) | Usar `data.stock` como fuente de verdad |
| 3 | Escáner de cámara no funcionaba en Ubicaciones | `div` casero bloqueado por Dialog padre de Radix | Envolver en `<Dialog>` oficial de Radix UI |
| 4 | Botón "Ajuste rápido" no respondía a clicks | Mini-modal `div` bajo `pointer-events: none` del Dialog padre | Convertir a `<Dialog>` oficial con portal DOM |
| 5 | Autocompletado no mostraba todos los productos | Catálogo en caché obsoleto | Recargar al abrir modal "Añadir" |
| 6 | Mensaje genérico de permisos | `errorInventario()` no diferenciaba 42501/PGRST116 | Mensajes específicos según contexto |

## 🏷️ Versiones y Recuperación de Emergencia

   🏷️ Versión estable actual: [v1.4.0-palets]`
**Fecha:** 25/10/2026
**Estado:** ✅ Producción en Vercel
**Tag:** [v1.3.0-informe-imprimible](https://github.com/recursos-email-pintureria/inventario-pintura-local/releases/tag/v1.3.0-informe-imprimible)

### 🚨 Cómo recuperar esta versión en caso de error crítico futuro
```bash
# 1. Asegúrate de estar en la rama principal
git checkout main

# 2. Restablece el código local al estado de la versión estable
git reset --hard v1.3.0-informe-imprimible

# 3. Fuerza la actualización en GitHub
# ⚠️ ATENCIÓN: Esto sobrescribe el historial remoto
git push origin main --force
🔐 Seguridad y Credenciales
Variables de entorno
El archivo .env.example contiene las variables necesarias. Nunca subir .env al repositorio.
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
Reglas de seguridad
✅ La clave anon de Supabase es pública por diseño (segura en frontend)
✅ RLS (Row Level Security) activo en todas las tablas
✅ Permisos granulares por usuario en permisos_usuario
✅ Protección contra auto-desprivilegio en gestión de usuarios
🚫 NUNCA subir tokens personales de GitHub (PAT) al código o chats
🚫 NUNCA escribir directamente en tablas protegidas desde el cliente
Si un token se expone: Ir a GitHub Settings → Tokens → Revocar el token inmediatamente → Generar uno nuevo con los permisos mínimos necesarios.
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
git fetch --prune        # Limpiar referencias remotas obsoletas

# Despliegue
git push origin main     # Vercel despliega automáticamente
📋 Próximas Fases Planificadas
Fase 5: Sistema de Palets (v1.4.0-palets)
   - `v1.4.0-palets` (26/10/2026): Sistema completo de palets, autodestrucción automática e impresión de etiquetas/listados.
Tabla independiente palets relacionada con ubicaciones tipo "Reserva"
Creación manual de palets con código de barras automático (PAL-###-Usuario-Fecha)
Gestión de productos dentro del palet (igual que armarios)
Autodestrucción automática con alerta de seguridad cuando stock = 0
Impresión de etiquetas con código de barras
Fase 6: Automatización de datos (Leroy Merlin)
Script para extraer Ref/SKU y descripción desde web de Leroy Merlin
Integración con el formulario de creación de productos
Validación automática de códigos de barras
Fase 7: Mejoras visuales adicionales
Rediseño del Dashboard con KPIs con semáforo de colores
Badges de colores para tipos de movimiento en tabla de actividad
Gráfico de movimientos de los últimos 7 días
Filtros en tabla de actividad (por tipo, fecha, ubicación)
Modo oscuro/claro
Atajos de teclado para operaciones frecuentes
Fase 8: Reportes y analítica avanzada
Dashboard de rotación de stock
Alertas automáticas de stock bajo por email
Historial de movimientos por producto con gráficos
Comparativa de inventarios entre fechas
👥 Contribución
Este proyecto fue desarrollado para gestión interna. Si necesitas colaborar:
Crea una rama desde main: git checkout -b feature/nueva-funcionalidad
Haz commits descriptivos siguiendo el patrón: tipo: descripción corta
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: cambios de formato (sin afectar lógica)
Abre un Pull Request describiendo los cambios
📄 Licencia
Propietario. Uso interno para gestión de inventario de la tienda.
Última actualización: 25/10/2026 · Versión: v1.3.0-informe-imprimible
