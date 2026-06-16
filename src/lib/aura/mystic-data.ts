export const MYSTIC_CATEGORIES = [
  "Huzur",
  "Güç",
  "Şefkat",
  "İddialı",
  "Ana karakter",
  "Mizah",
  "Derin",
  "Felsefi",
  "Romantik",
] as const;
export type MysticCategory = (typeof MYSTIC_CATEGORIES)[number];

export type MysticCardContent = {
  category: MysticCategory;
  quote: string;
  whisper: string;
};

const F = (category: MysticCategory, quote: string, whisper: string): MysticCardContent => ({ category, quote, whisper });

// High-quality, hand-written content pool. Used as fallback when AI is unavailable,
// and as inspiration / tone reference for AI-generated personalized cards.
export const MYSTIC_FALLBACK: MysticCardContent[] = [
  // HUZUR
  F("Huzur", "Bazen en cesur şey, her şeyi bırakmak değil — olduğun yerde durmaktır.", "Bugün kontrol değil, teslim günü."),
  F("Huzur", "Bir şeylerin hemen çözülmesi gerekmiyor. Bazı cevaplar zamanla gelir, zorlamayla değil.", "Sabır da bir güçtür."),

  // GÜÇ
  F("Güç", "Seni yıkmaya çalışan her şey, aslında ne kadar güçlü olduğunu test ediyor.", "Ve sen hâlâ buradasın."),
  F("Güç", "Kendi sesini bastırmayı bıraktığın gün, hayatın gerçekten başlar.", "O ses senin rehberin."),

  // ŞEFKAT
  F("Şefkat", "Kendine karşı en sert eleştirmen olma. O içindeki ses sana ait, ama her söylediği doğru değil.", "Kendine biraz daha nazik ol."),
  F("Şefkat", "Gösterdiğin çaba, aldığın sonuçtan çok daha değerlidir. Bunu unutma.", "Emek asla boşa gitmez."),

  // İDDİALI
  F("İddialı", "Herkesin seni anlamasına gerek yok. Kendini kaybetmediğin sürece sorun yok.", "Bazı insanlar seni ancak kaybettikten sonra anlar."),
  F("İddialı", "Kendi ayakları üzerinde durmayı öğrenen bir kadın, hiçbir ayrılığı felaket olarak görmez.", "Özgürlük bazen yalnız kalmakla başlar."),

  // ANA KARAKTER
  F("Ana karakter", "Hayatının yan karakteri olmaya niyetin var mı? Yoksa sahne senin.", "Başrol her zaman seçimdir."),
  F("Ana karakter", "Işığını kısmayı reddeden insanlar, bazı gözleri rahatsız eder. Bu senin sorunun değil.", "Parlamaya devam et."),

  // DERİN
  F("Derin", "Bazı kapılar kapanmadı. Sadece artık senin kapın değiller.", "Ait olduğun yer seni bekliyor."),
  F("Derin", "İnsan en çok kaçtığı şeyin içinde olgunlaşır.", "Zorluğun içinde bir hediye var."),

  // FELSEFİ
  F("Felsefi", "Dünle beraber gitti cancağızım, ne kadar söz varsa düne ait.", "— Mevlana"),
  F("Felsefi", "Mutluluk hayatının kalitesine değil, düşüncelerinin kalitesine bağlıdır.", "— Marcus Aurelius"),
  F("Felsefi", "İnsanın elinden alınamayacak son özgürlüğü — tavrını seçebilmesidir.", "— Viktor Frankl"),

  // MİZAH
  F("Mizah", "Bugün büyük kararlar almak zorunda değilsin. Sadece iyi bir kahve iç.", "Bazen bu yeterli. ☕"),
  F("Mizah", "Hakkımda konuşanlar kadar kendimle meşgul olsaydım, çoktan dünyayı değiştirmiştim.", "Ama işte buradayım. 😏"),

  // ROMANTİK
  F("Romantik", "Bazı insanlar hayatına girer, bazıları hayatının ta kendisi olur.", "Farkı hissediyorsun zaten."),
  F("Romantik", "Sevelim, sevilelim; dünya kimseye kalmaz.", "— Yunus Emre"),
];

export type TimeOfDay = "sabah" | "öğle" | "akşam" | "gece";

export function timeOfDay(d = new Date()): TimeOfDay {
  const h = d.getHours();
  if (h < 6) return "gece";
  if (h < 12) return "sabah";
  if (h < 18) return "öğle";
  if (h < 22) return "akşam";
  return "gece";
}

export function pickFallback(avoidQuote?: string): MysticCardContent {
  const pool = avoidQuote
    ? MYSTIC_FALLBACK.filter((c) => c.quote !== avoidQuote)
    : MYSTIC_FALLBACK;
  return pool[Math.floor(Math.random() * pool.length)];
}
