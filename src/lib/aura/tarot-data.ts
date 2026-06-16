export type TarotCategory = {
  key: string;
  label: string;
  emoji: string;
};

export const TAROT_CATEGORIES: TarotCategory[] = [
  { key: "ask", label: "Aşk & İlişki", emoji: "💕" },
  { key: "is", label: "İş & Kariyer", emoji: "💼" },
  { key: "saglik", label: "Sağlık & Enerji", emoji: "🌿" },
  { key: "eski", label: "Eski Sevgili & Geçmiş", emoji: "💔" },
  { key: "karar", label: "Karar Verme", emoji: "⚖️" },
  { key: "finans", label: "Finansal Durum", emoji: "💰" },
  { key: "aile", label: "Aile & Çevre", emoji: "👨‍👩" },
  { key: "gelisim", label: "Kişisel Gelişim", emoji: "🌱" },
];

export type TarotCard = {
  name: string;
  meaning: string;
  symbol: string;
  fallback: Record<string, string>;
};

const F = (
  ask: string, is: string, saglik: string, eski: string,
  karar: string, finans: string, aile: string, gelisim: string,
) => ({ ask, is, saglik, eski, karar, finans, aile, gelisim });

export const TAROT_DECK: TarotCard[] = [
  {
    name: "Deli",
    symbol: "✶",
    meaning: "Yeni bir başlangıç, cesaret ve bilinmeyene atılan adım. Saflık ve özgürlük.",
    fallback: F(
      "Kalbini yeni bir hisse açma vakti; geçmişin defterleri seni tutmasın.",
      "Alışılmadık bir teklif kapıda. Risk al, ilk adımı sen at.",
      "Bedenin yenilenmek istiyor. Küçük bir alışkanlığı bugün başlat.",
      "O sayfayı kapat. Bilinmeyen, tanıdık acıdan daha hafif.",
      "Mantığını dinle ama sezgine güven; ikisi aynı yeri gösteriyor.",
      "Yeni bir kazanç kapısı için tohum atma günü; küçük başla.",
      "Çevrendeki ağır enerjiyi taşımak zorunda değilsin. Yürü.",
      "Kendine yabancı geldiğin yer, aslında büyüme alanın.",
    ),
  },
  {
    name: "Büyücü",
    symbol: "✦",
    meaning: "Niyet, irade ve yaratıcı güç. Elindeki araçlarla istediğini var edebilirsin.",
    fallback: F(
      "Sözcüklerin büyülü bugün. Ne söylersen o gerçekleşmeye başlar.",
      "Yeteneklerin tam olarak ihtiyacın olan şey. Erteleme, başla.",
      "Niyet, bedenin en güçlü ilacı. Bugün net bir şey iste.",
      "Onu geri getirmek değil, kendini geri getirmek senin işin.",
      "Cevap sende. Dışarıda arama, içeride zaten biliyorsun.",
      "Küçük bir hareket büyük bir kapı açar. Bekleme.",
      "Ailene sınır koymak da bir tür şefkattir.",
      "Yaratıcılığın bastırılmış. Bugün bir şey üret — küçük olsun.",
    ),
  },
  {
    name: "Yıldız",
    symbol: "★",
    meaning: "Umut, sezgi, şifa. Karanlık geçti, ışık yavaşça akmaya başlıyor.",
    fallback: F(
      "Sevgi sandığından daha yakın. Kalbini biraz daha araladığın an gelir.",
      "Umudunu kaybetme; emeklerin sessizce yer buluyor.",
      "İçinde bir şifa süreci başlıyor. Yavaş ol, izin ver.",
      "O bölüm kapandı ama içindeki sevgi kaybolmadı; başka birine akacak.",
      "Berraklık geliyor. Acele etme, doğru cevap kendiliğinden belirir.",
      "Maddi kaygıların yumuşayacak. Sabırla.",
      "Yumuşak insanlar etrafına toplanıyor. Onları gör.",
      "İçindeki çocuk bugün biraz daha güveniyor sana.",
    ),
  },
  {
    name: "Ay",
    symbol: "☾",
    meaning: "Sezgi, yanılsamalar ve bilinçaltı. Görünenin ardına bakma zamanı.",
    fallback: F(
      "Söylenmeyenler söylenenden daha fazla. Sezgine güven.",
      "Her şey göründüğü gibi değil; sözleşmenin küçük yazılarını oku.",
      "Belirsiz huzursuzluğun bir mesajı var; uyku ve rüyalarına bak.",
      "Onu hatırlaman aşk değil, çözülmemiş bir duygu olabilir.",
      "Şu an karar verme. Birkaç gün bekle, sis dağılacak.",
      "Net olmayan bir teklife evet deme.",
      "Birinin maskesini düşürmek üzeresin; sakin kal.",
      "İçindeki gölgeyi yargılama, dinle. O sana yön gösteriyor.",
    ),
  },
  {
    name: "Güneş",
    symbol: "☀",
    meaning: "Sevinç, başarı, açıklık. Hayat bugün sana gülümsüyor.",
    fallback: F(
      "Aşkta açık, sıcak ve oyuncu ol. Karşılık alacaksın.",
      "Görünürlüğünün arttığı bir gün. Sahnede olmaktan korkma.",
      "Bedenin ışığa ihtiyaç duyuyor. Güneşi içine al.",
      "Geçmişin gölgesini taşımayı bırak; bugün senin günün.",
      "Karar nettir. İçindeki sesi takip et.",
      "Beklemediğin bir bereket kapıda. Almaya açık ol.",
      "Sevdiklerinle paylaşılan kahkaha bugün şifa.",
      "Olduğun haliyle yetiyorsun. Kendine bunu hatırlat.",
    ),
  },
  {
    name: "İmparatoriçe",
    symbol: "♀",
    meaning: "Bolluk, yaratıcılık, şefkat. Beslenmek ve beslemek için doğru zaman.",
    fallback: F(
      "Sevgi göstermekten korkma; verdiğin geri dönüyor.",
      "Bir projen büyümeye hazır. Onu sevgiyle besle.",
      "Bedenine nazik ol; zorlama, akmasına izin ver.",
      "Geçmişe değil, içindeki yumuşaklığa dön.",
      "Karar verirken kalbini sustuma. O da bilir.",
      "Bolluk için açık ol; kendini eksik hissetme.",
      "Çevrendekilere sıcaklık ver, ama kendini de unutma.",
      "Yaratıcı bir şey üret; bedenin bunu istiyor.",
    ),
  },
  {
    name: "Aşıklar",
    symbol: "♡",
    meaning: "Sevgi, seçim ve uyum. Bir bağ ya bir seçim seni bekliyor.",
    fallback: F(
      "Bir karar arifesindesin; kalbin zaten yanıtını biliyor.",
      "İki yol arasında kalmışsın; sana benzeyeni seç.",
      "Sevdiğin şeyi yaparken iyileşiyorsun. Buna izin ver.",
      "O bağ neden bittiyse o sebep hâlâ geçerli.",
      "Doğru seçim genelde 'zor olan ama hafifleten'dir.",
      "Ortaklık veya birleşme finansal olarak iyi gelebilir.",
      "Aile içinde bir denge kurman gerekiyor.",
      "Kendini sevmek bir seçimdir; bugün onu seç.",
    ),
  },
  {
    name: "Adalet",
    symbol: "⚖",
    meaning: "Denge, doğruluk ve karma. Verdiğin geri geliyor — iyi ya da öyle.",
    fallback: F(
      "Adil olmayan bir dinamik düzelmek üzere.",
      "Hak ettiğin şey sana geliyor; sabırlı ol.",
      "Bedenin bir denge istiyor; aşırılıkları gözden geçir.",
      "O hikâyede her şey kapandı; senin tarafın temiz.",
      "Mantıkla kalbi aynı kefeye koy; dengelisin.",
      "Resmi bir konu lehine sonuçlanabilir.",
      "Söylenmemiş bir sözün hesabını ver, içine ferahlar.",
      "Kendine adil davranıyor musun? Cevap orada.",
    ),
  },
  {
    name: "Kule",
    symbol: "▲",
    meaning: "Ani değişim, yıkım ve yeniden doğuş. Sahte olan çöker, gerçek ayakta kalır.",
    fallback: F(
      "Sahte bir bağ çözülecek; korkma, yerine gerçek gelir.",
      "Plan değişebilir; bu sürpriz aslında lehine.",
      "Birikmiş gerginlik boşalmaya hazır. Ağla, sars, bırak.",
      "İllüzyon çöküyor; gerçek olan sensin, o değil.",
      "Eski karar çürük; yenisini cesaretle al.",
      "Beklenmedik bir gider olabilir; panik yapma, telafi gelir.",
      "Eski bir rolden çıkıyorsun; bu sancılı ama gerekli.",
      "Yıkılan şey aslında seni daha az tutuyordu.",
    ),
  },
  {
    name: "Dünya",
    symbol: "○",
    meaning: "Tamamlanma, bütünlük, başarı. Bir döngü kapanıyor.",
    fallback: F(
      "Bir aşk döngüsü tamamlanıyor; ya derinleşecek ya kapanacak.",
      "Bitmek üzere olan iş emeğinin karşılığını veriyor.",
      "Bedenin uzun zamandır beklediği dengeye yaklaşıyor.",
      "O hikâyeyle barış; ders alındı, sayfa kapandı.",
      "Karar olgun; içinin sesi net.",
      "Bir kapı kapanırken başka bir kapı açılıyor.",
      "Bir sürecin sonundasın; kendini takdir et.",
      "Uzun zamandır olmak istediğin kişiye yaklaşıyorsun.",
    ),
  },
  {
    name: "Erminişe",
    symbol: "✧",
    meaning: "İç ses, yalnızlık ve bilgelik. Cevap dışarıda değil, sessizlikte.",
    fallback: F(
      "Geri çekil ve kalbini dinle; aşk acele etmez.",
      "Bir adım geri at; strateji açıklığa kavuşacak.",
      "Beden ve zihnin bugün dinlenmek istiyor.",
      "Yalnız kalmak kayıp değil, hatırlamaktır.",
      "Karar için sessizliğe ihtiyacın var; sosyal ortamdan biraz uzak dur.",
      "Aceleci bir alışveriş yapma; düşün.",
      "Çevrenin sesi sana ait değil; kendine dön.",
      "Sessizlikte büyüyorsun; bunu küçümseme.",
    ),
  },
  {
    name: "Çark",
    symbol: "❂",
    meaning: "Kader, döngü ve dönüşüm. Hayat tekerleği lehine dönmeye başlıyor.",
    fallback: F(
      "Beklenmedik bir karşılaşma kalbini hareketlendirecek.",
      "Şans seninle; cesur olduğun yerden kapı açılıyor.",
      "Enerjin döngüsel değişiyor; bedenine güven.",
      "Tekrarlanan örüntü kırılmaya başlıyor.",
      "Karar zamanı henüz değil; akışa bırak.",
      "Beklenmedik bir gelir kapısı açılabilir.",
      "Eski bir bağ yeniden gündeme gelebilir.",
      "Hayat seni doğru yere sürüklüyor; direnme.",
    ),
  },
];

export function pickCard(seed?: number): TarotCard {
  const idx = (seed ?? Math.floor(Math.random() * 1e9)) % TAROT_DECK.length;
  return TAROT_DECK[idx];
}

export type TarotLimit = { allowed: boolean; remaining: number; cap: number; periodLabel: string };

export function tarotLimitFor(tier: string, usedInWindow: number): TarotLimit {
  if (tier === "premium") {
    const cap = 2;
    return { allowed: usedInWindow < cap, remaining: Math.max(0, cap - usedInWindow), cap, periodLabel: "bugün" };
  }
  if (tier === "plus" || tier === "aura+") {
    const cap = 2;
    return { allowed: usedInWindow < cap, remaining: Math.max(0, cap - usedInWindow), cap, periodLabel: "bu hafta" };
  }
  return { allowed: false, remaining: 0, cap: 0, periodLabel: "" };
}
