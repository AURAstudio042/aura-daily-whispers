import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      // Allow user pinch-zoom for accessibility (WCAG 1.4.4)
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "AURA ✦ Günlük Ritüelin" },
      { name: "description", content: "AURA — kişisel günlük yaşam yoldaşın. Burç, stil, taş ve koku önerileriyle her gün taze." },
      { name: "theme-color", content: "#08060f" },
      { name: "apple-mobile-web-app-title", content: "AURA" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "AURA ✦ Günlük Ritüelin" },
      { property: "og:description", content: "Her gün sana özel bir ritüel." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "tr_TR" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ReferralCapture />
      <PageViewTracker />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

function PageViewTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const last = useRef<string>("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin")) return;
    if (last.current === pathname) return;
    last.current = pathname;
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("page_views").insert({ user_id: user.id, route: pathname });
      } catch { /* ignore */ }
    })();
  }, [pathname]);
  return null;
}

const REF_STORAGE_KEY = "aura:pending-ref";

function ReferralCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Persist ?ref= from URL into localStorage (survives auth redirect)
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        window.localStorage.setItem(REF_STORAGE_KEY, ref.trim().toUpperCase());
      }
    } catch {
      // ignore
    }

    // 2) Whenever the user becomes authenticated, try to redeem
    let cancelled = false;
    const tryRedeem = async () => {
      try {
        const pending = window.localStorage.getItem(REF_STORAGE_KEY);
        if (!pending) return;
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { redeemReferral } = await import("@/lib/aura/rewards.functions");
        const res = await redeemReferral({ data: { code: pending } });
        if (cancelled) return;
        // Clear pending whether success, invalid, self, or already
        if (res.ok || (!res.ok && res.reason !== "error")) {
          window.localStorage.removeItem(REF_STORAGE_KEY);
        }
      } catch {
        // network/auth not ready — leave for next attempt
      }
    };

    tryRedeem();

    // also retry on auth state changes
    let unsub: (() => void) | null = null;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") tryRedeem();
      });
      unsub = () => data.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  return null;
}
