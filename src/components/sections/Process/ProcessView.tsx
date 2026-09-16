import { Reveal } from "@/animations/components/Reveal";
import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { processDeliveries } from "@/content/process";
import { ProcessBlock } from "./ProcessBlock";

/** Il testo di una consegna. La forma (sagoma, campione, lato) sta nel
 *  contenuto e non qui: qui arrivano solo le parole, gia' tradotte. */
export type ProcessDeliveryView = {
  id: string;
  quando: string;
  titolo: string;
  lead: string;
  dentro: string[];
  nonlo: string;
  perche: string;
};

export type ProcessViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  deliveries: ProcessDeliveryView[];
};

export function ProcessView({ eyebrow, title, intro, deliveries }: ProcessViewProps) {
  return (
    <section id="process" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      {/* Qui il filo e' agganciato allo scroll: e' la sezione in cui la
          metafora coincide col contenuto, quindi merita lo scrub.
          Su mobile lo scrub viene ignorato da weave(). */}
      <ThreadSegment section="process" scrub className="pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto max-w-[64rem]">
        <p className="eyebrow">{eyebrow}</p>
        {/* L'intestazione si ferma prima di meta' pagina, e non e' una scelta
            di misura di lettura: e' che il filo scende nel corridoio fra le
            due colonne, e il corridoio senza un solo pixel di contenuto e'
            largo due punti, dal 50,00% al 52,14%. Un titolo a tutta larghezza
            ci finiva dentro, e una linea che attraversa un titolo si legge
            come una cancellatura. Stretto qui, il filo gli passa accanto. */}
        <h2 className="mt-3 max-w-[30rem] text-3xl lg:text-5xl">{title}</h2>
        <p className="mt-5 max-w-[30rem] leading-relaxed text-[var(--fg-muted)]">{intro}</p>

        {/* Ordinata, e non e' un dettaglio: «in quest'ordine» e' meta' del
            titolo, e una <ol> e' il modo in cui quell'ordine arriva anche a chi
            la pagina non la vede. Le voci si accoppiano al contenuto per
            posizione, come fa Practice con le sue scene. */}
        <Reveal as="ol" data-process-list stagger={0.1}>
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
