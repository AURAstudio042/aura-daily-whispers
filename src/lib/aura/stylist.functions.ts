import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const MsgSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
});

const InputSchema = z.object({
  message: z.string().max(500).optional().default(""),
  imageDataUrl: z
    .string()
    .max(8_000_000)
    .regex(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/i)
    .optional(),
  history: z.array(MsgSchema).max(20).optional(),
  context: z
    .object({
      name: z.string().max(100).optional(),
      style: z.string().max(100).optional(),
      zodiac: z.string().max(50).optional(),
      city: z.string().max(100).optional(),
      weather: z.string().max(100).optional(),
      timeOfDay: z.string().max(50).optional(),
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

    const hasImage = !!data.imageDataUrl;
    const userText = (data.message ?? "").trim();
    if (!hasImage && !userText) {
      return {
        ok: false,
        reason: "error",
        message: "Bir şey yaz ya da bir fotoğraf paylaş.",
      };
    }

    try {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) {
        return {
          ok: false,
          reason: "error",
          message: hasImage
            ? "Fotoğrafı analiz edemedim, tekrar dener misin?"
            : "Şu an bağlantı kurulamıyor, birazdan tekrar dene.",
        };
      }

      const c = data.context ?? {};
      const baseSystem = `Sen AURA'sın — kullanıcının kişisel AI stil danışmanı. Stilist bir arkadaş gibi sıcak, kendine güvenen ve şiirsel bir tonda konuş. Türkçe yaz. Asla klişe ya da reklamvari olma. Yanıtın markdown başlığı, liste işareti veya emoji bombardımanı içermesin; düz akıcı bir Türkçe metin yaz.

Kullanıcı profili:
- İsim: ${c.name ?? "—"}
- Stil tipi: ${c.style ?? "—"}
- Burç enerjisi: ${c.zodiac ?? "—"}
- Şehir: ${c.city ?? "—"}
- Bugünkü hava: ${c.weather ?? "—"}
- Günün vakti: ${c.timeOfDay ?? "—"}`;

      const textSystem = `${baseSystem}

Cevabını şu yapıda kur ama başlık koyma:
1) Önce ortama uygun spesifik bir kombin öner (üst, alt, ayakkabı, dış katman).
2) Renk önerisi ver (2-3 ton, kullanıcının stil tipiyle uyumlu).
3) Aksesuar dokunuşu ekle (1-2 öneri).
4) Sonunda tek cümlelik şiirsel bir stil ilhamı bırak.

Toplam 6-9 cümle. Çok uzun yazma.`;

      const photoSystem = `${baseSystem}

Kullanıcı sana giydiği bir kombinin fotoğrafını gönderdi. Fotoğrafı dikkatlice incele ve içten, sıcak, dürüst bir arkadaş gibi yorumla. Asla sert olma, her zaman cesaretlendir. Spesifik ve kişisel ol, asla genel geçer konuşma. Burcuna ve stil tipine doğal biçimde değin.

Yorumun şu unsurların hepsini akıcı bir metin içinde içersin (başlık veya madde işareti KULLANMA):
- Genel izlenim: kombinin enerjisi ve havası.
- Güçlü nokta: en iyi çalışan şey ("Bu parçanın kesimi senin duruşunu çok güçlendiriyor" gibi).
- Renk uyumu: renklerin birbirine ve sana nasıl yakıştığı.
- Aksesuar yorumu: aksesuarlar bütünü nasıl yükseltiyor ya da neyle daha güçlü olur.
- Kişisel enerji: kombin burç enerjisi ve stil tipiyle nasıl örtüşüyor.
- Öneri: kombini daha da güçlendirecek tek bir küçük dokunuş.
- Bitiş cümlesi: tek cümlelik, güçlü bir stil ilhamı.

Toplam 6-9 cümle. Doğal, akıcı bir Türkçe paragraf yaz.

Eğer fotoğrafta net bir kombin göremiyorsan, kibarca tekrar fotoğraf çekmesini iste; uydurma.`;

      const history = (data.history ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const userContent = hasImage
        ? [
            {
              type: "text" as const,
              text: userText || "Bu kombinim için ne düşünüyorsun?",
            },
            {
              type: "image" as const,
              image: data.imageDataUrl!,
            },
          ]
        : userText;

      const gateway = createLovableAiGatewayProvider(key);
      const result = await generateText({
        model: gateway(
          hasImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        ),
        system: hasImage ? photoSystem : textSystem,
        messages: [
          ...history,
          { role: "user" as const, content: userContent as any },
        ],
      });

      const text = result.text?.trim();
      if (!text || text.length < 10) {
        return {
          ok: false,
          reason: "error",
          message: hasImage
            ? "Fotoğrafı analiz edemedim, tekrar dener misin?"
            : "Şu an bağlantı kurulamıyor, birazdan tekrar dene.",
        };
      }
      return { ok: true, reply: text };
    } catch {
      return {
        ok: false,
        reason: "error",
        message: hasImage
          ? "Fotoğrafı analiz edemedim, tekrar dener misin?"
          : "Şu an bağlantı kurulamıyor, birazdan tekrar dene.",
      };
    }
  });
