import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type ThemePreference } from "@/components/theme/theme-context";

const STORAGE_KEY = "inventario-lm-theme";

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(getStoredTheme);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      root.classList.toggle("dark", theme === "dark" || (theme === "system" && mediaQuery.matches));
      root.style.colorScheme = theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;
    };

    applyTheme();
    if (theme !== "system") return;
    mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
