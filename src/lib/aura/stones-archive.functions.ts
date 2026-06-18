import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type StoneEntry = {
  date: string;
  name: string;
  meaning: string;
  kind: "stone" | "scent";
};

export type ArchiveResult = {
  ok: true;
  stones: StoneEntry[];
  scents: StoneEntry[];
  favorites: { kind: "stone" | "scent"; name: string; meaning: string | null }[];
  locked: boolean;
};

export const getStoneArchive = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ArchiveResult> => {
    const { data: profile } = await context.supabase
      .from("profiles").select("tier").eq("id", context.userId).maybeSingle();
    const tier = (profile?.tier as string || "free").toLowerCase();
    const locked = tier === "free";

    const [contentRes, favRes] = await Promise.all([
      context.supabase
        .from("daily_content")
        .select("date, content")
        .eq("user_id", context.userId)
        .order("date", { ascending: false })
        .limit(180),
      context.supabase
        .from("stone_favorites")
        .select("kind, name, meaning")
        .eq("user_id", context.userId),
    ]);

    const stones: StoneEntry[] = [];
    const scents: StoneEntry[] = [];
    const seenStones = new Set<string>();
    const seenScents = new Set<string>();

    for (const row of contentRes.data ?? []) {
      const c = (row.content ?? {}) as Record<string, any>;
      const d = row.date as string;
      if (c.stone?.name && !seenStones.has(c.stone.name)) {
        seenStones.add(c.stone.name);
        stones.push({ date: d, name: c.stone.name, meaning: c.stone.meaning ?? "", kind: "stone" });
      }
      if (c.scent?.names && !seenScents.has(c.scent.names)) {
        seenScents.add(c.scent.names);
        scents.push({ date: d, name: c.scent.names, meaning: c.scent.feeling ?? "", kind: "scent" });
      }
    }

    return {
      ok: true,
      locked,
      stones,
      scents,
      favorites: (favRes.data ?? []) as ArchiveResult["favorites"],
    };
  });

export const toggleStoneFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      kind: z.enum(["stone", "scent"]),
      name: z.string().max(200),
      meaning: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("stone_favorites")
      .select("id")
      .eq("user_id", context.userId)
      .eq("kind", data.kind)
      .eq("name", data.name)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("stone_favorites").delete().eq("id", existing.id);
      return { favorited: false };
    }
    await context.supabase.from("stone_favorites").insert({
      user_id: context.userId,
      kind: data.kind,
      name: data.name,
      meaning: data.meaning ?? null,
    });
    return { favorited: true };
  });
