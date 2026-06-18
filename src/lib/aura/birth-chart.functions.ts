import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const PlanetSchema = z.object({
  name: z.string(),
  sign: z.string(),
  house: z.string(),
  meaning: z.string(),
});

const ChartSchema = z.object({
  sun: PlanetSchema,
  moon: PlanetSchema,
  rising: PlanetSchema,
  mercury: PlanetSchema,
  venus: PlanetSchema,
  mars: PlanetSchema,
  jupiter: PlanetSchema,
  saturn: PlanetSchema,
  personality: z.string().min(40),
  strengths: z.array(z.string()).min(2).max(5),
  challenges: z.array(z.string()).min(2).max(4),
  life_path: z.string().min(40),
  signature_sentence: z.string().min(10),
});

export type BirthChart = z.infer<typeof ChartSchema>;

export type ChartResult =
  | { ok: true; chart: BirthChart; locked: false }
  | { ok: true; locked: true; preview: BirthChart }
  | { ok: false; reason: "error" | "missing"; message: string };

const Input = z.object({
  context: z.object({
    name: z.string().max(100).optional(),
    zodiac: z.string().max(40).optional(),
    birthDate: z.string().max(20).optional(),
    birthTime: z.string().max(10).optional(),
    city: z.string().max(80).optional(),
  }).optional(),
});

const PREVIEW: BirthChart = {
  sun: { name: "Güneş", sign: "—", house: "—", meaning: "Özünüz." },
  moon: { name: "Ay", sign: "—", house: "—", meaning: "Duygusal dünyanız." },
  rising: { name: "Yükselen", sign: "—", house: "—", meaning: "Dışarıya yansıttığınız maske." },
  mercury: { name: "Merkür", sign: "—", house: "—", meaning: "İletişim." },
  venus: { name: "Venüs", sign: "—", house: "—", meaning: "Aşk ve estetik." },
  mars: { name: "Mars", sign: "—", house: "—", meaning: "Tutku ve enerji." },
  jupiter: { name: "Jüpiter", sign: "—", house: "—", meaning: "Büyüme." },
  saturn: { name: "Satürn", sign: "—", house: "—", meaning: "Ders." },
  personality: "Kişiliğinin derin haritası burada açılacak.",
  strengths: ["—", "—"],
  challenges: ["—", "—"],
  life_path: "Yaşam yolun premium ile açılır.",
  signature_sentence: "Yıldızların senin için bir hikâyesi var.",
};

export const getBirthChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<ChartResult> => {
    const { data: profile } = await context.supabase
      .from("profiles").select("tier").eq("id", context.userId).maybeSingle();
    const tier = (profile?.tier as string || "free").toLowerCase();
    if (tier !== "premium") {
      return { ok: true, locked: true, preview: PREVIEW };
    }

    const { data: cached } = await context.supabase
      .from("birth_charts").select("content").eq("user_id", context.userId).maybeSingle();
    if (cached?.content) {
      return { ok: true, locked: false, chart: cached.content as BirthChart };
    }

    const c = data.context ?? {};
    if (!c.birthDate) {
      return { ok: false, reason: "missing", message: "Doğum tarihini profilinde tamamlaman gerekiyor." };
    }
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, reason: "error", message: "Şu an hazırlanamadı." };

    try {
      const gateway = createLovableAiGatewayProvider(key);
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        providerOptions: { lovable: { structuredOutputs: true } },
        system: `Sen AURA'nın astrolojik harita yorumcususun. Verilen doğum bilgilerine göre kişiye özel doğum haritası yorumu üretirsin. Türkçe yaz, şiirsel ama net ol. Gezegen konumlarını klasik astroloji bilgisiyle yaklaşık olarak tahmin et (efemerid hesabı yok). Her gezegen için burç (sign) ve ev (house) tahmini ver, sonra anlamını kişiselleştir.

Kullanıcı: ${c.name ?? "—"}
Doğum: ${c.birthDate} ${c.birthTime ?? ""}
Yer: ${c.city ?? "—"}
Burç (güneş): ${c.zodiac ?? "—"}`,
        experimental_output: Output.object({ schema: ChartSchema }),
        messages: [{ role: "user", content: "Tam doğum haritamı analiz et ve her gezegen + yaşam yolu için kişisel yorum yaz." }],
      });

      const chart = experimental_output as BirthChart;
      await context.supabase.from("birth_charts").upsert({
        user_id: context.userId,
        content: chart,
      }, { onConflict: "user_id" });

      return { ok: true, locked: false, chart };
    } catch {
      return { ok: false, reason: "error", message: "Şu an hazırlanamadı, tekrar dene." };
    }
  });
