import { useEffect, useState, useCallback } from "react";
import { zodiacFromDate, type Mood, type StyleType, type ZodiacKey } from "./data";

export type AuraUser = {
  name: string;
  birthDate: string;     // ISO yyyy-mm-dd
  birthTime?: string;    // HH:mm
  city: string;
  style: StyleType;
  mood?: Mood;
  undertone?: string;
  hair?: string;
  createdAt: string;
};

const KEY = "aura:user:v1";
const FAV_KEY = "aura:favs:v1";

export function getUser(): AuraUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuraUser) : null;
  } catch { return null; }
}
export function saveUser(u: AuraUser) {
  window.localStorage.setItem(KEY, JSON.stringify(u));
  window.dispatchEvent(new Event("aura:user-changed"));
}
export function clearUser() {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("aura:user-changed"));
}

export function useUser(): [AuraUser | null, (u: AuraUser | null) => void, boolean] {
  const [u, setU] = useState<AuraUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setU(getUser());
    setReady(true);
    const on = () => setU(getUser());
    window.addEventListener("aura:user-changed", on);
    return () => window.removeEventListener("aura:user-changed", on);
  }, []);
  const set = useCallback((next: AuraUser | null) => {
    if (next) saveUser(next); else clearUser();
  }, []);
  return [u, set, ready];
}

export function zodiacOf(u: AuraUser | null): ZodiacKey {
  return zodiacFromDate(u?.birthDate);
}

export function userName(u: AuraUser | null): string {
  return u?.name?.trim() || "Kullanıcı";
}
export function userCity(u: AuraUser | null): string {
  return u?.city?.trim() || "Bilinmiyor";
}

// Favorites
export type Favorite = { id: string; text: string; author?: string; date: string };
export function getFavs(): Favorite[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
}
export function toggleFav(f: Favorite) {
  const all = getFavs();
  const exists = all.find((x) => x.id === f.id);
  const next = exists ? all.filter((x) => x.id !== f.id) : [f, ...all];
  window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("aura:favs-changed"));
}
export function useFavs() {
  const [favs, setFavs] = useState<Favorite[]>([]);
  useEffect(() => {
    setFavs(getFavs());
    const on = () => setFavs(getFavs());
    window.addEventListener("aura:favs-changed", on);
    return () => window.removeEventListener("aura:favs-changed", on);
  }, []);
  return favs;
}
