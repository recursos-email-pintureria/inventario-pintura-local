import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface AddStockVariables {
  id_producto: string;
  id_ubicacion: string;
  tipo: 'entrada' | 'salida' | 'reposicion' | 'ajuste';
  cantidad: number;
  realizado_por: string;
  id_palet?: string | null;
}

export const useAddStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: AddStockVariables) => {
      // 1. Validaciones básicas
      if (!variables.id_producto || !variables.id_ubicacion) {
        throw new Error('id_producto e id_ubicacion son obligatorios');
      }

      // 2. Insertar en MOVIMIENTOS (NUNCA en stock directamente)
      const movimientoData: any = {
        id_producto: variables.id_producto,
        id_ubicacion: variables.id_ubicacion,
        tipo: variables.tipo,
        cantidad: variables.cantidad,
        realizado_por: variables.realizado_por,
      };

      // Añadir id_palet solo si existe
      if (variables.id_palet) {
        movimientoData.id_palet = variables.id_palet;
      }

      const { data, error } = await supabase
        .from('movimientos')
        .insert(movimientoData)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al registrar movimiento: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // 3. Invalidar caché para forzar el re-fetch de los datos actualizados
      // Nota: Ajusta 'inventario' a la queryKey exacta que uses en tu app (ej: ['inventario', userId])
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      
      // Si tienes una query específica por ubicación, descomenta la siguiente línea:
      // queryClient.invalidateQueries({ queryKey: ['stock', variables.id_ubicacion] });
    },
  });
};
