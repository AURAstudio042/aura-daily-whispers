import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  name: z.string(),
  zodiac: z.string(),
  mood: z.string().optional(),
  style: z.string().optional(),
  city: z.string(),
  weather: z.object({
    temp: z.number(),
    cond: z.string(),
  }),
});

const DailyPackSchema = z.object({
  greeting: z.string().min(1),
  horoscope: z.string().min(1),
  colors: z
    .array(z.object({ name: z.string().min(1), hex: z.string().regex(/^#([0-9a-fA-F]{6})$/) }))
    .min(3)
    .max(5),
  outfit: z.object({
    top: z.string().min(1),
    bottom: z.string().min(1),
    shoe: z.string().min(1),
    access: z.string().min(1),
    lip: z.string().min(1),
    jewelry: z.string().min(1),
    harmony: z.string().min(1),
    inspiration: z.string().min(1),
  }),
  stone: z.object({
    name: z.string().min(1),
    meaning: z.string().min(1),
    tags: z.array(z.string()).min(1).max(4),
  }),
  scent: z.object({
    scents: z.array(z.string()).min(2).max(3),
    feel: z.string().min(1),
  }),
  quote: z.object({
    text: z.string().min(1),
    author: z.string().min(1),
    category: z.string().min(1),
  }),
});

export type DailyPack = z.infer<typeof DailyPackSchema>;

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

export const generateDailyPack = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ pack: DailyPack | null }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { pack: null };

    try {
      const gateway = createLovableAiGatewayProvider(key);
      const system = `Sen AURA'sın — kullanıcılara her gün kişiselleştirilmiş, sıcak, şiirsel ve özgün günlük ritüel içeriği üreten Türkçe bir asistan. Tüm çıktın Türkçe olmalı. Yanıtın YALNIZCA geçerli bir JSON nesnesi olmalı, markdown veya açıklama olmadan.`;

      const user = `Kullanıcı: ${data.name}
Burç: ${data.zodiac}
Ruh hali: ${data.mood ?? "belirtilmemiş"}
Stil: ${data.style ?? "belirtilmemiş"}
Şehir: ${data.city}
Hava: ${data.weather.temp}°C, ${data.weather.cond}

Aşağıdaki şemaya tam olarak uyan bir JSON üret:

{
  "greeting": "Kullanıcının adını içeren, sıcak ve kişisel bir günaydın cümlesi (1 cümle)",
  "horoscope": "${data.zodiac} burcuna ve ruh haline özel, asla genel olmayan, burç özelliklerini doğal biçimde işleyen 2-3 cümlelik bir günlük yorum",
  "colors": [{ "name": "Türkçe renk adı", "hex": "#rrggbb" }, ... 3-5 renk],
  "outfit": {
    "top": "üst parça (havaya ve stile uygun)",
    "bottom": "alt parça",
    "shoe": "ayakkabı",
    "access": "aksesuar",
    "lip": "ruj tonu",
    "jewelry": "takı (altın/gümüş vb)",
    "harmony": "renk uyumu hakkında 1 cümle",
    "inspiration": "stil ilham cümlesi"
  },
  "stone": {
    "name": "Taş adı",
    "meaning": "Anlam hakkında 1 kısa cümle",
    "tags": ["2-4 anahtar kelime"]
  },
  "scent": {
    "scents": ["2-3 koku notası"],
    "feel": "Kokunun hissi hakkında 1 cümle"
  },
  "quote": {
    "text": "Gerçek bir filozof/şair/yazar/güçlü anonim sözden alıntı (Türkçe)",
    "author": "Yazar adı (anonim için 'Anonim')",
    "category": "Kategori (örn. Felsefi, Şiir, İlham)"
  }
}

Hava ${data.weather.temp}°C ve ${data.weather.cond} — kıyafet önerisi mutlaka buna uygun olsun. Yağmurluysa su geçirmez, soğuksa katmanlı, sıcaksa hafif öner.`;

      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        prompt: user,
      });

      const jsonText = extractJson(result.text);
      const parsed = JSON.parse(jsonText);
      const validated = DailyPackSchema.safeParse(parsed);
      if (!validated.success) return { pack: null };
      return { pack: validated.data };
    } catch {
      return { pack: null };
    }
  });
