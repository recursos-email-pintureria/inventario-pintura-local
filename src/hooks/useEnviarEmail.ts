import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export interface EmailPayload {
  destinatario: string;
  asunto: string;
  cuerpo: string;
  tipo?: "incidencia";
}

export type EnviarEmailVariables = EmailPayload;

export interface EnviarEmailResult {
  id: string;
}

export function useEnviarEmail() {
  return useMutation<EnviarEmailResult, Error, EmailPayload>({
    mutationFn: async (payload: EmailPayload) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No hay sesión activa para enviar el email");
      }

      const destinatario = payload.destinatario.trim();
      const asunto = payload.asunto.trim();
      const cuerpo = payload.cuerpo.trim();

      if (!destinatario || !asunto || !cuerpo) {
        throw new Error("Todos los campos (destinatario, asunto y cuerpo) son obligatorios.");
      }

      const { data, error } = await supabase.functions.invoke<EnviarEmailResult>("enviar-email", {
        body: {
          destinatario,
          asunto,
          cuerpo,
          ...(payload.tipo !== undefined && { tipo: payload.tipo }),
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || typeof data.id !== "string" || !data.id) {
        throw new Error("El servidor no confirmó el envío del email.");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Email enviado correctamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar el email: ${error.message}`);
    },
  });
}
