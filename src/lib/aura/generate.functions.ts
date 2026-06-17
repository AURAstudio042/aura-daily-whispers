import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildPersonalizationGuidance } from "./data";

const InputSchema = z.object({
  name: z.string().max(100),
  zodiac: z.string().max(50),
  mood: z.string().max(200).optional(),
  style: z.string().max(100).optional(),
  city: z.string().max(100),
  weather: z.object({
    temp: z.number(),
    cond: z.string().max(100),
  }),
  relationshipStatus: z.string().max(50).optional(),
  gender: z.string().max(50).optional(),
  lifeFocus: z.array(z.string().max(50)).max(20).optional(),
  hasChildren: z.boolean().optional(),
  hasPets: z.boolean().optional(),
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
    shoes: z.string().min(1),
    accessory: z.string().min(1),
  }),
  makeup: z.string().min(1),
  colorNote: z.string().min(1),
  styleInspo: z.string().min(1),
  stone: z.object({
    name: z.string().min(1),
    meaning: z.string().min(1),
  }),
  scent: z.object({
    names: z.string().min(1),
    feeling: z.string().min(1),
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
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<{ pack: DailyPack | null }> => {
    try {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) return { pack: null };

      const gateway = createLovableAiGatewayProvider(key);
      const system = `Sen AURA'sın — kullanıcılara her gün kişiselleştirilmiş, sıcak, şiirsel ve özgün günlük ritüel içeriği üreten Türkçe bir asistan. Tüm çıktın Türkçe olmalı. Asla genel ifadeler kullanma — kullanıcının burcuna, ruh haline, stiline, şehrine ve havasına özgü, kişisel ve spesifik içerik üret. Yanıtın YALNIZCA geçerli bir JSON nesnesi olmalı, markdown veya açıklama olmadan.`;

      const personalization = buildPersonalizationGuidance({
        relationshipStatus: data.relationshipStatus,
        gender: data.gender,
        lifeFocus: data.lifeFocus,
        hasChildren: data.hasChildren,
        hasPets: data.hasPets,
      });

      const user = `Kullanıcı: ${data.name}
Burç: ${data.zodiac}
Ruh hali: ${data.mood ?? "belirtilmemiş"}
Stil: ${data.style ?? "belirtilmemiş"}
Şehir: ${data.city}
Hava: ${data.weather.temp}°C, ${data.weather.cond}
${personalization ? "\n" + personalization + "\n" : ""}

Aşağıdaki yapıya tam olarak uyan bir JSON üret:

{
  "greeting": "Günaydın, ${data.name} ✨ [kısa, sıcak bir enerji cümlesi]",
  "horoscope": "[${data.zodiac} burcuna ve ruh haline özel, asla genel olmayan, burç özelliklerini doğal biçimde işleyen 2-3 cümlelik kişisel yorum]",
  "colors": [{"name": "Türkçe renk adı", "hex": "#rrggbb"}, ... 3-5 renk],
  "outfit": {
    "top": "üst parça (havaya, stile, ruh haline uygun)",
    "bottom": "alt parça",
    "shoes": "ayakkabı",
    "accessory": "aksesuar"
  },
  "makeup": "[makyaj ve aksesuar önerisi — ruj tonu ve takı dahil, 1-2 cümle]",
  "colorNote": "[bugünkü renk paletinin uyum notu, 1 cümle]",
  "styleInspo": "[stilini özetleyen şiirsel bir ilham cümlesi]",
  "stone": {
    "name": "Taş adı",
    "meaning": "Bugüne özel kısa bir anlam cümlesi"
  },
  "scent": {
    "names": "2-3 koku notası (örn. 'Bergamot, yasemin, beyaz misk')",
    "feeling": "Kokunun bıraktığı his hakkında 1 cümle"
  },
  "quote": {
    "text": "Gerçek bir filozof, şair, yazar veya güçlü bir anonim sözünden Türkçe alıntı",
    "author": "Yazar adı (mutlaka belirt; bilinmiyorsa 'Anonim')",
    "category": "Kategori (Felsefi, Şiir, İlham, Bilgelik vb)"
  }
}

Hava ${data.weather.temp}°C ve ${data.weather.cond} — kıyafet önerisi mutlaka buna uygun olsun. Yağmurluysa su geçirmez katman, soğuksa katmanlı sıcak parçalar, sıcaksa hafif kumaşlar öner.`;

      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        prompt: user,
      });

      try {
        const jsonText = extractJson(result.text);
        const parsed = JSON.parse(jsonText);
        const validated = DailyPackSchema.safeParse(parsed);
        if (!validated.success) return { pack: null };
        return { pack: validated.data };
      } catch {
        return { pack: null };
      }
    } catch {
      return { pack: null };
    }
  });
