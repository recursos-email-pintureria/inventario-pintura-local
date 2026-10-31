# Esquema de Tablas Clave (BASADO EN EL TRIGGER REAL)

## movimientos (ÚNICA vía de escritura de stock)
- `id` (uuid, PK)
- `id_producto` (uuid, FK → productos) ⚠️ NO es `producto_id`
- `id_ubicacion` (uuid, FK → ubicaciones) ⚠️ NO es `ubicacion_id`
- `tipo` (text: 'entrada', 'salida', 'reposicion', 'ajuste')
- `cantidad` (integer, > 0)
- `realizado_por` (uuid, FK → auth.users) ⚠️ NO es `creado_por`
- `id_palet` (uuid, FK → palets, nullable)
- `creado_en` (timestamptz)

## stock (SOLO LECTURA desde cliente)
- `id` (uuid, PK)
- `id_producto` (uuid, FK → productos)
- `id_ubicacion` (uuid, FK → ubicaciones)
- `id_palet` (uuid, FK → palets, nullable)
- `cantidad` (integer)
- `actualizado_en` (timestamptz)

## ubicaciones
- `id` (uuid, PK)
- `nombre` (text, unique)
- `tipo` (text: 'seccion', 'pasillo', 'reserva', 'caja', 'armario', 'cross')
- `descripcion` (text, nullable)
- `activo` (boolean)
- `id_ubicacion_padre` (uuid, FK → ubicaciones, nullable)
- `posicion_lateral` (text: 'derecha', 'izquierda', nullable)
- `posicion_longitudinal` (text, nullable)
- `numero` (integer, nullable)

## palets (Tabla independiente, NO es nivel de ubicación)
- `id` (uuid, PK)
- `codigo` (text, unique)
- `id_reserva` (uuid, FK → ubicaciones, tipo='reserva') ⚠️ NO es `ubicacion_id`
- `descripcion` (text, nullable)
- `activo` (boolean)
- `creado_por` (uuid, FK → auth.users)
- `creado_en` (timestamptz)

## permisos_usuario
- `id` (uuid, PK)
- `id_usuario` (uuid, FK → perfiles_usuario / auth.users)
- `puede_crear_productos` (boolean) ⚠️ REQUERIDO para insertar en movimientos
- `puede_gestionar_usuarios` (boolean)
- `puede_ver_reportes` (boolean)
- `puede_exportar` (boolean)
- `puede_eliminar_ubicaciones` (boolean)
- `puede_ajustar_stock` (boolean)