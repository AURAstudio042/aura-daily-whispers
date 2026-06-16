import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LiveWeather = {
  temp: number;
  cond: string;
  icon: string;
  main: string;
  windSpeed: number;
  city: string;
};

const ICONS: Record<string, string> = {
  Clear: "☀️",
  Clouds: "⛅",
  Rain: "🌧️",
  Drizzle: "🌦️",
  Thunderstorm: "⛈️",
  Snow: "❄️",
  Mist: "🌫️",
  Fog: "🌫️",
  Haze: "🌫️",
  Smoke: "🌫️",
  Dust: "🌫️",
  Sand: "🌫️",
  Ash: "🌫️",
  Squall: "🌬️",
  Tornado: "🌪️",
};

const InputSchema = z.object({ city: z.string().min(1).max(100) });

export const fetchWeather = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ weather: LiveWeather | null }> => {
    try {
      const key = process.env.OPENWEATHERMAP_API_KEY;
      if (!key || !data.city) return { weather: null };
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        data.city,
      )}&appid=${key}&units=metric&lang=tr`;
      const res = await fetch(url);
      if (!res.ok) return { weather: null };
      const json = (await res.json()) as {
        weather?: Array<{ main?: string; description?: string }>;
        main?: { temp?: number };
        wind?: { speed?: number };
        name?: string;
      };
      const w0 = json.weather?.[0];
      const main = w0?.main ?? "Clear";
      return {
        weather: {
          temp: Math.round(json.main?.temp ?? 0),
          cond: w0?.description ?? "açık",
          icon: ICONS[main] ?? "✦",
          main,
          windSpeed: json.wind?.speed ?? 0,
          city: json.name ?? data.city,
        },
      };
    } catch {
      return { weather: null };
    }
  });
