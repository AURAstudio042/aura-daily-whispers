import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName, userCity, zodiacOf } from "@/lib/aura/store";
import {
  generateSpecialDay,
  OCCASIONS,
  type SpecialDayPlan,
} from "@/lib/aura/special-day.functions";

export const Route = createFileRoute("/ozel-gun")({
  head: () => ({
    meta: [
      { title: "Özel Gün Analizi ✦ AURA" },
      { name: "description", content: "Doğum günün, yıl dönümün ya da özel bir günün için kişisel astrolojik analiz." },
      { property: "og:title", content: "Özel Gün Analizi ✦ AURA" },
      { property: "og:description", content: "Doğum günün, yıl dönümün ya da özel bir günün için kişisel astrolojik analiz." },
      { property: "og:url", content: "https://aura-daily-whispers.lovable.app/ozel-gun" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Özel Gün Analizi ✦ AURA" },
      { name: "twitter:description", content: "Doğum günün, yıl dönümün ya da özel bir günün için kişisel astrolojik analiz." },
    ],
    links: [{ rel: "canonical", href: "https://aura-daily-whispers.lovable.app/ozel-gun" }],
  }),
  component: OzelGunPage,
});

function OzelGunPage() {
  const [u, , ready, authed] = useUser();
  const [occasion, setOccasion] = useState<string>("wedding");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<SpecialDayPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const fn = useServerFn(generateSpecialDay);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const submit = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setLocked(false);
    try {
      const r = await fn({
        data: {
          occasion,
          date,
          note: note.trim() || undefined,
          context: {
            name: userName(u),
            zodiac: zodiacOf(u),
            style: u.style,
            city: userCity(u),
            gender: u.gender,
          },
        },
      });
      if (r.ok) setPlan(r.plan);
      else {
        setError(r.message);
        if (r.reason === "locked") setLocked(true);
      }
    } catch {
      setError("Şu an hazırlanamadı, tekrar dene.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuraShell>
      <header className="mb-4 animate-aura-fade-in">
        <p className="section-label">Ö · Z · E · L · G · Ü · N</p>
        <h1 className="serif mt-2 text-[40px] leading-[1.05] font-light text-white">
          Özel Gün Modu <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[13px] italic text-[color:var(--aura-soft)]">
          O güne özel enerji, kombin, taş, koku ve hazırlık rehberi.
        </p>
      </header>

      <section className="aura-card mb-4 p-5 animate-aura-fade-in">
        <label className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Olay</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOccasion(o.id)}
              className={`rounded-full border px-3 py-2 text-[11px] transition ${
                occasion === o.id
                  ? "border-[color:var(--aura-lavender)] bg-[color:var(--aura-purple)]/20 text-white"
                  : "border-[color:var(--border)] text-[color:var(--aura-soft)] hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Tarih</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mb-4 w-full rounded-xl border border-[color:var(--border)] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[color:var(--aura-lavender)]/60"
        />

        <label className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Not (opsiyonel)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Mekân, beklenti, dress code..."
          className="mb-4 w-full rounded-xl border border-[color:var(--border)] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[color:var(--aura-lavender)]/60"
        />

        <button
          onClick={submit}
          disabled={loading}
          className="aura-btn aura-btn-hover w-full text-[12px] disabled:opacity-50"
        >
          {loading ? "Hazırlanıyor ✦" : "Rehberi Oluştur ✦"}
        </button>
      </section>

      {error && !locked && (
        <div className="aura-card p-5 text-center text-[13px] text-[color:var(--aura-soft)]">{error}</div>
      )}
      {locked && (
        <div className="aura-card-dark p-6 text-center">
          <div className="serif text-5xl text-white/40">✦</div>
          <p className="serif mt-3 text-[20px] italic text-white">Özel gün modu AURA+ üyelerine açık.</p>
          <p className="mt-2 text-[13px] text-[color:var(--aura-soft)]">{error}</p>
          <Link to="/profil" className="aura-btn aura-btn-hover mt-5 inline-block px-6 text-[12px]">AURA+ ile Aç</Link>
        </div>
      )}

      {plan && <PlanView plan={plan} />}
    </AuraShell>
  );
}

function PlanView({ plan }: { plan: SpecialDayPlan }) {
  return (
    <div className="flex flex-col gap-3 animate-aura-fade-in">
      <Card title="✨ Günün Enerjisi">
        <p className="serif text-[18px] italic text-white">{plan.title}</p>
        <p className="mt-2 text-[13px] text-[color:var(--aura-soft)]">{plan.energy}</p>
      </Card>

      <Card title="👗 Kombin">
        <ul className="space-y-1 text-[13px] text-[color:var(--aura-soft)]">
          <li><span className="text-white">Üst: </span>{plan.outfit.top}</li>
          <li><span className="text-white">Alt: </span>{plan.outfit.bottom}</li>
          <li><span className="text-white">Ayakkabı: </span>{plan.outfit.shoes}</li>
          <li><span className="text-white">Aksesuar: </span>{plan.outfit.accessory}</li>
          <li><span className="text-white">Makyaj: </span>{plan.outfit.makeup}</li>
        </ul>
      </Card>

      <Card title="🎨 Renk Paleti">
        <div className="flex flex-wrap gap-2">
          {plan.color_palette.map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full border border-[color:var(--border)] px-2 py-1">
              <span className="h-5 w-5 rounded-full" style={{ background: c }} />
              <span className="text-[11px] text-[color:var(--aura-soft)]">{c}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card title="💎 Taş">
          <p className="serif text-[16px] text-white">{plan.stone.name}</p>
          <p className="mt-1 text-[12px] text-[color:var(--aura-soft)]">{plan.stone.meaning}</p>
        </Card>
        <Card title="🌸 Koku">
          <p className="serif text-[16px] text-white">{plan.scent.name}</p>
          <p className="mt-1 text-[12px] text-[color:var(--aura-soft)]">{plan.scent.feeling}</p>
        </Card>
      </div>

      <Card title="🌅 Hazırlık Rehberi">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Sabah</p>
        <p className="mb-3 text-[13px] text-[color:var(--aura-soft)]">{plan.prep_morning}</p>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Öğlen</p>
        <p className="mb-3 text-[13px] text-[color:var(--aura-soft)]">{plan.prep_afternoon}</p>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Akşam</p>
        <p className="text-[13px] text-[color:var(--aura-soft)]">{plan.prep_evening}</p>
      </Card>

      <Card title="💫 Güç Cümlesi">
        <p className="serif text-center text-[18px] italic text-white">"{plan.affirmation}"</p>
      </Card>
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
      <p className="mb-2 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">{title}</p>
      {children}
    </section>
  );
}
