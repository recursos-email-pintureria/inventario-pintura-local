-- FASE 6: reestructurar ubicaciones de armarios según el plano físico.
-- Ejecutar desde Supabase SQL Editor. La transacción se revierte ante cualquier error.
BEGIN;

-- Datos indicados como datos de prueba.
DELETE FROM public.stock;
DELETE FROM public.movimientos;
DELETE FROM public.producto_ubicaciones;

-- Eliminar exclusivamente ubicaciones de nivel 2 que se van a recrear/retirar.
DELETE FROM public.ubicaciones
WHERE tipo IN ('armario', 'alto');

-- Pasillo 12 - derecha
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E651', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E652', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E653', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E654', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E655', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E656', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E657', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E658', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;

-- Pasillo 12 - izquierda
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E659', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E660', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E661', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E662', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E663', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E664', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E665', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E666', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E667', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E668', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E669', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E670', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '12' AND p.tipo = 'pasillo' LIMIT 1;

-- Pasillo 14 - derecha
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E671', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E672', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E673', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E674', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E675', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E676', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E677', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E678', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E679', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E680', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E681', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E682', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E683', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;

-- Pasillo 14 - izquierda
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E684', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E685', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E686', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E687', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E688', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E689', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E690', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E691', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E692', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E693', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E694', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E695', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E696', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E697', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '14' AND p.tipo = 'pasillo' LIMIT 1;

-- Pasillo 16 - derecha
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E698', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E699', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E700', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E701', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E702', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E703', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E704', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E705', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E706', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E707', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E708', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E709', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E710', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;

-- Pasillo 16 - izquierda
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E711', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E712', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E713', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E714', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E715', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E716', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '16' AND p.tipo = 'pasillo' LIMIT 1;

-- Pasillo 18 - derecha
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E717', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E718', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E719', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E720', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E721', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E722', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E723', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E724', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E725', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E726', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E727', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E728', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;

-- Pasillo 18 - izquierda
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E729', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E730', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E731', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E732', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E733', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E734', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'izquierda'
FROM public.ubicaciones p WHERE p.nombre = '18' AND p.tipo = 'pasillo' LIMIT 1;

-- Pasillo perimetral - derecha
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E735', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E736', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E737', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E738', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E739', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E740', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E741', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E742', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E743', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;
INSERT INTO public.ubicaciones (nombre, tipo, activo, creado_por, creado_en, id_ubicacion_padre, seccion, posicion_lateral)
SELECT 'E744', 'armario', true, COALESCE(auth.uid(), (SELECT id FROM auth.users LIMIT 1)), now(), p.id, p.seccion, 'derecha'
FROM public.ubicaciones p WHERE LOWER(p.nombre) LIKE '%perimetral%' AND p.tipo = 'pasillo' LIMIT 1;

COMMIT;

-- Verificación: armarios activos y su pasillo padre.
SELECT
  p.nombre AS pasillo,
  u.nombre,
  u.posicion_lateral
FROM public.ubicaciones u
LEFT JOIN public.ubicaciones p ON u.id_ubicacion_padre = p.id
WHERE u.tipo = 'armario'
  AND u.activo = true
ORDER BY p.nombre, u.nombre;
