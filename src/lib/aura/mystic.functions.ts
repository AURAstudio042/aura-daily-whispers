import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  MYSTIC_CATEGORIES,
  pickFallback,
  type MysticCardContent,
} from "./mystic-data";

const InputSchema = z.object({
  zodiac: z.string().optional(),
  mood: z.string().optional(),
  name: z.string().optional(),
  timeOfDay: z.enum(["sabah", "öğle", "akşam", "gece"]),
  avoidQuote: z.string().optional(),
});

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

export const generateMysticCard = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<MysticCardContent> => {
    try {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) return pickFallback(data.avoidQuote);

      const gateway = createLovableAiGatewayProvider(key);
      const system =
        "Sen AURA'sın — şiirsel, sıcak, mistik bir Türkçe içerik üreticisi. Çıktın sadece geçerli bir JSON nesnesi olmalı; markdown veya açıklama olmadan.";
      const prompt = `Bir 'Mistik Kart' içeriği üret. Kart kullanıcıya kişisel ve güçlü hissettirmeli, klişe ya da reklamvari olmamalı.

Bağlam:
- Kullanıcı: ${data.name ?? "—"}
- Burç: ${data.zodiac ?? "—"}
- Ruh hali: ${data.mood ?? "—"}
- Günün vakti: ${data.timeOfDay}
- Kaçınılacak alıntı (asla aynısını kullanma): ${data.avoidQuote ?? "(yok)"}

Kategori havuzu (birini seç): ${MYSTIC_CATEGORIES.join(", ")}

Aşağıdaki yapıya tam uyan bir JSON döndür:
{
  "category": "Havuzdan tam bir kategori",
  "quote": "Tek cümlelik güçlü, şiirsel ana söz (en fazla 14 kelime). Tırnak işareti kullanma.",
  "whisper": "Sözü tamamlayan, 1 cümlelik sıcak ve net fısıltı. İmza ekleme."
}

Türkçe yaz. Reklam dili kullanma. 'AURA' kelimesini içeride geçirme.`;

      const res = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        prompt,
      });

      try {
        const parsed = JSON.parse(extractJson(res.text));
        const cat = String(parsed.category ?? "").trim();
        const quote = String(parsed.quote ?? "").replace(/^["""']|["""']$/g, "").trim();
        const whisper = String(parsed.whisper ?? "").trim();
        const valid = MYSTIC_CATEGORIES.includes(cat as any) && quote.length > 5 && whisper.length > 3;
        if (!valid || quote === data.avoidQuote) return pickFallback(data.avoidQuote);
        return { category: cat as MysticCardContent["category"], quote, whisper };
      } catch {
        return pickFallback(data.avoidQuote);
      }
    } catch {
      return pickFallback(data.avoidQuote);
    }
  });
