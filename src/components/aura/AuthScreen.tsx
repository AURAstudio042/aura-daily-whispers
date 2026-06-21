import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { APP_URL, RESET_PASSWORD_URL } from "@/lib/app-url";


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
  if (m.includes("rate limit") || m.includes("too many") || m.includes("you can only request this after") || m.includes("over_email_send_rate_limit"))
    return "Az önce bir bağlantı gönderdik. Lütfen ~1 dakika bekleyip tekrar dene (ve spam / gereksiz klasörünü de kontrol et).";
  if (m.includes("invalid email"))
    return "Geçersiz bir e-posta adresi.";
  if (m.includes("network") || m.includes("failed to fetch"))
    return "İnternet bağlantını kontrol et ve tekrar dene.";
  return "Bir şeyler ters gitti. Lütfen tekrar dene.";
}

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const [resendingVerify, setResendingVerify] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function signInWithGoogle() {
    setErr(null);
    setInfo(null);
    setGoogleLoading(true);
    try {
      // OAuth must return to the tab/origin that started the flow.
      // Using a hardcoded production URL breaks preview + mobile in-app browsers
      // (the originating tab never receives the session and shows a generic error
      // even when Google auth succeeded server-side).
      const origin =
        typeof window !== "undefined" ? window.location.origin : APP_URL;
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: origin,
      });
      if (result.error) {
        const msg = result.error instanceof Error ? result.error.message : String(result.error);
        setErr(translateAuthError(msg));
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) {
        // Browser is navigating to Google; keep loading state until redirect.
        return;
      }
      // Tokens returned → session set; useUser picks it up.
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Google ile giriş başarısız.";
      setErr(translateAuthError(msg));
      setGoogleLoading(false);
    }
  }


  async function resendVerification() {
    if (!pendingVerifyEmail) return;
    setErr(null);
    setInfo(null);
    setResendingVerify(true);
    console.info("[auth][resend] requesting signup verification resend", { email: pendingVerifyEmail });
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: pendingVerifyEmail,
        options: { emailRedirectTo: APP_URL },
      });
      if (error) {
        console.error("[auth][resend] failed", { message: error.message });
        throw error;
      }
      setInfo("Doğrulama maili tekrar gönderildi ✦ Gelmediyse spam / gereksiz klasörünü de kontrol et.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Hata";
      setErr(translateAuthError(msg));
    } finally {
      setResendingVerify(false);
    }
  }




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
          options: { emailRedirectTo: APP_URL },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setPendingVerifyEmail(email);
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

  async function onForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    const target = resetEmail.trim();
    if (!target) {
      setErr("Lütfen e-posta adresini gir.");
      return;
    }
    // basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      setErr("Geçersiz bir e-posta adresi.");
      return;
    }
    setResetSending(true);
    const redirectTo = RESET_PASSWORD_URL;
    console.info("[auth][reset] requesting password reset", { email: target, redirectTo, at: new Date().toISOString() });
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo,
      });
      if (error) {
        console.error("[auth][reset] failed", { email: target, message: error.message, status: (error as { status?: number }).status });
        throw error;
      }
      console.info("[auth][reset] request accepted by backend", { email: target, data });
      setInfo("Şifre sıfırlama bağlantısı e-posta adresine gönderildi. Gelmediyse spam / gereksiz klasörünü de kontrol et.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Hata";
      setErr(translateAuthError(msg));
    } finally {
      setResetSending(false);
    }
  }


  if (mode === "forgot") {
    return (
      <div className="mx-auto min-h-[100dvh] w-full max-w-md px-6 py-10">
        <div className="mb-10 text-center">
          <p className="section-label">A · U · R · A</p>
          <h1 className="mt-3 text-5xl font-light text-white">AURA ✦</h1>
          <p className="mt-2 text-sm text-[color:var(--aura-soft)]">
            Şifreni sıfırla
          </p>
        </div>

        <form onSubmit={onForgotSubmit} className="aura-card animate-aura-fade-in space-y-5 p-6" noValidate>
          <h2 className="text-2xl font-light text-white">Şifremi Unuttum</h2>
          <p className="text-sm text-[color:var(--aura-soft)]">
            E-posta adresini gir, sana yeni şifre belirleme bağlantısı gönderelim.
          </p>

          <div>
            <label htmlFor="aura-reset-email" className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
              E-posta
            </label>
            <input
              id="aura-reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              autoComplete="email"
              inputMode="email"
              className={inputCls}
            />
          </div>

          {err && (
            <p role="alert" aria-live="polite" className="text-[12px] text-red-300">{err}</p>
          )}
          {info && (
            <p role="status" aria-live="polite" className="text-[12px] text-[color:var(--aura-lavender)]">{info}</p>
          )}

          <button
            type="submit"
            disabled={resetSending}
            className="aura-btn aura-btn-hover w-full disabled:opacity-40"
          >
            {resetSending ? "…" : "BAĞLANTIYI GÖNDER ✦"}
          </button>

          <button
            type="button"
            onClick={() => { setErr(null); setInfo(null); setMode("login"); }}
            className="w-full text-center text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)]"
          >
            Girişe dön
          </button>
        </form>
      </div>
    );
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

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading || loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-[14px] font-medium text-[#1f1f1f] transition active:scale-[0.98] disabled:opacity-50"
        >
          <GoogleIcon />
          {googleLoading ? "Google'a yönlendiriliyor…" : mode === "login" ? "Google ile Giriş Yap" : "Google ile Devam Et"}
        </button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[color:var(--border)]" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">veya</span>
          <span className="h-px flex-1 bg-[color:var(--border)]" />
        </div>



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

        {mode === "signup" && pendingVerifyEmail && (
          <button
            type="button"
            onClick={resendVerification}
            disabled={resendingVerify}
            className="block w-full text-center text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-lavender)] underline-offset-4 hover:underline disabled:opacity-40"
          >
            {resendingVerify ? "Gönderiliyor…" : "Doğrulama mailini tekrar gönder ✦"}
          </button>
        )}

        {mode === "login" && (
          <button
            type="button"
            onClick={() => { setErr(null); setInfo(null); setResetEmail(email); setMode("forgot"); }}
            className="block w-full text-center text-[11px] tracking-[0.15em] text-[color:var(--aura-soft)] underline-offset-4 hover:underline"
          >
            Şifreni mi unuttun?
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}


const inputCls =

  "w-full rounded-xl border border-[color:var(--border)] bg-[#0d0917] px-4 py-3 text-[15px] text-white placeholder:text-[color:var(--aura-muted)] outline-none focus:border-[color:var(--aura-lavender)]";
