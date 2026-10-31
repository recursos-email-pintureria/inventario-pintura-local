---
name: inventario-lm
description: Reglas de negocio, esquema y patrones de Inventario LM. Úsala SIEMPRE al escribir, modificar o revisar código/SQL que involucre stock, movimientos, ubicaciones, palets, permisos o RLS.
---

# Skill: Inventario LM - Reglas Críticas

## 🚨 REGLA ABSOLUTA (Nunca violar)
El cliente (frontend) **NUNCA** escribe directamente en la tabla `stock` (no hay `insert`, `update`, `delete` ni `upsert` en `stock`). 
Toda modificación de inventario se hace **exclusivamente** insertando un registro en la tabla `movimientos`. El trigger `actualizar_stock` de PostgreSQL se encarga de actualizar la tabla `stock` de forma segura y atómica.

## ⚠️ NOMBRES DE CAMPOS REALES (NO los inventados)
Usa **exactamente** estos nombres en tus queries de Supabase:
- `id_producto` (❌ NO uses `producto_id`)
- `id_ubicacion` (❌ NO uses `ubicacion_id`)
- `realizado_por` (❌ NO uses `creado_por`)
- `id_palet` (✅ Correcto)
- `cantidad` (✅ Correcto)
- `tipo` (✅ Correcto)

## 🔐 Permisos requeridos
El usuario autenticado debe tener `puede_crear_productos = true` en la tabla `permisos_usuario`. El trigger valida esto y lanza una excepción `42501` si no tiene permiso. Además, valida que `realizado_por` coincida con `auth.uid()`.

## ⚙️ Comportamiento REAL del trigger `actualizar_stock`
- `entrada`: stock + cantidad (suma)
- `salida`: stock - cantidad (resta, valida que haya stock suficiente)
- `reposicion`: stock = cantidad (**FIJA el valor absoluto, NO suma**)
- `ajuste`: stock = cantidad (**FIJA el valor absoluto**)

⚠️ **IMPORTANTE**: `reposicion` NO suma. Si el stock actual es 5 y quieres que quede en 15, debes enviar `cantidad: 15` (no 10).

## 📦 Restricciones de palets
- Para movimientos con `id_palet`, el trigger **SOLO** permite los tipos `entrada` y `salida`.
- **NO** se permiten `reposicion` ni `ajuste` en movimientos de palets.
- La `id_ubicacion` del movimiento debe coincidir con la `id_reserva` del palet.

## 🏗️ Jerarquía de Ubicaciones
- **Nivel 0**: `seccion` (Raíz, sin padre)
- **Nivel 1**: `pasillo`, `reserva`, `caja` (Padre = sección)
- **Nivel 2**: `armario`, `cross` (Padre = pasillo). Los armarios tienen `posicion_lateral` ('derecha' o 'izquierda').
- **Nota**: `palets` es una tabla independiente, NO es un nivel de ubicación.

## 📚 Referencias Detalladas
Para el esquema completo de tablas y ejemplos de queries con los nombres de campo correctos, consulta los archivos en la carpeta `references/` de esta misma skill.