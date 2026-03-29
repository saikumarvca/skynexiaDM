"use client";

import { useState, useEffect, useRef } from "react";
import { Palette } from "lucide-react";

const STORAGE_KEY = "dm-theme";

type Theme =
  | "default"
  | "vivid"
  | "ocean"
  | "rose"
  | "default-mid"
  | "vivid-mid"
  | "ocean-mid"
  | "rose-mid"
  | "dark"
  | "midnight"
  | "dracula"
  | "forest"
  | "sunset";

const LIGHT_THEMES: { value: Theme; label: string; dot: string }[] = [
  { value: "default",  label: "Default",  dot: "bg-blue-500" },
  { value: "vivid",    label: "Vivid",    dot: "bg-emerald-500" },
  { value: "ocean",    label: "Ocean",    dot: "bg-cyan-500" },
  { value: "rose",     label: "Rose",     dot: "bg-rose-500" },
];

const MID_THEMES: { value: Theme; label: string; dot: string }[] = [
  { value: "default-mid", label: "Default Mid", dot: "bg-blue-600" },
  { value: "vivid-mid",   label: "Vivid Mid",   dot: "bg-emerald-600" },
  { value: "ocean-mid",   label: "Ocean Mid",   dot: "bg-cyan-600" },
  { value: "rose-mid",    label: "Rose Mid",    dot: "bg-rose-600" },
];

const DARK_THEMES: { value: Theme; label: string; dot: string }[] = [
  { value: "dark",     label: "Dark",     dot: "bg-slate-600" },
  { value: "midnight", label: "Midnight", dot: "bg-cyan-400" },
  { value: "dracula",  label: "Dracula",  dot: "bg-purple-500" },
  { value: "forest",   label: "Forest",   dot: "bg-teal-400" },
  { value: "sunset",   label: "Sunset",   dot: "bg-orange-400" },
];

const ALL_THEMES = [...LIGHT_THEMES, ...MID_THEMES, ...DARK_THEMES];

function applyTheme(theme: Theme) {
  if (theme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("default");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const valid = new Set(ALL_THEMES.map((t) => t.value));
    const initial: Theme = stored && valid.has(stored) ? stored : "default";
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (t: Theme) => {
    setTheme(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
    setOpen(false);
  };

  if (!mounted) return null;

  const current =
    ALL_THEMES.find((t) => t.value === theme) ?? LIGHT_THEMES[0]!;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-10 min-h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors sm:h-8 sm:min-h-0"
        aria-label="Change theme"
      >
        <Palette className="h-3.5 w-3.5" />
        <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
        <span>{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-40 rounded-lg border border-border bg-background shadow-lg py-1">

          {/* Light themes */}
          <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Light
          </p>
          {LIGHT_THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => select(t.value)}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                theme === t.value ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${t.dot}`} />
              {t.label}
              {theme === t.value && <span className="ml-auto text-primary">✓</span>}
            </button>
          ))}

          <div className="my-1 border-t border-border" />

          {/* Mid themes — softened light, slightly darker surfaces */}
          <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mid
          </p>
          {MID_THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => select(t.value)}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                theme === t.value ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${t.dot}`} />
              {t.label}
              {theme === t.value && <span className="ml-auto text-primary">✓</span>}
            </button>
          ))}

          <div className="my-1 border-t border-border" />

          {/* Dark themes */}
          <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dark
          </p>
          {DARK_THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => select(t.value)}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-muted transition-colors ${
                theme === t.value ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${t.dot}`} />
              {t.label}
              {theme === t.value && <span className="ml-auto text-primary">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
