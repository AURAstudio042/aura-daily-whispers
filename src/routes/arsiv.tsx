import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AuraShell, SectionLabel } from "@/components/aura/Shell";
import { Onboarding } from "@/components/aura/Onboarding";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { useUser, useFavs, zodiacOf } from "@/lib/aura/store";
import { dailyColors, dailyStone, dailyScent, QUOTES, pick } from "@/lib/aura/data";

export const Route = createFileRoute("/arsiv")({
  head: () => ({ meta: [{ title: "Arşiv ✦ AURA" }, { name: "description", content: "Geçmiş AURA günlerin ve kaydettiğin sözler." }] }),
  component: ArsivPage,
});

const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DAYS_TR = ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
const MOODS_PAST = ["Sakin", "Odaklı", "Enerjik", "Romantik", "Yorgun", "Mutlu"];

function ArsivPage() {
  const [u, , ready, authed] = useUser();
  const favs = useFavs();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());

  const days = useMemo(() => {
    const year = now.getFullYear();
    const last = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();
    const inThisMonth = month === now.getMonth();
    const cap = inThisMonth ? today : last;
    return Array.from({ length: cap }, (_, i) => cap - i).map((d) => {
      const date = new Date(year, month, d);
      const z = u ? zodiacOf(u) : "Bilinmiyor";
      const stone = dailyStone(z);
      const scent = dailyScent();
      const colors = dailyColors(u?.style, u?.mood).slice(0, 3);
      const q = pick(QUOTES, "arch-" + d + month);
      return {
        d, date, isToday: inThisMonth && d === today,
        mood: pick(MOODS_PAST, "m-" + d + month),
        quote: q.text.slice(0, 60) + (q.text.length > 60 ? "…" : ""),
        stoneName: stone.name, scent: scent.scents[0], colors,
      };
    });
  }, [month, u]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const stats = [
    { v: days.length, l: "Açılan gün" },
    { v: Math.floor(days.length / 3), l: "Paylaşım" },
    { v: favs.length, l: "Favori" },
    { v: Math.max(1, Math.floor(days.length / 5)), l: "Mistik Kart" },
  ];

  return (
    <AuraShell>
      <header className="mb-6 animate-aura-fade-in">
        <p className="section-label">A · U · R · A · ARŞİV</p>
        <h1 className="mt-3 text-4xl font-light text-white">Geçmiş Günlerin <span className="text-[color:var(--aura-lavender)]">✦</span></h1>
      </header>

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-2">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => setMonth(i)}
            disabled={i > now.getMonth()}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs tracking-wide transition-all ${
              i === month
                ? "border-[color:var(--aura-lavender)] bg-[color:var(--aura-lavender)]/15 text-white"
                : "border-[color:var(--border)] text-[color:var(--aura-soft)]"
            } ${i > now.getMonth() ? "opacity-30" : ""}`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="aura-card mb-5 grid grid-cols-4 gap-2 p-4">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <p className="serif text-2xl text-white">{s.v}</p>
            <p className="mt-1 text-[9px] tracking-[0.15em] uppercase text-[color:var(--aura-muted)]">{s.l}</p>
          </div>
        ))}
      </div>

      <SectionLabel n="✦" title="Günler" />
      <ul className="mb-6 space-y-3">
        {days.map((d) => (
          <li
            key={d.d}
            className={`aura-card p-4 ${d.isToday ? "ring-1 ring-[color:var(--aura-lavender)]/60" : ""}`}
          >
            <div className="flex items-start gap-4">
              <div className="text-center">
                <p className="serif text-3xl text-white">{d.d}</p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)]">{DAYS_TR[d.date.getDay()]}</p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-lavender)]">{d.mood}</span>
                  {d.isToday && <span className="rounded-full bg-[color:var(--aura-lavender)]/15 px-2 py-0.5 text-[9px] tracking-wider text-white">BUGÜN</span>}
                </div>
                <p className="mt-1 text-[13px] italic text-[color:var(--aura-soft)]">"{d.quote}"</p>
                <div className="mt-2 flex items-center gap-2">
                  {d.colors.map((c) => (
                    <span key={c.name} className="h-3 w-3 rounded-full" style={{ background: c.hex }} />
                  ))}
                  <span className="ml-2 text-[10px] text-[color:var(--aura-muted)]">{d.stoneName} · {d.scent}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <SectionLabel n="♥" title="Kaydettiklerin" />
      {favs.length === 0 ? (
        <p className="aura-card p-5 text-[13px] text-[color:var(--aura-muted)]">Henüz favori söz yok. Beğendiğin bir sözü kaydet, burada görürsün.</p>
      ) : (
        <ul className="space-y-3">
          {favs.map((f) => (
            <li key={f.id} className="aura-card p-4">
              <p className="serif text-[15px] italic text-white">"{f.text}"</p>
              {f.author && <p className="mt-2 text-[11px] text-[color:var(--aura-soft)]">— {f.author}</p>}
              <p className="mt-1 text-[10px] tracking-wider text-[color:var(--aura-muted)]">{new Date(f.date).toLocaleDateString("tr-TR")}</p>
            </li>
          ))}
        </ul>
      )}
    </AuraShell>
  );
}
