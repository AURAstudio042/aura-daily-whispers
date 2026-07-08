import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName, zodiacOf } from "@/lib/aura/store";
import { getDailyPlanets, type PlanetsResult } from "@/lib/aura/planets.functions";

export const Route = createFileRoute("/gezegenler")({
  head: () => ({
    meta: [
      { title: "Gezegen Takibi ✦ AURA" },
      { name: "description", content: "Bugünkü gezegen konumları ve burcuna etkileri." },
      { property: "og:title", content: "Gezegen Takibi ✦ AURA" },
      { property: "og:description", content: "Bugünkü gezegen konumları ve burcuna etkileri." },
      { property: "og:url", content: "https://aura-daily-whispers.lovable.app/gezegenler" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Gezegen Takibi ✦ AURA" },
      { name: "twitter:description", content: "Bugünkü gezegen konumları ve burcuna etkileri." },
    ],
    links: [{ rel: "canonical", href: "https://aura-daily-whispers.lovable.app/gezegenler" }],
  }),
  component: PlanetsPage,
});

function PlanetsPage() {
  const [u, , ready, authed] = useUser();
  const [state, setState] = useState<PlanetsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const fn = useServerFn(getDailyPlanets);

  useEffect(() => {
    if (!authed || !u) return;
    setLoading(true);
    fn({ data: { context: { name: userName(u), zodiac: zodiacOf(u) } } })
      .then(setState)
      .finally(() => setLoading(false));
  }, [authed, u, fn]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  return (
    <AuraShell>
      <header className="mb-4 animate-aura-fade-in">
        <p className="section-label">G · E · Z · E · G · E · N · L · E · R</p>
        <h1 className="serif mt-2 text-[40px] leading-[1.05] font-light text-white">
          Bugünün Gökyüzü <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[13px] italic text-[color:var(--aura-soft)]">
          {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      {loading && <div className="aura-card p-6 text-center text-[12px] text-[color:var(--aura-soft)]">Gökyüzü okunuyor ✦</div>}

      {!loading && state && !state.ok && (
        <div className="aura-card p-6 text-center text-[13px] text-[color:var(--aura-soft)]">{state.message}</div>
      )}

      {!loading && state?.ok && state.locked && (
        <div className="aura-card-dark p-6 text-center">
          <div className="serif text-5xl text-white/40">✦</div>
          <p className="serif mt-3 text-[20px] italic text-white">Gezegen takibi Premium ile açılır.</p>
          <Link to="/profil" className="aura-btn aura-btn-hover mt-5 inline-block px-6 text-[12px]">AURA Premium ile Aç</Link>
        </div>
      )}

      {!loading && state?.ok && !state.locked && (
        <div className="flex flex-col gap-3 animate-aura-fade-in">
          <Card title="✨ Günün Özeti">
            <p className="text-[14px] leading-relaxed text-[color:var(--aura-soft)]">{state.data.summary}</p>
          </Card>
          <Card title="🪐 Gezegenler">
            <div className="flex flex-col gap-2">
              {state.data.planets.map((p, i) => (
                <div key={i} className="rounded-xl border border-[color:var(--border)] bg-white/[0.02] p-3">
                  <div className="flex items-baseline justify-between">
                    <p className="serif text-[16px] text-white">{p.name}</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-lavender)]">{p.sign}</p>
                  </div>
                  <p className="mt-1 text-[12px] text-[color:var(--aura-soft)]">{p.influence}</p>
                  <p className="mt-1 text-[12px] italic text-white/80">Sana: {p.personal_effect}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card title="⚠️ Uyarı"><p className="text-[13px] text-[color:var(--aura-soft)]">{state.data.warning}</p></Card>
            <Card title="⏰ Güçlü Saatler"><p className="text-[13px] text-[color:var(--aura-soft)]">{state.data.power_hours}</p></Card>
          </div>
        </div>
      )}
    </AuraShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] p-5"
      style={{ background: "linear-gradient(160deg, #0b0716 0%, #1a0f2e 100%)" }}
    >
      <p className="mb-2 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">{title}</p>
      {children}
    </section>
  );
}
