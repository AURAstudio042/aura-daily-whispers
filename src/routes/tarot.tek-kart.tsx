import { createFileRoute, Link } from "@tanstack/react-router";
import { AuraShell, SectionLabel } from "@/components/aura/Shell";

const CANONICAL = "https://aura-daily-whispers.lovable.app/tarot/tek-kart";
const TITLE = "Tek Kart Tarot — Günün Kartı ve Anlamı ✦ AURA";
const DESCRIPTION =
  "Tek kart tarot çekimi ile günün mesajını al. Kısa, net ve sana özel yorum. Aşk, kariyer, ruh hali için tek kart tarot falı — AURA ile ücretsiz başla.";

export const Route = createFileRoute("/tarot/tek-kart")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "keywords", content: "tek kart tarot, tek kart tarot falı, günün tarot kartı, tarot çekimi, tek kart yorumu, tarot falı" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Tek kart tarot nedir?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Tek kart tarot, desteden çekilen tek bir kartla günün veya sorunun ana mesajını okuma yöntemidir. Sade, net ve odaklı bir mistik ritüeldir; karmaşık serimlere göre daha hızlı bir iç görü sunar.",
              },
            },
            {
              "@type": "Question",
              name: "Tek kart tarot falı doğru mu?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Tarot bir kehanet aracı değil, bir yansıma aracıdır. Tek kart, o anki niyetine ve sorunun enerjisine göre sana bir bakış açısı sunar. Sonucu nasıl yorumladığın seçim özgürlüğüne bağlıdır.",
              },
            },
            {
              "@type": "Question",
              name: "Günde kaç kez tek kart çekilebilir?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Aynı soru için günde bir kez çekmek en sağlıklısıdır. Kartın enerjisi gün boyunca sana eşlik eder; sürekli tekrar çekmek mesajı bulandırır.",
              },
            },
            {
              "@type": "Question",
              name: "AURA'da tek kart tarot nasıl çekilir?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sorunun kategorisini seç (aşk, kariyer, ruh hali, karar), kartı aç ve sana özel yorumunu oku. Ücretsiz haftalık hakkın hazır — üye olmadan da deneyebilirsin.",
              },
            },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: "https://aura-daily-whispers.lovable.app/" },
            { "@type": "ListItem", position: 2, name: "Tarot", item: "https://aura-daily-whispers.lovable.app/tarot" },
            { "@type": "ListItem", position: 3, name: "Tek Kart Tarot", item: CANONICAL },
          ],
        }),
      },
    ],
  }),
  component: TekKartLanding,
});

function TekKartLanding() {
  return (
    <AuraShell>
      <header className="relative mb-8 animate-aura-fade-in">
        <div className="aura-glow -left-10 -top-16 h-56 w-56 bg-[#8b5cf6]/40" />
        <div className="aura-glow -right-10 top-6 h-44 w-44 bg-[#b794d4]/25" />
        <p className="section-label">A · U · R · A · TEK KART</p>
        <h1 className="serif mt-3 text-[42px] leading-[1.05] font-light text-white">
          Tek Kart Tarot <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-3 text-[14px] italic text-[color:var(--aura-soft)]">
          Bir soru. Bir kart. Bir mesaj.
        </p>
      </header>

      <section className="aura-card-dark relative mb-6 overflow-hidden p-6 text-center animate-aura-fade-in">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--aura-purple)]/30 blur-3xl" />
        <div className="serif text-6xl text-white/40">✦</div>
        <p className="serif mt-4 text-[22px] italic leading-snug text-white">
          Günün kartını çek, sana özel yorumu oku.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--aura-soft)]">
          Tek kart tarot falı, o anki niyetinin en saf yansımasıdır.
          Karmaşık serimlere gerek yok — bir tek kart, bugün sana ne söylemek
          istiyorsa onu söyler.
        </p>
        <Link
          to="/tarot"
          className="aura-btn aura-btn-hover mt-6 inline-block px-8 text-[12px]"
        >
          ✦ Tek Kartımı Aç ✦
        </Link>
        <p className="mt-3 text-[11px] tracking-[0.25em] uppercase text-[color:var(--aura-muted)]">
          Ücretsiz haftalık hakkın hazır
        </p>
      </section>

      <section className="aura-card mb-5 p-6 animate-aura-fade-in">
        <SectionLabel n="01" title="Tek Kart Tarot Nedir?" />
        <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--aura-soft)]">
          Tek kart tarot çekimi, desteden çekilen tek bir kartla günün ya da
          aklındaki sorunun ana mesajını okuma ritüelidir. Üç kart, Kelt haçı
          ya da yıldız serimlerine göre çok daha sade ve odaklıdır.
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-[color:var(--aura-soft)]">
          Aceleyle bakılan bir fal değil — bir <em>duraklama</em> anıdır.
          Bir nefes, bir niyet, bir kart. Kart ne söylerse sana o yeter.
        </p>
      </section>

      <section className="aura-card mb-5 p-6 animate-aura-fade-in">
        <SectionLabel n="02" title="Ne Zaman Tek Kart Çekmeli?" />
        <ul className="mt-3 space-y-3 text-[14px] leading-relaxed text-[color:var(--aura-soft)]">
          <li>
            <strong className="text-white">Sabah ritüeli olarak</strong> —
            günün enerjisini önceden hisset.
          </li>
          <li>
            <strong className="text-white">Küçük bir karar önünde</strong> —
            "evet mi hayır mı" değil, "bu enerji nasıl hissettiriyor" için.
          </li>
          <li>
            <strong className="text-white">Aşk, kariyer, ruh hali</strong> —
            tek bir konuda tek bir yansıma yeter.
          </li>
          <li>
            <strong className="text-white">Yeni bir başlangıçta</strong> —
            hafta başında, ayın ilk gününde, önemli bir görüşmeden önce.
          </li>
        </ul>
      </section>

      <section className="aura-card mb-5 p-6 animate-aura-fade-in">
        <SectionLabel n="03" title="AURA'da Tek Kart Nasıl Çalışır?" />
        <ol className="mt-3 space-y-3 text-[14px] leading-relaxed text-[color:var(--aura-soft)] list-decimal pl-5">
          <li>Kategorini seç: aşk, kariyer, ruh hali ya da karar.</li>
          <li>Bir nefes al ve niyetini kalpten geçir.</li>
          <li>Kartı aç — sana özel, kısa ve net yorumunu oku.</li>
          <li>İstersen kartını arkadaşlarınla paylaş.</li>
        </ol>
        <div className="mt-6 text-center">
          <Link
            to="/tarot"
            className="aura-btn aura-btn-hover inline-block px-8 text-[12px]"
          >
            ✦ Kartımı Şimdi Aç ✦
          </Link>
        </div>
      </section>

      <section className="aura-card mb-5 p-6 animate-aura-fade-in">
        <SectionLabel n="04" title="Sık Sorulanlar" />
        <div className="mt-3 space-y-4 text-[14px] leading-relaxed text-[color:var(--aura-soft)]">
          <div>
            <h3 className="serif text-[16px] text-white">Tek kart tarot falı doğru mu?</h3>
            <p className="mt-1">
              Tarot bir kehanet değil, bir yansıma aracıdır. Tek kart, o anki
              niyetine göre sana bir bakış açısı sunar; ne yapacağın hâlâ
              senin seçimindir.
            </p>
          </div>
          <div>
            <h3 className="serif text-[16px] text-white">Günde kaç kez çekebilirim?</h3>
            <p className="mt-1">
              Aynı soru için günde bir kez idealdir. Sürekli tekrar çekmek
              kartın enerjisini bulandırır.
            </p>
          </div>
          <div>
            <h3 className="serif text-[16px] text-white">Üye olmadan deneyebilir miyim?</h3>
            <p className="mt-1">
              Evet — haftalık ücretsiz hakkın var. Sınırsız çekim için
              AURA+ üyeliğine geçebilirsin.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 text-center">
        <p className="text-[12px] italic text-[color:var(--aura-muted)]">
          Kartlar hazır. Bir tek nefes ve bir tek kart yeter.
        </p>
        <Link
          to="/tarot"
          className="aura-btn aura-btn-hover mt-4 inline-block px-8 text-[12px]"
        >
          ✦ Tek Kart Tarot Çek ✦
        </Link>
      </section>
    </AuraShell>
  );
}
