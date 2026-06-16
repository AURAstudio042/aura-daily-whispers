import { useState } from "react";

type Props = {
  code: string;
  url: string;
  count: number;
};

const MESSAGE = (url: string) =>
  `AURA'yı dene — her sabah sana özel burç yorumu, kombin önerisi ve çok daha fazlası! Benim davetimle indir: ${url}`;

export function ReferralCard({ code, url, count }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(MESSAGE(url));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareInstagram = async () => {
    // Instagram has no web share intent — fall back to native share + copy
    const text = MESSAGE(url);
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "AURA ✦", text });
        return;
      } catch {
        // user cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <section
      className="relative mb-4 overflow-hidden rounded-3xl p-6 text-white animate-aura-fade-in"
      style={{ background: "linear-gradient(135deg, #1a0f2e 0%, #2a1a4a 60%, #3a2461 100%)" }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#b794d4]/20 blur-3xl" />
      <p className="text-[10px] tracking-[0.3em] uppercase opacity-70">Arkadaşını Davet Et 🎁</p>
      <h2 className="serif mt-1 text-2xl">Birlikte daha güzel</h2>
      <p className="mt-2 text-[12px] text-[color:var(--aura-soft)]">
        Her davet ettiğin arkadaş için 1 tarot hakkı kazan. 4 arkadaşa ulaştığında
        1 hafta AURA+ deneme hediyemiz olsun.
      </p>

      <div className="mt-4 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Davet Kodun</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="serif text-xl tracking-[0.3em] text-white">{code}</span>
          <span className="text-[11px] text-[color:var(--aura-soft)]">{count} davet</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex-1 rounded-full bg-[#25D366] px-4 py-2.5 text-[12px] font-medium text-white"
        >
          WhatsApp
        </button>
        <button
          onClick={shareInstagram}
          className="flex-1 rounded-full px-4 py-2.5 text-[12px] font-medium text-white"
          style={{ background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}
        >
          Instagram
        </button>
        <button
          onClick={copyLink}
          className="flex-1 rounded-full border border-white/30 bg-white/[0.04] px-4 py-2.5 text-[12px] font-medium text-white"
        >
          {copied ? "Kopyalandı ✓" : "Linki Kopyala"}
        </button>
      </div>
    </section>
  );
}
