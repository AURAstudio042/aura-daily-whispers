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
      { title: "AI Stilist ✦ AURA" },
      { name: "description", content: "Sana özel stil danışmanın." },
    ],
  }),
  component: StylistPage,
});

type Msg = { role: "user" | "assistant"; content: string };

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

function StylistPage() {
  const [u, , ready, authed] = useUser();
  const weather = useDailyWeather(u?.city);
  const [tier, setTier] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const nextMessages: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const r = await ask({
        data: {
          message: t,
          history: messages.slice(-10),
          context: {
            name,
            style: u.style,
            zodiac: zodiacOf(u),
            city: userCity(u),
            weather: weather ? `${weather.icon} ${Math.round(weather.temp)}°C · ${weather.cond} · ${weatherNote(weather)}` : undefined,
            timeOfDay: timeOfDayLabel(),
          },
        },
      });
      const reply = r.ok ? r.reply : r.message;
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Şu an bağlantı kurulamıyor, birazdan tekrar dene." },
      ]);
    } finally {
      setLoading(false);
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
            AI Stilist yalnızca AURA Premium üyelerine açıktır. Kişisel kombin önerileri, renk paleti ve aksesuar dokunuşları için kilidi aç.
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
                    Bir şey sor, AURA sana özel bir kombin önersin.
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
                      className="max-w-[82%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-[13px] leading-relaxed text-white shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #8b5cf6 0%, #b794d4 100%)",
                        boxShadow: "0 8px 24px rgba(139,92,246,0.25)",
                      }}
                    >
                      {m.content}
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
                    ✦ AURA düşünüyor…
                  </div>
                </div>
              )}
            </div>
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
              placeholder="Bir şey sor..."
              className="flex-1 rounded-full border border-[color:var(--border)] bg-white/[0.04] px-4 py-3 text-[13px] text-white placeholder:text-[color:var(--aura-muted)] outline-none focus:border-[color:var(--aura-lavender)]/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
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
