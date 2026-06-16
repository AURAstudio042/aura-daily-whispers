import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AuraShell, SectionLabel, ShareSignature, Tag } from "@/components/aura/Shell";
import { Onboarding } from "@/components/aura/Onboarding";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { useUser, userName, userCity, zodiacOf, toggleFav, useFavs } from "@/lib/aura/store";
import {
  ZODIAC_SYMBOL,
  greetingHint,
  dailyHoroscope,
  dailyColors,
  dailyOutfit,
  dailyStone,
  dailyScent,
  dailyQuote,
  dailyWeather,
} from "@/lib/aura/data";
import { useDailyPack } from "@/lib/aura/useDailyPack";
import { useDailyWeather, weatherNote } from "@/lib/aura/useDailyWeather";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bugün ✦ AURA" },
      { name: "description", content: "Günlük AURA paketin: burç, renk, stil, taş, koku ve günün sözü." },
    ],
  }),
  component: BugunPage,
});

function BugunPage() {
  const [u, , ready, authed] = useUser();
  const city = userCity(u);
  const mock = dailyWeather(city);
  const live = useDailyWeather(u?.city);
  const weather = live
    ? { icon: live.icon, cond: live.cond, temp: live.temp, city: live.city, note: weatherNote(live) }
    : mock;
  const { pack, loading } = useDailyPack(u, { temp: weather.temp, cond: weather.cond });

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const name = userName(u);
  const z = zodiacOf(u);

  const horo = pack?.horoscope ?? dailyHoroscope(z, u.mood);
  const colors = pack?.colors ?? dailyColors(u.style, u.mood);
  const outfitMock = dailyOutfit(z, u.style, u.mood);
  const outfit = {
    top: pack?.outfit.top ?? outfitMock.top,
    bottom: pack?.outfit.bottom ?? outfitMock.bottom,
    shoe: pack?.outfit.shoes ?? outfitMock.shoe,
    access: pack?.outfit.accessory ?? outfitMock.access,
    lip: outfitMock.lip,
    jewelry: outfitMock.jewelry,
    harmony: pack?.colorNote ?? outfitMock.harmony,
    inspiration: pack?.styleInspo ?? outfitMock.inspiration,
    makeup: pack?.makeup ?? null as string | null,
  };
  const stoneMock = dailyStone(z, u.mood);
  const stone = {
    kind: stoneMock.kind,
    name: pack?.stone.name ?? stoneMock.name,
    meaning: pack?.stone.meaning ?? stoneMock.meaning,
    tags: stoneMock.tags,
  };
  const scentMock = dailyScent(u.mood);
  const scent = pack?.scent
    ? { scents: pack.scent.names.split(/[,·]\s*/).map((s) => s.trim()).filter(Boolean), feel: pack.scent.feeling }
    : { scents: scentMock.scents, feel: scentMock.feel };
  const quote = pack?.quote ?? dailyQuote();
  const morning = pack?.greeting ?? greetingHint(z);




  return (
    <AuraShell>
      {/* HEADER */}
      <header className="relative mb-7 animate-aura-fade-in">
        <div className="aura-glow -left-10 -top-16 h-56 w-56 bg-[#8b5cf6]/40" />
        <div className="aura-glow -right-12 top-10 h-40 w-40 bg-[#b794d4]/25" />
        <div className="relative flex items-start justify-between">
          <div className="min-w-0">
            <p className="section-label">A · U · R · A · GÜNLÜK RİTÜELİN</p>
            <h1 className="mt-3 text-[42px] leading-[1.05] font-light text-white">Günaydın,<br/>{name} <span className="text-[color:var(--aura-lavender)]">✦</span></h1>
            <p className="mt-3 text-[15px] italic text-[color:var(--aura-soft)]">{morning}{loading && <span className="ml-2 text-[11px] not-italic tracking-[0.2em] uppercase text-[color:var(--aura-muted)]">✦ aura örülüyor…</span>}</p>
          </div>
          <div className="shrink-0 grid h-14 w-14 place-items-center rounded-full border border-[color:var(--border)] bg-white/[0.03] text-2xl text-white backdrop-blur-md" aria-label={`Burç: ${z}`}>
            {ZODIAC_SYMBOL[z]}
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Tag>{city}</Tag>
          <Tag>{z}</Tag>
          {u.mood && <Tag>{u.mood}</Tag>}
        </div>
      </header>

      {/* WEATHER */}
      <div className="aura-card mb-5 flex items-center gap-4 p-4 animate-aura-fade-in">
        <div className="text-4xl">{weather.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[color:var(--aura-soft)]">
            Bugün <span className="text-white">{weather.city}</span>'da{" "}
            <span className="text-white">{weather.temp}°C</span> ve {weather.cond}.
          </p>
          <p className="text-[12px] text-[color:var(--aura-muted)]">{weather.note}</p>
        </div>
      </div>

      {/* 01 HOROSCOPE */}
      <Card>
        <SectionLabel n="01" title="Günlük Yorumun" />
        <p className="text-[16px] leading-relaxed text-white">{horo}</p>
      </Card>

      {/* 02 COLORS */}
      <Card>
        <SectionLabel n="02" title="Renklerin" />
        <div className="flex justify-around gap-3">
          {colors.map((c) => (
            <div key={c.name} className="flex flex-col items-center gap-2">
              <span
                className="h-14 w-14 rounded-full ring-1 ring-white/10"
                style={{ background: c.hex, boxShadow: `0 0 24px ${c.hex}55` }}
              />
              <span className="text-[11px] tracking-wide text-[color:var(--aura-soft)]">{c.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 03 STYLE */}
      <Card>
        <SectionLabel n="03" title="Stilin" />
        <ul className="space-y-2 text-[14px] text-[color:var(--aura-soft)]">
          <Row k="Üst" v={outfit.top} />
          <Row k="Alt" v={outfit.bottom} />
          <Row k="Ayakkabı" v={outfit.shoe} />
          <Row k="Aksesuar" v={outfit.access} />
        </ul>
        <Sep />
        <p className="text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Makyaj & Detay</p>
        <p className="mt-1 text-[14px] text-[color:var(--aura-soft)]">
          {outfit.makeup ?? <>Ruj: <span className="text-white">{outfit.lip}</span> · Takı: <span className="text-white">{outfit.jewelry}</span></>}
        </p>
        <Sep />
        <p className="text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Renk Uyumu</p>
        <p className="mt-1 text-[14px] text-[color:var(--aura-soft)]">{outfit.harmony}</p>
        <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[#0a0714] p-4">
          <p className="text-[15px] italic text-white">"{outfit.inspiration}"</p>
        </div>
      </Card>

      {/* 04 STONE */}
      <Card>
        <SectionLabel n="04" title="Taşın" />
        <div className="flex items-center gap-5">
          <div className={`gem gem-${stone.kind} animate-aura-pulse shrink-0`} />
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-light text-white">{stone.name}</h3>
            <p className="mt-1 text-[13px] text-[color:var(--aura-soft)]">{stone.meaning}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {stone.tags.map((t) => (
                <span key={t} className="pill-light rounded-full px-2.5 py-1 text-[10px] tracking-[0.15em] uppercase">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 05 SCENT */}
      <Card>
        <SectionLabel n="05" title="Kokun" />
        <p className="text-[16px] text-white">
          {scent.scents.join(" · ")}
        </p>
        <p className="mt-2 text-[13px] italic text-[color:var(--aura-soft)]">{scent.feel}</p>
      </Card>

      {/* 06 QUOTE */}
      <QuoteCard q={quote} />

      {/* SHARE */}
      <button
        onClick={() => {
          if (typeof navigator !== "undefined" && (navigator as any).share) {
            (navigator as any).share({ title: "AURA", text: `${horo}\n\n— AURA ✨` }).catch(() => {});
          }
        }}
        className="aura-btn aura-btn-hover mt-6 w-full text-[13px]"
      >
        ✦ AURA'mı Paylaş ✦
      </button>

      <ShareSignature />
    </AuraShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="aura-card mb-5 p-5 animate-aura-fade-in">{children}</section>;
}
function Sep() {
  return <div className="my-4 h-px bg-[color:var(--border)]" />;
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex gap-3">
      <span className="w-20 shrink-0 text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)]">{k}</span>
      <span className="min-w-0 flex-1 text-white">{v}</span>
    </li>
  );
}

function QuoteCard({ q }: { q: { text: string; author?: string; category: string } }) {
  const [shared, setShared] = useState(false);
  const favs = useFavs();
  const id = "q:" + q.text;
  const saved = favs.some((f) => f.id === id);
  return (
    <section className="aura-card-dark relative mb-5 overflow-hidden p-6 animate-aura-fade-in">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/20 blur-3xl" />
      <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Günün Sözü · {q.category}</p>
      <p className="serif mt-4 text-[24px] leading-snug italic text-white">"{q.text}"</p>
      {q.author && <p className="mt-3 text-[12px] tracking-wider text-[color:var(--aura-soft)]">— {q.author}</p>}
      <div className="mt-5 flex items-center justify-between">
        <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-lavender)]">
          {q.category}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => toggleFav({ id, text: q.text, author: q.author, date: new Date().toISOString() })}
            aria-label="Favori"
            className="rounded-full border border-[color:var(--border)] p-2 text-[color:var(--aura-soft)]"
          >
            {saved ? "♥" : "♡"}
          </button>
          <button
            onClick={() => {
              if ((navigator as any).share) (navigator as any).share({ text: `"${q.text}"${q.author ? ` — ${q.author}` : ""}\n\n— AURA ✨` }).catch(() => {});
              else setShared(true);
            }}
            className="rounded-full border border-[color:var(--border)] px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-lavender)]"
          >
            {shared ? "Kopyalandı" : "Paylaş"}
          </button>
        </div>
      </div>
      <p className="mt-4 text-right text-[10px] tracking-[0.35em] text-[color:var(--aura-muted)]">— AURA ✨</p>
    </section>
  );
}
