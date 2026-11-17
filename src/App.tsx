import { useEffect, useState } from "react";
import { AcademicModal } from "./components/academic/AcademicModal.tsx";
import { Footer } from "./components/layout/Footer.tsx";
import { Header, type ViewId } from "./components/layout/Header.tsx";
import { CoveragePage } from "./components/map/CoverageMap.tsx";
import { Account } from "./components/portal/Account.tsx";
import { Hero } from "./components/portal/Hero.tsx";
import { Plans } from "./components/portal/Plans.tsx";
import { Support } from "./components/portal/Support.tsx";
import { TopologyView } from "./components/topology/TopologyView.tsx";
import { NetworkProvider } from "./context/NetworkContext.tsx";

function parseView(hash: string): ViewId {
  const value = hash.replace("#", "");
  if (
    value === "cobertura" ||
    value === "planes" ||
    value === "red" ||
    value === "soporte" ||
    value === "cuenta" ||
    value === "inicio"
  ) {
    return value;
  }
  return "inicio";
}

function Shell() {
  const [view, setView] = useState<ViewId>(() => parseView(window.location.hash));
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const onHash = () => setView(parseView(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  function navigate(next: ViewId) {
    setView(next);
    const hash = `#${next}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header view={view} onNavigate={navigate} />
      {online ? null : (
        <p className="bg-card px-4 py-2 text-center text-sm text-muted">
          Sin señal. Vouchers, teléfonos de la junta y los datos locales siguen en este dispositivo.
        </p>
      )}
      <main>
        {view === "inicio" ? <Hero onNavigate={navigate} /> : null}
        {view === "cobertura" ? <CoveragePage /> : null}
        {view === "planes" ? <Plans /> : null}
        {view === "red" ? <TopologyView /> : null}
        {view === "soporte" ? <Support /> : null}
        {view === "cuenta" ? <Account /> : null}
      </main>
      <Footer />
      <AcademicModal />
    </div>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <Shell />
    </NetworkProvider>
  );
}
