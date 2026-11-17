import { Satellite } from "lucide-react";
import { cn } from "../../lib/utils.ts";

export type ViewId = "inicio" | "cobertura" | "planes" | "red" | "soporte" | "cuenta";

const LINKS: Array<{ id: ViewId; label: string }> = [
  { id: "inicio", label: "Inicio" },
  { id: "cobertura", label: "Cobertura" },
  { id: "planes", label: "Planes" },
  { id: "red", label: "Red" },
  { id: "soporte", label: "Soporte" },
];

export function Header({ view, onNavigate }: { view: ViewId; onNavigate: (view: ViewId) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-6">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-semibold tracking-[0.28em]"
          onClick={() => onNavigate("inicio")}
        >
          <Satellite className="size-4 text-emerald" aria-hidden="true" />
          GUAQUIRI
        </button>
        <nav className="flex flex-1 flex-wrap items-center gap-1 md:justify-center">
          {LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              data-testid={`nav-${link.id}`}
              aria-current={view === link.id ? "page" : undefined}
              className={cn(
                "px-3 py-2 text-xs tracking-[0.16em] uppercase",
                view === link.id ? "text-emerald" : "text-muted hover:text-foreground",
              )}
              onClick={() => onNavigate(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            data-testid="nav-cuenta"
            className="border border-white/70 px-3 py-2 text-xs tracking-[0.14em] uppercase hover:border-white"
            onClick={() => onNavigate("cuenta")}
          >
            Acceso
          </button>
          <button
            type="button"
            data-testid="lang-es"
            className="px-2 py-2 text-xs tracking-[0.16em] text-muted"
            title="La interfaz está en español"
          >
            ES
          </button>
        </div>
      </div>
    </header>
  );
}
