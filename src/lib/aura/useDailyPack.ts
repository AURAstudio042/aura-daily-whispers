import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateDailyPack, type DailyPack } from "./generate.functions";
import type { AuraUser } from "./store";
import { zodiacOf } from "./store";

function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function cacheKey(u: AuraUser): string {
  const sig = `${u.name}|${u.birthDate}|${u.city}|${u.style}|${u.mood ?? ""}`;
  return `aura:pack:${todayStamp()}:${sig}`;
}

export function useDailyPack(
  user: AuraUser | null,
  weather: { temp: number; cond: string },
): { pack: DailyPack | null; loading: boolean } {
  const [pack, setPack] = useState<DailyPack | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchPack = useServerFn(generateDailyPack);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    const key = cacheKey(user);
    try {
      const cached = window.localStorage.getItem(key);
      if (cached) {
        setPack(JSON.parse(cached) as DailyPack);
        return;
      }
    } catch {}

    let cancelled = false;
    setLoading(true);
    fetchPack({
      data: {
        name: user.name,
        zodiac: zodiacOf(user),
        mood: user.mood,
        style: user.style,
        city: user.city,
        weather,
      },
    })
      .then((res) => {
        if (cancelled) return;
        if (res?.pack) {
          setPack(res.pack);
          try {
            window.localStorage.setItem(key, JSON.stringify(res.pack));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.name, user?.birthDate, user?.city, user?.style, user?.mood, weather.temp, weather.cond]);

  return { pack, loading };
}
