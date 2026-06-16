import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function translateAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid_credentials") || m.includes("invalid email or password"))
    return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed"))
    return "E-postanı henüz doğrulamadın. Lütfen gelen kutunu kontrol et.";
  if (m.includes("user already registered") || m.includes("already registered") || m.includes("already exists"))
    return "Bu e-posta ile bir hesap zaten var. Giriş yapmayı dene.";
  if (m.includes("password") && m.includes("short"))
    return "Şifren en az 6 karakter olmalı.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Çok fazla deneme yaptın. Bir süre sonra tekrar dener misin?";
  if (m.includes("invalid email"))
    return "Geçersiz bir e-posta adresi.";
  if (m.includes("network") || m.includes("failed to fetch"))
    return "İnternet bağlantını kontrol et ve tekrar dene.";
  return "Bir şeyler ters gitti. Lütfen tekrar dene.";
}

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetSending, setResetSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfo("Hesabın oluşturuldu ✦ E-postana gönderdiğimiz bağlantıyla doğrulamayı tamamla.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bir hata oluştu";
      setErr(translateAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    setErr(null);
    setInfo(null);
    if (!email.trim()) {
      setErr("Önce e-posta adresini gir.");
      return;
    }
    setResetSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setInfo("Şifre sıfırlama bağlantısı e-postana gönderildi.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Hata";
      setErr(translateAuthError(msg));
    } finally {
      setResetSending(false);
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-md px-6 py-10">
      <div className="mb-10 text-center">
        <p className="section-label">A · U · R · A</p>
        <h1 className="mt-3 text-5xl font-light text-white">AURA ✦</h1>
        <p className="mt-2 text-sm text-[color:var(--aura-soft)]">
          {mode === "login" ? "Tekrar hoş geldin." : "Senin için günlük bir ritüel."}
        </p>
      </div>

      <form onSubmit={submit} className="aura-card animate-aura-fade-in space-y-5 p-6" noValidate>
        <h2 className="text-2xl font-light text-white">
          {mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
        </h2>

        <div>
          <label htmlFor="aura-email" className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
            E-posta
          </label>
          <input
            id="aura-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="aura-password" className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
            Şifre
          </label>
          <input
            id="aura-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputCls}
          />
          {mode === "signup" && (
            <p className="mt-1.5 text-[11px] text-[color:var(--aura-muted)]">
              En az 6 karakter.
            </p>
          )}
        </div>

        {err && (
          <p role="alert" aria-live="polite" className="text-[12px] text-red-300">{err}</p>
        )}
        {info && (
          <p role="status" aria-live="polite" className="text-[12px] text-[color:var(--aura-lavender)]">{info}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="aura-btn aura-btn-hover w-full disabled:opacity-40"
        >
          {loading ? "…" : mode === "login" ? "GİRİŞ YAP ✦" : "DEVAM ✦"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={resetSending}
            className="block w-full text-center text-[11px] tracking-[0.15em] text-[color:var(--aura-soft)] underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resetSending ? "Gönderiliyor…" : "Şifreni mi unuttun?"}
          </button>
        )}

        <button
          type="button"
          onClick={() => { setErr(null); setInfo(null); setMode(mode === "login" ? "signup" : "login"); }}
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
