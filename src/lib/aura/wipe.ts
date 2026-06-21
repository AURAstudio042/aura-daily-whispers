// Local AURA data wipe — clears every aura:* key that holds behavioral history
// (whispers, weekly goals, mood log, quote history, favorites, user cache).
// Used on account deletion before sign-out.

const AURA_LOCAL_KEYS = [
  "aura:user:v1",
  "aura:favs:v1",
  "aura:weekly-state:v1",
  "aura:mood-log:v1",
  "aura:visit-log:v1",
  "aura:quote-history:v1",
  "aura:notif-time",
  "aura:session-seed:v1",
];

export function wipeLocalAuraData() {
  if (typeof window === "undefined") return;
  try {
    // Known keys
    for (const k of AURA_LOCAL_KEYS) window.localStorage.removeItem(k);
    // Any remaining aura:* key (covers future additions).
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("aura:")) window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.error("[account] wipeLocalAuraData:", e);
  }
}
