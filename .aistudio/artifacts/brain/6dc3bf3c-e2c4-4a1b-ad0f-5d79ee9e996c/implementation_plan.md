# Eliminar Productos con Stock Cero en Armarios

Implementación de un flujo seguro y visual para eliminar productos asignados a un armario cuando su existencia física sea exactamente 0 uds, ubicado inmediatamente a la derecha del botón "Ajuste" en el panel lateral de la ubicación.

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones confirmadas a través de las preguntas de clarificación:
> 1. **Regla de stock estricta**: Solo se permite eliminar productos cuando su cantidad sea exactamente 0 unidades. Si el stock es positivo (> 0), la eliminación queda bloqueada para evitar inconsistencias de almacén.
> 2. **Diseño del botón**: Icono de papelera roja (`Trash2` de Lucide) situado junto al botón "Ajuste", con estado deshabilitado y tooltip explicativo si el producto tiene stock > 0.
> 3. **Confirmación obligatoria (Regla de Oro nº 4)**: Modal `AlertDialog` de shadcn/ui con campo de **Motivo de retirada obligatorio** antes de ejecutar la eliminación.

- **Decisión confirmada 1**: Condición de eliminación: `prod.cantidad === 0`. Con `prod.cantidad > 0`, el botón se muestra deshabilitado con título informativo: `"No se puede eliminar: el producto tiene existencias (X uds). Ajusta el stock a 0 primero."`.
- **Decisión confirmada 2**: Componente modal: `AlertDialog` (no modal genérico ni `window.confirm`), acorde con el sistema de diseño del proyecto (`rose-600` para acciones destructivas).
- **Decisión confirmada 3**: Auditoría de inventario: Registro en la tabla `movimientos` con el motivo justificado y actualización de la lista de productos del armario.

---

## 1. Overview & Core Concept

- **Qué hace**: Permite a los operarios y administradores desasignar o limpiar productos del inventario de un armario cuando ya no quedan existencias (stock = 0), manteniendo un registro de auditoría con la justificación de la retirada (por ejemplo: descatalogado, fin de campaña, reubicación definitiva).
- **Audiencia**: Vendedores, reponedores y encargados de tienda que gestionan el lineal y los armarios desde la vista de Ubicaciones.
- **Valor aportado**: Evita que los armarios queden saturados visualmente de artículos agotados o ya no asignados a esa ubicación, manteniendo los armarios limpios y legibles.

---

## 2. User Experience & Visual Design

```
Panel Lateral del Armario (Sheet)
┌─────────────────────────────────────────────────────────────┐
│ Esmalte Sintético Blanco 4L                                 │
│ SKU: ESM-001  ·  Pinturas                                  │
│                                                             │
│ [ 0 uds ]   [-] [+] [ Ajuste ] [ 🗑️ ]                        │
│                                   │                         │
│                  (Habilitado si stock = 0;                  │
│                   Deshabilitado si stock > 0)               │
└───────────────────────────────────┼─────────────────────────┘
                                    │ Clic
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Eliminar Producto del Armario                            │
├─────────────────────────────────────────────────────────────┤
│ ¿Estás seguro de que deseas retirar este producto del       │
│ armario "Armario A1-01"?                                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Producto: Esmalte Sintético Blanco 4L (ESM-001)        │ │
│ │ Stock actual: 0 uds                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Motivo de la retirada (obligatorio) *                       │
│ [ Ej. Producto reubicado en pasillo A2 o descatalogado... ] │
│                                                             │
│ [ Cancelar ]               [ Confirmar y Eliminar (Rojo) ]  │
└─────────────────────────────────────────────────────────────┘
```

- **Botón en fila de producto**:
  - Ubicado junto a `Ajuste` en el contenedor de acciones de cada fila.
  - Cuando `prod.cantidad === 0`:
    - Clase Tailwind: `h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/60 rounded-md transition-colors`.
    - Icono: `Trash2` de `lucide-react` (tamaño `w-3.5 h-3.5`).
    - Tooltip: `"Eliminar producto del armario (stock en 0)"`.
  - Cuando `prod.cantidad > 0`:
    - Clase Tailwind: `h-7 w-7 p-0 text-slate-300 border border-slate-100 rounded-md cursor-not-allowed opacity-50`.
    - Tooltip: `"No se puede eliminar: el producto tiene existencias (${prod.cantidad} uds). Ajusta el stock a 0 primero."`.
    - Si se intenta forzar el clic, muestra un toast de advertencia claro.

- **Modal de confirmación (`AlertDialog`)**:
  - `AlertDialogContent` con ancho contenido (`max-w-md`).
  - Cabecera: Icono `Trash2` en contenedor circular `bg-rose-100 text-rose-600` + título `Eliminar Producto del Armario`.
  - Tarjeta de resumen del producto: Fondo suave `bg-slate-50 border border-slate-200 rounded-lg p-3` mostrando nombre, SKU y `0 uds` de stock.
  - Input de texto para motivo obligatorio (`motivoEliminacion`), con validación en tiempo real.
  - Botón de confirmación `Confirmar y Eliminar`: fondo `bg-rose-600 hover:bg-rose-700 text-white`, deshabilitado si el motivo está vacío (`!motivoEliminacion.trim()`) o si la mutación está en progreso.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Bloqueo estricto con stock positivo**:
  - *Enfoque*: El botón solo es accionable cuando el stock es estrictamente 0.
  - *Por qué*: Evita que por error se elimine un producto que físicamente contiene botes de pintura en el armario sin haber registrado previamente la salida física de la mercancía.
  - *Alternativa descartada*: Permitir eliminar forzosamente a 0 en el mismo paso. Se descartó porque mezclar ajuste a cero con desasignación sin recuento físico previo crea discrepancias en auditoría.

- **Decisión 2: Diálogo Radix AlertDialog en vez de confirm nativo**:
  - *Enfoque*: Cumple con la Regla de Oro nº 4 de `AGENTS.md`. Proporciona accesibilidad, soporte de foco, cierre con ESC y diseño consistente.

- **Decisión 3: Registro en `movimientos` y actualización reactiva**:
  - *Enfoque*: El cliente nunca escribe directamente en `stock` (Regla de Oro nº 1). Se registra el evento de desasignación/retirada mediante `movimientos` con motivo justificado, y se actualiza el estado local y la caché de TanStack Query (`queryClient.invalidateQueries`).

---

## 4. Technical Architecture & Data Strategy

```
               Interacción de Usuario
                        │
                        ▼
       [ Botón Trash2 (prod.cantidad === 0) ]
                        │
                        ▼
       [ AlertDialog: Motivo Obligatorio ]
                        │
                        ▼ Confirmar
         [ useAddStock / registrarMovimiento ]
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
INSERT en public.movimientos    Actualizar estado local
(id_producto, id_ubicacion,     (u.productos sin el prod)
 tipo: 'ajuste', motivo)        + invalidar TanStack Query
```

### Componentes y Archivos Involucrados

1. **`src/routes/_authenticated/ubicaciones.tsx`**:
   - Estados locales del modal:
     - `productoParaEliminar`: Producto seleccionado (`ProductoEnUbicacion | null`).
     - `alertEliminarProdAbierto`: Booleano para abrir/cerrar el `AlertDialog`.
     - `motivoEliminarProd`: String con la justificación del usuario.
     - `eliminandoProd`: Booleano de estado de carga.
   - Renderizado del botón `Trash2` junto a `Ajuste` en la lista de productos del panel lateral (`Sheet`).
   - Modal `AlertDialog` con el formulario de confirmación y validación de campo requerido.
   - Función `handleConfirmarEliminarProductoDeArmario`:
     - Valida `productoParaEliminar` y `ubicacionSeleccionada`.
     - Llama a `addStockMutation.mutateAsync` registrando el movimiento de auditoría.
     - Actualiza el estado reactivo `setUbicaciones` eliminando el producto de la lista del armario.
     - Muestra toast de éxito y resetea los estados.

2. **Verificación y Pruebas**:
   - Validación de tipos TypeScript con `npx tsc --noEmit`.
   - Ejecución de la suite de pruebas unitarias con `npx vitest run`.
   - Verificación de compilación del applet con `npm run build`.
