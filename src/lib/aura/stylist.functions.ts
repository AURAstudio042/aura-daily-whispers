import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const MsgSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  message: z.string().min(1).max(500),
  history: z.array(MsgSchema).max(20).optional(),
  context: z
    .object({
      name: z.string().optional(),
      style: z.string().optional(),
      zodiac: z.string().optional(),
      city: z.string().optional(),
      weather: z.string().optional(),
      timeOfDay: z.string().optional(),
    })
    .optional(),
});

export type StylistResult =
  | { ok: true; reply: string }
  | { ok: false; reason: "locked" | "error"; message: string };

export const getStylistStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ tier: string }> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("tier")
      .eq("id", context.userId)
      .maybeSingle();
    return { tier: (data?.tier as string) || "free" };
  });

export const askStylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }): Promise<StylistResult> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("tier")
      .eq("id", context.userId)
      .maybeSingle();
    const tier = (profile?.tier as string) || "free";
    if (tier !== "premium") {
      return {
        ok: false,
        reason: "locked",
        message: "AI Stilist yalnızca AURA Premium üyelerine açıktır.",
      };
    }

    try {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) {
        return {
          ok: false,
          reason: "error",
          message: "Şu an bağlantı kurulamıyor, birazdan tekrar dene.",
        };
      }

      const c = data.context ?? {};
      const system = `Sen AURA'sın — kullanıcının kişisel AI stil danışmanı. Stilist bir arkadaş gibi sıcak, kendine güvenen ve şiirsel bir tonda konuş. Türkçe yaz. Asla klişe ya da reklamvari olma. Yanıtın markdown başlığı, liste işareti veya emoji bombardımanı içermesin; düz akıcı bir Türkçe metin yaz.

Kullanıcı profili:
- İsim: ${c.name ?? "—"}
- Stil tipi: ${c.style ?? "—"}
- Burç enerjisi: ${c.zodiac ?? "—"}
- Şehir: ${c.city ?? "—"}
- Bugünkü hava: ${c.weather ?? "—"}
- Günün vakti: ${c.timeOfDay ?? "—"}

Cevabını şu yapıda kur ama başlık koyma:
1) Önce ortama uygun spesifik bir kombin öner (üst, alt, ayakkabı, dış katman).
2) Renk önerisi ver (2-3 ton, kullanıcının stil tipiyle uyumlu).
3) Aksesuar dokunuşu ekle (1-2 öneri).
4) Sonunda tek cümlelik şiirsel bir stil ilhamı bırak.

Toplam 6-9 cümle. Çok uzun yazma.`;

      const history = (data.history ?? []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const gateway = createLovableAiGatewayProvider(key);
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        messages: [
          ...history,
          { role: "user" as const, content: data.message },
        ],
      });

      const text = result.text?.trim();
      if (!text || text.length < 10) {
        return {
          ok: false,
          reason: "error",
          message: "Şu an bağlantı kurulamıyor, birazdan tekrar dene.",
        };
      }
      return { ok: true, reply: text };
    } catch {
      return {
        ok: false,
        reason: "error",
        message: "Şu an bağlantı kurulamıyor, birazdan tekrar dene.",
      };
    }
  });
