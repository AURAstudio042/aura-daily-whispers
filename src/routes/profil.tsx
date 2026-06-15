import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuraShell, SectionLabel } from "@/components/aura/Shell";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName, userCity, zodiacOf, clearUser } from "@/lib/aura/store";

export const Route = createFileRoute("/profil")({
  head: () => ({ meta: [{ title: "Profil ✦ AURA" }, { name: "description", content: "Profilin, ayarların ve AURA+ üyelik." }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const [u, , ready] = useUser();
  const [mystic, setMystic] = useState(false);
  if (!ready) return <div className="min-h-screen" />;
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

      {/* Premium banner */}
      <section
        className="relative mb-6 overflow-hidden rounded-3xl p-6 text-white animate-aura-fade-in"
        style={{ background: "linear-gradient(135deg, #4a2470 0%, #8b5cf6 60%, #b794d4 100%)" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <p className="text-[10px] tracking-[0.3em] uppercase opacity-80">AURA ✦</p>
        <h2 className="serif mt-2 text-3xl">Premium</h2>
        <p className="mt-2 text-[13px] opacity-90">Doğum haritası, aylık derin analiz, AI stilist ve günde 2 tarot.</p>
        <button className="mt-4 rounded-full bg-white px-5 py-2.5 text-[12px] font-medium tracking-[0.15em] text-[#08060f]">
          99.90 TL / AY
        </button>
      </section>

      <SectionLabel n="✦" title="Ayarlar" />
      <ul className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)]">
        <SettingRow label="Bildirim Saati" value="07:00" />
        <SettingRow label="Stil Tercihlerim" value={u.style} />
        <SettingRow label="Tema" value="Dark Luxury ✦" />
        <SettingRow label="Taş & Koku Arşivi" value="AURA+" locked />
        <SettingRow
          label="Mystic Card"
          value={mystic ? "Açık" : "Reklam izle"}
          onClick={() => setMystic(true)}
        />
      </ul>

      <button
        onClick={() => { clearUser(); }}
        className="mb-6 w-full rounded-full border border-[color:var(--border)] py-3 text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]"
      >
        Profili Sıfırla
      </button>

      {mystic && <MysticCard onClose={() => setMystic(false)} />}
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
          {locked && <span className="rounded-full bg-[color:var(--aura-lavender)]/15 px-2 py-0.5 text-[9px] tracking-wider text-[color:var(--aura-lavender)]">AURA+</span>}
          {value}
          <span className="text-[color:var(--aura-muted)]">›</span>
        </span>
      </button>
    </li>
  );
}

function MysticCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#03020a]/95 px-6 backdrop-blur-xl animate-aura-fade-in">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl animate-aura-pulse" />
      <div className="relative max-w-sm text-center">
        <p className="section-label">Mistik Kart</p>
        <p className="serif mt-6 text-[28px] leading-snug italic text-white">
          "Bazı şeyleri çözmek zorunda değilsin."
        </p>
        <p className="mt-4 text-[14px] text-[color:var(--aura-soft)]">Bugün kontrol değil, denge günü.</p>
        <p className="mt-8 text-[11px] tracking-[0.35em] text-[color:var(--aura-muted)]">— AURA 🤍</p>
        <div className="mt-10 flex gap-3">
          <button className="flex-1 rounded-full border border-[color:var(--border)] py-3 text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-soft)]" onClick={onClose}>
            Kaydet
          </button>
          <button className="aura-btn flex-1 text-[11px]" onClick={onClose}>
            Paylaş
          </button>
        </div>
        <button onClick={onClose} className="mt-6 text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Kapat</button>
      </div>
    </div>
  );
}
