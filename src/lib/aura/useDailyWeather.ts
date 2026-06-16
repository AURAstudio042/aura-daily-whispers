import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchWeather, type LiveWeather } from "./weather.functions";

function todayStamp(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function cacheKey(city: string): string {
  const safe = city.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `aura_weather_${safe}_${todayStamp()}`;
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

  useEffect(() => {
    if (!city || typeof window === "undefined") return;
    const key = cacheKey(city);
    try {
      const cached = window.localStorage.getItem(key);
      if (cached) {
        setWeather(JSON.parse(cached) as LiveWeather);
        return;
      }
    } catch {}

    let cancelled = false;
    fetcher({ data: { city } })
      .then((res) => {
        if (cancelled || !res?.weather) return;
        setWeather(res.weather);
        try {
          window.localStorage.setItem(key, JSON.stringify(res.weather));
        } catch {}
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [city]);

  return weather;
}
