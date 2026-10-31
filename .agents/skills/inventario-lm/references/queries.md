# Queries de Ejemplo Correctas (NOMBRES REALES DE CAMPOS)

## ✅ CORRECTO: Añadir stock (Entrada)
```typescript
// El trigger actualizar_stock hará el resto
// Requiere: usuario autenticado con puede_crear_productos = true
const { data, error } = await supabase
  .from('movimientos')
  .insert({
    id_producto: 'uuid-producto',
    id_ubicacion: 'uuid-ubicacion',
    tipo: 'entrada',
    cantidad: 10,
    realizado_por: user.id
  })
  .select()
  .single();
```

## ✅ CORRECTO: Reposición (fija stock, NO suma)
```typescript
// ⚠️ IMPORTANTE: reposicion FIJA el stock al valor, NO suma
// Si stock actual = 5 y quieres 15, usa cantidad = 15 (no 10)
const { data, error } = await supabase
  .from('movimientos')
  .insert({
    id_producto: 'uuid-producto',
    id_ubicacion: 'uuid-ubicacion',
    tipo: 'reposicion',
    cantidad: 15,
    realizado_por: user.id
  });
```

## ✅ CORRECTO: Leer stock actual
```typescript
const { data } = await supabase
  .from('stock')
  .select('cantidad, id_producto, id_ubicacion')
  .eq('id_ubicacion', 'uuid-ubicacion');
```

## ✅ CORRECTO: Movimiento de palet (solo entrada/salida)
```typescript
// ⚠️ Para palets SOLO se permiten 'entrada' y 'salida'
const { data, error } = await supabase
  .from('movimientos')
  .insert({
    id_producto: 'uuid-producto',
    id_ubicacion: 'uuid-reserva',
    tipo: 'entrada',
    cantidad: 10,
    id_palet: 'uuid-palet',
    realizado_por: user.id
  });
```

---

## ❌ INCORRECTO: Nombres de campo equivocados
```typescript
await supabase.from('movimientos').insert({
  producto_id: '...',      // ❌ Debe ser id_producto
  ubicacion_id: '...',     // ❌ Debe ser id_ubicacion
  creado_por: '...'        // ❌ Debe ser realizado_por
});
```

## ❌ INCORRECTO: Escritura directa en stock
```typescript
await supabase.from('stock').update({ cantidad: 10 }).eq('id', 'uuid');
```

## ❌ INCORRECTO: Reposición en palet
```typescript
await supabase.from('movimientos').insert({
  id_producto: '...',
  id_ubicacion: '...',
  tipo: 'reposicion',  // ❌ Solo 'entrada' o 'salida' para palets
  id_palet: '...',
  realizado_por: user.id
});
```