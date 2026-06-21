// Centralized app URL for all auth redirects.
// Always points to the production AURA domain — no client-side overrides,
// no window.location.origin fallback, no lovable.dev defaults.
export const APP_URL: string =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://aura-daily-whispers.lovable.app";

export const RESET_PASSWORD_URL = `${APP_URL}/reset-password`;
