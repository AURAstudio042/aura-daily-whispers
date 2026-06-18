# Premium Özellikler — Gerçek Implementasyon Planı

Bu plan 7 büyük özelliği "yakında" toast'larından kurtarıp gerçek, AI destekli, kişiselleştirilmiş hale getirir. Hepsi Lovable AI Gateway (`google/gemini-3-flash-preview`) üzerinden çalışır, kullanıcı profili + günlük veriler bağlamına eklenir.

## Kapsam ve Mimari

Her özellik bir server function (`createServerFn` + `requireSupabaseAuth`) ve gerekirse bir cache tablosu kullanır. Tüm AI çağrıları zaten kurulu olan `createLovableAiGatewayProvider`'dan geçer. Premium gating `getUserTier` ile yapılır.

### 1) Aylık derin analiz (kişisel veriye dayalı)
- `monthly.functions.ts` zaten var ama sadece profil verisini kullanıyor. Genişletilecek: o ayki `tarot_readings`, `coffee_readings`, `daily_content` (mood/taş/koku geçmişi) ve `saved_quotes` çekilip prompt'a eklenecek.
- Yeni route: `src/routes/_authenticated/aylik.tsx` — mevcut `MonthlyAnalysis` componentini gösterir, profil sayfasından link.
- Cache: var olan `monthly_analyses` tablosu.

### 2) Özel gün modu (yeni)
- Yeni route: `src/routes/_authenticated/ozel-gun.tsx` — seçim ekranı (düğün, iş toplantısı, romantik buluşma, mezuniyet, mülakat, ilk randevu, doğum günü, sınav) + tarih + opsiyonel not.
- Yeni server fn: `src/lib/aura/special-day.functions.ts` → AI'dan yapılandırılmış çıktı: enerji analizi, kombin (üst/alt/ayakkabı/aksesuar/makyaj), taş, koku, hazırlık rehberi (sabah/öğlen/akşam adımları), güçlü cümle.
- Cache: var olan `special_day_messages` tablosuna kayıt (occasion + date + content jsonb).
- Gating: AURA+ veya Premium.

### 3) Taş ve koku arşivi (yeni)
- Yeni server fn: `src/lib/aura/stones-archive.functions.ts` → kullanıcının `daily_content` geçmişinden tüm taş + koku önerilerini toplar, tarih + bağlamla döner. Favori için yeni minik tablo `stone_favorites` (user_id, kind: stone|scent, name, meaning, created_at).
- Yeni route: `src/routes/_authenticated/arsiv-tas.tsx` — sekmeli: Taşlar / Kokular / Favoriler. Her kart açıklama + enerji. Kalp ikonuyla favori.
- Gating: AURA+ ve üstü.

### 4) Doğum haritası & yıldız haritası (yeni)
- Profile alanları zaten birth_date/birth_time/birth_place varsayılıyor; yoksa profil formuna ekle.
- Yeni server fn: `src/lib/aura/birth-chart.functions.ts` → AI'dan yapılandırılmış: güneş, ay, yükselen, merkür, venüs, mars, jüpiter, satürn için burç + ev + kişiye etki yorumu + genel kişilik özeti + güçlü/zayıf yönler + yaşam yolu.
- Cache: yeni tablo `birth_charts` (user_id pk, content jsonb, generated_at) — bir kez üretilir.
- Yeni route: `src/routes/_authenticated/dogum-haritasi.tsx` — SVG çember (12 ev + gezegen sembolleri yerleştirme) + her gezegen için açılır kart.
- Gating: Premium.

### 5) Gezegen takibi (yeni)
- Yeni server fn: `src/lib/aura/planets.functions.ts` → bugünün tarihi + kullanıcı burcu ile AI'dan: 7 gezegen için bugünkü "transit" yorumu + burca özel etki + günün uyarısı + güçlü saatler.
- Cache: günlük per-user (`daily_content` benzeri yeni `planet_transits` tablosu: user_id + date pk).
- Yeni route: `src/routes/_authenticated/gezegenler.tsx` — kart listesi.
- Gating: Premium.

### 6) Temalar gerçekten değişsin
- `src/styles.css` içine 3 tema sınıfı: `.theme-editorial`, `.theme-gold`, `.theme-midnight` — CSS değişkenlerini (background, foreground, primary, accent, card) override eder.
- Yeni hook: `useTheme()` — localStorage'dan okur, `document.documentElement.classList` üzerinde toggle eder.
- `profil.tsx`'teki tema seçici gerçek `setTheme()` çağırsın, toast yerine.
- `__root.tsx` mount'ta tema uygulasın.

### 7) AI Stilist genişletme
- Mevcut `stylist.functions.ts` korunur. Yeni mod ekle: `mode: "daily" | "special_day"`. `special_day` modunda occasion + tarih alır, ona göre komple rehber döner (gardırop seçimi + alternatifler + saç/makyaj + parfüm + aksesuar + güven cümlesi).
- `stilist.tsx`'e mod sekmesi ve özel gün formu.

## Yapılacak dosyalar

**Yeni server functions** (`src/lib/aura/`):
- `special-day.functions.ts`
- `stones-archive.functions.ts` (+ favorite toggle)
- `birth-chart.functions.ts`
- `planets.functions.ts`
- `monthly.functions.ts` (genişlet)
- `stylist.functions.ts` (special_day modu)

**Yeni route'lar** (`src/routes/_authenticated/`):
- `aylik.tsx`
- `ozel-gun.tsx`
- `arsiv-tas.tsx`
- `dogum-haritasi.tsx`
- `gezegenler.tsx`

**Migration**:
- `stone_favorites` tablosu
- `birth_charts` tablosu
- `planet_transits` tablosu
- `profiles`'a `theme` text kolonu (opsiyonel — şimdilik localStorage yeterli)

**Tema sistemi**:
- `src/styles.css` — 3 tema variant
- `src/hooks/useTheme.ts`
- `src/routes/profil.tsx` — gerçek tema değişimi
- `src/routes/__root.tsx` — mount'ta uygula

**UI entegrasyonları**:
- `profil.tsx` — "yakında" toast'larını yeni route linkleriyle değiştir
- `stilist.tsx` — özel gün modu UI

## Tahmini boyut
~13 yeni dosya, ~6 mevcut dosya değişikliği, 1 migration. Tek turda hepsini yazacağım, yarım bırakmayacağım.

## Onay sorusu
Bu kapsam doğru mu? Özellikle:
- (4) Doğum haritası: tam astronomik hesap (Swiss Ephemeris) yerine **AI tabanlı yorumsal** harita yapıyorum — gezegen pozisyonlarını AI yaklaşık verir, gerçek efemerid değil. Gerçek astronomik hassasiyet istersen ayrı bir library entegrasyonu gerekir (daha uzun). Onay verir misin AI yorumsal versiyonu için?
