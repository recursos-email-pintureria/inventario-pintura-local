import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.118.0/cors";

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

function getAdminKey(): string | null {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const configuredKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!configuredKeys) return null;

  const parsedKeys: unknown = JSON.parse(configuredKeys);
  if (!isRecord(parsedKeys)) return null;

  const defaultKey = parsedKeys["default"];
  return typeof defaultKey === "string" ? defaultKey : null;
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
  if (!authorization || !token) {
    return jsonResponse({ error: "Debes iniciar sesión para cambiar la contraseña." }, 401);
  }

  let supabaseUrl: string | undefined;
  let publishableKey: string | null;
  try {
    supabaseUrl = Deno.env.get("SUPABASE_URL");
    publishableKey = getPublishableKey();
  } catch (error) {
    console.error("No se pudo leer la configuración de Supabase.", error);
    return jsonResponse({ error: "La función de cambio no está configurada correctamente." }, 500);
  }

  let adminKey: string | null;
  try {
    adminKey = getAdminKey();
  } catch (error) {
    console.error("No se pudo leer la clave privada de Supabase.", error);
    return jsonResponse({ error: "La función de cambio no está configurada correctamente." }, 500);
  }
  if (!supabaseUrl || !publishableKey || !adminKey) {
    return jsonResponse({ error: "La función de cambio no está configurada correctamente." }, 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "El cuerpo de la solicitud debe ser JSON válido." }, 400);
  }
  const newPassword = isRecord(body) ? body["nueva_password"] : null;
  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
    return jsonResponse({ error: "La contraseña debe tener entre 8 y 128 caracteres." }, 400);
  }

  const callerClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: authError } = await callerClient.auth.getUser(token);
  if (authError || !userData.user) {
    return jsonResponse({ error: "La sesión no es válida o ha caducado." }, 401);
  }

  const { data: profile, error: profileError } = await callerClient
    .from("perfiles_usuario")
    .select("debe_cambiar_password")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("No se pudo comprobar el estado de cambio de contraseña.", profileError);
    return jsonResponse({ error: "No se pudo comprobar si debes cambiar la contraseña." }, 500);
  }
  if (profile?.debe_cambiar_password !== true) {
    return jsonResponse({ error: "Esta cuenta no tiene pendiente un cambio obligatorio." }, 403);
  }

  const adminClient = createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { error: passwordError } = await adminClient.auth.admin.updateUserById(userData.user.id, {
    password: newPassword,
  });
  if (passwordError) {
    console.error("No se pudo guardar la nueva contraseña.", passwordError);
    return jsonResponse({ error: "No se pudo guardar la nueva contraseña." }, 400);
  }

  const { data: updatedProfile, error: flagError } = await adminClient
    .from("perfiles_usuario")
    .update({ debe_cambiar_password: false })
    .eq("id", userData.user.id)
    .select("id")
    .maybeSingle();
  if (flagError || !updatedProfile) {
    console.error(
      "No se pudo quitar la marca de cambio obligatorio.",
      flagError ?? "No se encontró el perfil del usuario.",
    );
    return jsonResponse(
      {
        error:
          "La contraseña se guardó, pero el cambio obligatorio sigue pendiente. Inténtalo otra vez.",
      },
      500,
    );
  }

  return jsonResponse({ success: true });
}

Deno.serve(async (request: Request) => {
  try {
    return await handleRequest(request);
  } catch (error) {
    console.error("Error inesperado en completar-cambio-password.", error);
    return jsonResponse({ error: "Se produjo un error inesperado al guardar la contraseña." }, 500);
  }
});
