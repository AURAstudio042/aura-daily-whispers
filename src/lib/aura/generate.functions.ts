import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  name: z.string().min(1).max(60),
  zodiac: z.string().min(1).max(20),
  mood: z.string().max(20).optional(),
  style: z.string().max(20).optional(),
  city: z.string().max(60).optional(),
  undertone: z.string().max(20).optional(),
  weather: z
    .object({
      cond: z.string().max(40),
      temp: z.number(),
    })
    .optional(),
});

const DailyPackSchema = z.object({
  morningMessage: z.string().describe("Sıcak, kişisel sabah mesajı (2 cümle)"),
  horoscope: z.string().describe("Bugün için günlük burç yorumu (3-4 cümle)"),
  outfit: z.object({
    top: z.string(),
    bottom: z.string(),
    shoe: z.string(),
    access: z.string(),
    lip: z.string(),
    jewelry: z.string(),
    harmony: z.string().describe("Renk uyumu açıklaması (1 cümle)"),
  }),
  styleInspiration: z.string().describe("Tek cümlelik stil ilhamı"),
  stone: z.object({
    name: z.string().describe("Taşın Türkçe adı"),
    meaning: z.string().describe("Anlamı (1 cümle)"),
    tags: z.array(z.string()).min(2).max(4),
  }),
  scent: z.object({
    notes: z.array(z.string()).min(2).max(4).describe("Koku notaları"),
    feel: z.string().describe("Hissi anlatan tek cümle"),
  }),
  colors: z
    .array(z.object({ name: z.string(), hex: z.string() }))
    .min(4)
    .max(4)
    .describe("Bugün için 4 renk paleti; hex kodlarıyla"),
  quote: z.object({
    text: z.string(),
    author: z.string().optional(),
    category: z.string(),
  }),
});

export type DailyPack = z.infer<typeof DailyPackSchema>;

export const generateDailyPack = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DailyPack> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const gateway = createLovableAiGatewayProvider(key);
    const today = new Date().toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const context = [
      `İsim: ${data.name}`,
      `Burç: ${data.zodiac}`,
      data.mood && `Ruh hali: ${data.mood}`,
      data.style && `Stil tercihi: ${data.style}`,
      data.city && `Şehir: ${data.city}`,
      data.undertone && `Cilt tonu: ${data.undertone}`,
      data.weather && `Hava: ${data.weather.cond}, ${data.weather.temp}°C`,
      `Tarih: ${today}`,
    ]
      .filter(Boolean)
      .join("\n");

    const system = `Sen AURA'sın — kullanıcıya kendini özel hisstirmeyi amaçlayan, sıcak, şefkatli ve şiirsel bir günlük yaşam yoldaşısın. TÜM çıktılar Türkçe olmalı. Kibar, samimi, kişisel bir ton kullan. Klişelerden kaçın. Kullanıcının burcu, ruh hali, stili ve hava durumunu içselleştirerek yaz. Kıyafet önerisi hava durumuna uygun olmalı (yağmurda su geçirmez, soğukta katmanlı, sıcakta hafif). Renk hex kodları geçerli olmalı.`;

    const prompt = `Bugünün kişisel paketini hazırla ve sonucu JSON formatında döndür:\n\n${context}`;

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
      experimental_output: Output.object({ schema: DailyPackSchema }),
    });

    return experimental_output;
  });
