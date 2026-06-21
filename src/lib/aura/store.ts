import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  relationshipStatus?: string;
  gender?: string;
  lifeFocus?: string[];
  hasChildren?: boolean;
  hasPets?: boolean;
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

function cacheUser(u: AuraUser | null) {
  if (typeof window === "undefined") return;
  if (u) window.localStorage.setItem(KEY, JSON.stringify(u));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("aura:user-changed"));
}

function rowToUser(row: Record<string, unknown>): AuraUser {
  return {
    name: (row.name as string) ?? "Kullanıcı",
    birthDate: (row.birth_date as string) ?? "",
    birthTime: (row.birth_time as string) ?? undefined,
    city: (row.city as string) ?? "Bilinmiyor",
    style: ((row.style_type as StyleType) ?? "Klasik") as StyleType,
    undertone: (row.skin_tone as string) ?? undefined,
    hair: (row.hair_color as string) ?? undefined,
    relationshipStatus: (row.relationship_status as string) ?? undefined,
    gender: (row.gender as string) ?? undefined,
    lifeFocus: Array.isArray(row.life_focus) ? (row.life_focus as string[]) : undefined,
    hasChildren: typeof row.has_children === "boolean" ? (row.has_children as boolean) : undefined,
    hasPets: typeof row.has_pets === "boolean" ? (row.has_pets as boolean) : undefined,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

export async function saveUser(u: AuraUser) {
  cacheUser(u);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      name: u.name,
      birth_date: u.birthDate || null,
      birth_time: u.birthTime ?? null,
      city: u.city,
      zodiac_sign: zodiacFromDate(u.birthDate),
      style_type: u.style,
      skin_tone: u.undertone ?? null,
      hair_color: u.hair ?? null,
      relationship_status: u.relationshipStatus ?? null,
      gender: u.gender ?? null,
      life_focus: u.lifeFocus ?? [],
      has_children: u.hasChildren ?? null,
      has_pets: u.hasPets ?? null,
    });
    if (error) console.error("[aura] saveUser:", error);
  } catch (e) { console.error("[aura] saveUser:", e); }
}

export async function clearUser() {
  cacheUser(null);
  try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
}

export function useUser(): [AuraUser | null, (u: AuraUser | null) => void, boolean, boolean] {
  const [u, setU] = useState<AuraUser | null>(null);
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFromSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!session) {
          setAuthed(false);
          cacheUser(null);
          setU(null);
          setReady(true);
          return;
        }
        setAuthed(true);
        const { data: row } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        if (!mounted) return;
        // Soft-deleted accounts cannot use the app — sign them out immediately.
        if (row && (row as { deleted_at?: string | null }).deleted_at) {
          try { await supabase.auth.signOut(); } catch {}
          const { wipeLocalAuraData } = await import("./wipe");
          wipeLocalAuraData();
          if (typeof window !== "undefined") {
            const { toast } = await import("sonner");
            toast.error("Bu hesap silme aşamasında. Giriş yapamazsınız.");
          }
          setAuthed(false);
          setU(null);
          setReady(true);
          return;
        }
        if (row && row.birth_date) {
          const next = rowToUser(row);
          cacheUser(next);
          setU(next);
        } else {
          cacheUser(null);
          setU(null);
        }
        setReady(true);

      } catch (e) {
        console.error("[aura] loadFromSession:", e);
        if (mounted) setReady(true);
      }
    }

    loadFromSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        loadFromSession();
      }
    });
    const on = () => setU(getUser());
    window.addEventListener("aura:user-changed", on);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("aura:user-changed", on);
    };
  }, []);

  const set = useCallback((next: AuraUser | null) => {
    if (next) saveUser(next); else clearUser();
  }, []);

  return [u, set, ready, authed];
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
