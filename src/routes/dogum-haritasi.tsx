import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName, userCity, zodiacOf } from "@/lib/aura/store";
import { getBirthChart, type BirthChart, type ChartResult } from "@/lib/aura/birth-chart.functions";

export const Route = createFileRoute("/dogum-haritasi")({
  head: () => ({
    meta: [
      { title: "Doğum Haritası ✦ AURA" },
      { name: "description", content: "Güneş, ay, yükselen ve gezegen konumların — kişiye özel astrolojik analiz." },
    ],
  }),
  component: BirthChartPage,
});

function BirthChartPage() {
  const [u, , ready, authed] = useUser();
  const [state, setState] = useState<ChartResult | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchChart = useServerFn(getBirthChart);

  useEffect(() => {
    if (!authed || !u) return;
    setLoading(true);
    fetchChart({
      data: {
        context: {
          name: userName(u),
          zodiac: zodiacOf(u),
          birthDate: u.birthDate,
          birthTime: u.birthTime,
          city: userCity(u),
        },
      },
    })
      .then(setState)
      .finally(() => setLoading(false));
  }, [authed, u, fetchChart]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  return (
    <AuraShell>
      <header className="mb-4 animate-aura-fade-in">
        <p className="section-label">D · O · Ğ · U · M · H · A · R · İ · T · A · S · I</p>
        <h1 className="serif mt-2 text-[36px] leading-[1.05] font-light text-white">
          Yıldız Haritan <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[13px] italic text-[color:var(--aura-soft)]">
          {u.birthDate} {u.birthTime ?? ""} · {userCity(u)}
        </p>
      </header>

      {loading && <div className="aura-card p-6 text-center text-[12px] text-[color:var(--aura-soft)]">Haritanız hesaplanıyor ✦</div>}

      {!loading && state && !state.ok && (
        <div className="aura-card p-6 text-center text-[13px] text-[color:var(--aura-soft)]">{state.message}</div>
      )}

      {!loading && state?.ok && state.locked && (
        <div className="aura-card-dark p-6 text-center">
          <div className="serif text-5xl text-white/40">✦</div>
          <p className="serif mt-3 text-[20px] italic text-white">Yıldız haritan Premium ile açılır.</p>
          <Link to="/profil" className="aura-btn aura-btn-hover mt-5 inline-block px-6 text-[12px]">AURA Premium ile Aç</Link>
        </div>
      )}

      {!loading && state?.ok && !state.locked && <ChartBody chart={state.chart} />}
    </AuraShell>
  );
}

const PLANET_ORDER: { key: keyof BirthChart; icon: string }[] = [
  { key: "sun", icon: "☉" },
  { key: "moon", icon: "☽" },
  { key: "rising", icon: "↑" },
  { key: "mercury", icon: "☿" },
  { key: "venus", icon: "♀" },
  { key: "mars", icon: "♂" },
  { key: "jupiter", icon: "♃" },
  { key: "saturn", icon: "♄" },
];

function ChartBody({ chart }: { chart: BirthChart }) {
  return (
    <div className="flex flex-col gap-3 animate-aura-fade-in">
      <ChartWheel chart={chart} />

      <Card title="✨ Kişilik Özetin">
        <p className="text-[14px] leading-relaxed text-[color:var(--aura-soft)]">{chart.personality}</p>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="💪 Güçlü Yönlerin">
          <ul className="space-y-1 text-[13px] text-[color:var(--aura-soft)]">
            {chart.strengths.map((s, i) => <li key={i}>· {s}</li>)}
          </ul>
        </Card>
        <Card title="🌑 Çalışılacak Alanlar">
          <ul className="space-y-1 text-[13px] text-[color:var(--aura-soft)]">
            {chart.challenges.map((s, i) => <li key={i}>· {s}</li>)}
          </ul>
        </Card>
      </div>

      <Card title="🪐 Gezegenlerin">
        <div className="grid grid-cols-1 gap-2">
          {PLANET_ORDER.map(({ key, icon }) => {
            const p = chart[key] as BirthChart["sun"];
            return (
              <div key={key} className="rounded-xl border border-[color:var(--border)] bg-white/[0.02] p-3">
                <div className="flex items-baseline justify-between">
                  <p className="serif text-[16px] text-white">{icon} {p.name}</p>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-lavender)]">{p.sign} · {p.house}</p>
                </div>
                <p className="mt-1 text-[12px] text-[color:var(--aura-soft)]">{p.meaning}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="🛤️ Yaşam Yolun">
        <p className="text-[14px] leading-relaxed text-[color:var(--aura-soft)]">{chart.life_path}</p>
      </Card>

      <Card title="💫 İmza Cümlen">
        <p className="serif text-center text-[18px] italic text-white">"{chart.signature_sentence}"</p>
      </Card>
    </div>
  );
}

function ChartWheel({ chart }: { chart: BirthChart }) {
  const planets = PLANET_ORDER.map(({ key, icon }, i) => {
    const angle = (i / PLANET_ORDER.length) * Math.PI * 2 - Math.PI / 2;
    const r = 90;
    const x = 120 + Math.cos(angle) * r;
    const y = 120 + Math.sin(angle) * r;
    return { icon, x, y, sign: (chart[key] as BirthChart["sun"]).sign };
  });
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] p-4"
      style={{ background: "radial-gradient(circle at 50% 50%, #1f0f33 0%, #0b0716 100%)" }}
    >
      <svg viewBox="0 0 240 240" className="mx-auto h-60 w-60">
        <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(183,148,212,0.25)" />
        <circle cx="120" cy="120" r="78" fill="none" stroke="rgba(183,148,212,0.15)" />
        <circle cx="120" cy="120" r="40" fill="none" stroke="rgba(212,176,120,0.3)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={i}
              x1={120 + Math.cos(a) * 40}
              y1={120 + Math.sin(a) * 40}
              x2={120 + Math.cos(a) * 110}
              y2={120 + Math.sin(a) * 110}
              stroke="rgba(183,148,212,0.12)"
            />
          );
        })}
        {planets.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="14" fill="#1a0f2e" stroke="rgba(212,176,120,0.55)" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="13" fill="#d4b078">{p.icon}</text>
          </g>
        ))}
        <text x="120" y="125" textAnchor="middle" fontSize="22" fill="rgba(212,176,120,0.7)" fontFamily="Cormorant Garamond">✦</text>
      </svg>
    </section>
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
