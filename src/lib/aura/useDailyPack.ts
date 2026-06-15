import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateDailyPack, type DailyPack } from "@/lib/aura/generate.functions";
import type { AuraUser } from "@/lib/aura/store";
import { zodiacOf } from "@/lib/aura/store";
import { dailyWeather } from "@/lib/aura/data";

type CacheEntry = { date: string; sig: string; pack: DailyPack };
const CACHE_KEY = "aura:daily-pack:v1";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function signature(u: AuraUser) {
  return [u.name, u.birthDate, u.city, u.style, u.mood ?? "", u.undertone ?? ""].join("|");
}

function loadCache(): CacheEntry | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheEntry) : null;
  } catch {
    return null;
  }
}

function saveCache(entry: CacheEntry) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota */
  }
}

export type DailyPackState =
  | { status: "idle" }
  | { status: "loading"; cached?: DailyPack }
  | { status: "ready"; pack: DailyPack; cachedAt: string }
  | { status: "error"; error: string; cached?: DailyPack };

export function useDailyPack(u: AuraUser | null) {
  const generate = useServerFn(generateDailyPack);
  const [state, setState] = useState<DailyPackState>({ status: "idle" });

  useEffect(() => {
    if (!u) return;
    const sig = signature(u);
    const day = todayKey();
    const cached = loadCache();

    if (cached && cached.date === day && cached.sig === sig) {
      setState({ status: "ready", pack: cached.pack, cachedAt: cached.date });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", cached: cached?.pack });

    const weather = dailyWeather(u.city);
    generate({
      data: {
        name: u.name,
        zodiac: zodiacOf(u),
        mood: u.mood,
        style: u.style,
        city: u.city,
        undertone: u.undertone,
        weather: { cond: weather.cond, temp: weather.temp },
      },
    })
      .then((pack) => {
        if (cancelled) return;
        saveCache({ date: day, sig, pack });
        setState({ status: "ready", pack, cachedAt: day });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
        setState({ status: "error", error: msg, cached: cached?.pack });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u && signature(u)]);

  return state;
}

export function clearDailyPackCache() {
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* noop */
  }
}
