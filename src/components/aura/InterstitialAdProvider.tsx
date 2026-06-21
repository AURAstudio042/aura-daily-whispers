import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  shouldShowInterstitial,
  recordInterstitialShown,
} from "@/lib/aura/interstitial.functions";

/**
 * INTERSTITIAL AD COORDINATOR (server-controlled)
 *
 * The decision to show is made server-side via shouldShowInterstitial:
 *   - Premium / Plus / active trial → never shown.
 *   - 10-minute global cooldown (hard floor, server-enforced).
 *   - Same-placement 30-minute cooldown.
 *   - Rolling-24h daily cap (server-enforced; client cannot bypass).
 *
 * Client-side guards are intentionally kept as a *UX* layer only — they avoid
 * extra round-trips and a brief first-session grace. They are NOT a security
 * boundary; the server is the truth source.
 */

const FIRST_SESSION_GRACE_MS = 90 * 1000;
const SESSION_START_KEY = "aura:interstitial:session_start";
const AD_DURATION_SEC = 20;

type Ctx = {
  /** Request an interstitial at the named placement. Server may decline. */
  trigger: (placement: string) => void;
};

const InterstitialContext = createContext<Ctx>({ trigger: () => {} });
export const useInterstitial = () => useContext(InterstitialContext);

export function InterstitialAdProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const sessionStartRef = useRef<number>(0);
  const askServer = useServerFn(shouldShowInterstitial);
  const recordServer = useServerFn(recordInterstitialShown);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let started = Number(sessionStorage.getItem(SESSION_START_KEY) || 0);
    if (!started) {
      started = Date.now();
      sessionStorage.setItem(SESSION_START_KEY, String(started));
    }
    sessionStartRef.current = started;
  }, []);

  const trigger = useCallback(
    (placement: string) => {
      if (typeof window === "undefined") return;
      if (open || inFlightRef.current) return;
      if (Date.now() - sessionStartRef.current < FIRST_SESSION_GRACE_MS) return;

      inFlightRef.current = true;
      askServer({ data: { placement } })
        .then((res) => {
          if (!res || res.show !== true) return;
          // Defer one frame so the screen the user just landed on paints first.
          requestAnimationFrame(() => {
            setPendingPlacement(placement);
            setOpen(true);
          });
        })
        .catch(() => {
          // Network/auth error → silently skip. Server stays the truth source.
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    },
    [askServer, open],
  );

  const onClose = useCallback(() => {
    setOpen(false);
    // Record only after the user actually sat through the ad.
    if (pendingPlacement) {
      recordServer({ data: { placement: pendingPlacement } }).catch(() => {});
      setPendingPlacement(null);
    }
  }, [pendingPlacement, recordServer]);

  return (
    <InterstitialContext.Provider value={{ trigger }}>
      {children}
      {open && <InterstitialAdModal onClose={onClose} duration={AD_DURATION_SEC} />}
    </InterstitialContext.Provider>
  );
}

function InterstitialAdModal({ onClose, duration }: { onClose: () => void; duration: number }) {
  const [secs, setSecs] = useState(duration);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  const done = secs <= 0;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/95 backdrop-blur-md p-5">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[color:var(--border)] p-6 text-center text-white"
        style={{ background: "linear-gradient(160deg, #0f0a1f 0%, #1f1238 100%)" }}
      >
        <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#6d4ad6]/35 blur-3xl animate-aura-pulse" />
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Sponsor</p>

        {/* Video placeholder — replace with AdMob / IronSource interstitial mount in production */}
        <div className="relative mx-auto my-6 grid h-56 w-full place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/60">
          <div className="serif text-7xl text-[color:var(--aura-lavender)]/80 animate-aura-pulse">✦</div>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
            video reklam
          </p>
        </div>

        <p className="serif text-[18px] italic">Kısa bir mola ✦</p>
        <p className="mt-1 text-[12px] text-[color:var(--aura-soft)]">
          AURA+ ile reklamsız bir deneyim yaşa.
        </p>

        <button
          onClick={onClose}
          disabled={!done}
          className="mt-6 w-full rounded-full bg-white py-3 text-[12px] font-medium tracking-[0.2em] uppercase text-[#08060f] disabled:opacity-40"
        >
          {done ? "Devam et" : `${secs}s sonra kapatabilirsin`}
        </button>
      </div>
    </div>
  );
}
