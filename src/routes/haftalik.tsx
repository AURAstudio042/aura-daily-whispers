import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuraShell, SectionLabel, ShareSignature } from "@/components/aura/Shell";
import { Onboarding } from "@/components/aura/Onboarding";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { useUser, zodiacOf } from "@/lib/aura/store";
import { weeklyAura } from "@/lib/aura/data";
import { MonthlyAnalysisSection } from "@/components/aura/MonthlyAnalysis";

export const Route = createFileRoute("/haftalik")({
  head: () => ({ meta: [{ title: "Haftalık ✦ AURA" }, { name: "description", content: "Bu haftanın enerjisi, odak noktası ve mini hedefleri." }] }),
  component: HaftalikPage,
});

function HaftalikPage() {
  const [u, , ready, authed] = useUser();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const z = zodiacOf(u);
  const w = weeklyAura(z, u.mood);

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()} ${["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"][d.getMonth()]}`;

  return (
    <AuraShell>
      <header className="mb-6 animate-aura-fade-in">
        <p className="section-label">A · U · R A · HAFTALIK</p>
        <h1 className="mt-3 text-4xl font-light text-white">Bu Haftanın Enerjisi <span className="text-[color:var(--aura-lavender)]">✦</span></h1>
        <p className="mt-2 text-[13px] text-[color:var(--aura-muted)]">{fmt(monday)} — {fmt(sunday)}</p>
      </header>

      <Section title="🎯 Haftanın Odak Noktası">
        <p className="serif text-2xl italic text-white">{w.theme}</p>
      </Section>

      <Section title="💬 Sosyal Enerji">
        <p className="text-[15px] text-[color:var(--aura-soft)]">{w.social}</p>
      </Section>

      <Section title="💪 Motivasyon Alanı">
        <p className="text-[15px] text-[color:var(--aura-soft)]">{w.motivation}</p>
      </Section>

      <Section title="✓ Mini Hedefler">
        <ul className="space-y-3">
          {w.goals.map((g, i) => (
            <li key={i}>
              <button
                onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${checked[i] ? "border-[color:var(--aura-lavender)] bg-[color:var(--aura-lavender)]/30 text-white" : "border-[color:var(--border)]"}`}>
                  {checked[i] && "✓"}
                </span>
                <span className={`text-[14px] ${checked[i] ? "text-[color:var(--aura-muted)] line-through" : "text-[color:var(--aura-soft)]"}`}>{g}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="🌿 Öz Bakım Enerjisi">
        <p className="text-[13px] text-[color:var(--aura-muted)]">Haftanın Kokusu</p>
        <p className="mb-3 text-white">{w.scent}</p>
        <p className="text-[13px] text-[color:var(--aura-muted)]">Haftanın Rengi</p>
        <p className="mb-3 text-white">{w.color}</p>
        <p className="text-[13px] text-[color:var(--aura-muted)]">Küçük Ritüel</p>
        <p className="text-[color:var(--aura-soft)]">{w.ritual}</p>
      </Section>

      <section className="aura-card-dark relative mb-5 overflow-hidden p-6">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/20 blur-3xl" />
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Haftanın Cümlesi</p>
        <p className="serif mt-4 text-[22px] leading-snug italic text-white">"{w.quote.text}"</p>
        {w.quote.author && <p className="mt-3 text-[12px] tracking-wider text-[color:var(--aura-soft)]">— {w.quote.author}</p>}
        <p className="mt-4 text-right text-[10px] tracking-[0.35em] text-[color:var(--aura-muted)]">— AURA ✨</p>
      </section>

      <ShareSignature />

      <MonthlyAnalysisSection user={u} />
    </AuraShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="aura-card mb-5 p-5 animate-aura-fade-in">
      <SectionLabel n="✦" title={title} />
      {children}
    </section>
  );
}
