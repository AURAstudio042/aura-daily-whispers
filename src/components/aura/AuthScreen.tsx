import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bir hata oluştu";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-6 py-10">
      <div className="mb-10 text-center">
        <p className="section-label">A · U · R · A</p>
        <h1 className="mt-3 text-5xl font-light text-white">AURA ✦</h1>
        <p className="mt-2 text-sm text-[color:var(--aura-soft)]">
          {mode === "login" ? "Tekrar hoş geldin." : "Senin için günlük bir ritüel."}
        </p>
      </div>

      <form onSubmit={submit} className="aura-card animate-aura-fade-in space-y-5 p-6">
        <h2 className="text-2xl font-light text-white">
          {mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
        </h2>

        <div>
          <label className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
            E-posta
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
            Şifre
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputCls}
          />
        </div>

        {err && (
          <p className="text-[12px] text-red-300">{err}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="aura-btn aura-btn-hover w-full disabled:opacity-40"
        >
          {loading ? "…" : mode === "login" ? "GİRİŞ YAP ✦" : "DEVAM ✦"}
        </button>

        <button
          type="button"
          onClick={() => { setErr(null); setMode(mode === "login" ? "signup" : "login"); }}
          className="w-full text-center text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)]"
        >
          {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[color:var(--border)] bg-[#0d0917] px-4 py-3 text-[15px] text-white placeholder:text-[color:var(--aura-muted)] outline-none focus:border-[color:var(--aura-lavender)]";
