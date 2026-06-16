export const MYSTIC_CATEGORIES = [
  "Huzur",
  "Güç",
  "Şefkat",
  "İddialı",
  "Ana karakter",
  "Mizah",
  "Derin",
  "Felsefi",
] as const;
export type MysticCategory = (typeof MYSTIC_CATEGORIES)[number];

export type MysticCardContent = {
  category: MysticCategory;
  quote: string;
  whisper: string;
};

const F = (category: MysticCategory, quote: string, whisper: string): MysticCardContent => ({ category, quote, whisper });

// High-quality, hand-written fallback pool (used only if AI fails).
export const MYSTIC_FALLBACK: MysticCardContent[] = [
  F("Huzur", "Bazı şeyleri çözmek zorunda değilsin.", "Bugün kontrol değil, denge günü."),
  F("Huzur", "Sessizlik bir cevaptır.", "Açıklamaya borcun yok."),
  F("Güç", "Işığını kısmayı reddeden insanlar, bazı gözleri rahatsız eder.", "Sen rahatsız etmek için değil, parlamak için buradasın."),
  F("Güç", "Geri adım atmak, geri çekilmek değildir.", "Bazen güç, yavaşlamayı seçtiğinde belli olur."),
  F("Şefkat", "Kendine, en sevdiğin insana davrandığın gibi davran.", "Bugün önce sana iyi gel."),
  F("Şefkat", "Yorulmak zayıflık değil, taşımanın kanıtıdır.", "Bırakmak da bir özen biçimidir."),
  F("İddialı", "Sahne senin. Rolünü küçültme.", "Yer açmak için kendini küçültme."),
  F("İddialı", "Hak etmek için izin beklemiyorsun.", "İstediğini, kibarca ama net iste."),
  F("Ana karakter", "Hayatının başrolü olmak kibir değil, sorumluluktur.", "Bugün figüran gibi davranma."),
  F("Ana karakter", "Sen sahneye çıkınca ışık değişir.", "Olduğun gibi içeri gir."),
  F("Mizah", "Bugün hiçbir şey yapmadın ama en azından kötü karar da vermedin.", "Bu da bir başarı sayılır ☕"),
  F("Mizah", "Drama sende değil, çevrende fazla.", "Sen sadece izleyici koltuğuna geç."),
  F("Derin", "Bazı kapılar kapanmadı, sadece sana ait değiller.", "Yanlış kapıyı zorlamak da bir tür kayıptır."),
  F("Derin", "Kaybettiğini sandığın şey, aslında yön değiştiriyordu.", "Gidenin arkasından bakma; o seni bırakmadı, akış değişti."),
  F("Felsefi", "Olduğun yer, olman gereken yerdir; ama burada kalman gerekmez.", "Şimdi var olmak, sonra hareket etmeye engel değil."),
  F("Felsefi", "Zaman kaybı diye bir şey yok; sadece dönüşüm var.", "Bekleme dediğin şey, içten içe büyüme."),
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
