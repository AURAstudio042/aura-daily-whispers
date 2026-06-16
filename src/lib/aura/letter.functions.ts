import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export type FutureLetter = {
  id: string;
  letter: string;
  created_at: string;
  deliver_at: string;
  opened_at: string | null;
  unlocked: boolean;
  answers: Record<string, string>;
};

const AnswersSchema = z.object({
  current_focus: z.string().min(1).max(500),
  three_months: z.string().min(1).max(500),
  forgive: z.string().min(1).max(500),
  happiness: z.string().min(1).max(500),
  message: z.string().min(1).max(500),
});

export const getLetterStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ tier: string; letters: FutureLetter[] }> => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("tier")
      .eq("id", context.userId)
      .maybeSingle();
    const tier = (profile?.tier as string) || "free";

    const { data: rows } = await context.supabase
      .from("future_letters")
      .select("id, letter, created_at, deliver_at, opened_at, answers")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    const now = Date.now();
    const letters: FutureLetter[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      letter: r.letter,
      created_at: r.created_at,
      deliver_at: r.deliver_at,
      opened_at: r.opened_at,
      unlocked: new Date(r.deliver_at).getTime() <= now,
      answers: (r.answers ?? {}) as Record<string, string>,
    }));

    return { tier, letters };
  });

export const markLetterOpened = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("future_letters")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("opened_at", null);
    return { ok: true };
  });

export const createFutureLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        answers: AnswersSchema,
        context: z
          .object({
            name: z.string().optional(),
            zodiac: z.string().optional(),
            style: z.string().optional(),
            mood: z.string().optional(),
          })
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<
    | { ok: true; letter: FutureLetter }
    | { ok: false; reason: "locked" | "error"; message: string }
  > => {
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
        message: "Bu özellik yalnızca AURA Premium üyelerine açıktır.",
      };
    }

    try {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) {
        return { ok: false, reason: "error", message: "Mektubun hazırlanıyor, birazdan tekrar dene." };
      }

      const c = data.context ?? {};
      const a = data.answers;
      const today = new Date();
      const deliver = new Date(today);
      deliver.setMonth(deliver.getMonth() + 3);

      const system = `Sen kullanıcının üç ay sonraki "gelecekteki kendi"sisin. Ona, geçmişteki haline derinden, sıcak ve şiirsel bir mektup yaz. Türkçe yaz.

Kurallar:
- Mektup düz akıcı bir paragraf akışında olsun (başlık, madde işareti, emoji bombardımanı yok).
- "Sevgili ${c.name ?? "sen"}" gibi tek bir doğal hitapla başla.
- Onun cevaplarına spesifik olarak değin; üzerinde çalıştığı şeyi, üç ay sonra olmak istediği yeri, affetmesi gerekeni, mutlu eden şeyi ve kendine vermek istediği mesajı isimlendir.
- Burç enerjisi (${c.zodiac ?? "—"}) ve stil tipi (${c.style ?? "—"}) onun ruhuna doğal biçimde dokunsun, klişe astroloji yapma.
- Cesaretlendirici ama dürüst ol; sahte iyimserlik yok.
- 5-7 cümle. Çok uzun yazma.
- Sonunda tek cümlelik güçlü bir kapanış bırak.
- Mektup "— Gelecekteki Sen 🌙" imzasıyla bitsin.

Bugünün tarihi: ${today.toLocaleDateString("tr-TR")}.`;

      const userPrompt = `Cevapları:
1) Şu an üzerinde çalıştığım: ${a.current_focus}
2) Üç ay sonra olmak istediğim yer: ${a.three_months}
3) Kendime affetmem gereken: ${a.forgive}
4) Beni en çok mutlu eden: ${a.happiness}
5) Kendime vermek istediğim mesaj: ${a.message}

Şimdi bu kişiye, üç ay sonraki halinden bir mektup yaz.`;

      const gateway = createLovableAiGatewayProvider(key);
      const result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text = result.text?.trim();
      if (!text || text.length < 40) {
        return { ok: false, reason: "error", message: "Mektubun hazırlanıyor, birazdan tekrar dene." };
      }

      const finalText = /Gelecekteki Sen/i.test(text) ? text : `${text}\n\n— Gelecekteki Sen 🌙`;

      const { data: inserted, error } = await context.supabase
        .from("future_letters")
        .insert({
          user_id: context.userId,
          answers: a,
          letter: finalText,
          deliver_at: deliver.toISOString(),
        })
        .select("id, letter, created_at, deliver_at, opened_at, answers")
        .single();

      if (error || !inserted) {
        return { ok: false, reason: "error", message: "Mektubun hazırlanıyor, birazdan tekrar dene." };
      }

      const row: any = inserted;
      return {
        ok: true,
        letter: {
          id: row.id,
          letter: row.letter,
          created_at: row.created_at,
          deliver_at: row.deliver_at,
          opened_at: row.opened_at,
          unlocked: new Date(row.deliver_at).getTime() <= Date.now(),
          answers: row.answers,
        },
      };
    } catch {
      return { ok: false, reason: "error", message: "Mektubun hazırlanıyor, birazdan tekrar dene." };
    }
  });
