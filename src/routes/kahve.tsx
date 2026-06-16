import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell, ShareSignature } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName, zodiacOf } from "@/lib/aura/store";
import {
  analyzeCoffeeReading,
  claimCoffeeAd,
  getCoffeeStatus,
  listCoffeeReadings,
  type CoffeeStatus,
  type CoffeeReadingRow,
} from "@/lib/aura/coffee.functions";
import { shareNodeAsStory } from "@/lib/aura/share";

export const Route = createFileRoute("/kahve")({
  head: () => ({
    meta: [
      { title: "Kahve Falım ☕ AURA" },
      {
        name: "description",
        content: "Türk kahve falı — AURA fincanını okur, sana özel bir yorum bırakır.",
      },
    ],
  }),
  component: KahvePage,
});

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("read_error"));
    r.readAsDataURL(file);
  });
}

function KahvePage() {
  const [u, , ready, authed] = useUser();
  const statusFn = useServerFn(getCoffeeStatus);
  const analyzeFn = useServerFn(analyzeCoffeeReading);
  const claimAdFn = useServerFn(claimCoffeeAd);
  const listFn = useServerFn(listCoffeeReadings);

  const [status, setStatus] = useState<CoffeeStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [adWatching, setAdWatching] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [reading, setReading] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CoffeeReadingRow[]>([]);
  const [sharing, setSharing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoRef = useRef<string | null>(null);
  const readingRef = useRef<HTMLDivElement>(null);
  const adIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([statusFn(), listFn()]);
      setStatus(s as CoffeeStatus);
      setHistory((h as CoffeeReadingRow[]) ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false);
    }
  }, [statusFn, listFn]);

  useEffect(() => {
    if (authed && u) refresh();
  }, [authed, u, refresh]);

  // Cleanup ad interval on unmount so navigating away doesn't leak the timer
  useEffect(() => {
    return () => {
      if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    };
  }, []);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const runAnalysis = async (dataUrl: string) => {
    setAnalyzing(true);
    setError(null);
    setReading(null);
    try {
      const res = (await analyzeFn({
        data: {
          imageDataUrl: dataUrl,
          context: {
            name: userName(u),
            zodiac: zodiacOf(u),
            mood: u.mood,
          },
        },
      })) as Awaited<ReturnType<typeof analyzeCoffeeReading>>;
      if (res.ok) {
        setReading(res.reading);
        setStatus(res.status);
        // refresh history
        try {
          const h = await listFn();
          setHistory((h as CoffeeReadingRow[]) ?? []);
        } catch {}
      } else {
        setError(res.message);
        if (res.status) setStatus(res.status);
      }
    } catch {
      setError("Fotoğrafı analiz edemedim. Lütfen daha net bir fotoğraf dene.");
    } finally {
      setAnalyzing(false);
      pendingPhotoRef.current = null;
    }
  };


  const startAdAndAnalyze = async (dataUrl: string) => {
    // Claim a server-side ad grant first; server validates and rate-limits.
    try {
      const claim = (await claimAdFn()) as { ok: boolean };
      if (!claim?.ok) {
        setError("Reklam doğrulanamadı, lütfen tekrar dene.");
        return;
      }
    } catch {
      setError("Reklam doğrulanamadı, lütfen tekrar dene.");
      return;
    }
    setAdWatching(true);
    setAdCountdown(5);
    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    adIntervalRef.current = setInterval(() => {
      setAdCountdown((s) => {
        if (s <= 1) {
          if (adIntervalRef.current) {
            clearInterval(adIntervalRef.current);
            adIntervalRef.current = null;
          }
          setAdWatching(false);
          runAnalysis(dataUrl);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };


  const onFilePicked = async (file: File | null) => {
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhotoPreview(dataUrl);
      setReading(null);
      setError(null);
      pendingPhotoRef.current = dataUrl;
      if (!status) return;
      if (!status.unlimited && status.remaining <= 0) {
        setError(
          status.tier === "free"
            ? "Bu hafta 2 kahve falı hakkını kullandın. Pazartesi yenilenecek ya da AURA Premium ile sınırsız aç."
            : "Bu hafta 3 kahve falı hakkını kullandın. Pazartesi yenilenecek ya da AURA Premium ile sınırsız aç.",
        );
        return;
      }
      if (status.requiresAd) {
        startAdAndAnalyze(dataUrl);
      } else {
        runAnalysis(dataUrl, false);
      }
    } catch {
      setError("Fotoğrafı analiz edemedim. Lütfen daha net bir fotoğraf dene.");
    }
  };

  const onNewReading = () => {
    setReading(null);
    setPhotoPreview(null);
    setError(null);
    fileInputRef.current?.click();
  };

  const onShare = async () => {
    if (!reading || sharing) return;
    setSharing(true);
    try {
      await shareNodeAsStory(readingRef.current, {
        title: "AURA Kahve Falım",
        text: `☕ AURA Kahve Falım\n\n${reading}\n\n— AURA ✨`,
        filename: "aura-kahve-fali.png",
      });
    } finally {
      setSharing(false);
    }
  };

  const quotaText = status
    ? status.unlimited
      ? "Sınırsız fal hakkın var ✦"
      : `Bu hafta: ${status.usedThisWeek} / ${status.weeklyLimit}`
    : "—";

  return (
    <AuraShell>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          // Reset value so picking the same file again still fires onChange
          e.target.value = "";
          onFilePicked(f);
        }}
      />

      <header className="relative mb-6 animate-aura-fade-in">
        <div className="aura-glow -left-10 -top-16 h-56 w-56 bg-[#8b5cf6]/35" />
        <div className="aura-glow -right-10 top-4 h-44 w-44 bg-[#c79468]/25" />
        <p className="section-label">A · U · R · A · KAHVE FALI</p>
        <h1 className="serif mt-3 text-[40px] leading-[1.05] font-light text-white">
          Kahve Falım{" "}
          <span className="text-[#d4a373]">☕</span>
        </h1>
        <p className="mt-2 text-[14px] italic text-[color:var(--aura-soft)]">
          Fincanını çevir, AURA'ya bırak ☕
        </p>
        <p className="mt-3 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">
          {loadingStatus ? "✦ hazırlanıyor…" : quotaText}
        </p>
      </header>

      {/* CAPTURE / PREVIEW */}
      {!reading && (
        <section
          className="aura-card-dark relative mb-5 overflow-hidden p-6 text-center animate-aura-fade-in"
          style={{ minHeight: 320 }}
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#d4a373]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-44 w-44 rounded-full bg-[color:var(--aura-purple)]/25 blur-3xl" />

          {adWatching ? (
            <div className="relative grid place-items-center" style={{ minHeight: 240 }}>
              <CoffeeCup steaming />
              <p className="mt-5 text-[11px] tracking-[0.3em] uppercase text-[#d4a373]">
                ✦ Reklam izleniyor · {adCountdown}s ✦
              </p>
              <p className="mt-1 text-[12px] italic text-[color:var(--aura-soft)]">
                Falın hemen ardından açılıyor…
              </p>
            </div>
          ) : analyzing ? (
            <div className="relative grid place-items-center" style={{ minHeight: 240 }}>
              <CoffeeCup steaming />
              <p className="mt-5 text-[11px] tracking-[0.3em] uppercase text-[#d4a373] animate-aura-pulse">
                ✦ Telve okunuyor ✦
              </p>
              <p className="mt-1 text-[12px] italic text-[color:var(--aura-soft)]">
                Fincanın sırları aralanıyor…
              </p>
            </div>
          ) : photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Fincan"
                className="mx-auto max-h-56 w-auto rounded-2xl border border-white/10"
              />
              <p className="mt-4 text-[12px] italic text-[color:var(--aura-soft)]">
                Fotoğrafın hazır.
              </p>
            </div>
          ) : (
            <div className="relative grid place-items-center" style={{ minHeight: 240 }}>
              <CoffeeCup />
              <p className="mt-5 text-[13px] italic text-[color:var(--aura-soft)]">
                Fincanını çevir, AURA'ya bırak.
              </p>
              <p className="mt-1 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">
                Net bir fotoğraf paylaş
              </p>
            </div>
          )}
        </section>
      )}

      {error && !analyzing && !adWatching && (
        <p className="aura-card mb-4 p-4 text-center text-[13px] text-[color:var(--aura-soft)]">
          {error}
        </p>
      )}

      {!reading && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing || adWatching}
          className="aura-btn aura-btn-hover w-full text-[13px] disabled:opacity-60"
        >
          📸 Fotoğraf Çek veya Yükle
        </button>
      )}

      {status?.tier === "free" && !reading && (
        <p className="mt-3 text-center text-[11px] text-[color:var(--aura-muted)]">
          Her okuma öncesi kısa bir reklam izlenir · AURA Premium ile reklamsız & sınırsız
        </p>
      )}

      {/* READING */}
      {reading && (
        <>
          <section
            ref={readingRef}
            className="aura-card-dark relative mb-5 overflow-hidden p-6 animate-aura-fade-in"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#d4a373]/20 blur-3xl" />
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#d4a373]">
              ☕ AURA Kahve Falım
            </p>
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Fincan"
                className="mx-auto mt-4 max-h-40 w-auto rounded-xl border border-white/10 opacity-80"
              />
            )}
            <ReadingBody text={reading} />
            <p className="mt-5 text-right text-[10px] tracking-[0.35em] text-[color:var(--aura-muted)]">
              — AURA ✨
            </p>
          </section>

          <div className="flex gap-2">
            <button
              onClick={onShare}
              disabled={sharing}
              className="aura-btn aura-btn-hover flex-1 text-[12px] disabled:opacity-60"
            >
              {sharing ? "✦ Hazırlanıyor…" : "✦ Paylaş ✦"}
            </button>
            <button
              onClick={onNewReading}
              disabled={
                status ? !status.unlimited && status.remaining <= 0 : false
              }
              className="flex-1 rounded-full border border-[color:var(--border)] bg-white/[0.03] py-3 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-soft)] disabled:opacity-50"
            >
              Yeni Fal
            </button>
          </div>

          {status && !status.unlimited && status.remaining <= 0 && (
            <p className="mt-3 text-center text-[11px] text-[color:var(--aura-muted)]">
              Bu haftaki hakların doldu. Pazartesi yenilenecek ✦
            </p>
          )}
        </>
      )}

      {/* HISTORY PREVIEW */}
      {history.length > 0 && (
        <section className="mt-8 animate-aura-fade-in">
          <p className="section-label mb-3">A · U · R · A · GEÇMİŞ FALLARIN</p>
          <ul className="space-y-3">
            {history.slice(0, 3).map((r) => (
              <li key={r.id} className="aura-card p-4">
                <div className="flex gap-3">
                  {r.photo_url ? (
                    <img
                      src={r.photo_url}
                      alt="Fincan"
                      className="h-16 w-16 shrink-0 rounded-lg border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-white/10 text-2xl">
                      ☕
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-[#d4a373]">
                      {new Date(r.created_at).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "long",
                      })}
                    </p>
                    <p className="mt-1 line-clamp-3 text-[12px] text-[color:var(--aura-soft)]">
                      {firstParagraph(r.reading)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">
            Tümü Arşiv'de
          </p>
        </section>
      )}

      <ShareSignature />
    </AuraShell>
  );
}

function firstParagraph(text: string): string {
  const stripped = text.replace(/^☕[^\n]*\n*/, "");
  const idx = stripped.indexOf("GENEL ENERJİ:");
  if (idx >= 0) {
    const after = stripped.slice(idx + "GENEL ENERJİ:".length).trim();
    const end = after.indexOf("\n");
    return (end > 0 ? after.slice(0, end) : after).trim();
  }
  return stripped.slice(0, 140);
}

function ReadingBody({ text }: { text: string }) {
  // Render with bold headings on their own lines
  const lines = text.split(/\r?\n/);
  return (
    <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-white">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return <div key={i} className="h-1" />;
        if (/^☕ ?Kahve Falın/i.test(line)) {
          return (
            <p key={i} className="serif text-[22px] italic text-white">
              {line}
            </p>
          );
        }
        if (/^—\s*AURA/i.test(line)) {
          return null; // signature rendered outside
        }
        const head = line.match(
          /^(GENEL ENERJİ|ŞEKİLLER ?&? ?SEMBOLLER|AŞK ?&? ?İLİŞKİLER|İŞ ?&? ?KARİYER|İŞ ?&? ?KARYER|YAKIN GELECEK|GÜNÜN MESAJI):?$/i,
        );
        if (head) {
          return (
            <p
              key={i}
              className="mt-3 text-[10px] tracking-[0.3em] uppercase text-[#d4a373]"
            >
              {line.replace(/:$/, "")}
            </p>
          );
        }
        if (/^[•\-]/.test(line)) {
          return (
            <p key={i} className="pl-3 text-[14px] text-[color:var(--aura-soft)]">
              {line.replace(/^[-•]\s*/, "• ")}
            </p>
          );
        }
        return (
          <p key={i} className="text-[14px] text-white">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function CoffeeCup({ steaming = false }: { steaming?: boolean }) {
  return (
    <div className="relative grid place-items-center">
      {steaming && (
        <>
          <span className="absolute -top-6 left-1/2 h-10 w-2 -translate-x-6 rounded-full bg-white/15 blur-md animate-aura-pulse" />
          <span className="absolute -top-8 left-1/2 h-12 w-2 -translate-x-0 rounded-full bg-white/10 blur-md animate-aura-pulse" />
          <span className="absolute -top-6 left-1/2 h-10 w-2 translate-x-6 rounded-full bg-white/15 blur-md animate-aura-pulse" />
        </>
      )}
      <svg width="92" height="92" viewBox="0 0 64 64" fill="none" aria-hidden>
        <defs>
          <linearGradient id="cupG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d4a373" />
            <stop offset="1" stopColor="#7c5a3a" />
          </linearGradient>
        </defs>
        <path
          d="M14 26h28v14a10 10 0 0 1-10 10h-8a10 10 0 0 1-10-10V26z"
          fill="url(#cupG)"
          stroke="#f0d6b8"
          strokeWidth="1"
        />
        <path
          d="M42 30h4a6 6 0 0 1 0 12h-4"
          stroke="#f0d6b8"
          strokeWidth="1.4"
          fill="none"
        />
        <ellipse cx="28" cy="26" rx="14" ry="3" fill="#3a2418" />
        <ellipse cx="28" cy="26" rx="11" ry="2" fill="#1a0e08" />
      </svg>
    </div>
  );
}
