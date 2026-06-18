import { createFileRoute } from "@tanstack/react-router";
import { AuraShell } from "@/components/aura/Shell";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { Onboarding } from "@/components/aura/Onboarding";
import { useUser } from "@/lib/aura/store";
import { MonthlyAnalysisSection } from "@/components/aura/MonthlyAnalysis";

export const Route = createFileRoute("/aylik")({
  head: () => ({
    meta: [
      { title: "Aylık Analiz ✦ AURA" },
      { name: "description", content: "AI ile bu ayın derin analizi: gezegen geçişleri, güçlü günler, ritüeller." },
    ],
  }),
  component: AylikPage,
});

function AylikPage() {
  const [u, , ready, authed] = useUser();
  if (!ready) return <div className="min-h-screen" />;
  if (!authed) return <AuthScreen />;
  if (!u) return <Onboarding />;
  return (
    <AuraShell>
      <header className="mb-2 animate-aura-fade-in">
        <p className="section-label">A · Y · L · I · K</p>
        <h1 className="serif mt-2 text-[40px] leading-[1.05] font-light text-white">
          Aylık Analizin <span className="text-[color:var(--aura-lavender)]">✦</span>
        </h1>
        <p className="mt-2 text-[13px] italic text-[color:var(--aura-soft)]">
          Bu ay tarot çekimlerin, ruh hâlin, taşların ve kokuların ışığında derin bir analiz.
        </p>
      </header>
      <MonthlyAnalysisSection user={u} />
    </AuraShell>
  );
}
