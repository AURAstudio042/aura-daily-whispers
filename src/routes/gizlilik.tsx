import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/gizlilik")({
  head: () => ({
    meta: [
      { title: "Gizlilik & Güvenlik ✦ AURA" },
      {
        name: "description",
        content:
          "AURA'nın gizlilik, güvenlik ve veri kullanım yaklaşımı. Hesabınızın ve verilerinizin nasıl korunduğu hakkında.",
      },
      { property: "og:title", content: "Gizlilik & Güvenlik ✦ AURA" },
      {
        property: "og:description",
        content:
          "AURA'nın gizlilik, güvenlik ve veri kullanım yaklaşımı.",
      },
    ],
  }),
  component: TrustPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function TrustPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <header className="mb-8 space-y-2">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Ana sayfa
        </Link>
        <h1 className="font-serif text-4xl text-foreground">Gizlilik & Güvenlik</h1>
        <p className="text-sm text-muted-foreground">
          Bu sayfa AURA ekibi tarafından sürdürülür ve uygulamamızın gizlilik, güvenlik
          ve veri kullanımıyla ilgili sıkça sorulan soruları yanıtlar. Bu sayfa
          bağımsız bir sertifikasyon değildir.
        </p>
      </header>

      <div className="space-y-8">
        <Section title="Hesap & Kimlik Doğrulama">
          <p>
            Giriş e-posta/şifre veya Google ile yapılır. Şifreler asla düz metin
            saklanmaz; kimlik doğrulama altyapımız endüstri standartlarına uygun
            şekilde yönetilir. Oturum belirteçleri tarayıcınızda saklanır ve sunucu
            tarafında doğrulanır.
          </p>
        </Section>

        <Section title="Verileriniz">
          <p>
            Topladığımız veriler: hesap bilgileriniz (e-posta), doğum bilgileriniz
            (haritanız için), uygulama içi tercihleriniz, kaydettiğiniz içerikler ve
            kullanım istatistikleri. Bu veriler yalnızca size kişisel deneyim sunmak
            için kullanılır.
          </p>
          <p>
            Verileriniz veritabanı düzeyinde Row Level Security (RLS) ile korunur:
            yalnızca kendi verilerinize erişebilirsiniz. Abonelik seviyeniz (tier)
            yalnızca sunucu tarafında değiştirilebilir; istemciden değiştirilemez.
          </p>
        </Section>

        <Section title="Altyapı">
          <p>
            AURA, Lovable Cloud üzerinde çalışır. Veriler güvenli yönetilen bir
            PostgreSQL veritabanında saklanır; aktarım sırasında HTTPS/TLS ile
            şifrelenir.
          </p>
        </Section>

        <Section title="Üçüncü Taraflar">
          <p>
            Yalnızca uygulamanın çalışması için gerekli servisleri kullanırız:
            kimlik doğrulama (Google OAuth, isteğe bağlı), barındırma ve hava durumu
            verisi (OpenWeatherMap). Verileriniz reklam amacıyla satılmaz veya
            paylaşılmaz.
          </p>
        </Section>

        <Section title="Verilerinizin Silinmesi">
          <p>
            Hesabınızı ve verilerinizi silmek için{" "}
            <a
              href="mailto:aurastudioapp042@gmail.com"
              className="underline hover:text-foreground"
            >
              aurastudioapp042@gmail.com
            </a>{" "}
            adresinden bize ulaşabilirsiniz. Talebinizi makul bir süre içinde
            işleme alırız.
          </p>
        </Section>

        <Section title="Güvenlik Bildirimi">
          <p>
            Bir güvenlik açığı keşfettiyseniz lütfen sorumlu bir şekilde yukarıdaki
            e-posta adresi üzerinden bize bildirin. Konuyu inceleyip yanıt vereceğiz.
          </p>
        </Section>

        <Section title="Değişiklikler">
          <p>
            Bu sayfa zamanla güncellenebilir. Önemli değişiklikler uygulama
            içerisinde duyurulur.
          </p>
        </Section>
      </div>
    </main>
  );
}
