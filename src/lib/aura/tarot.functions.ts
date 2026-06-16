import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { TAROT_CATEGORIES, TAROT_DECK, pickCard, tarotLimitFor, type TarotLimit } from "./tarot-data";
import { buildPersonalizationGuidance } from "./data";

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
  bonusUsed?: boolean;
  bonusRemaining?: number;
};

async function fetchTrialActive(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("aura_plus_trials")
    .select("ends_at")
    .eq("user_id", userId)
    .gt("ends_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  return !!data;
}

async function fetchTier(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("tier").eq("id", userId).maybeSingle();
  let tier = (data?.tier as string) || "free";
  if (tier === "free" || tier === "plus" || tier === "aura+") {
    // Trial elevates to plus (not above premium)
    if (tier === "free") {
      const trial = await fetchTrialActive(supabase, userId);
      if (trial) tier = "plus";
    }
  }
  return tier;
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

async function fetchBonusCredits(supabase: any, userId: string): Promise<{ id: string }[]> {
  const { data } = await supabase
    .from("bonus_tarot_credits")
    .select("id")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .order("created_at", { ascending: true });
  return (data ?? []) as { id: string }[];
}

export const getTarotStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ tier: string; limit: TarotLimit; bonusCredits: number }> => {
    const tier = await fetchTier(context.supabase, context.userId);
    const used = await fetchUsage(context.supabase, context.userId, tier);
    const bonus = await fetchBonusCredits(context.supabase, context.userId);
    return { tier, limit: tarotLimitFor(tier, used), bonusCredits: bonus.length };
  });

export const drawTarot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ category: CategoryEnum, name: z.string().optional() }).parse(d))
  .handler(async ({ data, context }): Promise<TarotReadingResult> => {
    const tier = await fetchTier(context.supabase, context.userId);
    const used = await fetchUsage(context.supabase, context.userId, tier);
    let limit = tarotLimitFor(tier, used);

    // Determine whether we will consume a bonus credit
    let bonusCreditIdToConsume: string | null = null;
    const allowedByTier = tier !== "free" && limit.allowed;
    if (!allowedByTier) {
      const credits = await fetchBonusCredits(context.supabase, context.userId);
      if (credits.length === 0) {
        if (tier === "free") return { ok: false, reason: "free", limit };
        return { ok: false, reason: "limit", limit };
      }
      bonusCreditIdToConsume = credits[0].id;
    }

    const card = pickCard();
    const catObj = TAROT_CATEGORIES.find((c) => c.key === data.category)!;
    let interpretation = card.fallback[data.category] || card.meaning;

    try {
      const key = process.env.LOVABLE_API_KEY;
      if (key) {
        const { data: prof } = await context.supabase
          .from("profiles")
          .select("relationship_status, gender, life_focus, has_children, has_pets")
          .eq("id", context.userId)
          .maybeSingle();
        const personalization = buildPersonalizationGuidance({
          relationshipStatus: prof?.relationship_status ?? undefined,
          gender: prof?.gender ?? undefined,
          lifeFocus: (prof?.life_focus as string[] | null) ?? undefined,
          hasChildren: prof?.has_children ?? undefined,
          hasPets: prof?.has_pets ?? undefined,
        });
        const gateway = createLovableAiGatewayProvider(key);
        const result = await generateText({
          model: gateway("google/gemini-3-flash-preview"),
          system: "Sen AURA'sın — şiirsel, sıcak ve mistik bir Türkçe tarot yorumcusu. Yanıtın yalnızca düz Türkçe metin; markdown, başlık veya alıntı işareti kullanma.",
          prompt: `Tarot kartı: ${card.name}
Kartın genel anlamı: ${card.meaning}
Kullanıcının sorusu kategorisi: ${catObj.label}
Kullanıcı adı: ${data.name ?? "Kullanıcı"}
${personalization ? "\n" + personalization + "\n" : ""}
Bu karta ve bu kategoriye özel, 3-4 cümlelik kişisel, sıcak ve şiirsel bir Türkçe yorum yaz. Genelleme yapma. Klişelerden kaçın. Kullanıcının yaşam bağlamını doğal, ima yoluyla işle — asla doğrudan etiketleme. "— AURA" gibi imza ekleme.`,
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

    let bonusUsed = false;
    let bonusRemaining = 0;
    if (bonusCreditIdToConsume) {
      await context.supabase
        .from("bonus_tarot_credits")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", bonusCreditIdToConsume);
      bonusUsed = true;
      const remaining = await fetchBonusCredits(context.supabase, context.userId);
      bonusRemaining = remaining.length;
      // Tier limit stays unchanged when bonus is used
    } else {
      limit = tarotLimitFor(tier, used + 1);
      const remaining = await fetchBonusCredits(context.supabase, context.userId);
      bonusRemaining = remaining.length;
    }

    return {
      ok: true,
      card: { name: card.name, meaning: card.meaning, symbol: card.symbol },
      interpretation,
      category: data.category,
      categoryLabel: catObj.label,
      limit,
      bonusUsed,
      bonusRemaining,
    };
  });

// Reference deck export so the tree-shaker keeps fallback data
export const _deckSize = TAROT_DECK.length;
