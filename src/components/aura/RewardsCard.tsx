type Props = {
  tarotCredits: number;
  referralCount: number;
  trialDays: number;
  activeTrialEndsAt: string | null;
};

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export function RewardsCard({ tarotCredits, referralCount, trialDays, activeTrialEndsAt }: Props) {
  return (
    <section className="mb-4 animate-aura-fade-in">
      <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Ödüllerim ✦</p>
        <ul className="mt-3 space-y-2">
          <RewardRow icon="🎴" label="Tarot hakkı" value={`${tarotCredits} kez`} />
          <RewardRow icon="👥" label="Davet edilen arkadaş" value={`${referralCount} kişi`} />
          <RewardRow icon="⭐" label="Kazanılan AURA+ süresi" value={`${trialDays} gün`} />
        </ul>
        {activeTrialEndsAt && (
          <div className="mt-3 rounded-2xl border border-[color:var(--aura-lavender)]/40 bg-[color:var(--aura-purple)]/10 px-4 py-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-lavender)]">Aktif AURA+ Denemen</p>
            <p className="serif mt-1 text-[16px] italic text-white">
              {daysLeft(activeTrialEndsAt)} gün kaldı
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function RewardRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between rounded-2xl bg-white/[0.02] px-4 py-3">
      <span className="flex items-center gap-3 text-[13px] text-white">
        <span className="text-lg">{icon}</span>
        {label}
      </span>
      <span className="text-[12px] text-[color:var(--aura-soft)]">{value}</span>
    </li>
  );
}
