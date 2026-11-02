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

function abortError(): Error {
  return Object.assign(new Error("La sesión terminó antes de enviar el email."), {
    name: "AbortError",
  });
}

export function useEnviarEmail() {
  return useMutation<EnviarEmailResult, Error, EmailPayload>({
    mutationFn: async (payload: EmailPayload) => {
      const controller = new AbortController();
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") controller.abort();
      });

      try {
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

        if (controller.signal.aborted) throw abortError();

        const { data: currentSession } = await supabase.auth.getSession();
        if (!currentSession.session || controller.signal.aborted) throw abortError();

        const { data, error } = await supabase.functions.invoke<EnviarEmailResult>("enviar-email", {
          body: {
            destinatario,
            asunto,
            cuerpo,
            ...(payload.tipo !== undefined && { tipo: payload.tipo }),
          },
          signal: controller.signal,
        });

        if (controller.signal.aborted) throw abortError();
        if (error) throw new Error(error.message);
        if (!data || typeof data.id !== "string" || !data.id) {
          throw new Error("El servidor no confirmó el envío del email.");
        }

        return data;
      } catch (error) {
        if (controller.signal.aborted) throw abortError();
        throw error;
      } finally {
        authListener.subscription.unsubscribe();
      }
    },
    onSuccess: () => {
      toast.success("Email enviado correctamente");
    },
    onError: (error: Error) => {
      if (error.name === "AbortError") return;
      toast.error(`Error al enviar el email: ${error.message}`);
    },
  });
}
