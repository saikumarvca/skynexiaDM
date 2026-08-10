"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

const DARK_THEMES = new Set([
  "dark",
  "midnight",
  "forest",
  "sunset",
  "dracula",
]);

export function AppToaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const apply = () => {
      const t = document.documentElement.getAttribute("data-theme");
      if (!t || t === "default") {
        setTheme("light");
        return;
      }
      setTheme(DARK_THEMES.has(t) ? "dark" : "light");
    };
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border-border bg-card text-card-foreground shadow-lg",
        },
      }}
    />
  );
}
