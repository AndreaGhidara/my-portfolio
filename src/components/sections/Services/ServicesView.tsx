import { Reveal } from "@/animations/components/Reveal";
import { ThreadSegment } from "@/components/thread/ThreadSegment";

export type ServiceItem = { id: string; title: string; description: string };

export type ServicesViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  items: ServiceItem[];
};

/**
 * La risposta alle quattro frasi della sezione precedente, nello stesso
 * ordine: la prima riga qui e' come si risolve la prima frase di la'.
 *
 * Su carta e non sull'arancio: il blocco rumoroso e' il riconoscimento, questo
 * e' il blocco che si legge. Due sezioni gridate di fila si annullano, e questo
 * ha il testo piu' lungo della pagina — sull'arancio andrebbe tutto in
 * inchiostro per il contrasto, e sarebbe un muro.
 */
export function ServicesView({ eyebrow, title, intro, items }: ServicesViewProps) {
  return (
    <section id="services" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <ThreadSegment section="services" className="pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto max-w-5xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-3xl lg:text-5xl">{title}</h2>
        <p data-service-description className="mt-5 max-w-2xl text-[var(--fg-muted)]">
          {intro}
        </p>

        {/* Una colonna sola anche da desktop: sono quattro risposte da leggere
            in fila, non quattro schede da confrontare a colpo d'occhio. La
            griglia a due colonne invitava a saltarle. */}
        <Reveal as="ol" className="mt-10 border-t border-[var(--line)]" stagger={0.09}>
          {items.map((item, index) => (
            <li
              key={item.id}
              className="grid gap-2 border-b border-[var(--line)] py-7 lg:grid-cols-[13rem_1fr] lg:gap-8 lg:py-9"
            >
              <div className="lg:pt-1">
                <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-1 text-lg font-bold leading-tight text-[var(--fg)] lg:text-xl">
                  {item.title}
                </h3>
              </div>
              <p className="max-w-2xl leading-relaxed text-[var(--fg-muted)]">
                {item.description}
              </p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
