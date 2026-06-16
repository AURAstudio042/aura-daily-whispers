import { useEffect, useState } from "react";
import {
  hasAsked,
  notifPermission,
  requestNotifPermission,
  startAuraNotifications,
  stopAuraNotifications,
} from "@/lib/aura/notifications";

export function NotifPermissionBanner({
  name,
  hint,
  notificationTime,
}: {
  name: string;
  hint: string;
  notificationTime?: string;
}) {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const p = notifPermission();
    setPerm(p);
    if (p === "default" && !hasAsked()) setShow(true);
  }, []);

  // Start scheduler whenever permission is granted and inputs ready
  useEffect(() => {
    if (perm !== "granted") return;
    const stop = startAuraNotifications({ name, hint, notificationTime });
    return () => {
      stop?.();
      stopAuraNotifications();
    };
  }, [perm, name, hint, notificationTime]);

  if (perm === "unsupported" || perm === "granted" || perm === "denied") return null;
  if (dismissed || !show) return null;

  return (
    <div className="aura-card mb-5 p-4 animate-aura-fade-in">
      <p className="text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Aura Whispers</p>
      <p className="mt-2 text-[14px] text-white">
        Sana sabah selamı ve gün içinde nadir bir fısıltı göndermemize izin verir misin?
      </p>
      <p className="mt-1 text-[12px] italic text-[color:var(--aura-soft)]">
        Reklam değil — sadece günlük küçük bir hatırlatma.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={async () => {
            const p = await requestNotifPermission();
            setPerm(p);
            setShow(false);
          }}
          className="aura-btn aura-btn-hover px-4 py-2 text-[12px]"
        >
          İzin Ver
        </button>
        <button
          onClick={() => {
            setDismissed(true);
            setShow(false);
          }}
          className="rounded-full border border-[color:var(--border)] px-4 py-2 text-[12px] text-[color:var(--aura-soft)]"
        >
          Şimdi Değil
        </button>
      </div>
    </div>
  );
}
