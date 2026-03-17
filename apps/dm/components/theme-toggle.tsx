"use client";

import { useState, useEffect } from "react";
import { Palette } from "lucide-react";

const STORAGE_KEY = "dm-theme";
type Theme = "default" | "vivid";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "vivid") {
    root.setAttribute("data-theme", "vivid");
  } else {
    root.removeAttribute("data-theme");
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme = stored === "vivid" ? "vivid" : "default";
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "vivid" ? "default" : "vivid";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-8 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      title={theme === "vivid" ? "Switch to default theme" : "Switch to vivid theme"}
      aria-label={`Theme: ${theme}. Click to switch.`}
    >
      <Palette className="h-3.5 w-3.5" />
      <span>{theme === "vivid" ? "Vivid" : "Default"}</span>
    </button>
  );
}
