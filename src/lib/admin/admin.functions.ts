import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRICE_PLUS = 49.9;
const PRICE_PREMIUM = 99.9;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [total, today, profilesAll] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", startOfToday),
      supabaseAdmin.from("profiles").select("tier, updated_at, city, zodiac_sign, style_type, created_at"),
    ]);

    const profiles = profilesAll.data ?? [];
    const active7 = profiles.filter((p: any) => p.updated_at && p.updated_at >= d7).length;
    const active30 = profiles.filter((p: any) => p.updated_at && p.updated_at >= d30).length;
    const tiers = { free: 0, plus: 0, premium: 0 };
    for (const p of profiles as any[]) {
      const t = (p.tier ?? "free") as "free" | "plus" | "premium";
      tiers[t] = (tiers[t] ?? 0) + 1;
    }
    const totalCount = total.count ?? profiles.length;

    const thisMonthNew = profiles.filter((p: any) => p.created_at >= startOfMonth).length;
    const lastMonthNew = profiles.filter(
      (p: any) => p.created_at >= startOfLastMonth && p.created_at < startOfMonth,
    ).length;
    const growthPct = lastMonthNew === 0 ? (thisMonthNew > 0 ? 100 : 0) : ((thisMonthNew - lastMonthNew) / lastMonthNew) * 100;

    return {
      totalUsers: totalCount,
      todayNew: today.count ?? 0,
      active7,
      active30,
      tiers,
      revenue: {
        plusCount: tiers.plus,
        premiumCount: tiers.premium,
        plusRevenue: tiers.plus * PRICE_PLUS,
        premiumRevenue: tiers.premium * PRICE_PREMIUM,
        total: tiers.plus * PRICE_PLUS + tiers.premium * PRICE_PREMIUM,
        growthPct: Math.round(growthPct * 10) / 10,
        thisMonthNew,
        lastMonthNew,
      },
    };
  });

export const getUserMap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("city, zodiac_sign, style_type");
    const rows = (data as any[]) ?? [];
    const tally = (key: string, n: number) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const v = (r[key] ?? "").toString().trim();
        if (!v) continue;
        m.set(v, (m.get(v) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, count]) => ({ label, count }));
    };
    return {
      cities: tally("city", 10),
      zodiacs: tally("zodiac_sign", 12),
      styles: tally("style_type", 10),
    };
  });

export const getUsageAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const d30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const [views, shares, savedQuotes, tarotCount, mysticViews, totalUsers] = await Promise.all([
      supabaseAdmin.from("page_views").select("route, user_id, viewed_at").gte("viewed_at", d30),
      supabaseAdmin.from("share_events").select("kind", { count: "exact" }),
      supabaseAdmin.from("saved_quotes").select("quote_text"),
      supabaseAdmin.from("tarot_readings").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("page_views").select("id", { count: "exact", head: true }).eq("route", "/mistik"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const viewRows = (views.data as any[]) ?? [];
    const routeCounts = new Map<string, number>();
    const usersByDay = new Map<string, Set<string>>();
    for (const v of viewRows) {
      routeCounts.set(v.route, (routeCounts.get(v.route) ?? 0) + 1);
      if (v.user_id) {
        const day = (v.viewed_at as string).slice(0, 10);
        if (!usersByDay.has(day)) usersByDay.set(day, new Set());
        usersByDay.get(day)!.add(v.user_id);
      }
    }
    const sections = [...routeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([route, count]) => ({ route, count }));

    const totalDailyOpens = [...usersByDay.values()].reduce((s, set) => s + set.size, 0);
    const avgDailyOpens = usersByDay.size > 0 ? totalDailyOpens / usersByDay.size : 0;

    const quoteMap = new Map<string, number>();
    for (const q of (savedQuotes.data as any[]) ?? []) {
      const t = (q.quote_text ?? "").toString();
      if (!t) continue;
      quoteMap.set(t, (quoteMap.get(t) ?? 0) + 1);
    }
    const topQuotes = [...quoteMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([text, count]) => ({ text, count }));

    return {
      sections,
      topQuotes,
      shareCount: shares.count ?? 0,
      tarotCount: tarotCount.count ?? 0,
      mysticViews: mysticViews.count ?? 0,
      avgDailyOpens: Math.round(avgDailyOpens * 10) / 10,
      totalUsers: totalUsers.count ?? 0,
    };
  });

// Content management
export const listContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "whispers" | "quotes" | "mystic" | "special_days" }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "whispers" ? "whispers_pool"
      : data.kind === "quotes" ? "quotes_pool"
      : data.kind === "mystic" ? "mystic_pool"
      : "special_day_messages";
    const { data: rows } = await supabaseAdmin.from(table as any).select("*").order("created_at", { ascending: false }).limit(200);
    return { rows: (rows as any[]) ?? [] };
  });

export const addContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "whispers" | "quotes" | "mystic" | "special_days"; payload: Record<string, any> }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "whispers" ? "whispers_pool"
      : data.kind === "quotes" ? "quotes_pool"
      : data.kind === "mystic" ? "mystic_pool"
      : "special_day_messages";
    const { error } = await supabaseAdmin.from(table as any).insert(data.payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "whispers" | "quotes" | "mystic" | "special_days"; id: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "whispers" ? "whispers_pool"
      : data.kind === "quotes" ? "quotes_pool"
      : data.kind === "mystic" ? "mystic_pool"
      : "special_day_messages";
    const { error } = await supabaseAdmin.from(table as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// User management
export const searchUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = (data.q ?? "").trim();
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const users = authList?.users ?? [];
    const matched = q
      ? users.filter((u) => (u.email ?? "").toLowerCase().includes(q.toLowerCase()))
      : users.slice(0, 50);
    const ids = matched.map((u) => u.id);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("*").in("id", ids);
    const profMap = new Map((profiles as any[] ?? []).map((p) => [p.id, p]));
    const filtered = matched
      .map((u) => {
        const p = profMap.get(u.id);
        return {
          id: u.id,
          email: u.email ?? "",
          name: p?.name ?? "—",
          tier: p?.tier ?? "free",
          city: p?.city ?? "",
          zodiac: p?.zodiac_sign ?? "",
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at,
        };
      })
      .filter((u) =>
        q
          ? u.email.toLowerCase().includes(q.toLowerCase()) ||
            (u.name as string).toLowerCase().includes(q.toLowerCase())
          : true,
      )
      .slice(0, 50);
    return { users: filtered };
  });

export const grantPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; tier: "plus" | "premium"; days: number }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ends = new Date(Date.now() + data.days * 86400000).toISOString();
    const { error: ge } = await supabaseAdmin.from("premium_grants").insert({
      user_id: data.userId,
      tier: data.tier,
      ends_at: ends,
      granted_by: context.userId,
    });
    if (ge) throw new Error(ge.message);
    const { error: pe } = await supabaseAdmin.from("profiles").update({ tier: data.tier }).eq("id", data.userId);
    if (pe) throw new Error(pe.message);
    return { ok: true };
  });
