import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePrint } from "@/lib/print";

describe("usePrint", () => {
  const print = vi.fn();

  beforeEach(() => {
    print.mockReset();
    Object.defineProperty(window, "print", { writable: true, value: print });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });
    document.body.classList.remove("printing");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.classList.remove("printing");
  });

  it("activa printing, imprime y limpia al recibir afterprint", () => {
    const { result } = renderHook(() => usePrint());

    act(() => result.current());

    expect(document.body.classList.contains("printing")).toBe(true);
    expect(print).toHaveBeenCalledTimes(1);

    act(() => window.dispatchEvent(new Event("afterprint")));
    expect(document.body.classList.contains("printing")).toBe(false);
  });
});
