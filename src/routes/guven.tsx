import { createFileRoute, Link } from "@tanstack/react-router";
import { AuraShell } from "@/components/aura/Shell";

export const Route = createFileRoute("/guven")({
  head: () => ({
    meta: [
      { title: "Güven ve Gizlilik ✦ AURA" },
      {
        name: "description",
        content:
          "AURA'nın güvenlik, gizlilik ve veri koruma yaklaşımı. Verilerinin nasıl saklandığını ve korunduğunu öğren.",
      },
    ],
  }),
  component: TrustPage,
});

function TrustPage() {
  return (
    <AuraShell>
      <header className="mb-6 animate-aura-fade-in">
        <p className="section-label">G · Ü · V · E · N</p>
        <h1 className="serif mt-3 text-[36px] leading-[1.05] font-light text-white">
          Güven & Gizlilik <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[13px] italic text-[color:var(--aura-soft)]">
          Verilerin sana ait. AURA'nın koruma yaklaşımı şöyle.
        </p>
      </header>

      <section className="aura-card p-5 mb-4 space-y-3 text-[13px] leading-relaxed text-[color:var(--aura-soft)]">
        <h2 className="serif text-[18px] text-white">Kimlik doğrulama</h2>
        <p>
          Hesabın güvenli oturum jetonlarıyla korunur. Şifreler asla düz metin
          olarak saklanmaz; sağlayıcımız tarafından güçlü tek yönlü algoritmayla
          hash'lenir.
        </p>
      </section>

      <section className="aura-card p-5 mb-4 space-y-3 text-[13px] leading-relaxed text-[color:var(--aura-soft)]">
        <h2 className="serif text-[18px] text-white">Veri erişimi</h2>
        <p>
          Tüm kişisel kayıtlar (mektupların, kahve fincanların, tarot okumaların,
          doğum haritan) yalnızca senin hesabınla görüntülenebilir. Veritabanı
          seviyesinde satır bazlı erişim politikaları uygulanır.
        </p>
      </section>

      <section className="aura-card p-5 mb-4 space-y-3 text-[13px] leading-relaxed text-[color:var(--aura-soft)]">
        <h2 className="serif text-[18px] text-white">Fotoğraflar</h2>
        <p>
          Kahve fincanı fotoğrafların özel bir depoda saklanır. Görüntüleme için
          yalnızca kısa süreli (1 saatlik) imzalı bağlantılar üretilir.
        </p>
      </section>

      <section className="aura-card p-5 mb-4 space-y-3 text-[13px] leading-relaxed text-[color:var(--aura-soft)]">
        <h2 className="serif text-[18px] text-white">Gelecekten mektup</h2>
        <p>
          Mühürlenmiş mektupların içeriği teslim tarihinden önce sunucu tarafında
          gizlenir — kendin bile erken okuyamazsın. Mühür, üç ay sonra açılır.
        </p>
      </section>

      <section className="aura-card p-5 mb-6 space-y-3 text-[13px] leading-relaxed text-[color:var(--aura-soft)]">
        <h2 className="serif text-[18px] text-white">Verini sil</h2>
        <p>
          Hesabını ve tüm içeriğini silmek için profil sayfanı kullanabilir ya da
          bizimle iletişime geçebilirsin.
        </p>
      </section>

      <p className="text-center text-[11px] text-[color:var(--aura-muted)] mb-2">
        Bu sayfa AURA tarafından bilgilendirme amacıyla hazırlanmıştır; bağımsız
        bir güvenlik denetim sertifikası değildir.
      </p>

      <div className="text-center">
        <Link
          to="/gizlilik"
          className="text-[12px] text-[color:var(--aura-lavender)] underline underline-offset-4"
        >
          Gizlilik Politikası →
        </Link>
      </div>
    </AuraShell>
  );
}
