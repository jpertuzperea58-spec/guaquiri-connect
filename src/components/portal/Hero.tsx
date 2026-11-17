import type { ViewId } from "../layout/Header.tsx";
import { Button } from "../ui/button.tsx";

export function Hero({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  return (
    <section className="relative min-h-[calc(100vh-4.25rem)]">
      <img
        src={`${import.meta.env.BASE_URL}hero.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-6xl items-center px-6 py-20">
        <div className="max-w-xl">
          <h1
            data-testid="hero-title"
            className="text-4xl leading-[1.05] font-medium tracking-tight text-white sm:text-6xl"
          >
            Internet que conecta nuestra comunidad.
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/80">
            Una red inteligente diseñada para Guaquiri.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button data-testid="cta-cobertura" onClick={() => onNavigate("cobertura")}>
              Consultar cobertura
            </Button>
            <Button data-testid="cta-planes" variant="outline" onClick={() => onNavigate("planes")}>
              Ver planes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
