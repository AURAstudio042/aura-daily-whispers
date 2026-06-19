// Read-only debug/observer layer.
// Does NOT modify any cache, API, randomization, or state logic.
// Purely logs what the user is seeing for analysis purposes.

type QuoteEntry = {
  key: string;
  text: string;
  shownAt: string; // ISO
  day: string; // YYYY-MM-DD
};

const recentQuotes: QuoteEntry[] = []; // in-memory only, not persisted
const MAX_RECENT = 10;

function todayStamp(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function truncate(s: string, n = 80): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function logWeather(params: {
  location: string | undefined;
  requestedAt: string;
  respondedAt: string;
  cacheHit: boolean;
  raw: unknown;
}) {
  try {
    // eslint-disable-next-line no-console
    console.log(
      `%c[AURA·weather]%c ${params.cacheHit ? "CACHE HIT" : "FETCH"} loc=${params.location ?? "?"}`,
      "color:#b794d4;font-weight:bold",
      "color:inherit",
      {
        requestedAt: params.requestedAt,
        respondedAt: params.respondedAt,
        location: params.location,
        raw: params.raw,
      },
    );
  } catch {}
}

export function logDailyQuote(params: {
  key: string;
  text: string;
  source: "cache" | "fresh";
}) {
  try {
    const now = new Date();
    const today = todayStamp(now);
    const text = (params.text || "").trim();
    if (!text) return;

    // Duplicate-today warning
    const dupToday = recentQuotes.find(
      (q) => q.day === today && (q.key === params.key || q.text === text),
    );
    if (dupToday) {
      // eslint-disable-next-line no-console
      console.warn(
        "%c[AURA·quote] duplicate today",
        "color:#f59e0b;font-weight:bold",
        { key: params.key, text: truncate(text) },
      );
    }

    // 7-day repeat warning
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const repeat7d = recentQuotes.find(
      (q) =>
        new Date(q.shownAt) >= cutoff &&
        q.day !== today &&
        (q.key === params.key || q.text === text),
    );
    if (repeat7d) {
      // eslint-disable-next-line no-console
      console.warn(
        "%c[AURA·quote] repeat within 7 days",
        "color:#f59e0b;font-weight:bold",
        {
          key: params.key,
          text: truncate(text),
          previouslyShownAt: repeat7d.shownAt,
        },
      );
    }

    // Push to in-memory recents (dedupe exact same key on same day)
    if (!dupToday) {
      recentQuotes.unshift({ key: params.key, text, shownAt: now.toISOString(), day: today });
      if (recentQuotes.length > MAX_RECENT) recentQuotes.length = MAX_RECENT;
    }

    // eslint-disable-next-line no-console
    console.log(
      `%c[AURA·quote]%c ${params.source.toUpperCase()} key=${params.key}`,
      "color:#b794d4;font-weight:bold",
      "color:inherit",
      {
        text: truncate(text, 120),
        recent: recentQuotes.map((q) => ({
          key: q.key,
          day: q.day,
          text: truncate(q.text, 60),
        })),
      },
    );
  } catch {}
}
