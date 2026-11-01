import { useMutation } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface EnviarEmailVariables {
  destinatario: string;
  asunto: string;
  cuerpo: string;
  tipo?: "incidencia";
}

export interface EnviarEmailResult {
  id: string;
}

function validarEmail(input: EnviarEmailVariables): EnviarEmailVariables {
  const destinatario = input.destinatario.trim();
  const asunto = input.asunto.trim();
  const cuerpo = input.cuerpo.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario) || destinatario.length > 254) {
    throw new Error("Introduce una dirección de email válida.");
  }
  if (!asunto || asunto.length > 150 || /[\r\n]/.test(asunto)) {
    throw new Error("El asunto es obligatorio y no puede superar 150 caracteres.");
  }
  if (!cuerpo || cuerpo.length > 20_000) {
    throw new Error("El cuerpo es obligatorio y no puede superar 20.000 caracteres.");
  }

  return input.tipo === "incidencia"
    ? { destinatario, asunto, cuerpo, tipo: input.tipo }
    : { destinatario, asunto, cuerpo };
}

async function mensajeDeError(error: Error): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    try {
      const body: unknown = await error.context.clone().json();
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
      ) {
        return body.error;
      }
    } catch {
      return error.message;
    }
  }

  return error.message;
}

export function useEnviarEmail() {
  return useMutation<EnviarEmailResult, Error, EnviarEmailVariables>({
    mutationFn: async (input) => {
      const body = validarEmail(input);
      const { data, error } = await supabase.functions.invoke<EnviarEmailResult>("enviar-email", {
        body,
      });

      if (error) {
        throw new Error(`No se pudo enviar el email: ${await mensajeDeError(error)}`);
      }
      if (!data || typeof data.id !== "string" || !data.id) {
        throw new Error("El servidor no confirmó el envío del email.");
      }

      return data;
    },
  });
}
