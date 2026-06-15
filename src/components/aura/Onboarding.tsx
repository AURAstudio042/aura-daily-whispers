import { useState } from "react";
import { MOODS, STYLES, UNDERTONES, type Mood, type StyleType } from "@/lib/aura/data";
import { saveUser } from "@/lib/aura/store";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [city, setCity] = useState("");
  const [style, setStyle] = useState<StyleType>("Klasik");
  const [mood, setMood] = useState<Mood | "">("");
  const [undertone, setUndertone] = useState<string>("");
  const [hair, setHair] = useState("");

  const canNext1 = name.trim() && birthDate && city.trim();

  function finish(skipOptional = false) {
    saveUser({
      name: name.trim() || "Kullanıcı",
      birthDate,
      birthTime: birthTime || undefined,
      city: city.trim() || "Bilinmiyor",
      style,
      mood: skipOptional ? undefined : (mood || undefined),
      undertone: skipOptional ? undefined : (undertone || undefined),
      hair: skipOptional ? undefined : (hair.trim() || undefined),
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-6 py-10">
      <div className="mb-8 text-center">
        <p className="section-label">A · U · R · A</p>
        <h1 className="mt-3 text-5xl font-light text-white">AURA ✦</h1>
        <p className="mt-2 text-sm text-[color:var(--aura-soft)]">Senin için günlük bir ritüel.</p>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {[0, 1].map((i) => (
          <span key={i} className={`h-1 w-12 rounded-full ${i <= step ? "bg-[color:var(--aura-lavender)]" : "bg-white/10"}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="aura-card animate-aura-fade-in space-y-5 p-6">
          <h2 className="text-2xl font-light text-white">Tanışalım</h2>

          <Field label="Adın">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın" className={inputCls} />
          </Field>

          <Field label="Doğum Tarihi">
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Doğum Saati (opsiyonel, yükseliş için)">
            <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Şehir">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="İstanbul" className={inputCls} />
          </Field>

          <Field label="Stil Tipin">
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <Chip key={s} active={style === s} onClick={() => setStyle(s)}>{s}</Chip>
              ))}
            </div>
          </Field>

          <button
            disabled={!canNext1}
            onClick={() => setStep(1)}
            className="aura-btn aura-btn-hover w-full disabled:opacity-40"
          >
            DEVAM ✦
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="aura-card animate-aura-fade-in space-y-5 p-6">
          <h2 className="text-2xl font-light text-white">Biraz daha senden</h2>
          <p className="text-xs text-[color:var(--aura-muted)]">Bu bilgiler sadece renk ve kıyafet uyumu için kullanılır.</p>

          <Field label="Bugünkü Ruh Halin (opsiyonel)">
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <Chip key={m.id} active={mood === m.id} onClick={() => setMood(mood === m.id ? "" : m.id)}>
                  <span className="mr-1">{m.emoji}</span>{m.id}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Cilt Alt Tonu (opsiyonel)">
            <div className="flex flex-wrap gap-2">
              {UNDERTONES.map((u) => (
                <Chip key={u} active={undertone === u} onClick={() => setUndertone(undertone === u ? "" : u)}>{u}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Saç Rengi (opsiyonel)">
            <input value={hair} onChange={(e) => setHair(e.target.value)} placeholder="Örn. koyu kahve" className={inputCls} />
          </Field>

          <div className="flex gap-3">
            <button onClick={() => finish(true)} className="flex-1 rounded-full border border-[color:var(--border)] py-3 text-sm tracking-[0.15em] text-[color:var(--aura-soft)]">
              ATLA
            </button>
            <button onClick={() => finish(false)} className="aura-btn aura-btn-hover flex-1">
              BAŞLA ✦
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[color:var(--border)] bg-[#0d0917] px-4 py-3 text-[15px] text-white placeholder:text-[color:var(--aura-muted)] outline-none focus:border-[color:var(--aura-lavender)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">{label}</label>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs tracking-wide transition-all ${
        active
          ? "border-[color:var(--aura-lavender)] bg-[color:var(--aura-lavender)]/15 text-white"
          : "border-[color:var(--border)] text-[color:var(--aura-soft)] hover:border-[color:var(--aura-lavender)]/50"
      }`}
    >
      {children}
    </button>
  );
}
