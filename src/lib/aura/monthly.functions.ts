import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export type MonthlyAnalysis = {
  month_title: string;
  rising_effect: string;
  moon_tone: string;
  planets: { name: string; note: string }[];
  strong_days: { date: string; note: string }[];
  careful_days: { date: string; note: string }[];
  focus_theme: string;
  full_moon_ritual: string;
  new_moon_ritual: string;
  power_sentence: string;
};

export type MonthlyResult =
  | {
      ok: true;
      locked: false;
      year: number;
      month: number;
      analysis: MonthlyAnalysis;
    }
  | {
      ok: true;
      locked: true;
      year: number;
      month: number;
      preview: MonthlyAnalysis;
    }
  | { ok: false; reason: "error"; message: string };

const ContextSchema = z
  .object({
    name: z.string().optional(),
    zodiac: z.string().optional(),
    style: z.string().optional(),
    mood: z.string().optional(),
    birthDate: z.string().optional(),
    birthTime: z.string().optional(),
    city: z.string().optional(),
  })
  .optional();

const AnalysisSchema = z.object({
  month_title: z.string().min(10),
  rising_effect: z.string().min(10),
  moon_tone: z.string().min(10),
  planets: z
    .array(z.object({ name: z.string(), note: z.string() }))
    .min(2)
    .max(3),
  strong_days: z
    .array(z.object({ date: z.string(), note: z.string() }))
    .min(3)
    .max(5),
  careful_days: z
    .array(z.object({ date: z.string(), note: z.string() }))
    .min(2)
    .max(3),
  focus_theme: z.string().min(5),
  full_moon_ritual: z.string().min(10),
  new_moon_ritual: z.string().min(10),
  power_sentence: z.string().min(10),
});

const PREVIEW: MonthlyAnalysis = {
  month_title:
    "Bu ay görünmez bir dönüşüm enerjisi seni sarıyor. Sezgiler güçleniyor, dış gürültü azalıyor.",
  rising_effect:
    "Yükselen burcun bu ay dış dünyaya daha sakin ama daha kararlı bir yüz gösteriyor.",
  moon_tone:
    "Ay burcun bu dönemde geçmiş duyguları gün yüzüne çıkarıyor; affetmek hafifletir.",
  planets: [
    { name: "Venüs", note: "Estetik ve ilişki dengesinde nazik değişimler." },
    { name: "Merkür", note: "İletişimde net olma ihtiyacı belirginleşiyor." },
  ],
  strong_days: [
    { date: "—", note: "İçsel netlik günü." },
    { date: "—", note: "Yeni başlangıç hissi." },
    { date: "—", note: "Sezgilerin en güçlü olduğu gün." },
  ],
  careful_days: [
    { date: "—", note: "İletişimde sabır." },
    { date: "—", note: "Karar ertelenmeli." },
  ],
  focus_theme: "Bu ay sınır koyma ayın.",
  full_moon_ritual:
    "Dolunay gecesi yazdığın bir notu yak — bırakmak istediğin tek bir şey.",
  new_moon_ritual:
    "Yeni ay gecesi mum yak ve sessizce üç niyet yaz.",
  power_sentence: "Sınır koymak, sevgiyi büyütmenin en sessiz biçimidir.",
};

export const getMonthlyAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ context: ContextSchema }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<MonthlyResult> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("tier")
      .eq("id", context.userId)
      .maybeSingle();
    const tier = (profile?.tier as string) || "free";

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (tier !== "premium") {
      return { ok: true, locked: true, year, month, preview: PREVIEW };
    }

    const { data: cached } = await context.supabase
      .from("monthly_analyses")
      .select("content")
      .eq("user_id", context.userId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();

    if (cached?.content) {
      return {
        ok: true,
        locked: false,
        year,
        month,
        analysis: cached.content as MonthlyAnalysis,
      };
    }

    try {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) {
        return {
          ok: false,
          reason: "error",
          message: "Analizin hazırlanıyor, birazdan tekrar dene.",
        };
      }

      const c = data.context ?? {};
      const monthName = now.toLocaleDateString("tr-TR", { month: "long" });
      const lastDay = new Date(year, month, 0).getDate();

      const system = `Sen AURA'nın derin astroloji analistisin. Bir kullanıcı için bu ayın derin analizini hazırla. Türkçe yaz. Şiirsel, sıcak, kişisel ve spesifik ol; aynı burçtan iki kullanıcının aynı raporu almaması için kullanıcının özgün verilerini (isim, doğum, şehir, ruh hali, stil) dokuya işle.

Kullanıcı:
- İsim: ${c.name ?? "—"}
- Burç: ${c.zodiac ?? "—"}
- Doğum tarihi: ${c.birthDate ?? "—"}
- Doğum saati: ${c.birthTime ?? "—"}
- Şehir: ${c.city ?? "—"}
- Ruh hali: ${c.mood ?? "—"}
- Stil: ${c.style ?? "—"}
- Kullanıcı kimliği (özgün tohum): ${context.userId.slice(0, 8)}

Ay: ${monthName} ${year} (${lastDay} gün).

Kurallar:
- Klişe astroloji söylemi yok ("merkür retroda" gibi jenerik laflar).
- Tarihler 1 ile ${lastDay} arası gün sayıları olmalı (sadece sayı, örn. "12").
- Güçlü günler 3-5, dikkatli günler 2-3 tane.
- Her bölüm 1-3 cümle, akıcı Türkçe.
- power_sentence tek cümlelik, paylaşılmaya değer, güçlü.
- Yükselen ve ay burcunu bilmiyorsan kullanıcının burcundan ve doğum bilgisinden ince bir çıkarım yap; emin değilsen şiirsel bir ihtimal dili kullan.`;

      const userPrompt = `${c.name ?? "Bu kişi"} için ${monthName} ${year} ayının derin analizini ver. Bu ay tam olarak ona, bu ana, bu burç-ruh hali kombinasyonuna özel hissettir.`;

      const gateway = createLovableAiGatewayProvider(key);
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        experimental_output: Output.object({ schema: AnalysisSchema }),
        messages: [{ role: "user", content: userPrompt }],
      });

      const analysis = experimental_output as MonthlyAnalysis;

      await context.supabase.from("monthly_analyses").upsert(
        {
          user_id: context.userId,
          year,
          month,
          content: analysis,
        },
        { onConflict: "user_id,year,month" },
      );

      return { ok: true, locked: false, year, month, analysis };
    } catch {
      return {
        ok: false,
        reason: "error",
        message: "Analizin hazırlanıyor, birazdan tekrar dene.",
      };
    }
  });
