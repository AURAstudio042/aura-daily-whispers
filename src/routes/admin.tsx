import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import {
  checkIsAdmin,
  getAdminStats,
  getUserMap,
  getUsageAnalytics,
  listContent,
  addContent,
  deleteContent,
  searchUsers,
  grantPremium,
} from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Paneli — AURA" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Tab = "stats" | "map" | "revenue" | "usage" | "content" | "users";

function AdminPage() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("stats");
  const check = useServerFn(checkIsAdmin);

  useEffect(() => {
    check()
      .then((r) => {
        if (!r.isAdmin) {
          navigate({ to: "/", replace: true });
        } else setAllowed(true);
      })
      .catch(() => navigate({ to: "/", replace: true }));
  }, [check, navigate]);

  if (!allowed) return <div className="min-h-screen bg-white" />;

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "📊 İstatistikler" },
    { id: "map", label: "🌍 Harita" },
    { id: "revenue", label: "💰 Gelir" },
    { id: "usage", label: "📱 Kullanım" },
    { id: "content", label: "📝 İçerik" },
    { id: "users", label: "👥 Kullanıcılar" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">AURA Admin Paneli</h1>
            <p className="text-xs text-slate-500">Yönetim & İçerik & Analitik</p>
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
          >
            ← Uygulamaya dön
          </button>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition ${
                tab === t.id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "stats" && <StatsPane />}
        {tab === "map" && <MapPane />}
        {tab === "revenue" && <RevenuePane />}
        {tab === "usage" && <UsagePane />}
        {tab === "content" && <ContentPane />}
        {tab === "users" && <UsersPane />}
      </main>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {title && <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>}
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

function StatsPane() {
  const fn = useServerFn(getAdminStats);
  const [d, setD] = useState<any>(null);
  useEffect(() => { fn().then(setD).catch(() => {}); }, [fn]);
  if (!d) return <p className="text-slate-500">Yükleniyor…</p>;
  const totalTier = (d.tiers.free + d.tiers.plus + d.tiers.premium) || 1;
  const pct = (n: number) => Math.round((n / totalTier) * 100);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Toplam kullanıcı" value={d.totalUsers} />
        <Stat label="Bugün kayıt" value={d.todayNew} />
        <Stat label="7 günde aktif" value={d.active7} />
        <Stat label="30 günde aktif" value={d.active30} />
      </div>
      <Card title="Üyelik dağılımı">
        <div className="space-y-2">
          {(["free", "plus", "premium"] as const).map((t) => (
            <div key={t} className="flex items-center gap-3 text-sm">
              <span className="w-20 capitalize text-slate-600">{t === "free" ? "Free" : t === "plus" ? "AURA+" : "Premium"}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-slate-900" style={{ width: `${pct(d.tiers[t])}%` }} />
              </div>
              <span className="w-24 text-right tabular-nums text-slate-700">{d.tiers[t]} ({pct(d.tiers[t])}%)</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Veri yok</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.label} className="flex items-center gap-3 text-sm">
              <span className="w-32 truncate text-slate-700">{i.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-indigo-500" style={{ width: `${(i.count / max) * 100}%` }} />
              </div>
              <span className="w-10 text-right tabular-nums text-slate-600">{i.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function MapPane() {
  const fn = useServerFn(getUserMap);
  const [d, setD] = useState<any>(null);
  useEffect(() => { fn().then(setD).catch(() => {}); }, [fn]);
  if (!d) return <p className="text-slate-500">Yükleniyor…</p>;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ListCard title="🏙️ Top 10 Şehir" items={d.cities} />
      <ListCard title="♈ Burçlar" items={d.zodiacs} />
      <ListCard title="✦ Stil Tipleri" items={d.styles} />
    </div>
  );
}

function RevenuePane() {
  const fn = useServerFn(getAdminStats);
  const [d, setD] = useState<any>(null);
  useEffect(() => { fn().then(setD).catch(() => {}); }, [fn]);
  if (!d) return <p className="text-slate-500">Yükleniyor…</p>;
  const r = d.revenue;
  const fmt = (n: number) => n.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Aylık toplam gelir" value={fmt(r.total)} sub="49.90 + 99.90 ₺/ay" />
        <Stat label="AURA+ aboneleri" value={r.plusCount} sub={fmt(r.plusRevenue)} />
        <Stat label="Premium aboneleri" value={r.premiumCount} sub={fmt(r.premiumRevenue)} />
        <Stat label="Aylık büyüme" value={`${r.growthPct >= 0 ? "+" : ""}${r.growthPct}%`} sub={`Bu ay: ${r.thisMonthNew} · Geçen: ${r.lastMonthNew}`} />
      </div>
    </div>
  );
}

function UsagePane() {
  const fn = useServerFn(getUsageAnalytics);
  const [d, setD] = useState<any>(null);
  useEffect(() => { fn().then(setD).catch(() => {}); }, [fn]);
  if (!d) return <p className="text-slate-500">Yükleniyor…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Mystic Card açılış" value={d.mysticViews} />
        <Stat label="Tarot çekim" value={d.tarotCount} />
        <Stat label="Paylaşım" value={d.shareCount} />
        <Stat label="Günlük açılış (ort. kullanıcı)" value={d.avgDailyOpens} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="En çok görüntülenen bölümler (30g)" items={d.sections.map((s: any) => ({ label: s.route, count: s.count }))} />
        <ListCard title="En çok kaydedilen sözler" items={d.topQuotes.map((q: any) => ({ label: q.text.slice(0, 40) + (q.text.length > 40 ? "…" : ""), count: q.count }))} />
      </div>
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  whispers: "Whispers Bildirimleri",
  quotes: "Günlük Sözler",
  mystic: "Mystic Card İçeriği",
  special_days: "Özel Gün Mesajları",
};

function ContentPane() {
  const [kind, setKind] = useState<"whispers" | "quotes" | "mystic" | "special_days">("whispers");
  const list = useServerFn(listContent);
  const add = useServerFn(addContent);
  const del = useServerFn(deleteContent);
  const [rows, setRows] = useState<any[]>([]);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [preview, setPreview] = useState<string>("");

  const reload = () => list({ data: { kind } }).then((r) => setRows(r.rows)).catch(() => {});
  useEffect(() => { reload(); setDraft({}); setPreview(""); }, [kind]);

  const fields = useMemo(() => {
    if (kind === "whispers") return [{ name: "text", label: "Bildirim metni", type: "textarea" }];
    if (kind === "quotes") return [
      { name: "text", label: "Söz", type: "textarea" },
      { name: "author", label: "Yazar", type: "text" },
    ];
    if (kind === "mystic") return [
      { name: "title", label: "Başlık", type: "text" },
      { name: "body", label: "İçerik", type: "textarea" },
      { name: "category", label: "Kategori", type: "text" },
    ];
    return [
      { name: "month", label: "Ay (1-12)", type: "number" },
      { name: "day", label: "Gün (1-31)", type: "number" },
      { name: "label", label: "Etiket (ör. Sevgililer Günü)", type: "text" },
      { name: "message", label: "Mesaj", type: "textarea" },
    ];
  }, [kind]);

  const submit = async () => {
    const payload = { ...draft };
    if (kind === "special_days") {
      payload.month = Number(payload.month);
      payload.day = Number(payload.day);
    }
    await add({ data: { kind, payload } });
    setDraft({}); setPreview(""); reload();
  };

  const previewText = () => {
    if (kind === "whispers") setPreview(draft.text || "");
    else if (kind === "quotes") setPreview(`"${draft.text || ""}" — ${draft.author || "Anonim"}`);
    else if (kind === "mystic") setPreview(`${draft.title || ""}\n\n${draft.body || ""}`);
    else setPreview(`${draft.label || ""} (${draft.day}/${draft.month}): ${draft.message || ""}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k as any)}
            className={`rounded-md px-3 py-1.5 text-sm ${kind === k ? "bg-slate-900 text-white" : "border border-slate-300 hover:bg-slate-50"}`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <Card title={`Yeni ${KIND_LABEL[kind]}`}>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs text-slate-600">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  value={draft[f.name] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm"
                  rows={3}
                />
              ) : (
                <input
                  type={f.type}
                  value={draft[f.name] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={previewText} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Önizle</button>
            <button onClick={submit} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">Yayınla</button>
          </div>
          {preview && (
            <div className="mt-2 rounded-md bg-slate-50 p-3 text-sm whitespace-pre-wrap text-slate-700">
              <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-400">Önizleme</p>
              {preview}
            </div>
          )}
        </div>
      </Card>

      <Card title={`Mevcut (${rows.length})`}>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">Henüz içerik yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div className="flex-1 text-slate-700">
                  {kind === "whispers" && <span>{r.text}</span>}
                  {kind === "quotes" && <span>"{r.text}" — {r.author ?? "Anonim"}</span>}
                  {kind === "mystic" && <span><strong>{r.title}</strong> · {r.body?.slice(0, 80)}…</span>}
                  {kind === "special_days" && <span>{r.day}/{r.month} — <strong>{r.label}</strong>: {r.message}</span>}
                </div>
                <button
                  onClick={async () => { await del({ data: { kind, id: r.id } }); reload(); }}
                  className="text-xs text-red-600 hover:underline"
                >Sil</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function UsersPane() {
  const search = useServerFn(searchUsers);
  const grant = useServerFn(grantPremium);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);

  useEffect(() => { search({ data: { q: "" } }).then((r) => setRows(r.users)).catch(() => {}); }, [search]);

  const run = () => search({ data: { q } }).then((r) => setRows(r.users));

  const doGrant = async (tier: "plus" | "premium", days: number) => {
    if (!active) return;
    await grant({ data: { userId: active.id, tier, days } });
    alert(`${tier === "premium" ? "Premium" : "AURA+"} verildi (${days} gün).`);
    run();
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Kullanıcı ara">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="email veya isim"
            className="flex-1 rounded-md border border-slate-300 p-2 text-sm"
          />
          <button onClick={run} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">Ara</button>
        </div>
        <ul className="mt-3 max-h-[480px] divide-y divide-slate-100 overflow-y-auto">
          {rows.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => setActive(u)}
                className={`w-full px-2 py-2 text-left text-sm hover:bg-slate-50 ${active?.id === u.id ? "bg-slate-100" : ""}`}
              >
                <div className="font-medium text-slate-800">{u.name}</div>
                <div className="text-xs text-slate-500">{u.email}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">{u.tier}</div>
              </button>
            </li>
          ))}
          {rows.length === 0 && <li className="py-3 text-sm text-slate-400">Sonuç yok.</li>}
        </ul>
      </Card>

      <div className="md:col-span-2">
        {active ? (
          <Card title="Kullanıcı detayı">
            <div className="space-y-1 text-sm text-slate-700">
              <p><strong>İsim:</strong> {active.name}</p>
              <p><strong>E-posta:</strong> {active.email}</p>
              <p><strong>Şehir:</strong> {active.city || "—"}</p>
              <p><strong>Burç:</strong> {active.zodiac || "—"}</p>
              <p><strong>Üyelik:</strong> <span className="rounded bg-slate-100 px-2 py-0.5">{active.tier}</span></p>
              <p><strong>Kayıt:</strong> {active.createdAt ? new Date(active.createdAt).toLocaleString("tr-TR") : "—"}</p>
              <p><strong>Son giriş:</strong> {active.lastSignIn ? new Date(active.lastSignIn).toLocaleString("tr-TR") : "—"}</p>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="mb-2 text-xs text-slate-600">Ücretsiz erişim ver:</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => doGrant("plus", 30)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50">AURA+ · 30 gün</button>
                <button onClick={() => doGrant("premium", 30)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50">Premium · 30 gün</button>
                <button onClick={() => doGrant("premium", 90)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50">Premium · 90 gün</button>
                <button onClick={() => doGrant("premium", 365)} className="rounded-md bg-amber-500 px-3 py-1.5 text-xs text-white hover:bg-amber-600">Premium · 1 yıl</button>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">Detayları görmek için bir kullanıcı seç.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
