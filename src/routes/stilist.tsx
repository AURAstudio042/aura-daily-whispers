import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName, userCity, zodiacOf } from "@/lib/aura/store";
import { useDailyWeather, weatherNote } from "@/lib/aura/useDailyWeather";
import { askStylist, getStylistStatus } from "@/lib/aura/stylist.functions";

export const Route = createFileRoute("/stilist")({
  head: () => ({
    meta: [
      { title: "Kişisel Stilist ✦ AURA" },
      { name: "description", content: "Bugünün kombini, renk uyumu ve stil önerilerin — AURA stilistinden." },
      { property: "og:title", content: "Kişisel Stilist ✦ AURA" },
      { property: "og:description", content: "Bugünün kombini, renk uyumu ve stil önerilerin — AURA stilistinden." },
      { property: "og:url", content: "https://aura-daily-whispers.lovable.app/stilist" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Kişisel Stilist ✦ AURA" },
      { name: "twitter:description", content: "Bugünün kombini, renk uyumu ve stil önerilerin — AURA stilistinden." },
    ],
    links: [{ rel: "canonical", href: "https://aura-daily-whispers.lovable.app/stilist" }],
  }),
  component: StylistPage,
});

type Msg = {
  role: "user" | "assistant";
  content: string;
  image?: string;
};

const SAMPLE_PROMPTS = [
  "Düğüne ne giyeyim? 💒",
  "İş görüşmesi kombini 💼",
  "Romantik akşam yemeği 🌹",
  "Hafta sonu casual ☕",
  "Yaz tatili valiz 🌊",
];

function timeOfDayLabel(): string {
  const h = new Date().getHours();
  if (h < 6) return "gece";
  if (h < 12) return "sabah";
  if (h < 18) return "öğle";
  if (h < 22) return "akşam";
  return "gece";
}

async function fileToCompressedDataUrl(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: file.type || "image/jpeg" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function StylistPage() {
  const [u, , ready, authed] = useUser();
  const weather = useDailyWeather(u?.city);
  const [tier, setTier] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStatus = useServerFn(getStylistStatus);
  const ask = useServerFn(askStylist);

  useEffect(() => {
    if (!authed) return;
    fetchStatus().then((s) => setTier(s.tier)).catch(() => setTier("free"));
  }, [authed, fetchStatus]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const isPremium = tier === "premium";
  const name = userName(u);

  const send = async (text: string, imageDataUrl?: string | null) => {
    const t = text.trim();
    const img = imageDataUrl ?? pendingImage;
    if ((!t && !img) || loading) return;

    const userMsg: Msg = {
      role: "user",
      content: t || (img ? "Bu kombinim için ne düşünüyorsun?" : ""),
      image: img ?? undefined,
    };
    const nextMessages: Msg[] = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setPendingImage(null);
    setLoading(true);
    try {
      const r = await ask({
        data: {
          message: userMsg.content,
          imageDataUrl: img ?? undefined,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          context: {
            name,
            style: u.style,
            zodiac: zodiacOf(u),
            city: userCity(u),
            weather: weather
              ? `${weather.icon} ${Math.round(weather.temp)}°C · ${weather.cond} · ${weatherNote(weather)}`
              : undefined,
            timeOfDay: timeOfDayLabel(),
          },
        },
      });
      const reply = r.ok ? r.reply : r.message;
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: img
            ? "Fotoğrafı analiz edemedim, tekrar dener misin?"
            : "Şu an bağlantı kurulamıyor, birazdan tekrar dene.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPendingImage(dataUrl);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Fotoğrafı okuyamadım, tekrar dener misin?" },
      ]);
    }
  };

  return (
    <AuraShell>
      <header className="relative mb-6 animate-aura-fade-in">
        <div className="aura-glow -left-10 -top-16 h-56 w-56 bg-[#8b5cf6]/40" />
        <div className="aura-glow -right-10 top-6 h-44 w-44 bg-[#b794d4]/25" />
        <p className="section-label">A · U · R · A · STİLİST</p>
        <h1 className="serif mt-3 text-[44px] leading-[1.05] font-light text-white">
          AI Stilist <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[14px] italic text-[color:var(--aura-soft)]">Sana özel stil danışmanın</p>
      </header>

      {tier === null && (
        <div className="aura-card p-6 text-center text-[12px] text-[color:var(--aura-soft)]">Yükleniyor…</div>
      )}

      {tier !== null && !isPremium && (
        <section className="aura-card-dark relative overflow-hidden p-6 text-center animate-aura-fade-in">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl" />
          <div className="serif text-6xl text-white/40">✦</div>
          <p className="serif mt-4 text-[22px] italic text-white">Stilist sahnede değil.</p>
          <p className="mt-2 text-[13px] text-[color:var(--aura-soft)]">
            AI Stilist yalnızca AURA Premium üyelerine açıktır. Kişisel kombin önerileri, fotoğraf analizi, renk paleti ve aksesuar dokunuşları için kilidi aç.
          </p>
          <Link to="/profil" className="aura-btn aura-btn-hover mt-5 inline-block px-6 text-[12px]">
            ✦ AURA Premium ile Aç ✦
          </Link>
        </section>
      )}

      {isPremium && (
        <>
          {/* Sample chips */}
          {messages.length === 0 && (
            <div className="mb-4 flex flex-wrap gap-2 animate-aura-fade-in">
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-[color:var(--border)] bg-white/[0.03] px-3 py-2 text-[11px] text-[color:var(--aura-soft)] transition hover:border-[color:var(--aura-lavender)]/60 hover:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Chat area */}
          <div
            ref={scrollRef}
            className="aura-card mb-3 max-h-[55vh] min-h-[280px] overflow-y-auto p-4"
          >
            {messages.length === 0 && (
              <div className="grid h-full place-items-center py-10 text-center">
                <div>
                  <div className="serif text-5xl text-[color:var(--aura-lavender)]/70">✦</div>
                  <p className="mt-3 text-[13px] italic text-[color:var(--aura-soft)]">
                    Bir şey sor ya da kombinini paylaş, AURA sana özel bir yorum yapsın.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "user" ? (
                    <div
                      className="max-w-[82%] overflow-hidden rounded-2xl rounded-tr-sm text-[13px] leading-relaxed text-white shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #8b5cf6 0%, #b794d4 100%)",
                        boxShadow: "0 8px 24px rgba(139,92,246,0.25)",
                      }}
                    >
                      {m.image && (
                        <img
                          src={m.image}
                          alt="Kombin"
                          className="block max-h-72 w-full object-cover"
                        />
                      )}
                      {m.content && (
                        <div className="px-4 py-2.5">{m.content}</div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="max-w-[88%] rounded-2xl rounded-tl-sm border border-[color:var(--border)] px-4 py-3 text-[13px] leading-relaxed text-white/90"
                      style={{ background: "linear-gradient(160deg, #0b0716 0%, #1a0f2e 100%)" }}
                    >
                      <p className="mb-1 text-[9px] tracking-[0.35em] uppercase text-[color:var(--aura-muted)]">AURA ✦</p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[60%] rounded-2xl rounded-tl-sm border border-[color:var(--border)] px-4 py-3 text-[12px] italic text-[color:var(--aura-soft)]"
                    style={{ background: "linear-gradient(160deg, #0b0716 0%, #1a0f2e 100%)" }}
                  >
                    ✦ AURA {pendingImage || messages[messages.length - 1]?.image ? "kombinine bakıyor" : "düşünüyor"}…
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending image preview */}
          {pendingImage && (
            <div className="mb-2 flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/[0.03] p-2 animate-aura-fade-in">
              <img src={pendingImage} alt="Seçilen kombin" className="h-14 w-14 rounded-xl object-cover" />
              <div className="flex-1 text-[11px] text-[color:var(--aura-soft)]">
                Kombinin hazır. Bir not ekleyebilir ya da direkt gönderebilirsin.
              </div>
              <button
                onClick={() => setPendingImage(null)}
                className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)] hover:text-white"
              >
                Vazgeç
              </button>
            </div>
          )}

          {/* Photo button */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--aura-lavender)]/40 bg-[color:var(--aura-purple)]/15 px-4 py-2 text-[11px] text-white transition hover:border-[color:var(--aura-lavender)]/80 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Kombinini Paylaş 📸
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoPick}
            />
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={pendingImage ? "Bir not ekle (opsiyonel)..." : "Bir şey sor..."}
              className="flex-1 rounded-full border border-[color:var(--border)] bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder:text-[color:var(--aura-muted)] outline-none focus:border-[color:var(--aura-lavender)]/60"
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && !pendingImage)}
              className="aura-btn aura-btn-hover px-5 py-3 text-[12px] disabled:opacity-50"
            >
              {loading ? "..." : "Gönder"}
            </button>
          </form>
        </>
      )}
    </AuraShell>
  );
}
