import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  LifeBuoy,
  LoaderCircle,
  Lock,
  Monitor,
  Moon,
  Palette,
  Save,
  Settings,
  Sun,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { authErrorMessage, supabase } from "@/lib/supabase";
import {
  getSystemSettings,
  saveSystemSettings,
  validateSystemSettings,
  type SystemSettings,
} from "@/lib/configuracion";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Introduce tu contraseña actual"),
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: "La nueva contraseña debe ser distinta de la actual",
    path: ["newPassword"],
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

    const { data: profile, error: profileError } = await supabase
      .from("perfiles_usuario")
      .select("rol, activo")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const allowed = puedeGestionarConfiguracion(profile, null);
    if (!allowed) throw redirect({ to: "/" });
  },
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useMyProfile();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["configuracion-sistema"],
    queryFn: getSystemSettings,
    enabled: isAdmin,
  });

  const contactEmailQuery = useQuery({
    queryKey: ["configuracion-email-contacto"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion_sistema")
        .select("valor")
        .eq("clave", "contact_email")
        .maybeSingle();
      if (error) throw error;
      return typeof data?.valor === "string" ? data.valor : "";
    },
    enabled: !isAdmin,
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

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) =>
    setSettings((current) => (current ? { ...current, [key]: value } : current));

  const handleSave = () => {
    if (!isAdmin || !settings) return;
    const validationError = validateSystemSettings(settings);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    saveMutation.mutate(settings);
  };

  const contactEmail = isAdmin ? (settings?.contact_email ?? "") : (contactEmailQuery.data ?? "");
  const contactEmailLoading = isAdmin ? settingsQuery.isPending : contactEmailQuery.isPending;
  const contactEmailError = isAdmin ? settingsQuery.isError : contactEmailQuery.isError;
  const retryContactEmail = isAdmin ? settingsQuery.refetch : contactEmailQuery.refetch;

  return (
    <section
      className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8"
      aria-labelledby="settings-heading"
    >
      <header>
        <h1 id="settings-heading" className="text-2xl font-bold tracking-tight">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preferencias de tu cuenta y ayuda para usar Inventario LM.
        </p>
      </header>

      <CuentaTab />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" aria-hidden="true" />
            Apariencia
          </CardTitle>
          <CardDescription>
            El tema se guarda en este navegador, de forma independiente para cada usuario y
            dispositivo.
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
        </CardContent>
      </Card>

      <AyudaSoporteTab
        contactEmail={contactEmail}
        isLoadingContactEmail={contactEmailLoading}
        hasContactEmailError={contactEmailError}
        onRetryContactEmail={() => void retryContactEmail()}
      />

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" aria-hidden="true" />
              Administración
            </CardTitle>
            <CardDescription>
              Ajustes del despacho y el correo de contacto para reportes.
            </CardDescription>
          </CardHeader>
          {settingsQuery.isPending ? (
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Cargando ajustes administrativos…
              </div>
            </CardContent>
          ) : settingsQuery.isError ? (
            <CardContent>
              <div className="space-y-3" role="alert">
                <p className="text-sm text-destructive">
                  No se pudo cargar la configuración administrativa: {settingsQuery.error.message}
                </p>
                <Button variant="outline" onClick={() => void settingsQuery.refetch()}>
                  Reintentar
                </Button>
              </div>
            </CardContent>
          ) : settings ? (
            <CardContent className="space-y-6">
              <Field label="Email de contacto" htmlFor="contact-email">
                <Input
                  id="contact-email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(event) => update("contact_email", event.target.value)}
                />
              </Field>
              <SettingSwitch
                id="block-dispatch-at-zero"
                title="Bloquear despacho con stock cero"
                description="Impide el despacho de productos sin existencias."
                checked={settings.block_dispatch_at_zero}
                onCheckedChange={(checked) => update("block_dispatch_at_zero", checked)}
              />
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {saveMutation.isPending ? "Guardando…" : "Guardar administración"}
              </Button>
            </CardContent>
          ) : null}
        </Card>
      )}
    </section>
  );
}

function AyudaSoporteTab({
  contactEmail,
  isLoadingContactEmail,
  hasContactEmailError,
  onRetryContactEmail,
}: {
  contactEmail: string;
  isLoadingContactEmail: boolean;
  hasContactEmailError: boolean;
  onRetryContactEmail: () => void;
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

    const destinatario = contactEmail.trim();
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
          Soporte
        </CardTitle>
        <CardDescription>
          Contacta con el administrador o deja constancia de una incidencia para su seguimiento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section aria-labelledby="admin-contact-heading" className="space-y-3">
          <h3 id="admin-contact-heading" className="text-base font-semibold">
            Contacto del Administrador
          </h3>
          <p className="text-sm text-muted-foreground">
            Para problemas técnicos, permisos o dudas sobre el inventario, contacta directamente con
            el administrador del sistema.
          </p>
          {hasContactEmailError ? (
            <div className="space-y-2" role="alert">
              <p className="text-sm text-destructive">
                No se pudo cargar el email de contacto. No es posible enviar el reporte ahora.
              </p>
              <Button variant="outline" size="sm" onClick={onRetryContactEmail}>
                Reintentar
              </Button>
            </div>
          ) : isLoadingContactEmail ? (
            <p className="text-sm text-muted-foreground" role="status">
              Cargando contacto del administrador…
            </p>
          ) : contactEmail ? (
            <a
              className="inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`mailto:${contactEmail}?subject=Consulta%20sobre%20Inventario%20LM`}
            >
              Soporte Técnico — {contactEmail}
            </a>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              No hay email de contacto configurado. Contacta con un administrador.
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
                  {contactEmail
                    ? `El reporte se enviará por email al administrador (${contactEmail}).`
                    : "No hay email de administrador configurado."}
                </p>
                <p id="support-report-count" aria-live="polite">
                  {report.length}/2000
                </p>
              </div>
            </div>
            <Button
              type="submit"
              disabled={
                reportMutation.isPending ||
                isLoadingContactEmail ||
                hasContactEmailError ||
                !contactEmail
              }
            >
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

  const onSubmit = async ({ currentPassword, newPassword }: PasswordFormValues) => {
    if (!user?.email) {
      toast.error("No se pudo comprobar el email de la cuenta.");
      return;
    }

    try {
      const { error: currentPasswordError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (currentPasswordError) {
        toast.error(authErrorMessage(currentPasswordError));
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error("Error actualizando contraseña:", error);
        toast.error(authErrorMessage(error));
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
    const message =
      formErrors.currentPassword?.message ??
      formErrors.newPassword?.message ??
      formErrors.confirmPassword?.message;
    if (message) toast.error(message);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" aria-hidden="true" />
          Mi Cuenta
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
            Confirma tu contraseña actual antes de guardar una nueva.
          </p>
          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña actual</Label>
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
          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100"
          : ""
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {selected && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
