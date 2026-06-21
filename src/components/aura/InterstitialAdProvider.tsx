import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUserTier } from "@/lib/aura/tier.functions";

/**
 * INTERSTITIAL AD COORDINATOR
 *
 * Free users only. Plus / Premium / active trial → skipped entirely.
 *
 * Frequency policy (client-enforced; UX guard, not security):
 *   - MIN_COOLDOWN_MS between any two interstitials (spam guard)
 *   - SAME_PLACEMENT_COOLDOWN_MS between two ads on the same placement
 *   - First-session grace: never show within FIRST_SESSION_GRACE_MS of app open
 *
 * State persisted in localStorage so cooldown survives reloads but resets
 * on logout / app uninstall.
 *
 * Placements call `trigger("placement-name")` at natural transition points
 * (after a tarot result renders, after a coffee reading saved, etc.). The
 * coordinator decides whether to actually display the ad.
 */

const LAST_TS_KEY = "aura:interstitial:last_ts";
const LAST_PLACEMENT_KEY = "aura:interstitial:last_placement";
const SESSION_START_KEY = "aura:interstitial:session_start";

// 12 min average cooldown — sits in the user-requested 10-20 min band.
const MIN_COOLDOWN_MS = 12 * 60 * 1000;
const SAME_PLACEMENT_COOLDOWN_MS = 30 * 60 * 1000;
const FIRST_SESSION_GRACE_MS = 90 * 1000;
const AD_DURATION_SEC = 20;

type Ctx = {
  /** Request an interstitial at the named placement. No-op if cooldown / premium. */
  trigger: (placement: string) => void;
};

const InterstitialContext = createContext<Ctx>({ trigger: () => {} });
export const useInterstitial = () => useContext(InterstitialContext);

export function InterstitialAdProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [unlimited, setUnlimited] = useState<boolean | null>(null);
  const fetchTier = useServerFn(getUserTier);
  const sessionStartRef = useRef<number>(0);

  // One-time tier check; refreshes on auth change via window event from auth flow.
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchTier()
        .then((r) => {
          if (cancelled) return;
          const t = (r?.tier as string | undefined) ?? "free";
          setUnlimited(t === "plus" || t === "premium" || !!r?.trialEndsAt);
        })
        .catch(() => !cancelled && setUnlimited(false));
    };
    load();
    const onAuth = () => load();
    window.addEventListener("aura:auth-changed", onAuth);
    return () => {
      cancelled = true;
      window.removeEventListener("aura:auth-changed", onAuth);
    };
  }, [fetchTier]);

  // Capture session start (per tab) used for the grace period.
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
      if (unlimited !== false) return; // null (loading) or true (premium) → skip
      if (Date.now() - sessionStartRef.current < FIRST_SESSION_GRACE_MS) return;

      const lastTs = Number(localStorage.getItem(LAST_TS_KEY) || 0);
      const lastPlacement = localStorage.getItem(LAST_PLACEMENT_KEY);
      const now = Date.now();
      if (now - lastTs < MIN_COOLDOWN_MS) return;
      if (lastPlacement === placement && now - lastTs < SAME_PLACEMENT_COOLDOWN_MS) return;

      // Defer one frame so the screen the user just landed on paints first;
      // this matches the "natural transition point" UX intent.
      requestAnimationFrame(() => {
        localStorage.setItem(LAST_TS_KEY, String(Date.now()));
        localStorage.setItem(LAST_PLACEMENT_KEY, placement);
        setOpen(true);
      });
    },
    [unlimited],
  );

  return (
    <InterstitialContext.Provider value={{ trigger }}>
      {children}
      {open && <InterstitialAdModal onClose={() => setOpen(false)} duration={AD_DURATION_SEC} />}
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
