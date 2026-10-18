#  Inventario Pintura - LM - Especificaciones del Proyecto

## 🎯 Descripción
Aplicación web para gestión de inventario de una sección de pintura en almacén. Permite registrar productos con código de barras, ubicarlos en pasillos/altos/armarios, registrar movimientos de entrada/salida y exportar reportes.

## 👥 Usuarios y Roles

### Roles disponibles:
- **Admin**: Control total del sistema
- **Vendedor**: Permisos granulares asignados por el admin
- **Visualizador**: Solo puede consultar datos

### Permisos granulares (8 permisos):
1. `puede_crear_productos` - Crear nuevos productos
2. `puede_editar_productos` - Editar productos existentes
3. `puede_eliminar_productos` - Eliminar/desactivar productos
4. `puede_crear_ubicaciones` - Crear pasillos, altos, armarios
5. `puede_editar_ubicaciones` - Editar ubicaciones existentes
6. `puede_ver_movimientos` - Ver historial de movimientos
7. `puede_exportar_movimientos` - Exportar a Excel/PDF
8. `puede_gestionar_usuarios` - Gestionar usuarios y permisos

### Seguridad:
- Row Level Security (RLS) en todas las tablas
- Los códigos de barras son ÚNICOS e irrepetibles
- Los SKUs son ÚNICOS e irrepetibles
- El admin puede desactivar usuarios sin borrarlos
- Registro de auditoría de cambios en permisos

---

## ️ Base de Datos (Supabase + PostgreSQL)

### Tablas existentes (Fase 2A ✅):
- `perfiles_usuario`: id, nombre_completo, correo, rol, activo, creado_en, actualizado_en
- `permisos_usuario`: id_usuario + 8 permisos booleanos

### Tablas a crear (Fase 2B-2E):

#### `ubicaciones`:
- id (UUID, PK)
- nombre (TEXT, UNIQUE, NOT NULL) - ej: "Pasillo A", "Alto 3", "Armario Principal"
- tipo (TEXT, CHECK IN: 'pasillo', 'alto', 'armario')
- descripcion (TEXT, nullable)
- activo (BOOLEAN, default true)
- creado_por (UUID, FK auth.users)
- creado_en, actualizado_en (TIMESTAMPTZ)

#### `categorias`:
- id (UUID, PK)
- nombre (TEXT, UNIQUE, NOT NULL)
- descripcion (TEXT, nullable)
- activo (BOOLEAN, default true)
- creado_en (TIMESTAMPTZ)

#### `productos`:
- id (UUID, PK)
- codigo_barras (TEXT, UNIQUE, NOT NULL) - escaneado o manual
- sku (TEXT, UNIQUE, NOT NULL) - código interno del vendedor
- nombre (TEXT, NOT NULL)
- descripcion (TEXT, nullable)
- id_categoria (UUID, FK categorias)
- precio_unitario (DECIMAL 10,2, nullable)
- activo (BOOLEAN, default true)
- creado_por (UUID, FK auth.users)
- creado_en, actualizado_en (TIMESTAMPTZ)

#### `movimientos`:
- id (UUID, PK)
- id_producto (UUID, FK productos)
- id_ubicacion (UUID, FK ubicaciones)
- tipo (TEXT, CHECK IN: 'entrada', 'salida', 'reposicion', 'ajuste')
- cantidad (INTEGER, CHECK > 0)
- precio_unitario (DECIMAL 10,2)
- precio_total (DECIMAL 10,2, GENERATED: cantidad * precio_unitario)
- notas (TEXT, nullable)
- realizado_por (UUID, FK auth.users)
- fecha_movimiento (TIMESTAMPTZ, default now())

#### `stock`:
- id_producto (UUID, FK productos)
- id_ubicacion (UUID, FK ubicaciones)
- cantidad (INTEGER, default 0, CHECK >= 0)
- actualizado_en (TIMESTAMPTZ)
- PRIMARY KEY compuesto: (id_producto, id_ubicacion)

### Funciones y Triggers:
- `actualizar_stock()`: Trigger AFTER INSERT en movimientos que actualiza stock automáticamente
- `manejar_nuevo_usuario()`: Trigger AFTER INSERT en auth.users que crea perfil y permisos
- `es_admin()`: Función para verificar si un usuario es admin (evita recursión en RLS)
- `proteger_campos_perfil()`: Trigger que impide que no-admin cambien rol/activo/correo

---

## 🖥️ Frontend (React + Vite + TypeScript)

### Páginas existentes:
- `/login` - Inicio de sesión
- `/registro` - Registro de nuevos usuarios
- `/dashboard` - Panel principal (Fase 2E: mostrar datos reales)
- `/productos` - Gestión de productos (Fase 2C)
- `/categorias` - Gestión de categorías
- `/ubicaciones` - Gestión de ubicaciones (Fase 2B)
- `/movimientos` - Historial de movimientos (Fase 2D)
- `/usuarios` - Gestión de usuarios y permisos (Fase 2A ✅)
- `/configuracion` - Configuración general

### Funcionalidades por fase:

#### ✅ Fase 2A: Usuarios y Permisos (COMPLETADA)
- Tabla `perfiles_usuario` y `permisos_usuario` creadas
- RLS configurado con policies
- Página `/usuarios` funcional con datos reales
- Sistema de roles (admin/vendedor/visualizador)
- 8 permisos granulares editables
- Hook `useMyProfile()` para verificar permisos en toda la app

#### ⏳ Fase 2B: Ubicaciones (PENDIENTE)
- Crear tabla `ubicaciones` con RLS
- Página `/ubicaciones` con dos pestañas: "Pasillos" y "Altos/Armarios"
- Botón "Nueva ubicación" (protegido por permiso `puede_crear_ubicaciones`)
- Modal con: nombre (texto libre), tipo (selector), descripción
- Lista real de ubicaciones con contador de productos
- Botones Editar/Desactivar (protegidos por `puede_editar_ubicaciones`)
- Buscador por nombre

####  Fase 2C: Productos con Código de Barras (PENDIENTE)
- Crear tablas `categorias` y `productos` con RLS
- Página `/productos` con tabla real
- Botón "Nuevo producto" (protegido por `puede_crear_productos`)
- **Escáner de código de barras** (librería `html5-qrcode`)
- Campo SKU manual (validación de unicidad)
- Validación en tiempo real: código_barras y SKU únicos
- Buscador por código, SKU o nombre
- Filtro por categoría
- Botones Editar/Desactivar (protegidos por `puede_editar_productos`)

#### ⏳ Fase 2D: Movimientos con Exportación (PENDIENTE)
- Crear tablas `movimientos` y `stock` con RLS
- Trigger `actualizar_stock()` automático
- Página `/movimientos` con filtros: rango de fechas, tipo, producto, ubicación
- Tabla real con todos los campos
- Botón "Nuevo movimiento" (protegido por `puede_crear_productos`)
- **Exportar a Excel** (librería `xlsx`) - solo datos filtrados
- **Exportar a PDF** (librerías `jspdf` + `jspdf-autotable`) - solo datos filtrados
- Botones de exportación protegidos por `puede_exportar_movimientos`

#### ⏳ Fase 2E: Dashboard con Datos Reales (PENDIENTE)
- Tarjeta "Total de productos": COUNT de productos activos
- Tarjeta "Stock bajo": COUNT de productos con stock < 10
- Tarjeta "Movimientos hoy": COUNT de movimientos de hoy
- Tarjeta "Ubicaciones activas": COUNT de ubicaciones activas
- Sección "Actividad reciente": últimos 10 movimientos

---

## 🔐 Seguridad

### Autenticación:
- Supabase Auth con email/contraseña
- Sesión persistente en localStorage (opción "Recordar sesión")
- Validación de email antes de activar cuenta

### Autorización:
- Row Level Security (RLS) en TODAS las tablas
- Policies basadas en rol y permisos granulares
- Función `es_admin()` para verificar admin sin recursión
- Trigger `proteger_campos_perfil()` para evitar auto-promoción

### Validaciones:
- Código de barras: UNIQUE, no nulo, validación en frontend y backend
- SKU: UNIQUE, no nulo, validación en frontend y backend
- Stock: CHECK >= 0, no permitir salidas sin stock suficiente
- Campos obligatorios validados con Zod + React Hook Form

### Auditoría:
- Registro de quién cambió permisos/rol/estado de usuarios
- Timestamps en todas las tablas (creado_en, actualizado_en)
- Campo `creado_por` / `realizado_por` para trazabilidad

---

## 📦 Librerías necesarias

### Ya instaladas:
- `@supabase/supabase-js` - Cliente de Supabase
- `react-router-dom` - Navegación
- `@tanstack/react-query` - Gestión de estado del servidor

### A instalar para Fase 2C:
- `html5-qrcode` - Escáner de código de barras con cámara

### A instalar para Fase 2D:
- `xlsx` - Exportar a Excel
- `jspdf` - Exportar a PDF
- `jspdf-autotable` - Tablas en PDF
- `date-fns` - Manejo de fechas

### Recomendadas:
- `react-hook-form` - Formularios
- `zod` - Validación de schemas
- `sonner` o `react-hot-toast` - Notificaciones toast

---

## 🚀 Flujo de trabajo

### Desarrollo local:
1. Clonar repo: `git clone https://github.com/recursos-email-pintureria/signup-complete-app`
2. Instalar dependencias: `npm install`
3. Crear archivo `.env` con: