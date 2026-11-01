import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.118.0/cors";

interface EmailInput {
  destinatario: string;
  asunto: string;
  cuerpo: string;
  tipo?: "incidencia";
}

interface EmailProviderResponse {
  id: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

function getPublishableKey(): string | null {
  const legacyKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacyKey) return legacyKey;

  const configuredKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (!configuredKeys) return null;

  const parsedKeys: unknown = JSON.parse(configuredKeys);
  if (!isRecord(parsedKeys)) return null;

  const defaultKey = parsedKeys["default"];
  return typeof defaultKey === "string" ? defaultKey : null;
}

function parseEmailInput(value: unknown): EmailInput | null {
  if (!isRecord(value)) return null;

  const destinatario =
    typeof value["destinatario"] === "string" ? value["destinatario"].trim() : "";
  const asunto = typeof value["asunto"] === "string" ? value["asunto"].trim() : "";
  const cuerpo = typeof value["cuerpo"] === "string" ? value["cuerpo"].trim() : "";
  const tipo = value["tipo"];
  const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formatoEmail.test(destinatario) || destinatario.length > 254) return null;
  if (!asunto || asunto.length > 150 || /[\r\n]/.test(asunto)) return null;
  if (!cuerpo || cuerpo.length > 20_000) return null;
  if (tipo !== undefined && tipo !== "incidencia") return null;

  return tipo === "incidencia"
    ? { destinatario, asunto, cuerpo, tipo }
    : { destinatario, asunto, cuerpo };
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    return jsonResponse({ error: "Debes iniciar sesión para enviar emails." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  let publishableKey: string | null;
  try {
    publishableKey = getPublishableKey();
  } catch (error) {
    console.error("No se pudo leer la clave pública de Supabase.", error);
    return jsonResponse({ error: "La función de email no está configurada correctamente." }, 500);
  }

  if (!supabaseUrl || !publishableKey) {
    return jsonResponse({ error: "La función de email no está configurada correctamente." }, 500);
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: authorization },
    },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData.user) {
    return jsonResponse({ error: "La sesión no es válida o ha caducado." }, 401);
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return jsonResponse({ error: "El cuerpo de la solicitud debe ser JSON válido." }, 400);
  }

  const email = parseEmailInput(requestBody);
  if (!email) {
    return jsonResponse(
      {
        error:
          "Revisa los datos: destinatario válido, asunto de hasta 150 caracteres y cuerpo de hasta 20.000 caracteres.",
      },
      400,
    );
  }

  const esEmailPropio = email.destinatario.toLowerCase() === userData.user.email?.toLowerCase();
  if (!esEmailPropio) {
    const { data: profile, error: profileError } = await supabase
      .from("perfiles_usuario")
      .select("rol, activo")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("No se pudo comprobar el perfil del usuario.", profileError);
      return jsonResponse({ error: "No se pudieron comprobar los permisos del usuario." }, 500);
    }

    const esAdminActivo = profile?.rol === "admin" && profile.activo === true;
    let esEmailSoporteConfigurado = false;
    if (email.tipo === "incidencia") {
      const { data: setting, error: settingError } = await supabase
        .from("configuracion_sistema")
        .select("valor")
        .eq("clave", "contact_email")
        .maybeSingle();

      if (settingError) {
        console.error("No se pudo comprobar el email de soporte configurado.", settingError);
        return jsonResponse(
          { error: "No se pudo comprobar el email de soporte configurado." },
          500,
        );
      }

      esEmailSoporteConfigurado =
        profile?.activo === true &&
        typeof setting?.valor === "string" &&
        setting.valor.trim().toLowerCase() === email.destinatario.toLowerCase();
    }

    if (!esAdminActivo && !esEmailSoporteConfigurado) {
      return jsonResponse(
        {
          error:
            "Solo se pueden enviar emails a tu propia cuenta. Los reportes se limitan al email de soporte configurado.",
        },
        403,
      );
    }
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM")?.trim() || "onboarding@resend.dev";
  if (!resendApiKey) {
    return jsonResponse({ error: "Falta RESEND_API_KEY en los secretos." }, 500);
  }

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [email.destinatario],
        subject: email.asunto,
        text: email.cuerpo,
      }),
    });
  } catch (error) {
    console.error("No se pudo conectar con Resend.", error);
    return jsonResponse({ error: "No se pudo conectar con el proveedor de email." }, 502);
  }

  let providerBody: unknown;
  try {
    providerBody = await resendResponse.json();
  } catch {
    console.error("Resend devolvió una respuesta que no es JSON.", resendResponse.status);
    return jsonResponse({ error: "El proveedor de email devolvió una respuesta inválida." }, 502);
  }

  if (!resendResponse.ok) {
    console.error("Resend rechazó el envío.", resendResponse.status);
    const providerMessage = isRecord(providerBody)
      ? [providerBody["message"], providerBody["error"]].find(
          (value): value is string => typeof value === "string",
        )
      : undefined;
    return jsonResponse(
      {
        error: providerMessage
          ? `Resend rechazó el envío: ${providerMessage}`
          : `Resend rechazó el envío (HTTP ${resendResponse.status}).`,
      },
      502,
    );
  }

  if (!isRecord(providerBody) || typeof providerBody["id"] !== "string") {
    console.error("Resend devolvió una respuesta sin identificador.");
    return jsonResponse({ error: "No se pudo confirmar el envío del email." }, 502);
  }

  const result: EmailProviderResponse = { id: providerBody["id"] };
  return jsonResponse(result);
}

Deno.serve(async (request: Request) => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error("Error inesperado en la función enviar-email.", error);
    return jsonResponse({ error: "Se produjo un error inesperado al enviar el email." }, 500);
  }
});
