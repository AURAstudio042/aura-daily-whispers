import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { TAROT_CATEGORIES, TAROT_DECK, pickCard, tarotLimitFor, type TarotLimit } from "./tarot-data";

const CategoryEnum = z.enum(
  TAROT_CATEGORIES.map((c) => c.key) as [string, ...string[]],
);

export type TarotReadingResult = {
  ok: boolean;
  reason?: "limit" | "free" | "unauth";
  card?: { name: string; meaning: string; symbol: string };
  interpretation?: string;
  category?: string;
  categoryLabel?: string;
  limit?: TarotLimit;
};

async function fetchTier(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("tier").eq("id", userId).maybeSingle();
  return (data?.tier as string) || "free";
}

async function fetchUsage(supabase: any, userId: string, tier: string): Promise<number> {
  const now = new Date();
  const since = tier === "premium"
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("tarot_readings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  return count ?? 0;
}

export const getTarotStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ tier: string; limit: TarotLimit }> => {
    const tier = await fetchTier(context.supabase, context.userId);
    const used = await fetchUsage(context.supabase, context.userId, tier);
    return { tier, limit: tarotLimitFor(tier, used) };
  });

export const drawTarot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ category: CategoryEnum, name: z.string().optional() }).parse(d))
  .handler(async ({ data, context }): Promise<TarotReadingResult> => {
    const tier = await fetchTier(context.supabase, context.userId);
    if (tier === "free") {
      return { ok: false, reason: "free", limit: tarotLimitFor(tier, 0) };
    }
    const used = await fetchUsage(context.supabase, context.userId, tier);
    const limit = tarotLimitFor(tier, used);
    if (!limit.allowed) {
      return { ok: false, reason: "limit", limit };
    }

    const card = pickCard();
    const catObj = TAROT_CATEGORIES.find((c) => c.key === data.category)!;
    let interpretation = card.fallback[data.category] || card.meaning;

    try {
      const key = process.env.LOVABLE_API_KEY;
      if (key) {
        const gateway = createLovableAiGatewayProvider(key);
        const result = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          system: "Sen AURA'sın — şiirsel, sıcak ve mistik bir Türkçe tarot yorumcusu. Yanıtın yalnızca düz Türkçe metin; markdown, başlık veya alıntı işareti kullanma.",
          prompt: `Tarot kartı: ${card.name}
Kartın genel anlamı: ${card.meaning}
Kullanıcının sorusu kategorisi: ${catObj.label}
Kullanıcı adı: ${data.name ?? "Kullanıcı"}

Bu karta ve bu kategoriye özel, 3-4 cümlelik kişisel, sıcak ve şiirsel bir Türkçe yorum yaz. Genelleme yapma. Klişelerden kaçın. "— AURA" gibi imza ekleme.`,
        });
        const text = result.text?.trim();
        if (text && text.length > 20) interpretation = text;
      }
    } catch {
      // fallback already set
    }

    await context.supabase.from("tarot_readings").insert({
      user_id: context.userId,
      category: data.category,
      card_name: card.name,
      card_meaning: card.meaning,
      interpretation,
    });

    const nextLimit = tarotLimitFor(tier, used + 1);
    return {
      ok: true,
      card: { name: card.name, meaning: card.meaning, symbol: card.symbol },
      interpretation,
      category: data.category,
      categoryLabel: catObj.label,
      limit: nextLimit,
    };
  });

// Reference deck export so the tree-shaker keeps fallback data
export const _deckSize = TAROT_DECK.length;
