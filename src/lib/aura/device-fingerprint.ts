/**
 * Lightweight client-side device fingerprint. NOT a security boundary — it's
 * a soft signal to make referral farming inconvenient on the same browser/
 * device. Real attackers can rotate. Paired with IP hash + email-verification
 * + 24h activation it raises the cost of abuse meaningfully.
 *
 * Stable across sessions (persisted in localStorage). SHA-256 of a small
 * set of low-entropy device traits + a random per-install salt so two users
 * on the same model don't collide.
 */

const KEY = "aura:device:fp:v1";
const SALT_KEY = "aura:device:salt:v1";

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "";
  try {
    const cached = window.localStorage.getItem(KEY);
    if (cached) return cached;

    let salt = window.localStorage.getItem(SALT_KEY);
    if (!salt) {
      salt = randomSalt();
      window.localStorage.setItem(SALT_KEY, salt);
    }

    const traits = [
      navigator.userAgent || "",
      navigator.language || "",
      String(screen.width) + "x" + String(screen.height),
      String(screen.colorDepth || ""),
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      String(navigator.hardwareConcurrency || ""),
      // @ts-ignore — deviceMemory is non-standard but useful when present
      String((navigator as any).deviceMemory || ""),
      salt,
    ].join("|");

    const hash = await sha256Hex(traits);
    window.localStorage.setItem(KEY, hash);
    return hash;
  } catch {
    return "";
  }
}
