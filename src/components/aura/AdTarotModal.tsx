import { useEffect, useState } from "react";

type Props = {
  onComplete: () => void;
  onClose: () => void;
};

// NOTE: Placeholder for AdMob / IronSource integration.
// Real implementation would call the SDK's rewarded ad and only
// invoke onComplete on the `onRewarded` callback. For now we render
// a 5-second simulated rewarded ad with a forced wait.
export function AdTarotModal({ onComplete, onClose }: Props) {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const done = seconds <= 0;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/85 backdrop-blur-sm p-5">
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[color:var(--border)] p-6 text-center text-white"
        style={{ background: "linear-gradient(160deg, #1a0f2e 0%, #2a1a4a 100%)" }}
      >
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[#8b5cf6]/40 blur-3xl" />
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Sponsor</p>
        <div className="serif my-6 text-6xl text-[color:var(--aura-lavender)]">✦</div>
        <p className="serif text-[20px] italic text-white">Reklamın oynuyor…</p>
        <p className="mt-2 text-[12px] text-[color:var(--aura-soft)]">
          Bittiğinde 1 tarot hakkı kazanacaksın.
        </p>

        <div className="mx-auto mt-6 grid h-16 w-16 place-items-center rounded-full border border-[color:var(--aura-lavender)]/40">
          <span className="serif text-2xl text-white">{done ? "✓" : seconds}</span>
        </div>

        <button
          onClick={done ? onComplete : onClose}
          className="mt-6 w-full rounded-full bg-white py-3 text-[12px] font-medium tracking-[0.2em] uppercase text-[#08060f] disabled:opacity-40"
          disabled={!done}
        >
          {done ? "🎴 Tarot Hakkını Al" : `${seconds}s sonra alabilirsin`}
        </button>

        {!done && (
          <button
            onClick={onClose}
            className="mt-3 text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)]"
          >
            Vazgeç
          </button>
        )}
      </div>
    </div>
  );
}
