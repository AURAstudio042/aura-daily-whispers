import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell, SectionLabel, ShareSignature } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName } from "@/lib/aura/store";
import { TAROT_CATEGORIES } from "@/lib/aura/tarot-data";
import { drawTarot, getTarotStatus, type TarotReadingResult } from "@/lib/aura/tarot.functions";
import { shareNodeAsStory } from "@/lib/aura/share";

export const Route = createFileRoute("/tarot")({
  head: () => ({
    meta: [
      { title: "Tarot ✦ AURA" },
      { name: "description", content: "Kartlar sana ne söylüyor? Kategori seç, kartını aç." },
    ],
  }),
  component: TarotPage,
});

type Status = { tier: string; limit: { allowed: boolean; remaining: number; cap: number; periodLabel: string } };

function TarotPage() {
  const [u, , ready, authed] = useUser();
  const [category, setCategory] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TarotReadingResult | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchStatus = useServerFn(getTarotStatus);
  const draw = useServerFn(drawTarot);

  useEffect(() => {
    if (!authed) return;
    fetchStatus().then((s) => setStatus(s as Status)).catch(() => {});
  }, [authed, fetchStatus]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const tier = status?.tier ?? "free";
  const isFree = tier === "free";
  const name = userName(u);

  const onDraw = async () => {
    if (!category || loading) return;
    setLoading(true);
    setReveal(false);
    try {
      const r = (await draw({ data: { category, name } })) as TarotReadingResult;
      // small delay for flip animation feel
      setTimeout(() => {
        setResult(r);
        setReveal(true);
        if (r.limit) setStatus((s) => (s ? { ...s, limit: r.limit! } : s));
        setLoading(false);
      }, 900);
    } catch {
      setLoading(false);
    }
  };

  const onReset = () => {
    setReveal(false);
    setResult(null);
    setCategory(null);
  };

  const onShare = async () => {
    if (!result?.card || sharing) return;
    setSharing(true);
    try {
      await shareNodeAsStory(cardRef.current, {
        title: `Tarot · ${result.card.name}`,
        text: `${result.card.name} — ${result.interpretation}\n\n— AURA ✨`,
        filename: `aura-tarot-${result.card.name.toLowerCase()}.png`,
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <AuraShell>
      {/* HEADER */}
      <header className="relative mb-7 animate-aura-fade-in">
        <div className="aura-glow -left-10 -top-16 h-56 w-56 bg-[#8b5cf6]/40" />
        <div className="aura-glow -right-10 top-6 h-44 w-44 bg-[#b794d4]/25" />
        <p className="section-label">A · U · R · A · TAROT</p>
        <h1 className="serif mt-3 text-[44px] leading-[1.05] font-light text-white">
          Tarot <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[14px] italic text-[color:var(--aura-soft)]">Kartlar sana ne söylüyor?</p>
        {status && !isFree && (
          <p className="mt-3 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">
            {status.limit.remaining}/{status.limit.cap} {status.limit.periodLabel}
          </p>
        )}
      </header>

      {/* FREE LOCK */}
      {isFree && !result && (
        <section className="aura-card-dark relative mb-5 overflow-hidden p-6 text-center animate-aura-fade-in">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl" />
          <div className="serif text-6xl text-white/40">✦</div>
          <p className="serif mt-4 text-[22px] italic text-white">Kartlar kapalı.</p>
          <p className="mt-2 text-[13px] text-[color:var(--aura-soft)]">
            Tarot AURA+ üyelerine açıktır. Haftada 2, Premium'da günde 2 kart.
          </p>
          <Link
            to="/profil"
            className="aura-btn aura-btn-hover mt-5 inline-block px-6 text-[12px]"
          >
            ✦ AURA+ ile aç ✦
          </Link>
        </section>
      )}

      {/* CATEGORY PICKER */}
      {!isFree && !result && (
        <section className="aura-card mb-5 p-5 animate-aura-fade-in">
          <SectionLabel n="01" title="Sorunu Seç" />
          <div className="grid grid-cols-2 gap-2.5">
            {TAROT_CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className="rounded-xl border px-3 py-3 text-left text-[12px] transition"
                  style={{
                    borderColor: active ? "var(--aura-lavender)" : "var(--border)",
                    background: active ? "rgba(183,148,212,0.10)" : "rgba(255,255,255,0.02)",
                    color: active ? "#fff" : "var(--aura-soft)",
                  }}
                >
                  <span className="mr-1.5">{c.emoji}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* CARD AREA */}
      {!isFree && (
        <section ref={cardRef} className="aura-card-dark relative mb-5 overflow-hidden p-6 animate-aura-fade-in">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-40 w-40 rounded-full bg-[#b794d4]/15 blur-3xl" />

          {/* Card visual */}
          <div className="relative mx-auto my-3 grid h-64 w-44 place-items-center">
            <div
              className="absolute inset-0 rounded-2xl border border-[color:var(--aura-lavender)]/30 transition-all duration-700"
              style={{
                transform: reveal ? "rotateY(180deg)" : "rotateY(0)",
                background: reveal
                  ? "linear-gradient(160deg, #1a0f2e 0%, #2a1a4a 100%)"
                  : "linear-gradient(160deg, #0b0716 0%, #1a0f2e 100%)",
                boxShadow: "0 20px 50px rgba(139,92,246,0.25)",
                backfaceVisibility: "hidden",
              }}
            >
              {!reveal && (
                <div className="grid h-full place-items-center">
                  <div className="serif text-7xl text-[color:var(--aura-lavender)]/70">✦</div>
                </div>
              )}
            </div>
            {reveal && result?.card && (
              <div
                className="absolute inset-0 grid place-items-center rounded-2xl border border-[color:var(--aura-lavender)]/50 p-4 text-center animate-aura-fade-in"
                style={{
                  background: "linear-gradient(160deg, #1a0f2e 0%, #3a2461 100%)",
                  boxShadow: "0 0 40px rgba(183,148,212,0.35), inset 0 0 30px rgba(139,92,246,0.15)",
                }}
              >
                <div>
                  <div className="serif text-5xl text-[color:var(--aura-lavender)]">{result.card.symbol}</div>
                  <p className="mt-3 text-[10px] tracking-[0.35em] uppercase text-[color:var(--aura-muted)]">
                    {result.categoryLabel}
                  </p>
                  <h2 className="serif mt-2 text-[26px] font-light leading-tight text-white">{result.card.name}</h2>
                </div>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 grid place-items-center text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-lavender)]">
                ✦ Kartlar karılıyor ✦
              </div>
            )}
          </div>

          {/* Reveal text */}
          {reveal && result?.card && (
            <div className="mt-2 animate-aura-fade-in">
              <p className="text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Kartın Anlamı</p>
              <p className="mt-1 text-[14px] text-[color:var(--aura-soft)]">{result.card.meaning}</p>
              <div className="my-4 h-px bg-[color:var(--border)]" />
              <p className="text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Sana Özel</p>
              <p className="serif mt-2 text-[18px] italic leading-snug text-white">"{result.interpretation}"</p>
              <p className="mt-5 text-right text-[10px] tracking-[0.35em] text-[color:var(--aura-muted)]">— AURA ✨</p>
            </div>
          )}

          {/* Empty state */}
          {!reveal && !loading && (
            <p className="mt-3 text-center text-[12px] italic text-[color:var(--aura-soft)]">
              {category
                ? "Hazır olduğunda kartını aç."
                : "Önce bir kategori seç."}
            </p>
          )}

          {/* Limit reached */}
          {result && !result.ok && result.reason === "limit" && (
            <p className="mt-3 text-center text-[12px] text-[color:var(--aura-soft)]">
              Bu {result.limit?.periodLabel} için kartlarını çektin. Bir sonraki açılışı bekle. ✦
            </p>
          )}
        </section>
      )}

      {/* ACTIONS */}
      {!isFree && (
        <div className="flex gap-2">
          {!reveal ? (
            <button
              onClick={onDraw}
              disabled={!category || loading || (status ? !status.limit.allowed : false)}
              className="aura-btn aura-btn-hover flex-1 text-[13px] disabled:opacity-50"
            >
              {loading ? "✦ Açılıyor… ✦" : "✦ Kartı Aç ✦"}
            </button>
          ) : (
            <>
              <button
                onClick={onShare}
                disabled={sharing}
                className="aura-btn aura-btn-hover flex-1 text-[12px] disabled:opacity-60"
              >
                {sharing ? "..." : "Paylaş"}
              </button>
              <button
                onClick={onReset}
                className="rounded-full border border-[color:var(--border)] bg-white/[0.03] px-5 py-3 text-[12px] tracking-[0.2em] uppercase text-[color:var(--aura-soft)]"
              >
                Yeni Kart
              </button>
            </>
          )}
        </div>
      )}

      <ShareSignature />
    </AuraShell>
  );
}
