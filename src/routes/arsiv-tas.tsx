import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser } from "@/lib/aura/store";
import {
  getStoneArchive,
  toggleStoneFavorite,
  type ArchiveResult,
  type StoneEntry,
} from "@/lib/aura/stones-archive.functions";

export const Route = createFileRoute("/arsiv-tas")({
  head: () => ({
    meta: [
      { title: "Taş & Koku Arşivi ✦ AURA" },
      { name: "description", content: "Sana önerilen tüm taşların ve kokuların kişisel arşivi." },
    ],
  }),
  component: ArchivePage,
});

type Tab = "stones" | "scents" | "favs";

function ArchivePage() {
  const [u, , ready, authed] = useUser();
  const [data, setData] = useState<ArchiveResult | null>(null);
  const [tab, setTab] = useState<Tab>("stones");
  const [loading, setLoading] = useState(true);
  const fetchArchive = useServerFn(getStoneArchive);
  const toggle = useServerFn(toggleStoneFavorite);

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetchArchive()
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, [authed, fetchArchive]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const isFav = (kind: "stone" | "scent", name: string) =>
    data?.favorites.some((f) => f.kind === kind && f.name === name) ?? false;

  const handleFav = async (entry: StoneEntry) => {
    const r = await toggle({ data: { kind: entry.kind, name: entry.name, meaning: entry.meaning } });
    if (!data) return;
    if (r.favorited) {
      setData({
        ...data,
        favorites: [...data.favorites, { kind: entry.kind, name: entry.name, meaning: entry.meaning }],
      });
    } else {
      setData({
        ...data,
        favorites: data.favorites.filter((f) => !(f.kind === entry.kind && f.name === entry.name)),
      });
    }
  };

  return (
    <AuraShell>
      <header className="mb-4 animate-aura-fade-in">
        <p className="section-label">A · R · Ş · İ · V</p>
        <h1 className="serif mt-2 text-[40px] leading-[1.05] font-light text-white">
          Taş & Koku Arşivi <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[13px] italic text-[color:var(--aura-soft)]">
          Sana özel önerilen tüm enerjiler bir arada.
        </p>
      </header>

      {data?.locked && (
        <div className="aura-card-dark mb-4 p-6 text-center">
          <div className="serif text-5xl text-white/40">✦</div>
          <p className="serif mt-3 text-[20px] italic text-white">Arşiv AURA+ üyelerine açık.</p>
          <Link to="/profil" className="aura-btn aura-btn-hover mt-5 inline-block px-6 text-[12px]">AURA+ ile Aç</Link>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {(["stones", "scents", "favs"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full border px-3 py-2 text-[11px] tracking-[0.15em] uppercase transition ${
              tab === t
                ? "border-[color:var(--aura-lavender)] bg-[color:var(--aura-purple)]/20 text-white"
                : "border-[color:var(--border)] text-[color:var(--aura-soft)]"
            }`}
          >
            {t === "stones" ? "Taşlar" : t === "scents" ? "Kokular" : "Favoriler"}
          </button>
        ))}
      </div>

      {loading && <div className="aura-card p-5 text-center text-[12px] text-[color:var(--aura-soft)]">Yükleniyor…</div>}

      {!loading && data && (
        <div className="flex flex-col gap-3">
          {tab === "stones" && data.stones.length === 0 && <Empty />}
          {tab === "stones" &&
            data.stones.map((s, i) => (
              <EntryCard
                key={i}
                entry={s}
                fav={isFav("stone", s.name)}
                onFav={() => handleFav(s)}
              />
            ))}

          {tab === "scents" && data.scents.length === 0 && <Empty />}
          {tab === "scents" &&
            data.scents.map((s, i) => (
              <EntryCard key={i} entry={s} fav={isFav("scent", s.name)} onFav={() => handleFav(s)} />
            ))}

          {tab === "favs" && data.favorites.length === 0 && (
            <div className="aura-card p-6 text-center text-[13px] text-[color:var(--aura-soft)]">
              Henüz favorin yok. Taş ve koku kartlarında ♥ simgesine dokun.
            </div>
          )}
          {tab === "favs" &&
            data.favorites.map((f, i) => (
              <EntryCard
                key={i}
                entry={{ name: f.name, meaning: f.meaning ?? "", date: "", kind: f.kind }}
                fav={true}
                onFav={() => handleFav({ name: f.name, meaning: f.meaning ?? "", date: "", kind: f.kind })}
              />
            ))}
        </div>
      )}
    </AuraShell>
  );
}

function Empty() {
  return (
    <div className="aura-card p-6 text-center text-[13px] text-[color:var(--aura-soft)]">
      Henüz arşivde içerik yok. Günlük AURA kullandıkça doluyor.
    </div>
  );
}

function EntryCard({ entry, fav, onFav }: { entry: StoneEntry; fav: boolean; onFav: () => void }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] p-5"
      style={{ background: "linear-gradient(160deg, #0b0716 0%, #1a0f2e 100%)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="serif text-[18px] text-white">{entry.name}</p>
          <p className="mt-1 text-[13px] text-[color:var(--aura-soft)]">{entry.meaning}</p>
          {entry.date && (
            <p className="mt-2 text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)]">
              {new Date(entry.date).toLocaleDateString("tr-TR")}
            </p>
          )}
        </div>
        <button
          onClick={onFav}
          aria-label={fav ? "Favoriden çıkar" : "Favorilere ekle"}
          className={`text-2xl transition ${fav ? "text-[color:var(--aura-lavender)]" : "text-white/40 hover:text-white"}`}
        >
          {fav ? "♥" : "♡"}
        </button>
      </div>
    </section>
  );
}
