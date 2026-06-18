import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const PlanetTransit = z.object({
  name: z.string(),
  sign: z.string(),
  influence: z.string(),
  personal_effect: z.string(),
});

const DaySchema = z.object({
  summary: z.string().min(20),
  planets: z.array(PlanetTransit).min(5).max(8),
  warning: z.string().min(10),
  power_hours: z.string().min(5),
});

export type DailyPlanets = z.infer<typeof DaySchema>;

export type PlanetsResult =
  | { ok: true; locked: false; date: string; data: DailyPlanets }
  | { ok: true; locked: true; preview: DailyPlanets }
  | { ok: false; reason: "error"; message: string };

const PREVIEW: DailyPlanets = {
  summary: "Bugünün gezegen enerjileri premium ile açılır.",
  planets: [
    { name: "Güneş", sign: "—", influence: "—", personal_effect: "—" },
    { name: "Ay", sign: "—", influence: "—", personal_effect: "—" },
    { name: "Merkür", sign: "—", influence: "—", personal_effect: "—" },
    { name: "Venüs", sign: "—", influence: "—", personal_effect: "—" },
    { name: "Mars", sign: "—", influence: "—", personal_effect: "—" },
  ],
  warning: "—",
  power_hours: "—",
};

const Input = z.object({
  context: z.object({
    name: z.string().max(100).optional(),
    zodiac: z.string().max(40).optional(),
  }).optional(),
});

export const getDailyPlanets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<PlanetsResult> => {
    const { data: profile } = await context.supabase
      .from("profiles").select("tier").eq("id", context.userId).maybeSingle();
    const tier = (profile?.tier as string || "free").toLowerCase();
    if (tier !== "premium") {
      return { ok: true, locked: true, preview: PREVIEW };
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: cached } = await context.supabase
      .from("planet_transits").select("content")
      .eq("user_id", context.userId).eq("date", today).maybeSingle();
    if (cached?.content) {
      return { ok: true, locked: false, date: today, data: cached.content as DailyPlanets };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, reason: "error", message: "Şu an hazırlanamadı." };

    try {
      const gateway = createLovableAiGatewayProvider(key);
      const c = data.context ?? {};
      const dateLabel = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        providerOptions: { lovable: { structuredOutputs: true } },
        system: `Sen AURA'nın günlük gök yorumcususun. Bugünün gezegen konumlarını klasik astroloji yaklaşımıyla tahmin et ve kullanıcının burcuna özel etkilerini Türkçe yorumla. Şiirsel ama net.

Kullanıcı: ${c.name ?? "—"}
Burcu: ${c.zodiac ?? "—"}
Tarih: ${dateLabel}`,
        experimental_output: Output.object({ schema: DaySchema }),
        messages: [{ role: "user", content: "Bugünün 6 ana gezegeninin (Güneş, Ay, Merkür, Venüs, Mars, Jüpiter) konumunu ve kullanıcının burcuna etkisini anlat. Bir uyarı ve günün güçlü saatlerini ekle." }],
      });

      const day = experimental_output as DailyPlanets;
      await context.supabase.from("planet_transits").upsert({
        user_id: context.userId,
        date: today,
        content: day,
      }, { onConflict: "user_id,date" });

      return { ok: true, locked: false, date: today, data: day };
    } catch {
      return { ok: false, reason: "error", message: "Şu an hazırlanamadı, tekrar dene." };
    }
  });
