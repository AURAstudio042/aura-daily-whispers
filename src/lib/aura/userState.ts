// Lightweight client-side behavioral state for AURA.
// Tracks mood log + visit log in localStorage; used to add a dynamic shift
// on top of static palettes / content. SSR-safe (returns neutral defaults).

import type { Mood } from "./data";

const MOOD_LOG_KEY = "aura:mood-log:v1";
const VISIT_LOG_KEY = "aura:visit-log:v1";
const MAX_ENTRIES = 60;

type MoodEntry = { d: string; mood: Mood }; // d = yyyy-mm-dd
type VisitEntry = { t: number };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function logMood(mood: Mood | undefined) {
  if (!mood || typeof window === "undefined") return;
  const log = readJson<MoodEntry[]>(MOOD_LOG_KEY, []);
  const d = today();
  // De-dupe per day: replace today's entry.
  const filtered = log.filter((e) => e.d !== d);
  filtered.push({ d, mood });
  writeJson(MOOD_LOG_KEY, filtered.slice(-MAX_ENTRIES));
}

export function logVisit() {
  if (typeof window === "undefined") return;
  const log = readJson<VisitEntry[]>(VISIT_LOG_KEY, []);
  log.push({ t: Date.now() });
  writeJson(VISIT_LOG_KEY, log.slice(-MAX_ENTRIES));
}

export function getMoodHistory(days = 7): MoodEntry[] {
  const log = readJson<MoodEntry[]>(MOOD_LOG_KEY, []);
  const cutoff = Date.now() - days * 86400000;
  return log.filter((e) => new Date(e.d).getTime() >= cutoff);
}

// Maps a mood to an abstract "energy" axis (0 calm → 1 high).
const MOOD_ENERGY: Record<Mood, number> = {
  Stresli: 0.35,
  Yorgun: 0.15,
  Odaklı: 0.55,
  Romantik: 0.6,
  Mutlu: 0.75,
  Enerjik: 0.95,
};

export type DynamicState = {
  energy: number;            // 0..1 avg over last 7 days
  frequency: number;         // 0..1 visit frequency over last 7 days
  dominantMood?: Mood;
  tendency: "calm" | "balanced" | "high";
  sampleSize: number;
};

export function computeDynamicState(currentMood?: Mood): DynamicState {
  const moods = getMoodHistory(7);
  const counts = new Map<Mood, number>();
  let energySum = 0;
  for (const e of moods) {
    counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
    energySum += MOOD_ENERGY[e.mood] ?? 0.5;
  }
  // Fold in current mood (counts as one sample) for sensitivity.
  if (currentMood) {
    counts.set(currentMood, (counts.get(currentMood) ?? 0) + 1);
    energySum += MOOD_ENERGY[currentMood] ?? 0.5;
  }
  const sampleSize = moods.length + (currentMood ? 1 : 0);
  const energy = sampleSize ? energySum / sampleSize : 0.5;

  let dominantMood: Mood | undefined;
  let max = 0;
  for (const [m, c] of counts) {
    if (c > max) { max = c; dominantMood = m; }
  }

  const visits = readJson<VisitEntry[]>(VISIT_LOG_KEY, []);
  const cutoff = Date.now() - 7 * 86400000;
  const recent = visits.filter((v) => v.t >= cutoff).length;
  // 7+ visits/week → saturated.
  const frequency = Math.min(1, recent / 7);

  const tendency: DynamicState["tendency"] =
    energy < 0.4 ? "calm" : energy > 0.7 ? "high" : "balanced";

  return { energy, frequency, dominantMood, tendency, sampleSize };
}
