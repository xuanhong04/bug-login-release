"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { applyThemeColors, getThemeAppearance } from "@/lib/themes";

interface AppSettings {
  set_as_default_browser: boolean;
  theme: string;
  custom_theme?: Record<string, string>;
}

interface CustomThemeProviderProps {
  children: React.ReactNode;
}

export function CustomThemeProvider({ children }: CustomThemeProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [defaultTheme, setDefaultTheme] = useState<string>("system");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Lazy import to avoid pulling Tauri API on SSR
        const { invoke } = await import("@tauri-apps/api/core");
        const settings = await invoke<AppSettings>("get_app_settings");
        const themeValue = settings?.theme ?? "system";

        console.log("[theme-provider] Loaded settings:", {
          theme: themeValue,
          hasCustomTheme: !!settings?.custom_theme,
          customThemeKeys: settings?.custom_theme
            ? Object.keys(settings.custom_theme).length
            : 0,
        });

        if (
          themeValue === "light" ||
          themeValue === "dark" ||
          themeValue === "system"
        ) {
          setDefaultTheme(themeValue);
        } else if (themeValue === "custom") {
          if (
            settings.custom_theme &&
            Object.keys(settings.custom_theme).length > 0
          ) {
            setDefaultTheme(getThemeAppearance(settings.custom_theme));
            try {
              applyThemeColors(settings.custom_theme);
            } catch (error) {
              console.warn("Failed to apply custom theme variables:", error);
            }
          } else {
            setDefaultTheme("dark");
          }
        } else {
          setDefaultTheme("system");
        }
      } catch (error) {
        // Failed to load settings; fall back to system (handled by next-themes)
        console.warn(
          "Failed to load theme settings; defaulting to system:",
          error,
        );
        setDefaultTheme("system");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTheme();
  }, []);

  if (isLoading) {
    // Keep UI simple during initial settings load to avoid flicker
    return null;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  );
}
