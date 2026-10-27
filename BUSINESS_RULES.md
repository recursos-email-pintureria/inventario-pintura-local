# 📋 Reglas de Negocio - Inventario Pintura LM

## Propósito de la App

Sistema de gestión de inventario para una tienda de pinturas física. Permite controlar el stock de productos en ubicaciones específicas (estanterías, armarios, altos) y realizar movimientos (entradas, salidas, ajustes).

## Roles de Usuario

### Administrador

- Puede gestionar usuarios y permisos
- Puede crear/editar/eliminar ubicaciones
- Puede ajustar stock manualmente
- Puede ver todos los movimientos
- Puede exportar datos

### Operario de Almacén

- Puede ver ubicaciones y stock
- Puede escanear códigos de barras
- Puede añadir productos a ubicaciones
- Puede hacer ajustes rápidos de stock
- NO puede eliminar ubicaciones
- NO puede gestionar usuarios

### Vendedor (futuro)

- Solo puede consultar stock
- NO puede modificar nada

## 🔄 Flujos de Usuario Críticos

### Flujo 1: Recepción de Mercancía

1. El operario recibe un albarán con productos
2. Escanea el código de barras de cada producto
3. Si el producto existe en el catálogo, se abre el modal de ubicación
4. Selecciona la ubicación destino (ej: P12-A01-DRH)
5. Introduce la cantidad recibida
6. El sistema crea un movimiento tipo "entrada"
7. El trigger de PostgreSQL actualiza el stock automáticamente
8. El operario ve el nuevo stock en la tabla

### Flujo 2: Ajuste de Inventario (Conteo Físico)

1. El operario va a una ubicación física (ej: armario P12-A01)
2. Cuenta los productos reales
3. Compara con el stock en el sistema
4. Si hay diferencia, usa "Ajuste rápido" para corregir
5. El sistema crea un movimiento tipo "ajuste"
6. El stock se actualiza al valor exacto introducido

### Flujo 3: Venta (futuro)

1. El vendedor escanea el producto en caja
2. El sistema busca el producto por código de barras
3. Reduce el stock de la ubicación correspondiente
4. Crea un movimiento tipo "salida"

## ⚠️ Reglas de Validación Críticas

### Stock

- El stock NUNCA puede ser negativo
- El cliente NUNCA escribe directamente en la tabla `stock`
- Toda modificación pasa por la tabla `movimientos` y el trigger de PostgreSQL
- Para ajustar a 0, el sistema convierte el ajuste en una "salida" automática

### Ubicaciones

- No se puede eliminar una ubicación con productos en stock (solo desactivar)
- No se puede eliminar una ubicación con hijos (armarios dentro de un pasillo)
- Los tipos "armario", "alto", "cross" requieren un pasillo padre
- El tipo "cross" requiere además una sección de origen

### Productos

- El código de barras es único (no puede repetirse)
- El SKU es único (no puede repetirse)
- Al crear un producto nuevo desde el escáner, se deben completar SKU y nombre

### Permisos

- Un usuario NO puede quitarse a sí mismo el rol de administrador
- Los permisos se gestionan en la tabla `permisos_usuario`
- El menú de "Usuarios" solo es visible para admins o usuarios con `puede_gestionar_usuarios`

## 🏗️ Arquitectura de Datos (CRÍTICO)

### Tablas Principales

- `productos`: Catálogo de productos (SKU, nombre, código_barras)
- `ubicaciones`: Estructura jerárquica (pasillo → armario → productos)
- `stock`: Stock actual por ubicación (SOLO LECTURA para el cliente)
- `movimientos`: Historial de entradas/salidas/ajustes (fuente de verdad)
- `secciones`: Zonas de la tienda (Pintura, Droguería, etc.)

### Trigger de Stock

Cuando se INSERTA en `movimientos`:

1. Bloquea la fila en `stock` con `FOR UPDATE`
2. Calcula el nuevo stock según el tipo de movimiento
3. Actualiza/inserta/elimina la fila en `stock`
4. Libera el bloqueo

### Tipos de Movimiento

- `entrada`: stock + cantidad (recepción)
- `salida`: stock - cantidad (venta, merma)
- `reposicion`: stock + cantidad (repuesto de lineal)
- `ajuste`: stock = cantidad (valor absoluto, corrección)

## 🎨 Convenciones de UI

### Colores por Tipo de Ubicación

- Pasillo: Azul
- Armario: Esmeralda
- Alto: Ámbar
- Cross: Púrpura
- Caja: Rosa
- Reserva: Gris

### Iconos (Lucide React)

- Pasillo: ArrowLeftRight
- Armario: Archive
- Alto: Layers
- Cross: Shuffle
- Caja: Package
- Reserva: Warehouse

## 🚫 Lo que la IA NO debe hacer

1. NO permitir escritura directa en la tabla `stock` desde el cliente
2. NO eliminar ubicaciones con productos en stock (solo desactivar)
3. NO permitir stock negativo
4. NO crear flujos que requieran permisos de admin para usuarios normales
5. NO romper la jerarquía de ubicaciones (pasillo → armario → productos)
6. NO modificar el trigger de PostgreSQL sin consultarlo primero
7. NO cambiar la estructura de la tabla `movimientos` (es crítica para trazabilidad)

## ✅ Criterios de Aceptación para Nuevas Funcionalidades

- Debe pasar `npm run build` sin errores
- Debe pasar `npm test` (31 tests actuales)
- No debe romper la vista de árbol existente
- Debe respetar los permisos de usuario
- Debe mantener la trazabilidad de movimientos
- Debe funcionar en móvil (responsive)

---

## 📦 Sistema de Palets (Fase 5)

### Arquitectura y Relaciones

- Tabla independiente `palets` vinculada a `ubicaciones` mediante `id_reserva`.
- **Exclusividad de Reserva**: Los palets solo pueden crearse y asignarse a ubicaciones de tipo `"reserva"`.
- **Inmutabilidad de Ubicación**: Los palets NO se mueven entre reservas distintas. Permanecen en la reserva donde fueron dados de alta.

### Formato de Código de Barras

- Estructura: `PAL-{numero_pad_3digitos}-{usuario}-{fecha_ddmmaaaa}`
- Ejemplo: `PAL-001-Javier-25102026`
- Componentes:
  - Prefijo fijo `PAL-`
  - Número secuencial por reserva a 3 dígitos (ej: `001`, `002`) generado mediante `get_siguiente_numero_palet(id_reserva)`
  - Nombre o identificador normalizado del usuario generador
  - Fecha de generación en formato `DDMMAAAA`

### Ciclo de Vida y Eliminación (Soft Delete)

- **Eliminación Lógica Obligatoria**: La eliminación de un palet SIEMPRE es un soft delete (`UPDATE activo = FALSE`). NUNCA se ejecuta un `DELETE` físico en la base de datos (DELETE está revocado en RLS).
- **Alerta de Desactivación**: Al solicitar la baja de un palet, la interfaz debe requerir confirmación mediante modal crítico (`AlertDialog`) y notificar con `Toast`.

### Control de Acceso y RLS

- **Lectura**: Cualquier usuario autenticado puede consultar los palets (`SELECT` permitido).
- **Creación y Modificación**: Requiere ser Administrador (`perfiles_usuario.rol = 'admin'`) o contar con permisos de gestión de ubicaciones (`puede_crear_ubicaciones = true` o `puede_editar_ubicaciones = true` en `permisos_usuario`).
- **Borrado Físico**: Denegado para todos los roles de cliente.
