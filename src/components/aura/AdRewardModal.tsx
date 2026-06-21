import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { grantAdCredit, type GrantAdCreditResult } from "@/lib/aura/ad-credits.functions";
import { toast } from "sonner";

type Source = "tarot" | "coffee" | "mystic";

type Props = {
  source: Source;
  /** Duration of the simulated ad in seconds — must be >= 5 so the server's 4s anti-fraud floor accepts the grant. */
  durationSec?: number;
  onGranted: (balance: number) => void;
  onClose: () => void;
};

const LABEL: Record<Source, string> = {
  tarot: "1 tarot hakkı",
  coffee: "1 kahve falı hakkı",
  mystic: "1 mistik kart hakkı",
};

/**
 * Generic rewarded-ad placeholder. Wraps a forced wait + server-side
 * grantAdCredit call so credits can never be added without the timer
 * actually elapsing AND the server accepting the grant. Plugs in front of
 * any AdMob / IronSource rewarded ad in production.
 */
export function AdRewardModal({ source, durationSec = 5, onGranted, onClose }: Props) {
  const [secs, setSecs] = useState(durationSec);
  const [claiming, setClaiming] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const grant = useServerFn(grantAdCredit);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const done = secs <= 0;

  const onClaim = async () => {
    if (claiming || !done) return;
    setClaiming(true);
    try {
      const elapsed = Date.now() - startedAt.current;
      const res = (await grant({ data: { source, adDurationMs: elapsed } })) as GrantAdCreditResult;
      if (res.ok) {
        toast.success(`${LABEL[source]} kazanıldı ✦`);
        onGranted(res.balance);
      } else if (res.reason === "unlimited") {
        toast.info("AURA+ üyesisin — reklamsız kullanabilirsin.");
        onClose();
      } else if (res.reason === "too_soon") {
        toast.error("Çok hızlı denedin. Birkaç saniye sonra tekrar dene.");
        onClose();
      } else {
        toast.error("Ödül alınamadı, tekrar dene.");
        onClose();
      }
    } catch {
      toast.error("Bağlantı hatası, tekrar dene.");
      onClose();
    } finally {
      setClaiming(false);
    }
  };

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
          Bittiğinde {LABEL[source]} kazanacaksın.
        </p>

        <div className="mx-auto mt-6 grid h-16 w-16 place-items-center rounded-full border border-[color:var(--aura-lavender)]/40">
          <span className="serif text-2xl text-white">{done ? "✓" : secs}</span>
        </div>

        <button
          onClick={onClaim}
          className="mt-6 w-full rounded-full bg-white py-3 text-[12px] font-medium tracking-[0.2em] uppercase text-[#08060f] disabled:opacity-40"
          disabled={!done || claiming}
        >
          {claiming ? "Doğrulanıyor…" : done ? `✦ ${LABEL[source]} al` : `${secs}s sonra alabilirsin`}
        </button>

        {!done && (
          <button onClick={onClose} className="mt-3 text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)]">
            Vazgeç
          </button>
        )}
      </div>
    </div>
  );
}
