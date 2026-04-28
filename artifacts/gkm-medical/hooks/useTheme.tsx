import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { getTheme, setTheme as persistTheme, Theme } from "@/lib/preferences";

type ThemeContextValue = {
  theme: Theme;
  scheme: "light" | "dark";
  setTheme: (t: Theme) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  scheme: "light",
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [theme, setThemeState] = useState<Theme>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getTheme().then((t) => {
      setThemeState(t);
      setHydrated(true);
    });
  }, []);

  const setTheme = useCallback(async (t: Theme) => {
    setThemeState(t);
    await persistTheme(t);
  }, []);

  const scheme: "light" | "dark" =
    theme === "system" ? (systemScheme === "dark" ? "dark" : "light") : theme;

  const value = useMemo(() => ({ theme, scheme, setTheme }), [theme, scheme, setTheme]);

  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
