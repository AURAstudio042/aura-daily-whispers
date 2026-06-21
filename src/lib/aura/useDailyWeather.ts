import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchWeather, type LiveWeather } from "./weather.functions";
import { logWeather } from "./debug-observer";

// Refresh weather every 10 minutes, and treat any cached value older than
// that as stale. The previous implementation cached per-day in localStorage,
// which made the temperature freeze at whatever value first loaded (e.g. 16°C
// stuck all day). We now keep a short TTL cache and revalidate on interval.
const WEATHER_TTL_MS = 10 * 60 * 1000;

function cacheKey(city: string): string {
  const safe = city.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `aura_weather_${safe}`;
}

type CachedWeather = { fetchedAt: number; weather: LiveWeather };

function readCache(city: string): CachedWeather | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(city));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWeather | LiveWeather;
    // Backwards-compat: old shape was the raw LiveWeather object.
    if (parsed && typeof parsed === "object" && "fetchedAt" in parsed) {
      return parsed as CachedWeather;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(city: string, weather: LiveWeather) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedWeather = { fetchedAt: Date.now(), weather };
    window.localStorage.setItem(cacheKey(city), JSON.stringify(payload));
  } catch {}
}

export function weatherNote(w: LiveWeather): string {
  const rainy = ["Rain", "Drizzle", "Thunderstorm"].includes(w.main);
  if (rainy) return "Şemsiyeni ve su geçirmez ayakkabını unutma. 🌧️";
  if (w.temp <= 10) return "Katmanlı giyinmek bugün iyi fikir. 🧥";
  if (w.temp >= 25) return "Hafif ve nefes alan kumaşlar tercih et. ☀️";
  if (w.windSpeed >= 6 || w.main === "Squall") return "Saçını topla, ince bir fular işine yarar. 💨";
  return "Bugün için hafif bir katman yeterli olabilir. ✦";
}

export function useDailyWeather(city: string | undefined): LiveWeather | null {
  const [weather, setWeather] = useState<LiveWeather | null>(null);
  const fetcher = useServerFn(fetchWeather);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!city || typeof window === "undefined") return;

    let cancelled = false;

    // Seed instantly from cache (even if stale) so the UI isn't blank, but
    // ALWAYS revalidate against the API afterwards.
    const cached = readCache(city);
    if (cached) {
      setWeather(cached.weather);
      const ts = new Date().toISOString();
      logWeather({
        location: city,
        requestedAt: ts,
        respondedAt: ts,
        cacheHit: true,
        raw: cached.weather,
      });
    }

    async function refresh(reason: "mount" | "interval" | "focus") {
      if (cancelled) return;
      const requestedAt = new Date().toISOString();
      console.info("[weather] refresh", { city, reason, requestedAt });
      try {
        const res = await fetcherRef.current({ data: { city: city! } });
        if (cancelled || !res?.weather) return;
        setWeather(res.weather);
        writeCache(city!, res.weather);
        const respondedAt = new Date().toISOString();
        console.info("[weather] response", {
          city,
          reason,
          respondedAt,
          temp: res.weather.temp,
          main: res.weather.main,
        });
        logWeather({
          location: city!,
          requestedAt,
          respondedAt,
          cacheHit: false,
          raw: res.weather,
        });
      } catch (e) {
        console.warn("[weather] refresh failed", { city, reason, error: e });
      }
    }

    // Skip the network refresh on mount if the cached value is still fresh.
    const isFresh = cached && Date.now() - cached.fetchedAt < WEATHER_TTL_MS;
    if (!isFresh) {
      void refresh("mount");
    }

    const interval = window.setInterval(() => void refresh("interval"), WEATHER_TTL_MS);
    const onFocus = () => {
      const c = readCache(city);
      if (!c || Date.now() - c.fetchedAt >= WEATHER_TTL_MS) {
        void refresh("focus");
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [city]);

  return weather;
}
