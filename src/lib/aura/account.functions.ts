// Account deletion server functions.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("request_account_deletion");
    if (error) {
      console.error("[account] requestAccountDeletion:", error);
      throw new Error("Hesap silme isteği başarısız oldu.");
    }
    return { ok: true as const, deletedAt: new Date().toISOString() };
  });

export const cancelAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("cancel_account_deletion");
    if (error) {
      console.error("[account] cancelAccountDeletion:", error);
      throw new Error("İptal işlemi başarısız oldu.");
    }
    return { ok: true as const };
  });
