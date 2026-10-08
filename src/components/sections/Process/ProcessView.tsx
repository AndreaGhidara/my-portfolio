import { Reveal } from "@/animations/components/Reveal";
import { processDeliveries } from "@/content/process";
import { ProcessBlock } from "./ProcessBlock";

/** Il testo di una consegna. La forma (sagoma, campione, lato) sta nel
 *  contenuto e non qui: qui arrivano solo le parole, gia' tradotte. */
export type ProcessDeliveryView = {
  id: string;
  when: string;
  title: string;
  lead: string;
  includes: string[];
  excludes: string;
  why: string;
};

export type ProcessViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  deliveries: ProcessDeliveryView[];
};

export function ProcessView({ eyebrow, title, intro, deliveries }: ProcessViewProps) {
  return (
    <section id="process" aria-labelledby="titolo-process" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <div className="mx-auto max-w-[64rem]">
        <Reveal data-process-testata motion="dietro" stagger={0.08}>
        <p className="eyebrow">{eyebrow}</p>
        {/* L'intestazione si ferma prima di meta' pagina: e' la misura con cui
            la sezione e' stata impaginata, e sotto i 1024px le regole in
            sezioni/processo.css la centrano. */}
        <h2 id="titolo-process" className="titolo-sezione max-w-[30rem]">{title}</h2>
        <p className="mt-5 max-w-[30rem] leading-relaxed text-[var(--fg-muted)]">{intro}</p>
        </Reveal>

        {/* Ordinata, e non e' un dettaglio: «in quest'ordine» e' meta' del
            titolo, e una <ol> e' il modo in cui quell'ordine arriva anche a chi
            la pagina non la vede. Le voci si accoppiano al contenuto per
            posizione. */}
        {/* Ogni consegna entra dal lato in cui e' gia' impaginata: `data-lato`
            alterna destra e sinistra scendendo, e l'entrata non fa che
            rendere visibile quell'alternanza. */}
        <Reveal as="ol" data-process-list motion="lati">
          {deliveries.map((delivery, index) => (
            <ProcessBlock
              key={delivery.id}
              delivery={delivery}
              piece={processDeliveries[index]}
              index={index}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
