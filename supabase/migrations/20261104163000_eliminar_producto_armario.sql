-- ====================================================================
-- Migración: Eliminar / Desasignar Producto de Armario con Stock Cero
-- Fecha: 2026-11-04
-- ====================================================================
-- Función RPC con SECURITY DEFINER para desvincular un producto de una
-- ubicación (armario) de forma segura cuando su stock es estrictamente 0.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.eliminar_producto_armario(
  p_id_producto UUID,
  p_id_ubicacion UUID,
  p_motivo TEXT,
  p_usuario_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stock_actual INTEGER;
  v_prod_nombre TEXT;
  v_ubi_nombre TEXT;
BEGIN
  -- 1. Validar autenticación
  IF p_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = '42501';
  END IF;

  -- 2. Validar que el motivo no esté vacío
  IF p_motivo IS NULL OR trim(p_motivo) = '' THEN
    RAISE EXCEPTION 'El motivo de retirada es obligatorio';
  END IF;

  -- 3. Obtener nombres y stock actual
  SELECT nombre INTO v_prod_nombre FROM public.productos WHERE id = p_id_producto;
  SELECT nombre INTO v_ubi_nombre FROM public.ubicaciones WHERE id = p_id_ubicacion;

  SELECT cantidad INTO v_stock_actual
  FROM public.stock
  WHERE id_producto = p_id_producto AND id_ubicacion = p_id_ubicacion;

  -- 4. Verificar que no haya existencias positivas
  IF v_stock_actual IS NOT NULL AND v_stock_actual > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar un producto con existencias (% uds). Ajusta el stock a 0 primero.', v_stock_actual
      USING ERRCODE = '23514';
  END IF;

  -- 5. Eliminar la fila de stock a 0 si existe
  DELETE FROM public.stock
  WHERE id_producto = p_id_producto AND id_ubicacion = p_id_ubicacion;

  RETURN jsonb_build_object(
    'success', true,
    'mensaje', format('Producto %s retirado del armario %s con éxito', coalesce(v_prod_nombre, 'desconocido'), coalesce(v_ubi_nombre, 'desconocido'))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.eliminar_producto_armario(UUID, UUID, TEXT, UUID) TO authenticated;
