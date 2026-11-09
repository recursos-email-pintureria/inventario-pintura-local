# Flujos de Usuario

> **Última actualización:** 10/11/2026

## 1. Importar CSV de Armario

**Ruta:** `/cargar-lista-armario`  
**Componente:** `src/routes/_authenticated/cargar-lista-armario.tsx`

### Pasos:
1. Usuario selecciona armario de destino.
2. Elige modo: "Sumar cantidades" o "Rechazar duplicados".
3. Sube archivo CSV.
4. Sistema detecta columnas automáticamente (SKU, EAN, cantidad).
5. Usuario valida el mapeo en `PanelMapeoColumnas.tsx`.
6. Vista previa de cambios en stock.
7. Confirmación → se insertan registros en `movimientos`.
8. Trigger `actualizar_stock` actualiza la tabla `stock`.

### Notas técnicas:
- El mapeo se persiste en `mapeos_importacion_csv` para reutilizar.
- Los lotes se guardan en tabla `palets`.

## 2. Revertir Lote de Importación

**Componente:** `ModalRevertirLote.tsx`

### Pasos:
1. Usuario abre modal "Revertir lote".
2. Selecciona lote de la lista.
3. Sistema genera movimientos compensatorios (cantidades negativas).
4. Se insertan en `movimientos` con tipo `revertir`.
5. El stock se actualiza automáticamente.

### Notas:
- El historial original NO se borra.
- Se usa la función SQL `revertir_lote_importacion(lote_id)`.

## 3. Ajuste Manual de Stock

**Ruta:** `/actualizacion-masiva-stock`

### Pasos:
1. Usuario busca producto por SKU/EAN/nombre.
2. Selecciona ubicación.
3. Introduce cantidad (positiva o negativa).
4. Confirma → se inserta en `movimientos`.

## 4. Escaneo de Código de Barras

**Componente:** `lint-barcode-scanner` (skill del harness)

### Flujo:
1. Usuario activa escáner (cámara o lector USB).
2. Sistema detecta EAN-13.
3. Busca producto en tabla `productos`.
4. Muestra stock actual por ubicación.
5. Permite ajuste rápido.

## 5. Gestión de Ubicaciones

**Ruta:** `/ubicaciones`  
**Componentes:** `Mapa2D.tsx`, `Mapa2DModal.tsx`

### Jerarquía:Sección → Pasillo → Armario → Alto → Cross → Caja → Reserva
### Operaciones:
- Crear/editar/eliminar ubicaciones.
- Asignar productos a ubicaciones (tabla `producto_ubicaciones`).
- Visualizar mapa 2D del almacén.

## 6. Gestión de Usuarios y Permisos

**Ruta:** `/usuarios`

### Roles:
- **Admin:** Acceso total.
- **Vendedor:** Lectura + ajustes de stock.
- **Soporte:** Solo lectura.

### Políticas RLS:
Cada tabla tiene políticas que restringen operaciones según el rol.