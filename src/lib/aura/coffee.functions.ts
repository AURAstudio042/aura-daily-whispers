import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildPersonalizationGuidance } from "./data";

export type CoffeeTier = "free" | "plus" | "premium";

export type CoffeeStatus = {
  tier: CoffeeTier;
  usedThisWeek: number;
  weeklyLimit: number; // 0 = unlimited
  remaining: number; // Infinity-like represented as -1 when unlimited
  unlimited: boolean;
  requiresAd: boolean;
};

export type CoffeeReadingRow = {
  id: string;
  reading: string;
  photo_url: string | null;
  created_at: string;
};

export type CoffeeAnalyzeResult =
  | {
      ok: true;
      id: string;
      reading: string;
      photoUrl: string | null;
      status: CoffeeStatus;
    }
  | {
      ok: false;
      reason: "limit" | "ad_required" | "error" | "unclear";
      message: string;
      status?: CoffeeStatus;
    };

function startOfWeekISO(): string {
  const now = new Date();
  const day = now.getDay(); // 0 Sun ... 1 Mon
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  return monday.toISOString();
}

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

async function fetchTier(supabase: any, userId: string): Promise<CoffeeTier> {
  const { data } = await supabase.from("profiles").select("tier").eq("id", userId).maybeSingle();
  let tier = ((data?.tier as string) || "free").toLowerCase();
  if (tier === "aura+") tier = "plus";
  if (tier !== "premium" && tier !== "plus") {
    const trial = await fetchTrialActive(supabase, userId);
    if (trial) tier = "plus";
  }
  return (tier as CoffeeTier) ?? "free";
}

function weeklyLimitFor(tier: CoffeeTier): number {
  if (tier === "premium") return 0;
  if (tier === "plus") return 3;
  return 2;
}

async function buildStatus(supabase: any, userId: string): Promise<CoffeeStatus> {
  const tier = await fetchTier(supabase, userId);
  const weeklyLimit = weeklyLimitFor(tier);
  const { count } = await supabase
    .from("coffee_readings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfWeekISO());
  const usedThisWeek = count ?? 0;
  const unlimited = weeklyLimit === 0;
  const remaining = unlimited ? -1 : Math.max(0, weeklyLimit - usedThisWeek);
  const requiresAd = tier === "free";
  return { tier, usedThisWeek, weeklyLimit, remaining, unlimited, requiresAd };
}

export const getCoffeeStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CoffeeStatus> => {
    return buildStatus(context.supabase, context.userId);
  });

export const listCoffeeReadings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CoffeeReadingRow[]> => {
    const { data } = await context.supabase
      .from("coffee_readings")
      .select("id, reading, photo_url, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as CoffeeReadingRow[];
  });

const AnalyzeInput = z.object({
  imageDataUrl: z
    .string()
    .max(12_000_000)
    .regex(/^data:image\/(png|jpeg|jpg|webp|heic|heif);base64,/i),
  adWatched: z.boolean().optional(),
  context: z
    .object({
      name: z.string().optional(),
      zodiac: z.string().optional(),
      mood: z.string().optional(),
    })
    .optional(),
});

async function uploadPhoto(
  supabase: any,
  userId: string,
  dataUrl: string,
): Promise<string | null> {
  try {
    const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/i);
    if (!match) return null;
    const mime = match[1].toLowerCase();
    const ext = mime.split("/")[1].replace("jpeg", "jpg");
    const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("coffee-photos")
      .upload(path, bytes, { contentType: mime, upsert: false });
    if (error) return null;
    const { data: signed } = await supabase.storage
      .from("coffee-photos")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed?.signedUrl ?? path;
  } catch {
    return null;
  }
}

const UNCLEAR_MARK = "[FINCAN_HENUZ_HAZIR_DEGIL]";

export const analyzeCoffeeReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data, context }): Promise<CoffeeAnalyzeResult> => {
    const status = await buildStatus(context.supabase, context.userId);

    if (!status.unlimited && status.remaining <= 0) {
      return {
        ok: false,
        reason: "limit",
        message:
          status.tier === "free"
            ? "Bu hafta 2 kahve falı hakkını kullandın. Pazartesi yenilenecek ya da AURA Premium ile sınırsız fal aç."
            : "Bu hafta 3 kahve falı hakkını kullandın. Pazartesi yenilenecek ya da AURA Premium ile sınırsız aç.",
        status,
      };
    }

    if (status.tier === "free" && !data.adWatched) {
      return {
        ok: false,
        reason: "ad_required",
        message: "Falını okumak için önce kısa bir reklam izlemelisin.",
        status,
      };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        ok: false,
        reason: "error",
        message: "Fotoğrafı analiz edemedim. Lütfen daha net bir fotoğraf dene.",
        status,
      };
    }

    const c = data.context ?? {};
    const system = `Sen AURA'sın — geleneksel Türk kahve falı yorumcusu, sıcak, mistik, umut veren bir ses. Asla korkutucu ya da olumsuz olma. Türkçe yaz. Markdown veya yıldız işareti KULLANMA — düz metin, başlıkları büyük harf olarak yaz.

Geleneksel Türk kahve falı sembollerini kullan: kuş (haber/özgürlük), at (yolculuk/güç), balık (bolluk/şans), yılan (dikkat/iyileşme), kalp (aşk), yüzük (bağ/söz), yol (yeni dönem), anahtar (fırsat), ağaç (büyüme), göz (koruma), yıldız (umut), kelebek (dönüşüm), gemi (uzaktan haber), el (yardım), taç (başarı), çiçek (mutluluk), ay (sezgi), güneş (aydınlanma), köpek (sadık dost), kapı (yeni başlangıç).

Yanıtın TAM olarak bu yapıda ve bu başlıklarla olmalı (başlıkları aynen kullan, her başlığı yeni satırda büyük harflerle yaz):

☕ Kahve Falın

GENEL ENERJİ:
[tek cümle]

ŞEKİLLER & SEMBOLLER:
[2-3 spesifik şekil, her biri kendi satırında "• " ile başlasın, ne gördüğünü ve geleneksel anlamını birlikte söyle]

AŞK & İLİŞKİLER:
[2-3 cümle, kişisel, sıcak]

İŞ & KARIYER:
[2-3 cümle]

YAKIN GELECEK:
[2-3 cümle, önümüzdeki haftalar]

GÜNÜN MESAJI:
[tek güçlü kapanış cümlesi]

— AURA ☕✨

Eğer fotoğrafta kahve fincanı yoksa veya telve şekilleri hiç seçilemiyorsa, sadece şunu döndür: ${UNCLEAR_MARK}`;

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

    const userContext = `Kullanıcı bilgileri:
- İsim: ${c.name ?? "—"}
- Burç: ${c.zodiac ?? "—"}
- Ruh hali: ${c.mood ?? "—"}
${personalization ? "\n" + personalization + "\n" : ""}
Bu kullanıcının kahve fincanı fotoğrafını incele ve falını oku. Burç enerjisine doğal biçimde değin (zorlama). Yaşam bağlamına (ilişki, odak) doğal, ima yoluyla değin — asla doğrudan etiketleme. Spesifik ol — fincanın neresinde ne gördüğünü söyle (sol taraf, dip, kenar gibi).`;


    try {
      const gateway = createLovableAiGatewayProvider(key);
      const result = await generateText({
        model: gateway("google/gemini-2.5-flash"),
        system,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: userContext },
              { type: "image", image: data.imageDataUrl },
            ] as any,
          },
        ],
      });
      const text = result.text?.trim() ?? "";

      if (!text || text.includes(UNCLEAR_MARK) || text.length < 80) {
        return {
          ok: false,
          reason: "unclear",
          message:
            "Fincanın henüz sırlarını saklamak istiyor, kahven dinlendikten sonra tekrar dene.",
          status,
        };
      }

      const photoUrl = await uploadPhoto(context.supabase, context.userId, data.imageDataUrl);

      const { data: inserted, error: insErr } = await context.supabase
        .from("coffee_readings")
        .insert({
          user_id: context.userId,
          reading: text,
          photo_url: photoUrl,
        })
        .select("id")
        .single();
      if (insErr || !inserted) {
        return {
          ok: false,
          reason: "error",
          message: "Fotoğrafı analiz edemedim. Lütfen daha net bir fotoğraf dene.",
          status,
        };
      }

      const newStatus = await buildStatus(context.supabase, context.userId);
      return {
        ok: true,
        id: inserted.id as string,
        reading: text,
        photoUrl,
        status: newStatus,
      };
    } catch {
      return {
        ok: false,
        reason: "error",
        message: "Fotoğrafı analiz edemedim. Lütfen daha net bir fotoğraf dene.",
        status,
      };
    }
  });

export const deleteCoffeeReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await context.supabase
      .from("coffee_readings")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });
