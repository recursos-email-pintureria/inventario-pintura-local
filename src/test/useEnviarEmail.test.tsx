import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEnviarEmail } from "@/hooks/useEnviarEmail";

const { getSession, onAuthStateChange, invoke, toastError } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  invoke: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getSession, onAuthStateChange },
    functions: { invoke },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: toastError },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useEnviarEmail", () => {
  beforeEach(() => {
    getSession.mockReset().mockResolvedValue({
      data: { session: { access_token: "valid-session-token" } },
    });
    onAuthStateChange.mockReset();
    invoke.mockReset().mockResolvedValue({ data: { id: "email-1" }, error: null });
    toastError.mockReset();
  });

  it("aborta el email pendiente cuando la sesión termina", async () => {
    let authCallback: ((event: string, session: null) => void) | undefined;
    let requestOptions: { signal?: AbortSignal } | undefined;
    onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    invoke.mockImplementation((_functionName, options) => {
      requestOptions = options;
      return new Promise((_resolve, reject) => {
        options.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
    });

    const { result } = renderHook(() => useEnviarEmail(), { wrapper: createWrapper() });
    let pendingRequest: Promise<unknown>;
    act(() => {
      pendingRequest = result.current.mutateAsync({
        destinatario: "admin@example.com",
        asunto: "Prueba",
        cuerpo: "Mensaje",
      });
    });

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    act(() => authCallback?.("SIGNED_OUT", null));

    expect(requestOptions?.signal?.aborted).toBe(true);
    await expect(pendingRequest!).rejects.toMatchObject({ name: "AbortError" });
    expect(toastError).not.toHaveBeenCalled();
  });
});
