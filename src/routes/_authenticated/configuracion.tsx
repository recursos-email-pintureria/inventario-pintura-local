import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  LifeBuoy,
  LoaderCircle,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  Settings,
  Sun,
  User,
  Mail,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "@/components/theme/theme-context";
import { useAuth } from "@/contexts/AuthContext";
import { useEnviarEmail } from "@/hooks/useEnviarEmail";
import { puedeGestionarConfiguracion, useMyProfile } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_SYSTEM_SETTINGS,
  getSystemSettings,
  saveSystemSettings,
  validateSystemSettings,
  type SystemSettings,
} from "@/lib/configuracion";

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const Route = createFileRoute("/_authenticated/configuracion")({
  beforeLoad: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw redirect({ to: "/login" });

    const [{ data: profile, error: profileError }, { data: permissions, error: permissionsError }] =
      await Promise.all([
        supabase
          .from("perfiles_usuario")
          .select("rol, activo")
          .eq("id", userData.user.id)
          .maybeSingle(),
        supabase
          .from("permisos_usuario")
          .select("puede_gestionar_usuarios")
          .eq("id_usuario", userData.user.id)
          .maybeSingle(),
      ]);
    if (profileError) throw profileError;
    if (permissionsError) throw permissionsError;

    const allowed = puedeGestionarConfiguracion(profile, permissions);
    if (!allowed) throw redirect({ to: "/" });
  },
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["configuracion-sistema"],
    queryFn: getSystemSettings,
  });

  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveSystemSettings,
    onSuccess: async (saved) => {
      setSettings(saved);
      await queryClient.invalidateQueries({ queryKey: ["configuracion-sistema"] });
      toast.success("La configuración se guardó correctamente.");
    },
    onError: (error) => {
      console.error("Error guardando configuración del sistema:", error);
      toast.error(
        error instanceof Error
          ? `No se pudo guardar la configuración: ${error.message}`
          : "No se pudo guardar la configuración. Verifica tus permisos e inténtalo de nuevo.",
      );
    },
  });

  const testEmailMutation = useEnviarEmail();

  if (settingsQuery.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Cargando configuración</span>
      </div>
    );
  }
  if (settingsQuery.isError) {
    return (
      <Card className="mx-auto mt-8 max-w-2xl border-rose-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="h-5 w-5" /> No se pudo cargar la configuración
          </CardTitle>
          <CardDescription>
            Comprueba que se haya aplicado la migración de configuración y que tu cuenta tenga
            permisos de administración.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{settingsQuery.error.message}</p>
          <Button className="mt-4" variant="outline" onClick={() => void settingsQuery.refetch()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (!settings) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Preparando configuración</span>
      </div>
    );
  }

  const savedSettings = settings;
  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) =>
    setSettings({ ...settings, [key]: value });

  const handleSave = () => {
    const validationError = validateSystemSettings(settings);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate(settings);
  };

  const handleRestore = () => {
    setSettings(DEFAULT_SYSTEM_SETTINGS);
    saveMutation.mutate(DEFAULT_SYSTEM_SETTINGS);
  };

  return (
    <section
      className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8"
      aria-labelledby="settings-heading"
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-600" aria-hidden="true" />
            <h1 id="settings-heading" className="text-2xl font-bold tracking-tight">
              Configuración del sistema
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Preferencias generales y reglas operativas de Inventario LM.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRestore} disabled={saveMutation.isPending}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restaurar valores por defecto
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </div>
      </header>

      <div
        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <Badge variant="outline" className="gap-1">
          <Check className="h-3 w-3" /> Persistencia en Supabase
        </Badge>
        {savedSettings.updated_at ? (
          <span>
            Último guardado:{" "}
            <time dateTime={savedSettings.updated_at}>
              {new Intl.DateTimeFormat("es-ES", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(savedSettings.updated_at))}
            </time>
          </span>
        ) : (
          <span>Configuración inicial; guarda los cambios para persistirlos.</span>
        )}
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="stock">Almacén y stock</TabsTrigger>
          <TabsTrigger value="dispositivos">Terminales</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          <TabsTrigger value="cuenta" className="gap-1.5">
            <User className="h-4 w-4" aria-hidden="true" />
            Cuenta
          </TabsTrigger>
          <TabsTrigger value="ayuda" className="gap-1.5">
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Ayuda y Soporte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración general</CardTitle>
              <CardDescription>Datos de contacto y formato regional de la tienda.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <Field label="Nombre comercial" htmlFor="store-name">
                <Input
                  id="store-name"
                  value={settings.store_name}
                  onChange={(e) => update("store_name", e.target.value)}
                />
              </Field>
              <Field label="Dirección física" htmlFor="store-address">
                <Input
                  id="store-address"
                  value={settings.store_address}
                  onChange={(e) => update("store_address", e.target.value)}
                />
              </Field>
              <Field label="Email de contacto/reportes" htmlFor="store-email">
                <Input
                  id="store-email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => update("contact_email", e.target.value)}
                />
              </Field>
              <Field label="Zona horaria" htmlFor="timezone">
                <Select
                  value={settings.time_zone}
                  onValueChange={(value) => update("time_zone", value)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Madrid">Europa/Madrid</SelectItem>
                    <SelectItem value="Atlantic/Canary">Atlántico/Canarias</SelectItem>
                    <SelectItem value="America/Mexico_City">América/Ciudad de México</SelectItem>
                    <SelectItem value="America/Bogota">América/Bogotá</SelectItem>
                    <SelectItem value="America/Buenos_Aires">América/Buenos Aires</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Moneda predeterminada" htmlFor="currency">
                <Select
                  value={settings.currency}
                  onValueChange={(value) => update("currency", value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR — Euro</SelectItem>
                    <SelectItem value="USD">USD — Dólar estadounidense</SelectItem>
                    <SelectItem value="MXN">MXN — Peso mexicano</SelectItem>
                    <SelectItem value="COP">COP — Peso colombiano</SelectItem>
                    <SelectItem value="ARS">ARS — Peso argentino</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de almacén y stock</CardTitle>
              <CardDescription>
                Estas opciones documentan reglas operativas; las mutaciones de stock siguen
                realizándose exclusivamente mediante movimientos y sus triggers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingSwitch
                id="critical-alert"
                title="Alerta de stock crítico"
                description="Activar avisos cuando el stock esté por debajo del umbral definido."
                checked={settings.critical_stock_alert}
                onCheckedChange={(checked) => update("critical_stock_alert", checked)}
              />
              <Field label="Umbral de alerta (%)" htmlFor="critical-threshold">
                <Input
                  id="critical-threshold"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.critical_stock_threshold}
                  onChange={(e) => update("critical_stock_threshold", Number(e.target.value))}
                  className="max-w-40"
                />
              </Field>
              <SettingSwitch
                id="block-zero"
                title="Bloquear despacho con stock cero"
                description="Preferencia administrativa. La aplicación debe aplicar esta regla en el flujo de despacho."
                checked={settings.block_dispatch_at_zero}
                onCheckedChange={(checked) => update("block_dispatch_at_zero", checked)}
              />
              <SettingSwitch
                id="negative-stock"
                title="Permitir stock negativo"
                description="No cambia los permisos RLS ni evita las validaciones del trigger de movimientos."
                checked={settings.allow_negative_stock}
                onCheckedChange={(checked) => update("allow_negative_stock", checked)}
              />
              <Field label="Stock mínimo por defecto" htmlFor="default-min-stock">
                <Input
                  id="default-min-stock"
                  type="number"
                  min={0}
                  step={1}
                  value={settings.default_minimum_stock}
                  onChange={(e) => update("default_minimum_stock", Number(e.target.value))}
                  className="max-w-40"
                />
              </Field>
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                El stock real se consulta desde la tabla calculada <code>stock</code>. Esta pantalla
                no escribe en ella.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispositivos">
          <Card>
            <CardHeader>
              <CardTitle>Terminales y dispositivos</CardTitle>
              <CardDescription>
                Ajustes del lector de códigos. La aplicación todavía no dispone de un servicio de
                presencia/heartbeat para inventariar terminales remotos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingSwitch
                id="scanner-enabled"
                title="Habilitar lectura de códigos"
                description="Permite a las pantallas compatibles iniciar el flujo de escaneo."
                checked={settings.scanner_enabled}
                onCheckedChange={(checked) => update("scanner_enabled", checked)}
              />
              <Field label="Formatos admitidos" htmlFor="scanner-formats">
                <Select
                  value={settings.scanner_format}
                  onValueChange={(value) => update("scanner_format", value)}
                >
                  <SelectTrigger id="scanner-formats">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CODE_128">Code 128</SelectItem>
                    <SelectItem value="EAN_13">EAN-13</SelectItem>
                    <SelectItem value="QR_CODE">QR Code</SelectItem>
                    <SelectItem value="ALL">Todos los formatos compatibles</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Monitor className="mt-0.5 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium">Este navegador</p>
                  <p className="text-sm text-muted-foreground">
                    Terminal actual. No se muestran otros dispositivos porque no existe registro
                    central de sesiones de terminal.
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  Activo
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apariencia">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia y tema</CardTitle>
              <CardDescription>
                El tema se aplica globalmente y se guarda en este navegador, de forma independiente
                para cada usuario/dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <fieldset>
                <legend className="mb-3 text-sm font-medium">Tema de la aplicación</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ThemeChoice
                    value="light"
                    current={theme}
                    onSelect={setTheme}
                    label="Claro"
                    icon={<Sun className="h-5 w-5" />}
                  />
                  <ThemeChoice
                    value="dark"
                    current={theme}
                    onSelect={setTheme}
                    label="Oscuro"
                    icon={<Moon className="h-5 w-5" />}
                  />
                  <ThemeChoice
                    value="system"
                    current={theme}
                    onSelect={setTheme}
                    label="Sistema"
                    icon={<Monitor className="h-5 w-5" />}
                  />
                </div>
              </fieldset>
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                El tema se guarda automáticamente en este dispositivo; no requiere guardar los
                ajustes del sistema.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuenta">
          <CuentaTab />
        </TabsContent>

        <TabsContent value="ayuda">
          <AyudaSoporteTab testEmailMutation={testEmailMutation} settings={savedSettings} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function AyudaSoporteTab({
  testEmailMutation,
  settings,
}: {
  testEmailMutation: ReturnType<typeof useEnviarEmail>;
  settings: SystemSettings;
}) {
  const { user } = useAuth();
  const { perfil } = useMyProfile();
  const [report, setReport] = useState("");
  const reportMutation = useEnviarEmail();

  const handleSubmitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const descripcion = report.trim();
    if (!descripcion) {
      toast.error("Describe brevemente la incidencia antes de enviarla.");
      return;
    }

    const destinatario = settings.contact_email.trim();
    if (!destinatario) {
      toast.error("No hay email de administrador configurado.");
      return;
    }

    const fecha = new Date();
    const fechaTexto = fecha.toLocaleString("es-ES");
    const asuntoFecha = fecha.toLocaleDateString("es-ES");
    const cuerpo = [
      `Incidencia reportada por: ${user?.email ?? user?.id ?? "Usuario no disponible"}`,
      `Nombre: ${perfil?.nombre_completo || "No disponible"}`,
      `Fecha: ${fechaTexto}`,
      "",
      "Descripción:",
      descripcion,
    ].join("\n");

    reportMutation.mutate(
      {
        destinatario,
        asunto: `Incidencia reportada - ${asuntoFecha}`,
        cuerpo,
        tipo: "incidencia",
      },
      {
        onSuccess: () => {
          toast.success("Incidencia enviada al administrador.");
          setReport("");
        },
        onError: (error) => toast.error(`No se pudo enviar la incidencia: ${error.message}`),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5" aria-hidden="true" />
          Ayuda y Soporte
        </CardTitle>
        <CardDescription>
          Contacta con el administrador o deja constancia de una incidencia para su seguimiento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* --- NUEVO: Sección de prueba de email --- */}
        <section
          aria-labelledby="test-email-heading"
          className="space-y-3 rounded-lg border border-dashed p-4 bg-muted/30"
        >
          <h3 id="test-email-heading" className="text-base font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Prueba del sistema de notificaciones por email
          </h3>
          <p className="text-sm text-muted-foreground">
            Se enviará un email de prueba a tu cuenta registrada (
            {user?.email || "email no disponible"}).
          </p>
          <Button
            variant="outline"
            onClick={() =>
              testEmailMutation.mutate(
                {
                  destinatario: user?.email ?? "",
                  asunto: "Prueba de email desde Inventario LM",
                  cuerpo:
                    "¡Hola! Si estás leyendo esto, la Edge Function está funcionando correctamente con autenticación de sesión segura.",
                },
                {
                  onSuccess: () =>
                    toast.success(
                      "Email de prueba enviado. Revisa tu bandeja de entrada (y Spam).",
                    ),
                  onError: (error) => toast.error(`Error al enviar: ${error.message}`),
                },
              )
            }
            disabled={testEmailMutation.isPending || !user?.email}
          >
            {testEmailMutation.isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {testEmailMutation.isPending ? "Enviando..." : "Enviar email de prueba"}
          </Button>
        </section>
        {/* ------------------------------------------- */}

        <section aria-labelledby="admin-contact-heading" className="space-y-3">
          <h3 id="admin-contact-heading" className="text-base font-semibold">
            Contacto del Administrador
          </h3>
          <p className="text-sm text-muted-foreground">
            Para problemas técnicos, permisos o dudas sobre el inventario, contacta directamente con
            el administrador del sistema.
          </p>
          {settings.contact_email ? (
            <a
              className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`mailto:${settings.contact_email}?subject=Consulta%20sobre%20Inventario%20LM`}
            >
              Soporte Técnico — {settings.contact_email}
            </a>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No configurado. Configura el email de contacto en la pestaña General.
            </p>
          )}
        </section>

        <section aria-labelledby="report-issue-heading" className="space-y-3 border-t pt-6">
          <h3 id="report-issue-heading" className="text-base font-semibold">
            Reportar una incidencia rápida
          </h3>
          <form onSubmit={handleSubmitReport} className="max-w-2xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-report">Descripción de la incidencia</Label>
              <Textarea
                id="support-report"
                value={report}
                onChange={(event) => setReport(event.target.value)}
                placeholder="Describe brevemente el problema o la pantalla donde ocurrió..."
                rows={5}
                maxLength={2000}
                aria-describedby="support-report-note support-report-count"
              />
              <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <p id="support-report-note">
                  {settings.contact_email
                    ? `El reporte se enviará por email al administrador (${settings.contact_email}).`
                    : "No hay email de administrador configurado."}
                </p>
                <p id="support-report-count" aria-live="polite">
                  {report.length}/2000
                </p>
              </div>
            </div>
            <Button type="submit" disabled={reportMutation.isPending || !settings.contact_email}>
              {reportMutation.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LifeBuoy className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {reportMutation.isPending ? "Enviando..." : "Enviar reporte al administrador"}
            </Button>
          </form>
        </section>
      </CardContent>
    </Card>
  );
}

function CuentaTab() {
  const { user } = useAuth();
  const { perfil, isPending: profilePending } = useMyProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async ({ newPassword }: PasswordFormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error("Error actualizando contraseña:", error);
        toast.error(error.message || "No se pudo actualizar la contraseña.");
        return;
      }

      toast.success("Contraseña actualizada correctamente");
      reset();
    } catch (error) {
      console.error("Error inesperado actualizando contraseña:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la contraseña.");
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    const message = formErrors.newPassword?.message ?? formErrors.confirmPassword?.message;
    if (message) toast.error(message);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" aria-hidden="true" />
          Cuenta
        </CardTitle>
        <CardDescription>Consulta tus datos y actualiza la contraseña de acceso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Email</p>
            <p className="break-all text-sm text-muted-foreground" aria-live="polite">
              {user?.email || "No disponible"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Nombre</p>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {profilePending ? "Cargando…" : perfil?.nombre_completo || "No disponible"}
            </p>
          </div>
        </div>

        <form
          className="max-w-xl space-y-5"
          noValidate
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          aria-labelledby="change-password-heading"
        >
          <h3 id="change-password-heading" className="text-base font-semibold">
            Cambiar contraseña
          </h3>
          <p className="text-sm text-muted-foreground">
            La contraseña actual es opcional; Supabase autoriza el cambio mediante tu sesión.
          </p>
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña actual (opcional)</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={errors.currentPassword ? "current-password-error" : undefined}
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p id="current-password-error" className="text-sm text-destructive" role="alert">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={errors.newPassword ? "new-password-error" : undefined}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p id="new-password-error" className="text-sm text-destructive" role="alert">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Actualizando…" : "Cambiar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function SettingSwitch({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor={id}>{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ThemeChoice({
  value,
  current,
  onSelect,
  label,
  icon,
}: {
  value: "light" | "dark" | "system";
  current: "light" | "dark" | "system";
  onSelect: (theme: "light" | "dark" | "system") => void;
  label: string;
  icon: ReactNode;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={`flex min-h-20 items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
        selected
          ? "border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100"
          : ""
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {selected && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
