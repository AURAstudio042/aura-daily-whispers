// AURA mock content & helpers. All Turkish. Pure functions; safe with null user.
// Content rotates: a per-session seed is generated each time the app opens, so
// every visit produces a genuinely different combination. Within a single
// session the same call returns the same result (stable while you browse).

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

// ── Kişiselleştirme: ilişki, odak, yaşam bağlamı
export const RELATIONSHIP_STATUSES = [
  { id: "Evli", emoji: "💍" },
  { id: "İlişkim Var", emoji: "❤️" },
  { id: "Bekar", emoji: "🌿" },
  { id: "İlişki Aramıyorum", emoji: "🤍" },
  { id: "Karmaşık / Belirsiz", emoji: "🌙" },
] as const;
export type RelationshipStatus = typeof RELATIONSHIP_STATUSES[number]["id"];

export const GENDERS = ["Kadın", "Erkek", "Non-binary", "Belirtmek istemiyorum"] as const;
export type Gender = typeof GENDERS[number];

export const LIFE_FOCUS_OPTIONS = [
  { id: "Aşk", emoji: "❤️" },
  { id: "Kariyer", emoji: "💼" },
  { id: "Para", emoji: "💰" },
  { id: "Ruhsal Gelişim", emoji: "✨" },
  { id: "Sağlık", emoji: "🌿" },
  { id: "Aile", emoji: "👨‍👩‍👧‍👦" },
] as const;
export type LifeFocus = typeof LIFE_FOCUS_OPTIONS[number]["id"];

export type PersonalizationContext = {
  relationshipStatus?: string;
  gender?: string;
  lifeFocus?: string[];
  hasChildren?: boolean;
  hasPets?: boolean;
};

/**
 * Builds a short Turkish guidance string fed into AI prompts. Designed to be
 * subtle — never let AI label or restrict the user, just nudge tone.
 */
export function buildPersonalizationGuidance(p: PersonalizationContext | null | undefined): string {
  if (!p) return "";
  const lines: string[] = [];
  const rel = p.relationshipStatus;
  if (rel) {
    if (rel === "Evli") lines.push("İlişki bağlamı: Evli — bağlılık, aile, ortak enerji ve uzun vadeli uyum temaları doğal biçimde yer alabilir.");
    else if (rel === "İlişkim Var") lines.push("İlişki bağlamı: Bir ilişkide — iletişim, duygusal uyum ve bağlantı temalarına nazikçe değin.");
    else if (rel === "Bekar") lines.push("İlişki bağlamı: Bekar — kendine dönüş, yeni deneyimlere açıklık ve duygusal bağımsızlık temalarına odaklan.");
    else if (rel === "İlişki Aramıyorum") lines.push("İlişki bağlamı: Şu an ilişki aramıyor — bireysel özgürlük, iç huzur ve kendi enerjisi temalarına saygıyla yaklaş; partner ima etme.");
    else lines.push("İlişki bağlamı: Belirsiz/Karmaşık — duygusal netlik, kendini dinleme ve şefkatli bir ton kullan; yargılayıcı olma.");
  }
  if (p.lifeFocus && p.lifeFocus.length) {
    lines.push(`Yaşam odağı: ${p.lifeFocus.join(", ")} — günün renkleri, kıyafet, taş, koku ve burç yorumu bu alana hafifçe eğilebilir.`);
  }
  if (p.hasChildren) lines.push("Çocuk: var — aile ve koruyucu enerji temaları doğal olabilir.");
  if (p.hasPets) lines.push("Evcil hayvan: var — sıcaklık ve sadakat metaforlarına yer açabilirsin.");
  if (p.gender) lines.push(`Cinsiyet: ${p.gender} — dili ona göre doğal tut, ama kalıplara sokma.`);
  if (!lines.length) return "";
  return "Kişisel bağlam (asla doğrudan etiketleme, sadece tonu yumuşatmak için kullan):\n- " + lines.join("\n- ");
}


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

// ── Session seed: generated once per app open. Persisted in sessionStorage so
// route navigation within the same browser tab stays consistent, but a full
// reload / new tab produces fresh content.
const SESSION_KEY = "aura:session-seed:v1";
function sessionSeed(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let s = window.sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s = Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
      window.sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return String(Date.now());
  }
}

// Day stamp — combined with session seed so content also rotates day-to-day.
function dayStamp(): string {
  return new Date().toDateString();
}

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seedFor(salt: string): number {
  return hash(dayStamp() + "|" + sessionSeed() + "|" + salt);
}

export function pick<T>(arr: T[], salt = ""): T {
  if (!arr.length) return undefined as unknown as T;
  return arr[seedFor(salt) % arr.length];
}
export function pickN<T>(arr: T[], n: number, salt = ""): T[] {
  const copy = [...arr];
  const out: T[] = [];
  let seed = seedFor(salt) || 1;
  while (out.length < Math.min(n, copy.length)) {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    const i = seed % copy.length;
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

// ── Horoscope — multiple openings + middles + closings, mixed combinatorially
// so each zodiac + mood + session yields a fresh-sounding sentence.
const HORO_OPEN: Record<ZodiacKey, string[]> = {
  "Aslan": [
    "İçindeki sahne ışığı bugün biraz daha sıcak.",
    "Aslan enerjin bugün etrafa farkında olmadan ısı yayıyor.",
    "Kalbinin gür sesi bugün seni doğru yere çağırıyor.",
    "Bugün doğal kararlılığın etrafındakilere güven veriyor.",
  ],
  "Başak": [
    "Detayları görme yeteneğin bugün hediye gibi.",
    "Zihnin bugün berrak ama yorucu olabilir; nefese dön.",
    "Düzen kurma içgüdün bugün başkasının huzuru oluyor.",
    "Küçük bir liste, büyük bir iç ferahlık getirecek.",
  ],
  "Terazi": [
    "Estetik gözün bugün her şeyi yumuşatıyor.",
    "Denge arayışın bugün dışarıda değil, içeride çözülüyor.",
    "Bir karar olgunlaşıyor — acele etmene gerek yok.",
    "İlişkilerin bugün ayna gibi: gördüklerin sana söylüyor.",
  ],
  "Akrep": [
    "Sezgilerin bugün olağandan keskin.",
    "Derinlerin bugün başkalarını ürkütmüyor, çekiyor.",
    "Sessiz bir dönüşüm içeride başladı.",
    "Bakışların bugün kelimelerden çok şey söylüyor.",
  ],
  "Yay": [
    "Ufkun bugün geniş — ama bir yere gitmek şart değil.",
    "Spontane bir karar bugün sana iyi gelir.",
    "Bir gerçek söylenmeyi bekliyor; şefkatle ört.",
    "Yay özgürlüğün bugün küçük şeylerde parlıyor.",
  ],
  "Oğlak": [
    "Disiplinin bugün lütufkar, sert değil.",
    "Bir mola, bir yenilgi değil — bir bakım hareketi.",
    "Hedefe değil, ritmine güven bugün.",
    "Yavaş ama kalıcı bir kazanım yaklaşıyor.",
  ],
  "Kova": [
    "Sıradanlık seni daraltıyorsa, küçük bir tuhaflığa izin ver.",
    "Fikirlerin bugün anlaşılmaktan kıymetli.",
    "Bir bağlantı dürüst bir cümleyle kurulacak.",
    "Geleceğe ait bir şey bugün sezgine düşüyor.",
  ],
  "Balık": [
    "Rüya ile gerçek arasında ince bir hat var bugün.",
    "Duyguların bugün hava gibi — şekil verirsen seninle.",
    "Yaratıcılığın küçük şeylerden parlıyor.",
    "Bir koku, bir müzik bugün seni toparlayacak.",
  ],
  "Koç": [
    "Ateşin bugün sana yol gösteriyor, ama yöneten sen ol.",
    "Cesaretin başkasının ilhamı oluyor.",
    "Bir başlangıç fikri içeride olgunlaşıyor.",
    "Hızlı cevap her zaman doğru cevap değil — nefes al.",
  ],
  "Boğa": [
    "Sabrın bugün altın değerinde.",
    "Güzel olana dokunma ihtiyacın haklı.",
    "Değerlerine sadık kalman bugün asil bir his bırakıyor.",
    "Demlemek senin gücün, acele değil.",
  ],
  "İkizler": [
    "Zihnin çok sesli — en sevdiğin sesi dinle.",
    "Sözcükler bugün senin elinde.",
    "Birden fazla şey istemek kusur değil; sıraya koy.",
    "Bir mesaj bir kapıyı sessizce aralayacak.",
  ],
  "Yengeç": [
    "Kabuğun bugün kale değil, yuva.",
    "Sevdiklerine olan sezgin seni yanıltmıyor.",
    "Hafıza güzel bir hediye — ama her şeyi bugüne taşıma.",
    "Kalbin bugün hem koruyor hem açıyor.",
  ],
  "Bilinmiyor": [
    "Enerjin bugün yumuşak ama net.",
    "Olduğun yerde durmak da bir hareket.",
    "İçindeki sessiz ses bugün daha bilge.",
    "Küçük bir dikkat büyük bir farkındalığa dönüşebilir.",
  ],
};

const HORO_MIDDLE = [
  "Başkalarının tereddüt ettiği yerde sana hız veren şey, kendi sezgine duyduğun saygı.",
  "Bugün küçük bir 'hayır', büyük bir kapı açıyor.",
  "Bir nefes önce konuş — kelimelerin bugün her zamankinden ağır.",
  "Hissettiğin yorgunluk tembellik değil, derinlik.",
  "Hayır demek bugün bir bakım hareketi.",
  "Bugün kendine ayırdığın 10 dakika başkasına ayırdığın bir saatten değerli.",
  "Sınır koymak, sevgini eksiltmiyor — tam tersine sahici kılıyor.",
  "Bir konuya 'yeter' demek bugün sana hafiflik getirecek.",
  "İçinden geçeni yazıya dök; gün sana çok şey söyleyecek.",
  "Beklediğin bir cevap geç gelse de doğru gelecek.",
];

const HORO_CLOSE: Record<Mood | "none", string[]> = {
  "Stresli": [
    "Akşama doğru omuzların düşecek — buna izin ver.",
    "Bedenin bugün dinlenmek istiyor; programı esnet.",
    "Bir kupa sıcak içecek, küçük bir reset gibi olacak.",
  ],
  "Yorgun": [
    "Bugün üretkenliğini değil, yumuşaklığını ölç.",
    "Erken yatmak da bir başarı.",
    "Yapmadığın şeyler için kendini suçlama.",
  ],
  "Enerjik": [
    "Bu enerjini en sevdiğin şeye akıt — boşa harcama.",
    "Hareket et, ama bir an dur ve nereye gittiğine bak.",
    "Bugün başlattığın bir şey ileride seni gülümsetecek.",
  ],
  "Mutlu": [
    "Bu hafiflik bulaşıcı — yanındakilere de iyi gelecek.",
    "Sebebi sormadan tadını çıkar.",
    "Bugün küçük bir an, uzun bir hatıraya dönüşebilir.",
  ],
  "Romantik": [
    "Bir bakış, bir cümle bugün katlanarak büyüyebilir.",
    "Kendine de aynı romantizmle yaklaş.",
    "Akşam bir mum yak — atmosfer senin hediyendir.",
  ],
  "Odaklı": [
    "Tek bir şeye verdiğin dikkat bugün sihir gibi çalışacak.",
    "Bildirimleri kapat, dünya seni bekler.",
    "Bugün biten bir iş, yarın açılan bir kapı.",
  ],
  "none": [
    "Günün geri kalanı sana doğru akıyor.",
    "Akışta kal, zorlama.",
    "Bugün hissettiklerin yarına bilgi olacak.",
  ],
};

const MOOD_INTRO: Record<Mood, string> = {
  "Stresli": "Stresli enerjin bugün şefkatle yumuşuyor. ",
  "Yorgun": "Yorgunluğunun içinde sessiz bir bilgelik var. ",
  "Enerjik": "Enerjin bugün doğru yere akıyor. ",
  "Mutlu": "Mutluluğun bulaşıcı — etrafına da iyi geliyor. ",
  "Romantik": "Romantik bir telin tınlıyor bugün. ",
  "Odaklı": "Odağın bugün cerrahi keskinlikte. ",
};

export function dailyHoroscope(z: ZodiacKey, mood?: Mood): string {
  const intro = mood ? MOOD_INTRO[mood] : "";
  const open = pick(HORO_OPEN[z] ?? HORO_OPEN["Bilinmiyor"], "h-open-" + z + (mood ?? ""));
  const mid = pick(HORO_MIDDLE, "h-mid-" + z + (mood ?? ""));
  const close = pick(HORO_CLOSE[mood ?? "none"], "h-close-" + z + (mood ?? ""));
  return `${intro}${open} ${mid} ${close}`.trim();
}

// ── Colors palette (expanded)
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
  { name: "Mercan", hex: "#e08878" },
  { name: "Şampanya", hex: "#efe2c4" },
  { name: "Petrol", hex: "#1e4a55" },
  { name: "Lila", hex: "#c8a8d8" },
  { name: "Karamel", hex: "#8a5a32" },
  { name: "Sis Grisi", hex: "#9a9aa4" },
  { name: "Yosun", hex: "#4a5a3a" },
  { name: "Şeftali", hex: "#f0c0a0" },
];

// Mood biases — colors that resonate with a given mood get a higher chance.
const MOOD_COLOR_BIAS: Record<Mood, string[]> = {
  "Enerjik": ["Mercan", "Altın", "Şeftali", "Bordo"],
  "Mutlu": ["Şampanya", "Krem", "Şeftali", "Lila"],
  "Stresli": ["Lavanta", "Buz Mavi", "Adaçayı", "Sis Grisi"],
  "Yorgun": ["Pudra", "Krem", "Lavanta", "Şampanya"],
  "Romantik": ["Bordo", "Pudra", "Şeftali", "Mercan"],
  "Odaklı": ["Antrasit", "Gece Mavisi", "Petrol", "Zeytin"],
};

export function dailyColors(style?: string, mood?: Mood): Color[] {
  let pool = COLOR_POOL;
  if (mood) {
    const bias = MOOD_COLOR_BIAS[mood] ?? [];
    // Duplicate biased entries to weight the random pick.
    pool = [...COLOR_POOL, ...COLOR_POOL.filter((c) => bias.includes(c.name))];
  }
  return pickN(pool, 4, "colors-" + (style ?? "") + (mood ?? ""));
}

// ── Outfit (expanded pools + mood/zodiac influence)
const TOPS = [
  "İpek bluz", "Yumuşak kaşmir kazak", "Beyaz oversize gömlek", "Krem triko",
  "Lavanta tonlarında tunik", "Sade bir vintage tişört", "Saten bir bluz",
  "Yün boğazlı kazak", "Hafif tüvit ceket", "Keten gömlek", "Dantel detaylı body",
  "Oversize blazer", "Yumuşak hırka", "Bordo kaşmir", "Siyah crop knit",
];
const BOTTOMS = [
  "Yüksek bel siyah pantolon", "Uzun düz etek", "Geniş paça denim",
  "Bej keten pantolon", "Midi etek", "Çikolata kahve kumaş pantolon",
  "Krem geniş paça", "Pile detaylı midi etek", "Vintage mom jean",
  "Saten midi etek", "Yün şort + çorap", "Düz kesim siyah jean",
];
const SHOES = [
  "Sade beyaz spor ayakkabı", "Loafer", "Bilekten bağlı sandalet",
  "Kısa topuk", "Klasik bot", "Bale ayakkabısı", "Slingback",
  "Süet bilekli bot", "Mary Jane", "Minimalist babet",
];
const ACCESS = [
  "İnce altın kolye", "Minimal saat", "Pamuklu eşarp", "Küçük çapraz çanta",
  "Gümüş yüzük", "Vintage küpe", "İnce kemer", "Yün bere",
  "Saç tokası", "Geniş kenarlı şapka", "Mini el çantası",
];
const LIPS = [
  "nude pembe", "yumuşak terracotta", "şarap kırmızısı", "şeftali",
  "berry tonu", "soft mokka", "çıplak gül", "kiremit",
];
const JEWELRY = ["altın", "gümüş", "rose gold", "antik altın", "incili gümüş"];

// Style + mood biases — push outfit toward a coherent feeling.
const STYLE_TOP_BIAS: Record<string, string[]> = {
  "Klasik": ["İpek bluz", "Saten bir bluz", "Krem triko", "Hafif tüvit ceket"],
  "Spor": ["Sade bir vintage tişört", "Oversize blazer", "Siyah crop knit"],
  "Minimalist": ["Beyaz oversize gömlek", "Krem triko", "Siyah crop knit"],
  "Bohem": ["Lavanta tonlarında tunik", "Dantel detaylı body", "Keten gömlek"],
  "Modern": ["Oversize blazer", "Saten bir bluz", "Bordo kaşmir"],
};
const MOOD_LIP_BIAS: Record<Mood, string[]> = {
  "Enerjik": ["şarap kırmızısı", "kiremit", "berry tonu"],
  "Mutlu": ["şeftali", "çıplak gül", "nude pembe"],
  "Stresli": ["nude pembe", "soft mokka"],
  "Yorgun": ["soft mokka", "çıplak gül"],
  "Romantik": ["berry tonu", "şarap kırmızısı", "şeftali"],
  "Odaklı": ["yumuşak terracotta", "nude pembe"],
};

const HARMONY = [
  "Bugünkü tonlar cilt rengini sıcak bir ışıkla buluşturuyor — yüzünde doğal bir parıltı bırakır.",
  "Renkler birbirini sessizce destekliyor; göz teninde, ten kıyafetinde dinleniyor.",
  "Soğuk ve sıcak tonların dengesi bugün seni daha uzun süre taze gösterecek.",
  "Nötr tonların üstüne minik bir vurgu — bu yetiyor.",
  "Bu kombin, akşama doğru bile yorgun görünmeyen bir paletle çalışıyor.",
];
const STYLE_QUOTES = [
  "Bugün sadelik senin en güçlü ifaden.",
  "Az ama doğru. Bugün öyle bir gün.",
  "Renkler değil, taşıyış konuşur bugün.",
  "Şıklık dikkat çekmek değil, akılda kalmaktır.",
  "Bugün giyindiğin şey ne giydiğin değil, nasıl hissettiğindir.",
  "Detaylar bağırmasın, fısıldasın.",
  "Bir parça vintage, bir parça sen — yeter.",
];

function biased<T extends string>(pool: T[], bias: T[] | undefined, salt: string): T {
  if (!bias || !bias.length) return pick(pool, salt);
  return pick([...pool, ...bias, ...bias], salt);
}

export function dailyOutfit(seedKey = "", style?: string, mood?: Mood) {
  const k = seedKey + (style ?? "") + (mood ?? "");
  return {
    top: biased(TOPS, style ? STYLE_TOP_BIAS[style] : undefined, "top" + k),
    bottom: pick(BOTTOMS, "bot" + k),
    shoe: pick(SHOES, "shoe" + k),
    access: pick(ACCESS, "acc" + k),
    lip: biased(LIPS, mood ? MOOD_LIP_BIAS[mood] : undefined, "lip" + k),
    jewelry: pick(JEWELRY, "jw" + k),
    harmony: pick(HARMONY, "harm" + k),
    inspiration: pick(STYLE_QUOTES, "sq" + k),
  };
}

// ── Stones (expanded)
export type StoneKind = "aquamarine" | "amethyst" | "rose" | "carnelian" | "onyx" | "citrine";
const STONES: { kind: StoneKind; name: string; meaning: string; tags: string[] }[] = [
  { kind: "aquamarine", name: "Akuamarin", meaning: "Sakinlik, akış ve berrak iletişim getirir.", tags: ["sakinlik", "iletişim", "akış"] },
  { kind: "amethyst", name: "Ametist", meaning: "Sezgini güçlendirir, zihni durultur.", tags: ["sezgi", "huzur", "berraklık"] },
  { kind: "rose", name: "Gül Kuvars", meaning: "Kalp enerjisini açar, öz şefkati besler.", tags: ["şefkat", "sevgi", "şifa"] },
  { kind: "carnelian", name: "Karneol", meaning: "Cesareti uyandırır, eylemi besler.", tags: ["cesaret", "ateş", "eylem"] },
  { kind: "onyx", name: "Oniks", meaning: "Korur, topraklar, sınırları net çizer.", tags: ["koruma", "denge", "sınır"] },
  { kind: "citrine", name: "Sitrin", meaning: "Bolluğu ve neşeyi davet eder.", tags: ["bolluk", "neşe", "güneş"] },
];

// Each zodiac has affinity stones; mood adds another bias layer.
const ZODIAC_STONE_BIAS: Partial<Record<ZodiacKey, StoneKind[]>> = {
  "Aslan": ["citrine", "carnelian"],
  "Başak": ["amethyst", "aquamarine"],
  "Terazi": ["rose", "aquamarine"],
  "Akrep": ["onyx", "amethyst"],
  "Yay": ["citrine", "carnelian"],
  "Oğlak": ["onyx", "amethyst"],
  "Kova": ["amethyst", "aquamarine"],
  "Balık": ["aquamarine", "rose"],
  "Koç": ["carnelian", "citrine"],
  "Boğa": ["rose", "onyx"],
  "İkizler": ["citrine", "aquamarine"],
  "Yengeç": ["rose", "amethyst"],
};
const MOOD_STONE_BIAS: Record<Mood, StoneKind[]> = {
  "Enerjik": ["carnelian", "citrine"],
  "Mutlu": ["citrine", "rose"],
  "Stresli": ["amethyst", "aquamarine"],
  "Yorgun": ["rose", "amethyst"],
  "Romantik": ["rose", "carnelian"],
  "Odaklı": ["onyx", "amethyst"],
};
export function dailyStone(z: ZodiacKey, mood?: Mood) {
  const bias = [
    ...(ZODIAC_STONE_BIAS[z] ?? []),
    ...(mood ? MOOD_STONE_BIAS[mood] : []),
  ];
  const pool = [...STONES, ...STONES.filter((s) => bias.includes(s.kind))];
  return pick(pool, "stone-" + z + (mood ?? ""));
}

// ── Scents (expanded with mood bias)
type ScentLine = { scents: string[]; feel: string; moods?: Mood[] };
const SCENT_LINES: ScentLine[] = [
  { scents: ["Lavanta", "beyaz misk", "adaçayı"], feel: "Bugün sakin ve derin bir iz bırak.", moods: ["Stresli", "Yorgun"] },
  { scents: ["Bergamot", "yasemin"], feel: "Hafif, parlak, kendinle barışık.", moods: ["Mutlu", "Enerjik"] },
  { scents: ["Sandal ağacı", "vanilya", "amber"], feel: "Sıcak bir kucaklama gibi taşı kendini.", moods: ["Romantik", "Yorgun"] },
  { scents: ["Yeşil çay", "limon kabuğu"], feel: "Yeniden başlama hissi.", moods: ["Odaklı", "Enerjik"] },
  { scents: ["Gül", "tonka", "tütsü"], feel: "Romantik ama güçlü bir iz.", moods: ["Romantik"] },
  { scents: ["Mürver", "iris", "beyaz çay"], feel: "Çiçekli ama temkinli — zarif bir gün.", moods: ["Mutlu"] },
  { scents: ["Vetiver", "tütsü", "kedi otu"], feel: "Topraklayıcı, sakin, derin.", moods: ["Odaklı", "Stresli"] },
  { scents: ["Şeftali", "ud", "vanilya"], feel: "Tatlı ama oturaklı — akşam için ideal.", moods: ["Romantik"] },
  { scents: ["Greyfurt", "nane"], feel: "Berrak ve uyandırıcı.", moods: ["Enerjik", "Odaklı"] },
  { scents: ["Mür", "deri", "tütsü"], feel: "Mistik bir gizliliği var.", moods: ["Odaklı"] },
];
export function dailyScent(mood?: Mood) {
  const pool = mood
    ? [...SCENT_LINES, ...SCENT_LINES.filter((s) => s.moods?.includes(mood))]
    : SCENT_LINES;
  return pick(pool, "scent-" + (mood ?? ""));
}

// ── Quotes (expanded)
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
  { text: "Bir kapı kapanırsa, başka bir kapı açılır; ama biz çoğu zaman kapanan kapıya o kadar uzun bakarız ki açılanı göremeyiz.", author: "Helen Keller", category: "İlham" },
  { text: "Yapabileceğine inan, yarı yolu katetmişsin demektir.", author: "Theodore Roosevelt", category: "İlham" },
  { text: "Aşk, görülmediğinde de var olabilen tek şeydir.", category: "Romantik" },
  { text: "Az konuş, çok dinle — kelimelerin değeri böyle artar.", category: "Bilgelik" },
  { text: "Bugün yorgunsan, bu da bir şey öğretiyor sana.", category: "Şefkat" },
  { text: "Kendine zaman ayırmak bencillik değil, ön koşuldur.", category: "Öz Bakım" },
  { text: "Hayat seni nereye götürürse götürsün, kalbini de yanına al.", category: "Yol" },
  { text: "Bekleyişin de bir anlamı var; her şey aynı anda çiçek açmaz.", category: "Sabır" },
];
export function dailyQuote(): Quote {
  return pick(QUOTES, "quote");
}

// ── Weather mock (expanded)
const WEATHER_TYPES = [
  { icon: "☀️", cond: "güneşli", note: "Hafif bir ceket yeter, ışığa çık." },
  { icon: "⛅", cond: "parçalı bulutlu", note: "Hafif bir katman al, hava oynayabilir." },
  { icon: "🌧️", cond: "yağmurlu", note: "Trençkotunu almayı unutma." },
  { icon: "🌫️", cond: "puslu", note: "Yumuşak ışık günü — pastel tonlar iyi durur." },
  { icon: "❄️", cond: "soğuk", note: "Kaşmir veya yün bir katman seni şımartsın." },
  { icon: "🌤️", cond: "açık", note: "Güneş gözlüğün yanında olsun." },
  { icon: "🌬️", cond: "rüzgarlı", note: "Saçını topla, hafif bir eşarp işine yarar." },
];
export function dailyWeather(city: string) {
  const w = pick(WEATHER_TYPES, "w-" + city);
  const temp = 8 + (seedFor("temp-" + city) % 22);
  return { ...w, temp, city };
}


// ── Greeting
export function greetingHint(z: ZodiacKey): string {
  const map: Record<ZodiacKey, string[]> = {
    "Aslan": ["Aslan enerjin bugün çok güçlü — gel bakalım.", "Sahne senin Aslan, ışığı yumuşak tut.", "Kalbinin sesi bugün açık."],
    "Başak": ["Başak detayları bugün sana özel bir armağan.", "Düzenin bugün huzura dönüşüyor.", "Zihnin berrak, kalbin sakin."],
    "Terazi": ["Terazi'nin estetiği bugün her detayında parlıyor.", "Denge bugün içeride kuruluyor.", "Hafif bir gün senin için."],
    "Akrep": ["Akrep sezgisi bugün konuşmaya başladı.", "Derinlerin bugün hediyendir.", "Sessiz ama net bir gün."],
    "Yay": ["Yay'ın özgürlüğü bugün geniş ufuklarda.", "Bugün küçük bir macera çağırıyor.", "Hafiflik senin tarafında."],
    "Oğlak": ["Oğlak disiplini bugün lütufkar.", "Yavaş ama emin — tam senin temposu.", "Bugün sağlam bir tuğla daha."],
    "Kova": ["Kova ışığı bugün her zamankinden parlak.", "Farklılığın bugün hediye.", "Geleceğe ait bir fikir geliyor."],
    "Balık": ["Balık duyguları bugün sanatla buluşuyor.", "Hayalin ve gerçeğin bugün el ele.", "Hassasiyetin gücün."],
    "Koç": ["Koç ateşi bugün doğru yere bakıyor.", "Bir kıvılcım, doğru bir yön.", "Cesaretin yumuşak konuşsun."],
    "Boğa": ["Boğa sabrı bugün altın değerinde.", "Güzel olana yaklaşma günü.", "Demlenmenin tadını çıkar."],
    "İkizler": ["İkizler zihninin bir tarafı bugün net konuşuyor.", "Kelimelerin bugün anahtar.", "Hafif ve çok sesli bir gün."],
    "Yengeç": ["Yengeç kalbi bugün hem koruyor hem açıyor.", "Yuvan bugün senin gücün.", "Sezgine güven."],
    "Bilinmiyor": ["Enerjin bugün yumuşak ama net.", "Akışta kal.", "Bugün sana doğru akıyor."],
  };
  return pick(map[z], "greet-" + z);
}

// ── Weekly
export function weeklyAura(z: ZodiacKey, mood?: Mood) {
  const themes = [
    "Sınır koyma haftası",
    "Yumuşak başlangıçlar haftası",
    "Görünür olma haftası",
    "İçe dönüş haftası",
    "Cesur sözler haftası",
    "Sadeleşme haftası",
    "Bağlantı kurma haftası",
  ];
  const goals = [
    "Bu hafta bir 'hayır' demeyi dene",
    "Günde 10 dakika telefonsuz yürüyüş",
    "Sevdiğin birine sebepsiz bir mesaj",
    "Bir akşam kendine yemek pişir",
    "Bir kitabın 20 sayfasını oku",
    "Erken uyanıp bir kahve sessizliği yaşa",
    "Bir gün sosyal medyaya hiç bakma",
    "Bir dostuna küçük bir hediye al",
    "Bir akşam mum ışığında yemek ye",
  ];
  const socials = [
    "Bu hafta yakın çevren seni daha çok duymak istiyor. Kısa ama içten cümleler kurmak yeter.",
    "Bu hafta yeni biriyle tanışma ihtimalin yüksek; açık ol ama acele etme.",
    "Eski bir bağlantı bu hafta yeniden açılabilir; ne hissettiğine dikkat et.",
  ];
  const motivations = [
    "Enerjini büyük hedeflere değil, küçük tutarlılıklara ver — gerisini hafta kendi getirir.",
    "Bu hafta plan değil, prensip seni taşıyacak: ne yapmayacağına karar ver.",
    "Bir şeyi bitirmek yenisine başlamaktan daha tatmin edici olacak bu hafta.",
  ];
  const rituals = [
    "Sabahları 3 dakika derin nefes — burnundan 4, tutuş 4, ağızdan 6.",
    "Yatmadan önce 5 dakika telefonsuz oturma.",
    "Akşamları bir bardak sıcak su + limon ritüeli.",
    "Sabah ilk işin pencereyi aç ve gökyüzüne bak.",
  ];
  return {
    theme: pick(themes, "wtheme-" + z + (mood ?? "")),
    social: pick(socials, "wsoc-" + z),
    motivation: pick(motivations, "wmot-" + z + (mood ?? "")),
    goals: pickN(goals, 4, "wgoals-" + z + (mood ?? "")),
    scent: pick(["Sandal & vanilya", "Bergamot & yasemin", "Gül & tonka", "Vetiver & tütsü", "Greyfurt & nane"], "wsc-" + (mood ?? "")),
    color: pick(COLOR_POOL, "wcol-" + z).name,
    ritual: pick(rituals, "writ-" + z),
    quote: pick(QUOTES, "wq"),
  };
}
