import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell, ShareSignature } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName, zodiacOf, toggleFav, useFavs } from "@/lib/aura/store";
import { generateMysticCard } from "@/lib/aura/mystic.functions";
import { pickFallback, timeOfDay, type MysticCardContent } from "@/lib/aura/mystic-data";
import { ShareSheet } from "@/components/aura/ShareSheet";
import { downloadBlob, nativeShareImage, renderNodeAsStoryBlob, shareToWhatsApp } from "@/lib/aura/share";

export const Route = createFileRoute("/mistik")({
  head: () => ({
    meta: [
      { title: "Mistik ✦ AURA" },
      { name: "description", content: "Mistik Kart — kalbinden geçen bir mesaj." },
    ],
  }),
  component: MistikPage,
});

const LAST_KEY = "aura:mystic:last";

function MistikPage() {
  const [u, , ready, authed] = useUser();
  const [card, setCard] = useState<MysticCardContent | null>(null);
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adWatching, setAdWatching] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const genCard = useServerFn(generateMysticCard);
  const favs = useFavs();

  // TODO: pull real tier from profile; for now treat as free.
  const tier = "free" as "free" | "plus" | "premium";
  const unlimited: boolean = tier === "plus" || tier === "premium";

  const drawCard = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setOpened(false);
    const avoidQuote = typeof window !== "undefined" ? window.localStorage.getItem(LAST_KEY) ?? undefined : undefined;
    try {
      const next = await genCard({
        data: {
          zodiac: u ? zodiacOf(u) : undefined,
          mood: u?.mood,
          name: u ? userName(u) : undefined,
          timeOfDay: timeOfDay(),
          avoidQuote,
        },
      }) as MysticCardContent;
      const safe = next.quote === avoidQuote ? pickFallback(avoidQuote) : next;
      setCard(safe);
      if (typeof window !== "undefined") window.localStorage.setItem(LAST_KEY, safe.quote);
      setTimeout(() => setOpened(true), 250);
    } catch {
      const fb = pickFallback(avoidQuote);
      setCard(fb);
      setOpened(true);
    } finally {
      setLoading(false);
    }
  }, [genCard, loading, u]);

  // Auto-draw for plus/premium
  useEffect(() => {
    if (authed && u && unlimited && !card && !loading) drawCard();
  }, [authed, u, unlimited, card, loading, drawCard]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const onUnlock = async () => {
    if (unlimited) { drawCard(); return; }
    setAdWatching(true);
    // Mock ad: 3s wait, then draw
    setTimeout(async () => {
      setAdWatching(false);
      await drawCard();
    }, 3000);
  };

  const onNew = () => { setOpened(false); setCard(null); drawCard(); };

  const shareText = card ? `${card.quote}\n— AURA ✨` : "— AURA ✨";

  const onInstagram = async () => {
    if (!card) return;
    setShareBusy(true);
    try {
      const blob = await renderNodeAsStoryBlob(cardRef.current, "Mistik Kart");
      if (!blob) return;
      const ok = await nativeShareImage(blob, shareText, "aura-mistik.png");
      if (!ok) downloadBlob(blob, "aura-mistik.png");
    } finally { setShareBusy(false); setShareOpen(false); }
  };
  const onWhatsApp = async () => {
    if (!card) return;
    setShareBusy(true);
    try {
      const blob = await renderNodeAsStoryBlob(cardRef.current, "Mistik Kart");
      shareToWhatsApp(shareText, blob, "aura-mistik.png");
    } finally { setShareBusy(false); setShareOpen(false); }
  };
  const onMore = async () => {
    if (!card) return;
    setShareBusy(true);
    try {
      const blob = await renderNodeAsStoryBlob(cardRef.current, "Mistik Kart");
      if (!blob) return;
      const ok = await nativeShareImage(blob, shareText, "aura-mistik.png");
      if (!ok) downloadBlob(blob, "aura-mistik.png");
    } finally { setShareBusy(false); setShareOpen(false); }
  };

  const saved = card ? favs.some((f) => f.id === "m:" + card.quote) : false;
  const onSave = () => {
    if (!card) return;
    toggleFav({ id: "m:" + card.quote, text: card.quote, author: "AURA · " + card.category, date: new Date().toISOString() });
  };

  return (
    <AuraShell>
      <header className="relative mb-6 animate-aura-fade-in">
        <div className="aura-glow -left-10 -top-16 h-56 w-56 bg-[#8b5cf6]/40" />
        <div className="aura-glow -right-10 top-4 h-44 w-44 bg-[#b794d4]/25" />
        <p className="section-label">A · U · R · A · MİSTİK KART</p>
        <h1 className="serif mt-3 text-[40px] leading-[1.05] font-light text-white">
          Mistik Kart <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[14px] italic text-[color:var(--aura-soft)]">Kalbinden geçen bir mesaj.</p>
      </header>

      {/* CARD */}
      <section
        ref={cardRef}
        className="aura-card-dark relative mb-5 overflow-hidden p-7 text-center animate-aura-fade-in"
        style={{ minHeight: 360 }}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl animate-aura-pulse" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-40 w-40 rounded-full bg-[#b794d4]/15 blur-3xl" />

        {!card && !loading && !adWatching && (
          <div className="relative grid place-items-center" style={{ minHeight: 280 }}>
            <div className="serif text-7xl text-[color:var(--aura-lavender)]/70">✦</div>
            <p className="mt-4 text-[13px] italic text-[color:var(--aura-soft)]">Kartını açmaya hazır mısın?</p>
          </div>
        )}

        {(loading || adWatching) && (
          <div className="relative grid place-items-center" style={{ minHeight: 280 }}>
            <div className="serif text-7xl text-[color:var(--aura-lavender)]/60 animate-aura-pulse">✦</div>
            <p className="mt-4 text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-lavender)]">
              {adWatching ? "✦ Reklam izleniyor ✦" : "✦ Kart açılıyor ✦"}
            </p>
          </div>
        )}

        {card && opened && (
          <div className="relative animate-aura-fade-in">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[color:var(--aura-muted)]">
              {card.category}
            </p>
            <p className="serif mt-6 text-[26px] leading-snug italic text-white">"{card.quote}"</p>
            <p className="mt-5 text-[14px] text-[color:var(--aura-soft)]">{card.whisper}</p>
            <p className="mt-8 text-[11px] tracking-[0.35em] text-[color:var(--aura-muted)]">— AURA ✨</p>
          </div>
        )}
      </section>

      {/* ACTIONS */}
      {!card ? (
        <button
          onClick={onUnlock}
          disabled={loading || adWatching}
          className="aura-btn aura-btn-hover w-full text-[13px] disabled:opacity-60"
        >
          {adWatching ? "✦ Lütfen bekle ✦" : unlimited ? "✦ Kartı Aç ✦" : "✦ Reklam izle & aç ✦"}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex-1 rounded-full border border-[color:var(--border)] bg-white/[0.03] py-3 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-soft)]"
          >
            {saved ? "♥ Kayıtlı" : "♡ Kaydet"}
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="aura-btn aura-btn-hover flex-1 text-[12px]"
          >
            Paylaş
          </button>
          <button
            onClick={onNew}
            className="rounded-full border border-[color:var(--border)] bg-white/[0.03] px-4 py-3 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-soft)]"
            aria-label="Yeni kart"
          >
            ↻
          </button>
        </div>
      )}

      {!unlimited && (
        <p className="mt-4 text-center text-[11px] text-[color:var(--aura-muted)]">
          AURA+ ile reklamsız ve sınırsız aç ✦
        </p>
      )}

      <ShareSignature />

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onInstagram={onInstagram}
        onWhatsApp={onWhatsApp}
        onMore={onMore}
        busy={shareBusy}
      />
    </AuraShell>
  );
}
