// AURA local notifications: morning greeting + irregular "Aura Whispers".
// Uses the browser Notification API. Works while the tab/PWA is open or
// returns to focus. No backend / service-worker push.

const ANTI_REPEAT_KEY = "aura:whisper:recent:v1";
const ANTI_REPEAT_MAX = 10;
const SIGN = "— AURA ✦";
const STATE_KEY = "aura:notif:v1";

// Humanized whisper pool. Tone: a calm, wise close friend + gentle spiritual guide.
// Mix of everyday intimacy and deeper "rehberlik" fısıltıları. Signature added in fire().
export const WHISPERS = [
  // — Yakın arkadaş tonu (gündelik)
  "Bugün biraz yavaşlasan da olur. Her şeye yetişmek zorunda değilsin.",
  "İçinden geçenleri bastırma. Sadece fark et, yeter şimdilik.",
  "Aklındaki o konu var ya — bugün çözmek zorunda değilsin.",
  "Kendine bir bardak su koy. Küçük şeyler bazen en çok iyi gelen oluyor.",
  "Herkese cevap vermek zorunda değilsin. Sessizlik de bir cevap.",
  "Bugün iyi hissetmiyorsan, o da geçerli. Kendini zorlama.",
  "Bir an dur ve nefes al. Sadece bu kadar; başka bir şey istemiyorum senden.",
  "Olmayan bir şeye üzülüyor olabilirsin. Olanlara bakmayı dene biraz.",
  "Aklın çok yorgun bugün, farkındayım. Telefonu bir süre bırakmak iyi gelebilir.",
  "Kendini açıklamak zorunda değilsin. Anlayan zaten anlıyor.",
  "Bugün küçük bir iyilik yap kendine. Listeden değil, içinden geleni.",
  "Bazı günler sadece geçer, bir şey öğretmek zorunda değil.",

  // — Rehberlik / spiritüel derinlik
  "İçindeki fırtınanın dinmesini bekleme, dalgalarla dans etmeyi öğren. Evren tam şu an seni izliyor.",
  "Attığın o cesur adımı kimse görmedi sanıyorsun ama yukarısı her şeyin farkında. Devam et.",
  "Şu an hissettiğin o boşluk, aslında içine dolacak yeni güzellikler için açılan yerdir. Direnmeyi bırak.",
  "Zihnin oyunlarına gelme; kalbinin derinliklerindeki o sessiz ses sana doğruyu söylüyor, onu dinle.",
  "Beklediğin o işaret tam olarak bu fısıltı. Kendine güven, her şey olması gerektiği anda gerçekleşiyor.",
  "Kaybettiğini sandığın şey, aslında seni doğru olana yaklaştırmak için gitti.",
  "İçindeki o küçük şüphe var ya — onu bugün kalbinin sesiyle değiştir.",
  "Yolun daralıyor gibi hissediyorsan, bil ki daralan yol seni odaklıyor. Sapma.",
  "Gecenin en karanlık anı, şafağın en yakın olduğu andır. Sana da bir şey söylüyor bu.",
  "Bugün taşıdığın yük senin değil; bir kısmını yere bırakabilirsin.",
  "Sezgin bugün olağandan yüksek. Küçük bir işarete bile dikkat et.",
  "Kimseye kanıtlamak zorunda değilsin. Sadece bilmek yeter.",
  "İçinde büyüyen o his boşuna değil — bir şeye doğru yürüyorsun, farkında ol.",
  "Bugün 'neden ben?' yerine 'neden benim için?' diye sor. Cevap değişecek.",
  "Bıraktığın her ağırlık, sana yeni bir hafiflik olarak dönecek.",
  "Kaderin sana bir kapı kapattıysa, penceresini de gösterir. Etrafına bak.",
  "İçindeki çocuğa bugün nazik ol. O hâlâ orada, seni bekliyor.",
  "Sabrın bir zayıflık değil, olgunluğun sessiz gücüdür.",
  "Bugün küçük gördüğün bir an, aslında büyük bir dönüşümün başlangıcı olabilir.",
];


function readRecentWhispers(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ANTI_REPEAT_KEY);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    return Array.isArray(arr) ? arr.filter((n) => Number.isInteger(n)) : [];
  } catch { return []; }
}

function pushRecentWhisper(idx: number) {
  if (typeof window === "undefined") return;
  try {
    const recent = readRecentWhispers().filter((i) => i !== idx);
    recent.push(idx);
    while (recent.length > ANTI_REPEAT_MAX) recent.shift();
    window.localStorage.setItem(ANTI_REPEAT_KEY, JSON.stringify(recent));
  } catch { /* ignore */ }
}

/**
 * Anti-repeat weighted random whisper selection.
 * - Excludes the last ANTI_REPEAT_MAX whispers shown.
 * - Never returns the immediately previous one (no consecutive repeats).
 * - Falls back gracefully if the pool is small.
 */
export function pickNextWhisper(): string {
  const recent = readRecentWhispers();
  const last = recent[recent.length - 1];
  const blocked = new Set(recent);
  let pool = WHISPERS.map((_, i) => i).filter((i) => !blocked.has(i));
  if (pool.length === 0) {
    // Pool exhausted vs history — drop oldest blocks, but always avoid `last`.
    pool = WHISPERS.map((_, i) => i).filter((i) => i !== last);
    if (pool.length === 0) pool = WHISPERS.map((_, i) => i);
  }
  // Weighted: less-recently-shown items get higher weight.
  const recencyRank = new Map<number, number>();
  recent.forEach((i, pos) => recencyRank.set(i, pos + 1));
  const weights = pool.map((i) => {
    const rank = recencyRank.get(i);
    // Never-shown → highest weight; otherwise older = heavier.
    return rank == null ? ANTI_REPEAT_MAX + 2 : rank;
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  let chosenIdx = pool[0];
  for (let k = 0; k < pool.length; k++) {
    r -= weights[k];
    if (r <= 0) { chosenIdx = pool[k]; break; }
  }
  pushRecentWhisper(chosenIdx);
  return WHISPERS[chosenIdx];
}

type DayState = {
  date: string;            // yyyy-mm-dd
  morningFired?: boolean;
  whisperTimes?: number[]; // epoch ms scheduled for today
  whisperFired?: number[]; // epoch ms already fired
  asked?: boolean;
};

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readState(): DayState {
  if (typeof window === "undefined") return { date: todayKey() };
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const parsed = raw ? (JSON.parse(raw) as DayState) : null;
    if (!parsed || parsed.date !== todayKey()) {
      return { date: todayKey(), asked: parsed?.asked };
    }
    return parsed;
  } catch {
    return { date: todayKey() };
  }
}

function writeState(s: DayState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch {}
}

export function notifPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotifPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  const s = readState();
  s.asked = true;
  writeState(s);
  try {
    const p = await Notification.requestPermission();
    return p;
  } catch {
    return Notification.permission;
  }
}

export function hasAsked(): boolean {
  return !!readState().asked;
}

function fire(title: string, body: string, opts?: { sign?: boolean }) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const withSign = opts?.sign ?? true;
    const text = !withSign || body.trim().endsWith(SIGN) ? body : `${body}\n\n${SIGN}`;
    new Notification(title, {
      body: text,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `aura-${Date.now()}`,
      silent: false,
    });
  } catch {
    // ignore
  }
}

// Plan today's whisper schedule (0/1/2 with weights, random times in 10:00–22:00 window)
function planTodayWhispers(): number[] {
  const r = Math.random();
  // 50% zero, 35% one, 15% two
  const count = r < 0.5 ? 0 : r < 0.85 ? 1 : 2;
  if (count === 0) return [];
  const now = new Date();
  const start = new Date(now); start.setHours(10, 0, 0, 0);
  const end = new Date(now); end.setHours(22, 0, 0, 0);
  const startMs = Math.max(start.getTime(), now.getTime() + 2 * 60 * 1000);
  const endMs = end.getTime();
  if (endMs <= startMs) return [];
  const times: number[] = [];
  for (let i = 0; i < count; i++) {
    times.push(startMs + Math.random() * (endMs - startMs));
  }
  // ensure ≥ 90 min apart
  times.sort((a, b) => a - b);
  if (times.length === 2 && times[1] - times[0] < 90 * 60 * 1000) {
    times[1] = Math.min(endMs, times[0] + 90 * 60 * 1000 + Math.random() * 60 * 60 * 1000);
  }
  return times;
}

function nextMorningMs(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const now = new Date();
  const next = new Date(now);
  next.setHours(isFinite(h) ? h : 7, isFinite(m) ? m : 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

type Schedule = {
  name: string;
  hint: string;
  notificationTime?: string;
};

let timers: number[] = [];
let active = false;

function clearTimers() {
  timers.forEach((id) => window.clearTimeout(id));
  timers = [];
}

function scheduleAt(ms: number, fn: () => void) {
  const delay = Math.max(0, ms - Date.now());
  // setTimeout max ~24.8 days; we always schedule < 24h ahead so safe.
  const id = window.setTimeout(fn, delay);
  timers.push(id);
}

export function startAuraNotifications({ name, hint, notificationTime = "07:00" }: Schedule) {
  if (typeof window === "undefined") return () => {};
  if (active) return stopAuraNotifications;
  active = true;

  const tick = () => {
    if (notifPermission() !== "granted") return;
    const s = readState();

    // Morning
    const morningAt = nextMorningMs(notificationTime);
    const isToday = new Date(morningAt).toDateString() === new Date().toDateString();
    if (isToday && !s.morningFired) {
      scheduleAt(morningAt, () => {
        fire("AURA ✦", `Günaydın, ${name} ✨ ${hint}`);
        const cur = readState();
        cur.morningFired = true;
        writeState(cur);
      });
    } else if (!isToday) {
      // tomorrow's morning — schedule and reset state at boundary
      scheduleAt(morningAt, () => {
        fire("AURA ✦", `Günaydın, ${name} ✨ ${hint}`);
        const cur: DayState = { date: todayKey(new Date(morningAt)), morningFired: true, asked: s.asked };
        writeState(cur);
      });
    }

    // Whispers
    let plan = s.whisperTimes;
    if (!plan) {
      plan = planTodayWhispers();
      const ns = readState();
      ns.whisperTimes = plan;
      ns.whisperFired = [];
      writeState(ns);
    }
    const fired = new Set(s.whisperFired ?? []);
    plan.forEach((t) => {
      if (fired.has(t)) return;
      if (t <= Date.now()) return; // missed while offline — skip silently
      scheduleAt(t, () => {
        const msg = pickNextWhisper();
        fire("AURA'dan bir fısıltı", msg);
        const cur = readState();
        cur.whisperFired = [...(cur.whisperFired ?? []), t];
        writeState(cur);
      });
    });
  };

  clearTimers();
  tick();

  // Re-plan when the tab regains focus (new day, missed timers after sleep)
  const onVis = () => {
    if (document.visibilityState === "visible") {
      clearTimers();
      tick();
    }
  };
  document.addEventListener("visibilitychange", onVis);

  // Cleanup
  const stop = () => {
    document.removeEventListener("visibilitychange", onVis);
    clearTimers();
    active = false;
  };
  (stopAuraNotifications as any)._stop = stop;
  return stop;
}

export function stopAuraNotifications() {
  const stop = (stopAuraNotifications as any)._stop as undefined | (() => void);
  if (stop) stop();
}
