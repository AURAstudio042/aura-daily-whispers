import { useCallback, useEffect, useState } from "react";

export const THEMES = [
  { id: "default", label: "Dark Luxury", className: "" },
  { id: "editorial", label: "Editöryal", className: "theme-editorial" },
  { id: "gold", label: "Altın", className: "theme-gold" },
  { id: "midnight", label: "Gece Mavisi", className: "theme-midnight" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const KEY = "aura:theme:v1";
const CLASSES = ["theme-editorial", "theme-gold", "theme-midnight"];

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  CLASSES.forEach((c) => root.classList.remove(c));
  const t = THEMES.find((t) => t.id === id);
  if (t && t.className) root.classList.add(t.className);
  try { window.localStorage.setItem(KEY, id); } catch { /* noop */ }
  window.dispatchEvent(new Event("aura:theme-changed"));
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "default";
  try {
    const v = window.localStorage.getItem(KEY) as ThemeId | null;
    if (v && THEMES.some((t) => t.id === v)) return v;
  } catch { /* noop */ }
  return "default";
}

export function useTheme(): [ThemeId, (id: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>("default");
  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    applyTheme(t);
    const on = () => setTheme(getStoredTheme());
    window.addEventListener("aura:theme-changed", on);
    return () => window.removeEventListener("aura:theme-changed", on);
  }, []);
  const set = useCallback((id: ThemeId) => { applyTheme(id); setTheme(id); }, []);
  return [theme, set];
}
