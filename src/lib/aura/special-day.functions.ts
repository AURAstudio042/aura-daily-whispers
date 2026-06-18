import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const OCCASIONS = [
  { id: "wedding", label: "Düğün 💒" },
  { id: "meeting", label: "İş Toplantısı 💼" },
  { id: "interview", label: "Mülakat 📋" },
  { id: "romantic", label: "Romantik Buluşma 🌹" },
  { id: "first_date", label: "İlk Randevu ✨" },
  { id: "graduation", label: "Mezuniyet 🎓" },
  { id: "birthday", label: "Doğum Günü 🎂" },
  { id: "exam", label: "Sınav 📖" },
  { id: "presentation", label: "Sunum 🎤" },
  { id: "party", label: "Parti 🎉" },
] as const;

const Input = z.object({
  occasion: z.string().max(40),
  date: z.string().max(20).optional(),
  note: z.string().max(300).optional(),
  context: z.object({
    name: z.string().max(100).optional(),
    zodiac: z.string().max(40).optional(),
    style: z.string().max(60).optional(),
    city: z.string().max(80).optional(),
    gender: z.string().max(40).optional(),
  }).optional(),
});

const Outfit = z.object({
  top: z.string(), bottom: z.string(), shoes: z.string(),
  accessory: z.string(), makeup: z.string(),
});

const SchemaOut = z.object({
  title: z.string().min(8),
  energy: z.string().min(20),
  outfit: Outfit,
  color_palette: z.array(z.string()).min(2).max(5),
  stone: z.object({ name: z.string(), meaning: z.string() }),
  scent: z.object({ name: z.string(), feeling: z.string() }),
  prep_morning: z.string().min(15),
  prep_afternoon: z.string().min(15),
  prep_evening: z.string().min(15),
  affirmation: z.string().min(10),
});

export type SpecialDayPlan = z.infer<typeof SchemaOut>;

export type SpecialDayResult =
  | { ok: true; plan: SpecialDayPlan }
  | { ok: false; reason: "locked" | "error"; message: string };

export const generateSpecialDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<SpecialDayResult> => {
    const { data: profile } = await context.supabase
      .from("profiles").select("tier").eq("id", context.userId).maybeSingle();
    const tier = (profile?.tier as string || "free").toLowerCase();
    if (tier === "free") {
      return { ok: false, reason: "locked", message: "Özel gün modu AURA+ üyelerine açıktır." };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { ok: false, reason: "error", message: "Şu an hazırlanamadı, tekrar dener misin?" };

    const c = data.context ?? {};
    const occasion = OCCASIONS.find(o => o.id === data.occasion)?.label ?? data.occasion;
    const dateStr = data.date ?? new Date().toISOString().slice(0, 10);

    try {
      const gateway = createLovableAiGatewayProvider(key);
      const system = `Sen AURA'sın — kullanıcıya özel günler için tam bir hazırlık rehberi sunan, sıcak ve sezgisel bir kişisel danışman. Türkçe yaz, klişe olma, kullanıcıya özgü ve şiirsel ol.

Kullanıcı:
- İsim: ${c.name ?? "—"}
- Burç: ${c.zodiac ?? "—"}
- Stil: ${c.style ?? "—"}
- Cinsiyet: ${c.gender ?? "—"}
- Şehir: ${c.city ?? "—"}

Özel gün: ${occasion}
Tarih: ${dateStr}
Kullanıcının notu: ${data.note ?? "—"}`;

      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        providerOptions: { lovable: { structuredOutputs: true } },
        system,
        experimental_output: Output.object({ schema: SchemaOut }),
        messages: [{
          role: "user",
          content: `${c.name ?? "Bu kullanıcı"} için ${occasion} gününe özel komple bir hazırlık rehberi hazırla. Renk paleti hex değerleri (#rrggbb) olmalı. Hazırlık adımları (sabah/öğlen/akşam) net ve uygulanabilir olsun.`,
        }],
      });

      const plan = experimental_output as SpecialDayPlan;
      return { ok: true, plan };
    } catch {
      return { ok: false, reason: "error", message: "Şu an hazırlanamadı, tekrar dener misin?" };
    }
  });
