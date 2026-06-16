import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AuraShell, SectionLabel } from "@/components/aura/Shell";
import { Onboarding } from "@/components/aura/Onboarding";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { RewardsCard } from "@/components/aura/RewardsCard";
import { ReferralCard } from "@/components/aura/ReferralCard";
import { useUser, userName, userCity, zodiacOf, clearUser } from "@/lib/aura/store";
import { getRewardsSummary, type RewardsSummary } from "@/lib/aura/rewards.functions";

export const Route = createFileRoute("/profil")({
  head: () => ({ meta: [{ title: "Profil ✦ AURA" }, { name: "description", content: "Profilin, ayarların ve AURA+ üyelik." }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const [u, , ready, authed] = useUser();
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const fetchSummary = useServerFn(getRewardsSummary);

  useEffect(() => {
    if (!authed) return;
    fetchSummary().then((s) => setRewards(s as RewardsSummary)).catch(() => {});
  }, [authed, fetchSummary]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const name = userName(u);
  const initial = name[0]?.toUpperCase() || "?";
  const z = zodiacOf(u);
  const dateLabel = u.birthDate ? new Date(u.birthDate).toLocaleDateString("tr-TR") : "—";

  return (
    <AuraShell>
      <header className="mb-6 flex flex-col items-center text-center animate-aura-fade-in">
        <div
          className="grid h-24 w-24 place-items-center rounded-full text-4xl font-light text-white"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #b794d4 100%)", boxShadow: "0 10px 30px rgba(139,92,246,0.4)" }}
        >
          {initial}
        </div>
        <h1 className="mt-4 serif text-3xl text-white">{name}</h1>
        <p className="mt-1 text-[13px] text-[color:var(--aura-soft)]">{z} · {u.style}</p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-soft)]">{userCity(u)}</span>
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-soft)]">{dateLabel}</span>
        </div>
      </header>

      {/* Ödüllerim */}
      {rewards && (
        <RewardsCard
          tarotCredits={rewards.tarotCreditsAvailable}
          referralCount={rewards.referralCount}
          trialDays={rewards.trialDaysEarned}
          activeTrialEndsAt={rewards.activeTrialEndsAt}
        />
      )}

      {/* Referral */}
      {rewards && (
        <ReferralCard
          code={rewards.referralCode}
          url={rewards.referralUrl}
          count={rewards.referralCount}
        />
      )}

      {/* AURA+ */}
      <section
        className="relative mb-4 overflow-hidden rounded-3xl p-6 text-white animate-aura-fade-in"
        style={{ background: "linear-gradient(135deg, #2a1f3d 0%, #3d2e54 50%, #5a3e7a 100%)" }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/8 blur-3xl" />
        <p className="text-[10px] tracking-[0.3em] uppercase opacity-70">AURA+ ✦</p>
        <h2 className="serif mt-1 text-2xl">AURA+</h2>
        <ul className="mt-3 space-y-1 text-[12px] opacity-90">
          <li>Reklamsız deneyim</li>
          <li>Daha derin günlük içerik</li>
          <li>Özel gün modu</li>
          <li>Taş & koku arşivi</li>
          <li>Sınırsız Mystic Card</li>
          <li>Haftada 2 kez tarot</li>
          <li>Editöryal / Clean tema</li>
        </ul>
        <button className="mt-4 rounded-full bg-white px-5 py-2.5 text-[12px] font-medium tracking-[0.15em] text-[#08060f]">
          49.90 TL / AY
        </button>
      </section>

      {/* AURA Premium */}
      <section
        className="relative mb-6 overflow-hidden rounded-3xl p-6 text-white animate-aura-fade-in"
        style={{ background: "linear-gradient(135deg, #4a2470 0%, #8b5cf6 60%, #b794d4 100%)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <p className="text-[10px] tracking-[0.3em] uppercase opacity-80">AURA Premium ✦</p>
        <h2 className="serif mt-1 text-2xl">AURA Premium</h2>
        <ul className="mt-3 space-y-1 text-[12px] opacity-90">
          <li>AURA+'nın her şeyi</li>
          <li>Doğum haritası & yıldız haritası</li>
          <li>Aylık derin analiz</li>
          <li>Gezegen takibi</li>
          <li>AI Stylist</li>
          <li>Gelecekteki kendinden mektup</li>
          <li>Günde 2 kez tarot</li>
          <li>Özel temalar (Altın, Gece Mavisi)</li>
          <li>Premium watermark</li>
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="rounded-full bg-white px-5 py-2.5 text-[12px] font-medium tracking-[0.15em] text-[#08060f]">
            99.90 TL / AY
          </button>
          <Link
            to="/stilist"
            className="rounded-full border border-white/40 px-4 py-2.5 text-[11px] tracking-[0.15em] text-white/90 hover:bg-white/10"
          >
            ✦ AI Stilist'i Aç
          </Link>
          <Link
            to="/mektup"
            className="rounded-full border border-white/40 px-4 py-2.5 text-[11px] tracking-[0.15em] text-white/90 hover:bg-white/10"
          >
            ✦ Gelecekteki Kendinden Mektup
          </Link>
        </div>
      </section>

      <SectionLabel n="✦" title="Ayarlar" />
      <ul className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]">
        <SettingRow label="Bildirim Saati" value="07:00" />
        <SettingRow label="Stil Tercihlerim" value={u.style} />
        <SettingRow label="Tema" value="Dark Luxury ✦" />
        <SettingRow label="Taş & Koku Arşivi" value="AURA+" locked />
      </ul>

      <button
        onClick={() => { clearUser(); }}
        className="mb-6 w-full rounded-full border border-[color:var(--border)] py-3 text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]"
      >
        Çıkış Yap
      </button>
    </AuraShell>
  );
}

function SettingRow({ label, value, locked, onClick }: { label: string; value: string; locked?: boolean; onClick?: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-4 text-left last:border-b-0"
      >
        <span className="text-[14px] text-white">{label}</span>
        <span className="flex items-center gap-2 text-[12px] text-[color:var(--aura-soft)]">
          {locked && <span className="rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#b794d4] px-2 py-0.5 text-[9px] font-medium tracking-wider text-white">AURA+</span>}
          {value}
          <span className="text-[color:var(--aura-muted)]">›</span>
        </span>
      </button>
    </li>
  );
}
