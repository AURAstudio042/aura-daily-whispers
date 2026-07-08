import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuraShell } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser, userName, zodiacOf } from "@/lib/aura/store";
import {
  createFutureLetter,
  getLetterStatus,
  markLetterOpened,
  type FutureLetter,
} from "@/lib/aura/letter.functions";
import { shareNodeAsStory } from "@/lib/aura/share";

export const Route = createFileRoute("/mektup")({
  head: () => ({
    meta: [
      { title: "AURA Mektubun ✦" },
      { name: "description", content: "Kalbinden geçenleri AURA'ya yaz — sana özel bir mektup gelsin." },
      { property: "og:title", content: "AURA Mektubun ✦" },
      { property: "og:description", content: "Kalbinden geçenleri AURA'ya yaz — sana özel bir mektup gelsin." },
      { property: "og:url", content: "https://aura-daily-whispers.lovable.app/mektup" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "AURA Mektubun ✦" },
      { name: "twitter:description", content: "Kalbinden geçenleri AURA'ya yaz — sana özel bir mektup gelsin." },
    ],
    links: [{ rel: "canonical", href: "https://aura-daily-whispers.lovable.app/mektup" }],
  }),
  component: MektupPage,
});

const QUESTIONS: { key: keyof Answers; q: string; placeholder: string }[] = [
  {
    key: "current_focus",
    q: "Şu an hayatında en çok ne üzerinde çalışıyorsun?",
    placeholder: "Birkaç cümle yeter…",
  },
  {
    key: "three_months",
    q: "3 ay sonra kendini nerede görmek istiyorsun?",
    placeholder: "His, yer, hâl…",
  },
  {
    key: "forgive",
    q: "Kendine en çok neyi affetmen gerekiyor?",
    placeholder: "Sadece sen okuyacaksın.",
  },
  {
    key: "happiness",
    q: "Seni en çok ne mutlu ediyor?",
    placeholder: "Küçük ya da büyük, fark etmez.",
  },
  {
    key: "message",
    q: "Kendine vermek istediğin en önemli mesaj ne?",
    placeholder: "Tek cümle bile olur.",
  },
];

type Answers = {
  current_focus: string;
  three_months: string;
  forgive: string;
  happiness: string;
  message: string;
};

const EMPTY: Answers = {
  current_focus: "",
  three_months: "",
  forgive: "",
  happiness: "",
  message: "",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function MektupPage() {
  const [u, , ready, authed] = useUser();
  const [tier, setTier] = useState<string | null>(null);
  const [letters, setLetters] = useState<FutureLetter[]>([]);
  const [view, setView] = useState<"home" | "wizard" | "letter">("home");
  const [active, setActive] = useState<FutureLetter | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = useServerFn(getLetterStatus);
  const create = useServerFn(createFutureLetter);
  const markOpened = useServerFn(markLetterOpened);

  const load = async () => {
    try {
      const s = await fetchStatus();
      setTier(s.tier);
      setLetters(s.letters);
    } catch {
      setTier("free");
    }
  };

  useEffect(() => {
    if (authed) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;

  const isPremium = tier === "premium";
  const name = userName(u);

  const startWizard = () => {
    setAnswers(EMPTY);
    setStep(0);
    setErrorMsg(null);
    setView("wizard");
  };

  const openLetter = async (l: FutureLetter) => {
    setActive(l);
    setView("letter");
    if (l.unlocked && !l.opened_at) {
      try {
        await markOpened({ data: { id: l.id } });
      } catch {
        /* noop */
      }
    }
  };

  const submitAnswers = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const r = await create({
        data: {
          answers,
          context: { name, zodiac: zodiacOf(u), style: u.style, mood: u.mood },
        },
      });
      if (!r.ok) {
        setErrorMsg(r.message);
        return;
      }
      setLetters((prev) => [r.letter, ...prev]);
      setActive(r.letter);
      setView("letter");
    } catch {
      setErrorMsg("Mektubun hazırlanıyor, birazdan tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuraShell>
      <header className="relative mb-6 animate-aura-fade-in">
        <div className="aura-glow -left-10 -top-16 h-56 w-56 bg-[#8b5cf6]/40" />
        <div className="aura-glow -right-10 top-6 h-44 w-44 bg-[#b794d4]/25" />
        <p className="section-label">M · E · K · T · U · P</p>
        <h1 className="serif mt-3 text-[40px] leading-[1.05] font-light text-white">
          Gelecekteki Kendinden <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[14px] italic text-[color:var(--aura-soft)]">
          Üç ay sonraki sen, bugünün sana bir şey söylüyor.
        </p>
      </header>

      {tier === null && (
        <div className="aura-card p-6 text-center text-[12px] text-[color:var(--aura-soft)]">Yükleniyor…</div>
      )}

      {tier !== null && !isPremium && <LockedView />}

      {isPremium && view === "home" && (
        <HomeView letters={letters} onNew={startWizard} onOpen={openLetter} />
      )}

      {isPremium && view === "wizard" && (
        <WizardView
          step={step}
          setStep={setStep}
          answers={answers}
          setAnswers={setAnswers}
          submitting={submitting}
          errorMsg={errorMsg}
          onCancel={() => setView("home")}
          onSubmit={submitAnswers}
        />
      )}

      {isPremium && view === "letter" && active && (
        <LetterView
          letter={active}
          name={name}
          onBack={() => {
            setActive(null);
            setView("home");
            load();
          }}
          onNew={startWizard}
        />
      )}
    </AuraShell>
  );
}

function LockedView() {
  return (
    <section className="aura-card-dark relative overflow-hidden p-6 text-center animate-aura-fade-in">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl" />
      <div className="serif text-6xl text-white/40">✉</div>
      <p className="serif mt-4 text-[22px] italic text-white">Mektup henüz mühürlü.</p>
      <p className="mt-2 text-[13px] text-[color:var(--aura-soft)]">
        Gelecekteki kendinden mektup yalnızca AURA Premium üyelerine açıktır. Üç ay sonra seni bekleyen
        bir cümle yaz.
      </p>
      <Link to="/profil" className="aura-btn aura-btn-hover mt-5 inline-block px-6 text-[12px]">
        ✦ AURA Premium ile Aç ✦
      </Link>
    </section>
  );
}

function HomeView({
  letters,
  onNew,
  onOpen,
}: {
  letters: FutureLetter[];
  onNew: () => void;
  onOpen: (l: FutureLetter) => void;
}) {
  return (
    <div className="animate-aura-fade-in">
      <section
        className="relative mb-5 overflow-hidden rounded-3xl border border-[color:var(--border)] p-6 text-center"
        style={{ background: "linear-gradient(160deg, #14091f 0%, #1f0f33 100%)" }}
      >
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/25 blur-3xl" />
        <div className="serif text-5xl text-[color:var(--aura-lavender)]/80">✉</div>
        <p className="serif mt-3 text-[18px] italic text-white">
          5 küçük soru. Üç ay sonra mühür açılır.
        </p>
        <p className="mt-2 text-[12px] text-[color:var(--aura-soft)]">
          Bugün yazdıklarını sadece gelecekteki sen okuyacak.
        </p>
        <button
          onClick={onNew}
          className="aura-btn aura-btn-hover mt-5 inline-block px-6 text-[12px]"
        >
          ✦ Yeni Mektup Yaz
        </button>
      </section>

      {letters.length > 0 && (
        <>
          <p className="section-label mb-3">M · Ü · H · Ü · R · L · Ü · A · R · Ş · İ · V</p>
          <ul className="flex flex-col gap-3">
            {letters.map((l) => {
              const days = daysUntil(l.deliver_at);
              return (
                <li key={l.id}>
                  <button
                    onClick={() => onOpen(l)}
                    className="group relative w-full overflow-hidden rounded-2xl border border-[color:var(--border)] p-4 text-left transition hover:border-[color:var(--aura-lavender)]/60"
                    style={{ background: "linear-gradient(160deg, #0b0716 0%, #1a0f2e 100%)" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="serif text-3xl text-[color:var(--aura-lavender)]/80">
                          {l.unlocked ? "✦" : "✉"}
                        </span>
                        <div>
                          <p className="text-[13px] text-white">
                            {formatDate(l.created_at)} tarihinde mühürlendi
                          </p>
                          <p className="mt-0.5 text-[11px] text-[color:var(--aura-soft)]">
                            {l.unlocked
                              ? l.opened_at
                                ? "Okundu · tekrar açmak için dokun"
                                : "Mühür açıldı · okumaya hazır"
                              : `${days} gün sonra açılacak`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[color:var(--aura-muted)]">›</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function WizardView({
  step,
  setStep,
  answers,
  setAnswers,
  submitting,
  errorMsg,
  onCancel,
  onSubmit,
}: {
  step: number;
  setStep: (n: number) => void;
  answers: Answers;
  setAnswers: (a: Answers) => void;
  submitting: boolean;
  errorMsg: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const current = QUESTIONS[step];
  const value = answers[current.key];
  const isLast = step === QUESTIONS.length - 1;
  const canNext = value.trim().length > 0;

  return (
    <section className="aura-card relative overflow-hidden p-6 animate-aura-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
          Soru {step + 1} / {QUESTIONS.length}
        </p>
        <button
          onClick={onCancel}
          className="text-[10px] tracking-[0.2em] uppercase text-[color:var(--aura-muted)] hover:text-white"
        >
          Vazgeç
        </button>
      </div>

      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#b794d4] transition-all"
          style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <h2 className="serif text-[22px] leading-snug text-white">{current.q}</h2>

      <textarea
        value={value}
        onChange={(e) => setAnswers({ ...answers, [current.key]: e.target.value })}
        placeholder={current.placeholder}
        rows={4}
        maxLength={500}
        className="mt-4 w-full resize-none rounded-2xl border border-[color:var(--border)] bg-white/[0.04] px-4 py-3 text-[14px] leading-relaxed text-white placeholder:text-[color:var(--aura-muted)] outline-none focus:border-[color:var(--aura-lavender)]/60"
      />

      {errorMsg && (
        <p className="mt-3 text-[12px] text-[#f9a8a8]">{errorMsg}</p>
      )}

      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0 || submitting}
          className="rounded-full border border-[color:var(--border)] px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-soft)] disabled:opacity-40"
        >
          Geri
        </button>
        {isLast ? (
          <button
            onClick={onSubmit}
            disabled={!canNext || submitting}
            className="aura-btn aura-btn-hover px-6 text-[12px] disabled:opacity-50"
          >
            {submitting ? "Mühürleniyor…" : "✦ Mühürle"}
          </button>
        ) : (
          <button
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            className="aura-btn aura-btn-hover px-6 text-[12px] disabled:opacity-50"
          >
            İleri
          </button>
        )}
      </div>
    </section>
  );
}

function LetterView({
  letter,
  name,
  onBack,
  onNew,
}: {
  letter: FutureLetter;
  name: string;
  onBack: () => void;
  onNew: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shareBusy, setShareBusy] = useState(false);

  const handleShare = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    try {
      await shareNodeAsStory(cardRef.current, {
        title: "Gelecekteki Senden",
        text: "— AURA ✨",
        filename: "aura-mektup.png",
      });
    } finally {
      setShareBusy(false);
    }
  };

  if (!letter.unlocked) {
    const days = daysUntil(letter.deliver_at);
    return (
      <section className="aura-card relative overflow-hidden p-6 text-center animate-aura-fade-in">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl" />
        <div className="serif text-6xl text-white/50">✉</div>
        <p className="serif mt-3 text-[22px] italic text-white">Mühür henüz açılmadı.</p>
        <p className="mt-2 text-[13px] text-[color:var(--aura-soft)]">
          Bu mektubu üç ay sonraki sen okuyabilecek. <br />
          <span className="text-white">{days} gün</span> kaldı —{" "}
          {formatDate(letter.deliver_at)} tarihinde açılır.
        </p>
        <button
          onClick={onBack}
          className="mt-5 rounded-full border border-[color:var(--border)] px-6 py-2.5 text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-soft)]"
        >
          Geri
        </button>
      </section>
    );
  }

  return (
    <div className="animate-aura-fade-in">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl border border-[color:var(--aura-lavender)]/30 p-6"
        style={{
          background:
            "linear-gradient(160deg, #100722 0%, #1a0e30 45%, #241340 100%)",
          boxShadow: "0 30px 60px -20px rgba(139,92,246,0.35)",
        }}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl" />
        <p className="text-center text-[10px] tracking-[0.4em] uppercase text-[color:var(--aura-muted)]">
          {formatDate(letter.created_at)} → {formatDate(letter.deliver_at)}
        </p>
        <p className="mt-3 text-center text-[11px] italic text-[color:var(--aura-soft)]">
          Sevgili {name},
        </p>
        <div className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.85] text-white/90 serif italic">
          {letter.letter}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="rounded-full border border-[color:var(--border)] px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase text-[color:var(--aura-soft)]"
        >
          Geri
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShare}
            disabled={shareBusy}
            className="rounded-full border border-[color:var(--aura-lavender)]/40 bg-[color:var(--aura-purple)]/15 px-4 py-2.5 text-[11px] tracking-[0.15em] text-white disabled:opacity-50"
          >
            {shareBusy ? "Hazırlanıyor…" : "Paylaş"}
          </button>
          <button
            onClick={onNew}
            className="aura-btn aura-btn-hover px-5 py-2.5 text-[11px]"
          >
            Yeni Mektup
          </button>
        </div>
      </div>
    </div>
  );
}
