import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

function TabIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const TABS = [
  { to: "/", label: "Bugün", d: "M12 3l2.39 4.84L19.8 8.6l-3.9 3.8.92 5.36L12 15.27l-4.82 2.53.92-5.36L4.2 8.6l5.41-.76L12 3z" },
  { to: "/haftalik", label: "Haftalık", d: "M4 6h16M4 12h16M4 18h10" },
  { to: "/arsiv", label: "Arşiv", d: "M3 7h18v4H3zM5 11v9h14v-9M10 15h4" },
  { to: "/profil", label: "Profil", d: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6" },
] as const;

export function AuraShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md pb-24 text-foreground">
      <div className="px-5 pt-6">{children}</div>
      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-[color:var(--border)] bg-[#08060f]/85 backdrop-blur-xl">
        <ul className="grid grid-cols-4">
          {TABS.map((t) => {
            const active = t.to === "/" ? pathname === "/" : pathname.startsWith(t.to);
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className="flex flex-col items-center gap-1 py-3 transition-colors"
                  style={{ color: active ? "var(--aura-lavender)" : "var(--aura-muted)" }}
                >
                  <TabIcon d={t.d} />
                  <span className="text-[10px] tracking-[0.2em] uppercase">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-[10px] tracking-[0.3em] text-[color:var(--aura-muted)]">{n}</span>
      <span className="h-px flex-1 bg-[color:var(--border)]" />
      <span className="text-[10px] tracking-[0.3em] uppercase text-[color:var(--aura-lavender)]">{title}</span>
    </div>
  );
}

export function ShareSignature() {
  return (
    <p className="mt-4 text-center text-[11px] tracking-[0.35em] text-[color:var(--aura-muted)]">— AURA ✨</p>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] tracking-[0.25em] uppercase text-[color:var(--aura-soft)]">
      {children}
    </span>
  );
}
