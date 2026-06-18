import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function translateError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("session") || m.includes("expired") || m.includes("invalid"))
    return "Bağlantının süresi dolmuş ya da geçersiz. Lütfen yeniden şifre sıfırlama isteği gönder.";
  if (m.includes("password") && m.includes("short"))
    return "Şifren en az 6 karakter olmalı.";
  if (m.includes("network") || m.includes("failed to fetch"))
    return "İnternet bağlantını kontrol et ve tekrar dene.";
  return "Bir şeyler ters gitti. Lütfen tekrar dene.";
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasSession(true);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasSession(!!session);
      setReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr("Şifren en az 6 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setErr("Şifreler birbirleriyle eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => {
        navigate({ to: "/" });
      }, 1800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Hata";
      setErr(translateError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-md px-6 py-10">
      <div className="mb-10 text-center">
        <p className="section-label">A · U · R · A</p>
        <h1 className="mt-3 text-5xl font-light text-white">AURA ✦</h1>
        <p className="mt-2 text-sm text-[color:var(--aura-soft)]">
          Yeni şifreni belirle
        </p>
      </div>

      <div className="aura-card animate-aura-fade-in space-y-5 p-6">
        {!ready ? (
          <p className="text-center text-sm text-[color:var(--aura-soft)]">…</p>
        ) : !hasSession ? (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-light text-white">Bağlantı geçersiz</h2>
            <p className="text-sm text-[color:var(--aura-soft)]">
              Şifre sıfırlama bağlantısı geçersiz ya da süresi dolmuş. Lütfen yeniden bir bağlantı iste.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="aura-btn aura-btn-hover w-full"
            >
              GİRİŞE DÖN ✦
            </button>
          </div>
        ) : done ? (
          <div className="space-y-3 text-center">
            <h2 className="text-xl font-light text-white">Şifren güncellendi ✦</h2>
            <p className="text-sm text-[color:var(--aura-soft)]">
              Birazdan uygulamaya yönlendirileceksin.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <h2 className="text-2xl font-light text-white">Yeni Şifre</h2>

            <div>
              <label htmlFor="new-password" className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
                Yeni şifre
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[color:var(--border)] bg-[#0d0917] px-4 py-3 text-[15px] text-white placeholder:text-[color:var(--aura-muted)] outline-none focus:border-[color:var(--aura-lavender)]"
              />
              <p className="mt-1.5 text-[11px] text-[color:var(--aura-muted)]">En az 6 karakter.</p>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
                Şifreyi tekrarla
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-[color:var(--border)] bg-[#0d0917] px-4 py-3 text-[15px] text-white placeholder:text-[color:var(--aura-muted)] outline-none focus:border-[color:var(--aura-lavender)]"
              />
            </div>

            {err && (
              <p role="alert" aria-live="polite" className="text-[12px] text-red-300">{err}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="aura-btn aura-btn-hover w-full disabled:opacity-40"
            >
              {loading ? "…" : "ŞİFREYİ GÜNCELLE ✦"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
