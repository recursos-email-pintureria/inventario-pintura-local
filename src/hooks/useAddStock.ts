import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registrarMovimiento, type DatosMovimiento } from "@/lib/inventario";

export interface AddStockVariables extends DatosMovimiento {
  realizado_por?: string;
}

export const useAddStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: AddStockVariables) => {
      return await registrarMovimiento({
        id_producto: variables.id_producto,
        id_ubicacion: variables.id_ubicacion,
        tipo: variables.tipo,
        cantidad: variables.cantidad,
        ...(variables.notas !== undefined && { notas: variables.notas }),
        ...(variables.id_palet !== undefined && { id_palet: variables.id_palet }),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventario"] }),
        queryClient.invalidateQueries({ queryKey: ["movimientos"] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["ubicaciones"] }),
        queryClient.invalidateQueries({ queryKey: ["productos"] }),
      ]);
    },
  });
};

export const useRegistrarMovimiento = useAddStock;
