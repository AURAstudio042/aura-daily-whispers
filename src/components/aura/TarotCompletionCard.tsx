import { useEffect, useState } from "react";

type Props = {
  tier: "plus" | "premium";
  nextResetAt: string | null;
};

function formatRemaining(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function TarotCompletionCard({ tier, nextResetAt }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = nextResetAt ? new Date(nextResetAt).getTime() : null;
  const remaining = target ? target - now : null;
  const parts = remaining !== null ? formatRemaining(remaining) : null;

  const periodLabel = tier === "premium" ? "Yarın yeniden açılır" : "Haftalık yenileme";

  return (
    <section className="aura-card-dark relative mb-5 overflow-hidden p-8 text-center animate-aura-fade-in">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-[#b794d4]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-0 h-40 w-40 rounded-full bg-[#8b5cf6]/15 blur-3xl" />

      <p className="serif text-4xl text-[color:var(--aura-lavender)]">✨</p>

      {/* Glowing crescent / crystal */}
      <div className="relative mx-auto my-6 grid h-32 w-32 place-items-center">
        <div className="absolute inset-0 rounded-full bg-[color:var(--aura-lavender)]/25 blur-2xl animate-aura-pulse" />
        <div className="absolute inset-3 rounded-full bg-[#b794d4]/15 blur-xl" />
        <svg
          viewBox="0 0 100 100"
          className="relative h-24 w-24 drop-shadow-[0_0_20px_rgba(183,148,212,0.55)] animate-aura-float"
          aria-hidden
        >
          <defs>
            <radialGradient id="moonGlow" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#f5e9ff" />
              <stop offset="55%" stopColor="#d6b8ff" />
              <stop offset="100%" stopColor="#6b4a99" />
            </radialGradient>
          </defs>
          {/* Crescent: full disc minus offset disc */}
          <mask id="crescentMask">
            <rect width="100" height="100" fill="black" />
            <circle cx="50" cy="50" r="34" fill="white" />
            <circle cx="62" cy="44" r="30" fill="black" />
          </mask>
          <circle cx="50" cy="50" r="34" fill="url(#moonGlow)" mask="url(#crescentMask)" />
          {/* Sparkle */}
          <g fill="#f5e9ff" opacity="0.9">
            <circle cx="24" cy="30" r="1.2" />
            <circle cx="80" cy="72" r="1" />
            <circle cx="74" cy="22" r="1.4" />
          </g>
        </svg>
      </div>

      <h2 className="serif text-[24px] font-light leading-snug text-white">
        Bu tarot yolculuğunu tamamladın
      </h2>
      <p className="mt-3 text-[13px] italic text-[color:var(--aura-soft)]">
        Kartların sana söyleyeceklerini söyledi.
      </p>
      <p className="mt-1 text-[13px] italic text-[color:var(--aura-soft)]">
        Şimdi biraz bekleme ve iç sesini dinleme zamanı.
      </p>

      <div className="my-6 h-px bg-gradient-to-r from-transparent via-[color:var(--aura-lavender)]/40 to-transparent" />

      <p className="text-[10px] tracking-[0.35em] uppercase text-[color:var(--aura-muted)]">
        ⏳ Yeni açılım için kalan süre
      </p>

      {parts ? (
        <div className="mt-4 flex items-end justify-center gap-2 text-white">
          {parts.d > 0 && (
            <>
              <TimeBlock value={pad(parts.d)} label="gün" />
              <Colon />
            </>
          )}
          <TimeBlock value={pad(parts.h)} label="saat" />
          <Colon />
          <TimeBlock value={pad(parts.m)} label="dk" />
          <Colon />
          <TimeBlock value={pad(parts.s)} label="sn" />
        </div>
      ) : (
        <p className="serif mt-4 text-[18px] italic text-white">Yakında</p>
      )}

      <p className="mt-4 text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
        {periodLabel}
      </p>

      <p className="serif mt-7 text-[13px] italic text-[color:var(--aura-soft)]">
        — AURA 🍂
      </p>
    </section>
  );
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="serif text-[36px] font-light leading-none tabular-nums text-white"
        style={{ textShadow: "0 0 18px rgba(183,148,212,0.45)" }}
      >
        {value}
      </span>
      <span className="mt-1 text-[9px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="serif pb-5 text-[28px] font-light text-[color:var(--aura-lavender)]/60">
      :
    </span>
  );
}
