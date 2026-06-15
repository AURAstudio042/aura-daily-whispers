import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
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
type DailyPackInput = z.infer<typeof InputSchema>;

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let cleaned = (fenced?.[1] ?? raw).trim();

  if (!cleaned.startsWith("{")) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("AI response did not contain JSON");
    cleaned = cleaned.slice(start, end + 1);
  }

  return JSON.parse(cleaned);
}

function fallbackDailyPack(data: DailyPackInput): DailyPack {
  const mood = data.mood || "sakin";
  const style = data.style || "kişisel";
  const city = data.city || "bulunduğun şehir";
  const condition = data.weather?.cond?.toLocaleLowerCase("tr-TR") || "ılıman";
  const temp = data.weather?.temp ?? 20;
  const rainy = /yağmur|sağanak|çise|fırtına/.test(condition);
  const cold = temp <= 12;
  const hot = temp >= 26;

  return {
    morningMessage: `Günaydın ${data.name}, bugün ${data.zodiac} enerjin ${mood} halinle daha yumuşak bir ritim buluyor. ${city} havasını da yanına alıp kendine nazik bir başlangıç seç.`,
    horoscope: `Bugün sezgilerin küçük işaretleri daha net okuyabilir. ${data.zodiac} tarafın, acele etmeden ama içinden geleni bastırmadan ilerlemek istiyor. ${mood} ruh halin sana neye yaklaşman, neyden uzak durman gerektiğini fısıldıyor. Günün sonunda en çok kendine gösterdiğin incelik aklında kalacak.`,
    outfit: {
      top: rainy ? "Su itici trençkot altında yumuşak triko" : cold ? "Katmanlı kaşmir kazak ve ince ceket" : hot ? "Hafif keten gömlek" : `${style} çizgide ipek dokulu bluz`,
      bottom: hot ? "Akışkan midi etek" : "Yüksek bel rahat kumaş pantolon",
      shoe: rainy ? "Kaymaz tabanlı zarif bot" : cold ? "Deri bilekli bot" : "Minimal loafer",
      access: rainy ? "Kompakt şemsiye ve suya dayanıklı çanta" : "İnce metalik kolye ve küçük omuz çantası",
      lip: hot ? "Şeftali nude balm" : "Gül kurusu saten ruj",
      jewelry: "İnce halka küpe",
      harmony: rainy ? "Derin mürdüm ve antrasit tonları yağmurlu havayı sofistike gösterir." : cold ? "Krem ve gece mavisi katmanlar sıcak ama rafine bir uyum kurar." : "Yumuşak lila ve şampanya tonları bugünün ışığını nazikçe taşır.",
    },
    styleInspiration: `${style} stilini bugün tek bir şiirsel detayla görünür kıl: dokusu güzel bir parça yeter.`,
    stone: {
      name: data.zodiac === "Aslan" ? "Sitrin" : data.zodiac === "Akrep" ? "Obsidyen" : data.zodiac === "Balık" ? "Ametist" : "Ay Taşı",
      meaning: "Bugün sezgini sakinleştirip iç sesini daha berrak duymana eşlik eder.",
      tags: ["denge", "sezgi", "ışık"],
    },
    scent: {
      notes: rainy ? ["sedir", "amber", "ıslak yaprak"] : hot ? ["bergamot", "incir", "beyaz misk"] : ["vanilya", "iris", "sandal"],
      feel: "Teninde zarif, yakın ve gün boyu güven veren bir iz bırakır.",
    },
    colors: [
      { name: "Ay Işığı", hex: "#F7F1FF" },
      { name: "Gül Dumanı", hex: "#C9A7B8" },
      { name: "Gece Mavisi", hex: "#1F2A44" },
      { name: rainy ? "Yağmur Adaçayı" : "Şampanya", hex: rainy ? "#8EA39A" : "#E6D2A8" },
    ],
    quote: {
      text: "Bugün kendine verdiğin naz, yarının ışığını hazırlar.",
      author: "AURA",
      category: mood,
    },
  };
}

function parseDailyPack(raw: string, data: DailyPackInput): DailyPack {
  try {
    const parsed = DailyPackSchema.safeParse(extractJson(raw));
    if (parsed.success) return parsed.data;
    console.warn("AURA AI JSON schema mismatch", parsed.error.flatten());
  } catch (error) {
    console.warn("AURA AI JSON parse failed", error);
  }

  return fallbackDailyPack(data);
}

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

    const system = `Sen AURA'sın — kullanıcıya kendini özel hissettirmeyi amaçlayan, sıcak, şefkatli ve şiirsel bir günlük yaşam yoldaşısın. TÜM çıktılar Türkçe olmalı. Kibar, samimi, kişisel bir ton kullan. Klişelerden kaçın. Kullanıcının burcu, ruh hali, stili ve hava durumunu içselleştirerek yaz. Kıyafet önerisi hava durumuna uygun olmalı (yağmurda su geçirmez, soğukta katmanlı, sıcakta hafif). Yanıt yalnızca geçerli JSON olmalı; markdown, kod bloğu veya açıklama ekleme.`;

    const prompt = `Bugünün kişisel paketini hazırla. Aşağıdaki şemaya birebir uyan, sadece parse edilebilir JSON döndür:\n\n${context}\n\n{
  "morningMessage": "2 cümlelik kişisel sabah mesajı",
  "horoscope": "3-4 cümlelik günlük burç yorumu",
  "outfit": {
    "top": "üst parça",
    "bottom": "alt parça",
    "shoe": "ayakkabı",
    "access": "aksesuar",
    "lip": "ruj önerisi",
    "jewelry": "takı önerisi",
    "harmony": "renk uyumu açıklaması"
  },
  "styleInspiration": "tek cümlelik stil ilhamı",
  "stone": { "name": "taş adı", "meaning": "anlamı", "tags": ["2-4 kısa etiket"] },
  "scent": { "notes": ["2-4 koku notası"], "feel": "tek cümlelik his" },
  "colors": [
    { "name": "renk adı", "hex": "#AABBCC" },
    { "name": "renk adı", "hex": "#AABBCC" },
    { "name": "renk adı", "hex": "#AABBCC" },
    { "name": "renk adı", "hex": "#AABBCC" }
  ],
  "quote": { "text": "motive edici söz", "author": "AURA veya gerçek yazar", "category": "kategori" }
}`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
    });

    return parseDailyPack(text, data);
  });
