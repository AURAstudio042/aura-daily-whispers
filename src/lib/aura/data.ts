// AURA mock content & helpers. All Turkish. Pure functions; safe with null user.

export type Mood = "Enerjik" | "Mutlu" | "Stresli" | "Yorgun" | "Romantik" | "Odaklı";
export const MOODS: { id: Mood; emoji: string }[] = [
  { id: "Enerjik", emoji: "⚡" },
  { id: "Mutlu", emoji: "😊" },
  { id: "Stresli", emoji: "😣" },
  { id: "Yorgun", emoji: "😴" },
  { id: "Romantik", emoji: "💕" },
  { id: "Odaklı", emoji: "🎯" },
];

export const STYLES = ["Klasik", "Spor", "Minimalist", "Bohem", "Modern"] as const;
export type StyleType = typeof STYLES[number];

export const UNDERTONES = ["Sıcak", "Soğuk", "Nötr"] as const;

export type ZodiacKey =
  | "Koç" | "Boğa" | "İkizler" | "Yengeç" | "Aslan" | "Başak"
  | "Terazi" | "Akrep" | "Yay" | "Oğlak" | "Kova" | "Balık" | "Bilinmiyor";

export const ZODIAC_SYMBOL: Record<ZodiacKey, string> = {
  "Koç": "♈", "Boğa": "♉", "İkizler": "♊", "Yengeç": "♋",
  "Aslan": "♌", "Başak": "♍", "Terazi": "♎", "Akrep": "♏",
  "Yay": "♐", "Oğlak": "♑", "Kova": "♒", "Balık": "♓",
  "Bilinmiyor": "✦",
};

export function zodiacFromDate(iso?: string): ZodiacKey {
  if (!iso) return "Bilinmiyor";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Bilinmiyor";
  const m = d.getMonth() + 1, day = d.getDate();
  const c = (mm: number, dd: number) => m === mm && day >= dd;
  const b = (mm: number, dd: number) => m === mm && day <= dd;
  if (c(3, 21) || b(4, 19)) return "Koç";
  if (c(4, 20) || b(5, 20)) return "Boğa";
  if (c(5, 21) || b(6, 20)) return "İkizler";
  if (c(6, 21) || b(7, 22)) return "Yengeç";
  if (c(7, 23) || b(8, 22)) return "Aslan";
  if (c(8, 23) || b(9, 22)) return "Başak";
  if (c(9, 23) || b(10, 22)) return "Terazi";
  if (c(10, 23) || b(11, 21)) return "Akrep";
  if (c(11, 22) || b(12, 21)) return "Yay";
  if (c(12, 22) || b(1, 19)) return "Oğlak";
  if (c(1, 20) || b(2, 18)) return "Kova";
  return "Balık";
}

// Deterministic-ish seed per day so refresh feels stable within a session, but rotates
function seedFor(salt: string) {
  const key = new Date().toDateString() + "|" + salt + "|" + Math.floor(Date.now() / 60000);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function pick<T>(arr: T[], salt = ""): T {
  if (!arr.length) return undefined as unknown as T;
  return arr[seedFor(salt) % arr.length];
}
export function pickN<T>(arr: T[], n: number, salt = ""): T[] {
  const s = seedFor(salt);
  const copy = [...arr];
  const out: T[] = [];
  let seed = s;
  while (out.length < Math.min(n, copy.length)) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const i = seed % copy.length;
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

// ── Horoscope blurbs per zodiac (tone varies)
const HOROSCOPE: Record<ZodiacKey, string[]> = {
  "Aslan": [
    "İçindeki sahne ışığı bugün biraz daha sıcak. Aslan'ın doğal kararlılığı, başkalarının tereddüt ettiği yerde sana hız veriyor.",
    "Bugün küçük bir 'hayır' senin için büyük bir kapı açıyor. Cömertliğinin sınırlarını bilmek, asaletinden eksiltmiyor.",
    "Sözlerin bugün her zamankinden ağır. Söylemeden önce bir nefes — çünkü tek bir cümlen bir odayı toplayabilir.",
  ],
  "Başak": [
    "Detayları çözme yeteneğin bugün başkasının huzuru oluyor. Ama önce kendi listenin başına kendini yaz.",
    "Plan yapmanın huzur veren tarafıyla, mükemmeliyetçiliğin yorucu tarafı arasında bugün denge günü.",
    "Sessiz bir farkındalık günü. İçinden geçenleri kağıda dökersen, gün sana çok şey söyleyecek.",
  ],
  "Terazi": [
    "Bugün hangi tarafı seçeceğin değil, hangi tarafta huzur bulduğun önemli. Terazi'nin estetiği iç dünyana da uygulanmayı bekliyor.",
    "Bir karar erteleniyorsa, belki de cevap henüz olgunlaşmadığı içindir. Acele etme.",
    "İlişkilerin bugün ayna gibi — gördüklerin, kendine de bir şey söylüyor.",
  ],
  "Akrep": [
    "Sezgilerin bugün olağandan keskin. Ama dışarıya kanıt sunmana gerek yok — sen zaten biliyorsun.",
    "Derinlerin, bugün başkalarını korkutmuyor; tam tersine onları kendine çekiyor. Olduğun gibi kal.",
    "Bir dönüşüm sessizce başladı. Bu hafta bir şey biterken, başka bir şey doğuyor içinde.",
  ],
  "Yay": [
    "Bugün ufkun, odan kadar büyük değil. Bir yere gitmek değil, bir fikre dokunmak yeterli.",
    "Spontane bir karar bugün sana iyi gelir. Plansızlığın da bir tılsımı var.",
    "Bir gerçeği yumuşatmadan söylemek isteyebilirsin. Kelimelerini şefkatle örtersen, etkileri katlanır.",
  ],
  "Oğlak": [
    "Disiplinin bugün lütufkar. Küçük bir adım, büyük bir saygıya dönüşüyor — önce kendine.",
    "Hep güçlü olmak zorunda değilsin. Bir mola, bir yenilgi değil — bir bakım hareketi.",
    "Hedefe değil, ritmine güven bugün. Oğlak'ın zaferleri yavaş ama kalıcıdır.",
  ],
  "Kova": [
    "Sıradanlık seni daraltıyorsa, bugün küçük bir tuhaflığa izin ver. Ait olmadığın yerleri bırakmak da bir özgürlük.",
    "Fikirlerin bugün başkalarının yanlış anladığı kadar değerli. Açıklamak zorunda değilsin.",
    "Bir bağlantı kurmak istiyorsan, dürüst bir cümle yeter. Stratejiye değil samimiyete ihtiyacın var.",
  ],
  "Balık": [
    "Bugün rüya ile gerçek arasında ince bir hat var. Hangisinin sana iyi geldiğini hissetmeyi bil.",
    "Duyguların bugün hava gibi — şekil verirsen seninle, vermezsen başkalarınla. Sınır da bir şefkat türü.",
    "Yaratıcılığın bugün küçük şeylerden parlıyor. Bir müzik, bir koku, bir yürüyüş — yeniden bütünleşeceksin.",
  ],
  "Koç": [
    "Hızlı bir cevap her zaman doğru cevap değil. Ateşin bugün sana yol gösteriyor, ama yöneten sen ol.",
    "Cesaretin başkasının ilhamı oluyor — sen bunu fark etmesen de.",
    "Bir başlangıç fikri zihninde. Onu kimseye sormadan önce kendine güvenmen yeter.",
  ],
  "Boğa": [
    "Sabrın bugün altın değerinde. Acele etmek değil, demlemek senin gücün.",
    "Güzel olana dokunmak ihtiyacın bugün. Küçük bir lüks — bir kahve, bir mum — sana iyi gelir.",
    "Değerlerine sadık kalmak bazen yalnızlaştırır ama her zaman seni asil kılar.",
  ],
  "İkizler": [
    "Zihnin bugün çok sesli. Hepsini değil, en sevdiğin sesi dinle.",
    "Sözcükler bugün senin elinde. Bir mesaj, bir konuşma — bir kapıyı sessizce açıyor.",
    "Birden fazla şey istemek bir kusur değil. Sıraya koymak senin gücün.",
  ],
  "Yengeç": [
    "Kabuğun bugün kale değil, yuva. İçeride iyi olduğun sürece dışarısı sana zarar veremez.",
    "Sevdiklerine olan derin sezgin bugün de seni yanıltmayacak. Ama önce kendi kalbini dinle.",
    "Hafıza güzel bir hediye — ama her hatırayı bugüne taşımak zorunda değilsin.",
  ],
  "Bilinmiyor": [
    "Bugün enerjin yumuşak ama net. Olduğun yerde durmak da bir hareket.",
    "Küçük bir dikkat, büyük bir farkındalığa dönüşebilir. Bugün kendini izle.",
    "İçindeki sessiz ses bugün daha bilge. Karar onun.",
  ],
};

export function dailyHoroscope(z: ZodiacKey, mood?: Mood): string {
  const base = HOROSCOPE[z] ?? HOROSCOPE["Bilinmiyor"];
  const intro = mood
    ? {
        "Stresli": "Stresli enerjin bugün şefkatle yumuşuyor. ",
        "Yorgun": "Yorgunluğunun içinde sessiz bir bilgelik var. ",
        "Enerjik": "Enerjin bugün doğru yere akıyor. ",
        "Mutlu": "Mutluluğun bulaşıcı — etrafına da iyi geliyor. ",
        "Romantik": "Romantik bir telin tınlıyor bugün. ",
        "Odaklı": "Odağın bugün cerrahi keskinlikte. ",
      }[mood]
    : "";
  return intro + pick(base, "horo-" + z + (mood ?? ""));
}

// ── Colors palette
type Color = { name: string; hex: string };
const COLOR_POOL: Color[] = [
  { name: "Lavanta", hex: "#b794d4" },
  { name: "Teal", hex: "#3a8a8a" },
  { name: "Adaçayı", hex: "#8aa884" },
  { name: "Toprak", hex: "#a07858" },
  { name: "Krem", hex: "#e8d8c0" },
  { name: "Antrasit", hex: "#3a3a44" },
  { name: "Bordo", hex: "#7a2438" },
  { name: "Altın", hex: "#d4b078" },
  { name: "Gece Mavisi", hex: "#1a2a4a" },
  { name: "Pudra", hex: "#e8c4c8" },
  { name: "Zeytin", hex: "#6a7048" },
  { name: "Buz Mavi", hex: "#a8c8d8" },
];
export function dailyColors(style?: string, mood?: Mood): Color[] {
  return pickN(COLOR_POOL, 4, "colors-" + (style ?? "") + (mood ?? ""));
}

// ── Outfit
const TOPS = ["İpek bluz", "Yumuşak kaşmir kazak", "Beyaz oversize gömlek", "Krem triko", "Lavanta tonlarında tunik", "Sade bir vintage tişört"];
const BOTTOMS = ["Yüksek bel siyah pantolon", "Uzun düz etek", "Geniş paça denim", "Bej keten pantolon", "Midi etek"];
const SHOES = ["Sade beyaz spor ayakkabı", "Loafer", "Bilekten bağlı sandalet", "Kısa topuk", "Klasik bot"];
const ACCESS = ["İnce altın kolye", "Minimal saat", "Pamuklu eşarp", "Küçük çapraz çanta", "Gümüş yüzük"];
const LIPS = ["nude pembe", "yumuşak terracotta", "şarap kırmızısı", "şeftali", "berry tonu"];
const JEWELRY = ["altın", "gümüş", "rose gold"];
const STYLE_QUOTES = [
  "Bugün sadelik senin en güçlü ifaden.",
  "Az ama doğru. Bugün öyle bir gün.",
  "Renkler değil, taşıyış konuşur bugün.",
  "Şıklık dikkat çekmek değil, akılda kalmaktır.",
];
export function dailyOutfit(seedKey = "") {
  return {
    top: pick(TOPS, "top" + seedKey),
    bottom: pick(BOTTOMS, "bot" + seedKey),
    shoe: pick(SHOES, "shoe" + seedKey),
    access: pick(ACCESS, "acc" + seedKey),
    lip: pick(LIPS, "lip" + seedKey),
    jewelry: pick(JEWELRY, "jw" + seedKey),
    harmony: "Bugünkü tonlar cilt rengini sıcak bir ışıkla buluşturuyor — yüzünde doğal bir parıltı bırakır.",
    inspiration: pick(STYLE_QUOTES, "sq" + seedKey),
  };
}

// ── Stones
export type StoneKind = "aquamarine" | "amethyst" | "rose" | "carnelian" | "onyx" | "citrine";
const STONES: { kind: StoneKind; name: string; meaning: string; tags: string[] }[] = [
  { kind: "aquamarine", name: "Akuamarin", meaning: "Sakinlik, akış ve berrak iletişim getirir.", tags: ["sakinlik", "iletişim", "akış"] },
  { kind: "amethyst", name: "Ametist", meaning: "Sezgini güçlendirir, zihni durultur.", tags: ["sezgi", "huzur", "berraklık"] },
  { kind: "rose", name: "Gül Kuvars", meaning: "Kalp enerjisini açar, öz şefkati besler.", tags: ["şefkat", "sevgi", "şifa"] },
  { kind: "carnelian", name: "Karneol", meaning: "Cesareti uyandırır, eylemi besler.", tags: ["cesaret", "ateş", "eylem"] },
  { kind: "onyx", name: "Oniks", meaning: "Korur, topraklar, sınırları net çizer.", tags: ["koruma", "denge", "sınır"] },
  { kind: "citrine", name: "Sitrin", meaning: "Bolluğu ve neşeyi davet eder.", tags: ["bolluk", "neşe", "güneş"] },
];
export function dailyStone(z: ZodiacKey, mood?: Mood) {
  return pick(STONES, "stone-" + z + (mood ?? ""));
}

// ── Scents
const SCENT_LINES = [
  { scents: ["Lavanta", "beyaz misk", "adaçayı"], feel: "Bugün sakin ve derin bir iz bırak." },
  { scents: ["Bergamot", "yasemin"], feel: "Hafif, parlak, kendinle barışık." },
  { scents: ["Sandal ağacı", "vanilya", "amber"], feel: "Sıcak bir kucaklama gibi taşı kendini." },
  { scents: ["Yeşil çay", "limon kabuğu"], feel: "Yeniden başlama hissi." },
  { scents: ["Gül", "tonka", "tütsü"], feel: "Romantik ama güçlü bir iz." },
];
export function dailyScent(mood?: Mood) {
  return pick(SCENT_LINES, "scent-" + (mood ?? ""));
}

// ── Quotes
export type Quote = { text: string; author?: string; category: string };
export const QUOTES: Quote[] = [
  { text: "Kendi ayakları üzerinde durmayı öğrenen bir kadın, hiçbir ayrılığı felaket olarak görmez.", category: "Güçlü" },
  { text: "Sessizlik de bir cevaptır.", author: "Sigmund Freud", category: "Gönderme" },
  { text: "Bugün hiçbir şey yapmadın ama en azından kötü karar da vermedin. ☕", category: "Komik" },
  { text: "Mutluluk düşüncelerinin kalitesine bağlıdır.", author: "Marcus Aurelius", category: "Felsefi" },
  { text: "Dünle beraber gitti cancağızım, ne kadar söz varsa düne ait.", author: "Mevlana", category: "Tasavvuf" },
  { text: "İnsan acısını bile güzel yaşamalı.", author: "Cemal Süreya", category: "Şiir" },
  { text: "Sahne senin. Rolünü küçültme.", category: "Ana karakter" },
  { text: "Işığını kısmayı reddeden insanlar, bazı gözleri rahatsız eder.", category: "İddialı" },
  { text: "Önemli olan ne kadar darbe alıp devam edebildiğindir.", author: "Rocky Balboa", category: "Film" },
];
export function dailyQuote(): Quote {
  return pick(QUOTES, "quote");
}

// ── Weather mock
const WEATHER_TYPES = [
  { icon: "☀️", cond: "güneşli", note: "Hafif bir ceket yeter, ışığa çık." },
  { icon: "⛅", cond: "parçalı bulutlu", note: "Hafif bir katman al, hava oynayabilir." },
  { icon: "🌧️", cond: "yağmurlu", note: "Trençkotunu almayı unutma." },
  { icon: "🌫️", cond: "puslu", note: "Yumuşak ışık günü — pastel tonlar iyi durur." },
  { icon: "❄️", cond: "soğuk", note: "Kaşmir veya yün bir katman seni şımartsın." },
];
export function dailyWeather(city: string) {
  const w = pick(WEATHER_TYPES, "w-" + city);
  const temp = 8 + (seedFor("temp-" + city) % 22);
  return { ...w, temp, city };
}
function seedFor2(salt: string) { return Math.abs([...salt].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)); }

// ── Greeting
export function greetingHint(z: ZodiacKey): string {
  return {
    "Aslan": "Aslan enerjin bugün çok güçlü — gel bakalım.",
    "Başak": "Başak detayları bugün sana özel bir armağan.",
    "Terazi": "Terazi'nin estetiği bugün her detayında parlıyor.",
    "Akrep": "Akrep sezgisi bugün konuşmaya başladı.",
    "Yay": "Yay'ın özgürlüğü bugün geniş ufuklarda.",
    "Oğlak": "Oğlak disiplini bugün lütufkar.",
    "Kova": "Kova ışığı bugün her zamankinden parlak.",
    "Balık": "Balık duyguları bugün sanatla buluşuyor.",
    "Koç": "Koç ateşi bugün doğru yere bakıyor.",
    "Boğa": "Boğa sabrı bugün altın değerinde.",
    "İkizler": "İkizler zihninin bir tarafı bugün net konuşuyor.",
    "Yengeç": "Yengeç kalbi bugün hem koruyor hem açıyor.",
    "Bilinmiyor": "Enerjin bugün yumuşak ama net.",
  }[z];
}

// ── Weekly
export function weeklyAura(z: ZodiacKey, mood?: Mood) {
  const themes = [
    "Sınır koyma haftası",
    "Yumuşak başlangıçlar haftası",
    "Görünür olma haftası",
    "İçe dönüş haftası",
    "Cesur sözler haftası",
  ];
  const goals = [
    "Bu hafta bir 'hayır' demeyi dene",
    "Günde 10 dakika telefonsuz yürüyüş",
    "Sevdiğin birine sebepsiz bir mesaj",
    "Bir akşam kendine yemek pişir",
    "Bir kitabın 20 sayfasını oku",
    "Erken uyanıp bir kahve sessizliği yaşa",
  ];
  return {
    theme: pick(themes, "wtheme-" + z),
    social: "Bu hafta yakın çevren seni daha çok duymak istiyor. Kısa ama içten cümleler kurmak yeter.",
    motivation: "Enerjini büyük hedeflere değil, küçük tutarlılıklara ver — gerisini hafta kendi getirir.",
    goals: pickN(goals, 4, "wgoals-" + z),
    scent: pick(["Sandal & vanilya", "Bergamot & yasemin", "Gül & tonka"], "wsc"),
    color: pick(COLOR_POOL, "wcol").name,
    ritual: "Sabahları 3 dakika derin nefes — burnundan 4, tutuş 4, ağızdan 6.",
    quote: pick(QUOTES, "wq"),
  };
}
