import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  getMonthlyAnalysis,
  type MonthlyAnalysis,
  type MonthlyResult,
} from "@/lib/aura/monthly.functions";
import type { AuraUser } from "@/lib/aura/store";
import { userName, userCity, zodiacOf } from "@/lib/aura/store";

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function MonthlyAnalysisSection({ user }: { user: AuraUser }) {
  const fetchMonthly = useServerFn(getMonthlyAnalysis);
  const [state, setState] = useState<MonthlyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchMonthly({
      data: {
        context: {
          name: userName(user),
          zodiac: zodiacOf(user),
          style: user.style,
          mood: user.mood,
          birthDate: user.birthDate,
          birthTime: user.birthTime,
          city: userCity(user),
        },
      },
    })
      .then((r) => {
        if (alive) setState(r);
      })
      .catch(() => {
        if (alive)
          setState({
            ok: false,
            reason: "error",
            message: "Analizin hazırlanıyor, birazdan tekrar dene.",
          });
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user, fetchMonthly]);

  const monthLabel =
    state && "year" in state
      ? `${MONTH_NAMES[(state.month - 1) | 0]} ${state.year}`
      : MONTH_NAMES[new Date().getMonth()] + " " + new Date().getFullYear();

  return (
    <section className="relative mt-8 mb-6 animate-aura-fade-in">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="section-label">A · Y · L · I · K · A · N · A · L · İ · Z · İ · N</p>
          <p className="serif mt-2 text-[26px] font-light text-white">
            Aylık Analizin <span className="text-[color:var(--aura-lavender)]">✦</span>
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-soft)]">
          {monthLabel}
        </span>
      </div>

      {loading && (
        <div className="aura-card p-6 text-center text-[12px] text-[color:var(--aura-soft)]">
          Yükleniyor…
        </div>
      )}

      {!loading && state && !state.ok && (
        <div className="aura-card p-6 text-center text-[13px] text-[color:var(--aura-soft)]">
          {state.message}
        </div>
      )}

      {!loading && state && state.ok && state.locked && (
        <LockedAnalysis preview={state.preview} />
      )}

      {!loading && state && state.ok && !state.locked && (
        <UnlockedAnalysis analysis={state.analysis} />
      )}
    </section>
  );
}

function LockedAnalysis({ preview }: { preview: MonthlyAnalysis }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[color:var(--aura-lavender)]/30">
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-[#0a0714]/30 via-[#0a0714]/60 to-[#0a0714]/95" />
      <div className="relative z-0 select-none p-5 blur-[3px] [filter:blur(4px)]">
        <AnalysisBody analysis={preview} compact />
      </div>
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
        <div className="serif text-5xl text-[color:var(--aura-lavender)]/80">✦</div>
        <p className="serif mt-3 text-[22px] italic text-white">
          Bu ay senin için ne diyor?
        </p>
        <p className="mt-2 max-w-xs text-[13px] text-[color:var(--aura-soft)]">
          Aylık derin analiz, yükselen burcun, gezegen geçişlerin ve sana özel güçlü günler — yalnızca AURA Premium.
        </p>
        <Link
          to="/profil"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#b794d4] px-6 py-3 text-[12px] font-medium tracking-[0.15em] text-white shadow-lg"
          style={{ boxShadow: "0 12px 30px rgba(139,92,246,0.45)" }}
        >
          AURA Premium ile Aç 🔒
        </Link>
      </div>
    </div>
  );
}

function UnlockedAnalysis({ analysis }: { analysis: MonthlyAnalysis }) {
  return <AnalysisBody analysis={analysis} />;
}

function AnalysisBody({
  analysis,
  compact = false,
}: {
  analysis: MonthlyAnalysis;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Card title="🌟 Bu Ay Senin Ayın">
        <p className="serif text-[17px] italic leading-snug text-white">
          {analysis.month_title}
        </p>
      </Card>

      <Card title="⬆️ Yükselen Burcunun Bu Ayki Etkisi">
        <p className="text-[14px] text-[color:var(--aura-soft)]">
          {analysis.rising_effect}
        </p>
      </Card>

      <Card title="🌙 Ay Burcunun Duygusal Tonu">
        <p className="text-[14px] text-[color:var(--aura-soft)]">
          {analysis.moon_tone}
        </p>
      </Card>

      <Card title="🪐 Öne Çıkan Gezegenler">
        <ul className="space-y-2">
          {analysis.planets.map((p, i) => (
            <li key={i} className="text-[13px] text-[color:var(--aura-soft)]">
              <span className="text-white">{p.name} · </span>
              {p.note}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="✨ Güçlü Günler">
          <ul className="space-y-2">
            {analysis.strong_days.map((d, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[13px]">
                <span className="serif text-[18px] text-[color:var(--aura-lavender)]">
                  {d.date}
                </span>
                <span className="text-[color:var(--aura-soft)]">{d.note}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="⚠️ Dikkatli Olunacak Günler">
          <ul className="space-y-2">
            {analysis.careful_days.map((d, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[13px]">
                <span className="serif text-[18px] text-[#f9a8a8]">{d.date}</span>
                <span className="text-[color:var(--aura-soft)]">{d.note}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="🎯 Aylık Odak Teması">
        <p className="serif text-[18px] italic text-white">
          {analysis.focus_theme}
        </p>
      </Card>

      <Card title="🌕 Dolunay & Yeni Ay Ritüeli">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">
          Dolunay
        </p>
        <p className="mb-3 text-[14px] text-[color:var(--aura-soft)]">
          {analysis.full_moon_ritual}
        </p>
        <p className="text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">
          Yeni Ay
        </p>
        <p className="text-[14px] text-[color:var(--aura-soft)]">
          {analysis.new_moon_ritual}
        </p>
      </Card>

      <PowerSentenceCard sentence={analysis.power_sentence} disabled={compact} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] p-5"
      style={{ background: "linear-gradient(160deg, #0b0716 0%, #1a0f2e 100%)" }}
    >
      <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-[color:var(--aura-purple)]/15 blur-3xl" />
      <p className="mb-2 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">
        {title}
      </p>
      {children}
    </section>
  );
}

function PowerSentenceCard({
  sentence,
  disabled,
}: {
  sentence: string;
  disabled?: boolean;
}) {
  const [shared, setShared] = useState(false);

  const onShare = async () => {
    if (disabled) return;
    const text = `"${sentence}"\n\n— AURA ✨`;
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    try {
      if (nav?.share) {
        await nav.share({ title: "AURA", text });
      } else if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[color:var(--aura-lavender)]/30 p-6 text-center"
      style={{
        background:
          "linear-gradient(160deg, #14091f 0%, #1f0f33 50%, #2a1645 100%)",
      }}
    >
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/25 blur-3xl" />
      <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
        💫 Aylık Güç Cümlesi
      </p>
      <p className="serif mt-4 text-[20px] italic leading-snug text-white">
        "{sentence}"
      </p>
      <p className="mt-4 text-[10px] tracking-[0.35em] text-[color:var(--aura-muted)]">
        — AURA ✨
      </p>
      <button
        onClick={onShare}
        disabled={disabled}
        className="mt-4 rounded-full border border-[color:var(--aura-lavender)]/40 bg-[color:var(--aura-purple)]/15 px-5 py-2.5 text-[11px] tracking-[0.15em] text-white disabled:opacity-50"
      >
        {shared ? "Kopyalandı ✓" : "Paylaş ✦"}
      </button>
    </section>
  );
}
