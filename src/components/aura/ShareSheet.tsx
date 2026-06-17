import type { ReactNode } from "react";

export function ShareSheet({
  open, onClose, onInstagram, onWhatsApp, onMore, onCopyLink, busy,
}: {
  open: boolean;
  onClose: () => void;
  onInstagram: () => void;
  onWhatsApp: () => void;
  onMore: () => void;
  onCopyLink?: () => void;
  busy?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-aura-fade-in" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-md rounded-t-3xl border-t border-[color:var(--border)] bg-[#0a0714] p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Paylaşım seçenekleri"
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/15" />
        <p className="mb-4 text-center text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">Paylaş</p>
        <div className="grid grid-cols-3 gap-3">
          <ShareBtn label="Instagram" onClick={onInstagram} disabled={busy} icon={
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
            </svg>
          } />
          <ShareBtn label="WhatsApp" onClick={onWhatsApp} disabled={busy} icon={
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-3.5-7.1L21 4l-1 3.4A8.97 8.97 0 0121 12z" />
              <path d="M8.5 9.5c0 4 3 7 7 7l1.5-1.5-2.2-1.1-1 1c-1.4-.5-2.7-1.7-3.2-3.1l1-1L10.5 8 9 9.5z" />
            </svg>
          } />
          <ShareBtn label="Diğer" onClick={onMore} disabled={busy} icon={
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          } />
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-full border border-[color:var(--border)] py-3 text-[11px] tracking-[0.3em] uppercase text-[color:var(--aura-muted)]">
          Vazgeç
        </button>
      </div>
    </div>
  );
}

function ShareBtn({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white/[0.03] px-3 py-4 text-[color:var(--aura-soft)] transition hover:text-white disabled:opacity-50"
    >
      <span className="text-[color:var(--aura-lavender)]">{icon}</span>
      <span className="text-[10px] tracking-[0.2em] uppercase">{label}</span>
    </button>
  );
}
