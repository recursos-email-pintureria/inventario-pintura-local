import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.118.0/cors";

interface ResetInput {
  id_usuario: string;
  email: string;
  forzar_cambio: boolean;
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

function parseResetInput(value: unknown): ResetInput | null {
  if (!isRecord(value)) return null;

  const idUsuario = value["id_usuario"];
  const email = value["email"];
  const forzarCambio = value["forzar_cambio"] ?? false;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (typeof idUsuario !== "string" || !uuidPattern.test(idUsuario)) return null;
  if (typeof email !== "string" || email.length > 254 || !emailPattern.test(email)) return null;
  if (typeof forzarCambio !== "boolean") return null;

  return { id_usuario: idUsuario, email, forzar_cambio: forzarCambio };
}

function randomIndex(maxExclusive: number): number {
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / maxExclusive) * maxExclusive;
  const random = new Uint32Array(1);
  let value: number;

  do {
    crypto.getRandomValues(random);
    const sample = random[0];
    if (sample === undefined) throw new Error("No se pudo generar aleatoriedad segura.");
    value = sample;
  } while (value >= limit);

  return value % maxExclusive;
}

function generateTemporaryPassword(): string {
  const groups = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%&*+-_",
  ];
  const allCharacters = groups.join("");
  const characters = groups.map((group) => group[randomIndex(group.length)]!);

  while (characters.length < 12) {
    characters.push(allCharacters[randomIndex(allCharacters.length)]!);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex]!, characters[index]!];
  }

  return characters.join("");
}

async function updateAuditStatus(
  adminClient: ReturnType<typeof createClient>,
  auditId: string,
  estado: "fallido" | "completado" | "email_fallido",
): Promise<boolean> {
  const { error } = await adminClient.from("auditoria_admin").update({ estado }).eq("id", auditId);
  if (!error) return true;

  console.error("No se pudo actualizar el estado de la auditoría.", error);
  return false;
}

async function sendTemporaryPasswordEmail(
  email: string,
  password: string,
  forzarCambio: boolean,
): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.error("Falta RESEND_API_KEY en los secretos.");
    return false;
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM")?.trim() || "onboarding@resend.dev",
        to: [email],
        subject: "Tu contraseña ha sido restablecida",
        text: [
          "Se ha restablecido la contraseña de tu cuenta de Inventario LM.",
          "",
          `Contraseña temporal: ${password}`,
          "",
          "Inicia sesión con esta contraseña temporal.",
          forzarCambio
            ? "El sistema te pedirá que elijas una contraseña nueva antes de continuar."
            : "Por seguridad, cambia esta contraseña después de iniciar sesión.",
        ].join("\n"),
      }),
    });
  } catch (error) {
    console.error("No se pudo conectar con Resend.", error);
    return false;
  }

  if (!response.ok) {
    console.error("Resend rechazó el envío.", response.status);
    return false;
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    console.error("Resend devolvió una respuesta inválida.");
    return false;
  }

  return isRecord(result) && typeof result["id"] === "string" && result["id"].length > 0;
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
    return jsonResponse({ error: "Debes iniciar sesión para restablecer una contraseña." }, 401);
  }

  let supabaseUrl: string | undefined;
  let publishableKey: string | null;
  try {
    supabaseUrl = Deno.env.get("SUPABASE_URL");
    publishableKey = getPublishableKey();
  } catch (error) {
    console.error("No se pudo leer la configuración de Supabase.", error);
    return jsonResponse({ error: "La función de reset no está configurada correctamente." }, 500);
  }

  let adminKey: string | null;
  try {
    adminKey = getAdminKey();
  } catch (error) {
    console.error("No se pudo leer la clave privada de Supabase.", error);
    return jsonResponse({ error: "La función de reset no está configurada correctamente." }, 500);
  }
  if (!supabaseUrl || !publishableKey || !adminKey) {
    return jsonResponse({ error: "La función de reset no está configurada correctamente." }, 500);
  }

  let input: ResetInput | null;
  try {
    input = parseResetInput(await request.json());
  } catch {
    return jsonResponse({ error: "El cuerpo de la solicitud debe ser JSON válido." }, 400);
  }
  if (!input) {
    return jsonResponse({ error: "Revisa el identificador, el email y la opción de cambio." }, 400);
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
    .select("rol, activo")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("No se pudo comprobar el perfil del administrador.", profileError);
    return jsonResponse({ error: "No se pudieron comprobar los permisos del administrador." }, 500);
  }
  if (profile?.rol !== "admin" || profile.activo !== true) {
    return jsonResponse(
      { error: "Solo los administradores activos pueden resetear contraseñas." },
      403,
    );
  }

  const adminClient = createClient(supabaseUrl, adminKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { data: target, error: targetError } = await adminClient.auth.admin.getUserById(
    input.id_usuario,
  );
  if (
    targetError ||
    !target.user ||
    target.user.email?.toLowerCase() !== input.email.toLowerCase()
  ) {
    return jsonResponse({ error: "El usuario no existe o su email no coincide." }, 404);
  }
  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from("perfiles_usuario")
    .select("id")
    .eq("id", input.id_usuario)
    .maybeSingle();
  if (targetProfileError) {
    console.error("No se pudo comprobar el perfil del usuario objetivo.", targetProfileError);
    return jsonResponse({ error: "No se pudo comprobar el perfil del usuario." }, 500);
  }
  if (!targetProfile) {
    return jsonResponse({ error: "El usuario no tiene un perfil activo en el sistema." }, 404);
  }

  const password = generateTemporaryPassword();
  const { data: audit, error: auditError } = await adminClient
    .from("auditoria_admin")
    .insert({
      id_admin: userData.user.id,
      accion: "reset_password",
      id_usuario_afectado: input.id_usuario,
      forzar_cambio: input.forzar_cambio,
      estado: "iniciado",
    })
    .select("id")
    .single();
  if (auditError || !audit) {
    console.error("No se pudo registrar el inicio del reset.", auditError);
    return jsonResponse(
      { error: "No se pudo registrar la auditoría. No se cambió la contraseña." },
      500,
    );
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(input.id_usuario, {
    password,
  });
  if (updateError) {
    console.error("No se pudo actualizar la contraseña del usuario.", updateError);
    await updateAuditStatus(adminClient, audit.id, "fallido");
    return jsonResponse({ error: "No se pudo actualizar la contraseña del usuario." }, 500);
  }

  const { data: updatedProfile, error: forceChangeError } = await adminClient
    .from("perfiles_usuario")
    .update({ debe_cambiar_password: input.forzar_cambio })
    .eq("id", input.id_usuario)
    .select("id")
    .maybeSingle();
  if (forceChangeError || !updatedProfile) {
    console.error(
      "No se pudo guardar la marca de cambio obligatorio.",
      forceChangeError ?? "No se encontró el perfil del usuario.",
    );
    await updateAuditStatus(adminClient, audit.id, "fallido");
    return jsonResponse(
      {
        error:
          "La contraseña se actualizó, pero no se pudo guardar la opción de cambio obligatorio. No se envió el email.",
      },
      500,
    );
  }

  let emailSent = false;
  try {
    emailSent = await sendTemporaryPasswordEmail(input.email, password, input.forzar_cambio);
  } catch (error) {
    console.error("No se pudo enviar el email de restablecimiento.", error);
  }
  if (!emailSent) {
    await updateAuditStatus(adminClient, audit.id, "email_fallido");
    return jsonResponse(
      {
        error:
          "La contraseña se actualizó, pero no se pudo enviar el email. Repite el reset para generar otra.",
      },
      502,
    );
  }

  if (!(await updateAuditStatus(adminClient, audit.id, "completado"))) {
    return jsonResponse(
      {
        error:
          "La contraseña se actualizó y el email se envió, pero no se pudo cerrar el registro de auditoría.",
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
    console.error("Error inesperado en reset-password-admin.", error);
    return jsonResponse(
      { error: "Se produjo un error inesperado al restablecer la contraseña." },
      500,
    );
  }
});
