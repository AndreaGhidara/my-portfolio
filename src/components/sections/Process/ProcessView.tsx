import { Reveal } from "@/animations/components/Reveal";
import { processDeliveries } from "@/content/process";
import { ProcessBlock } from "./ProcessBlock";

/** La forma (sagoma, campione, lato) sta nel contenuto: qui solo le parole. */
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
    <section id="process" aria-labelledby="process-title" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <div className="mx-auto max-w-[64rem]">
        <Reveal data-process-header motion="behind" stagger={0.08}>
        <p className="eyebrow">{eyebrow}</p>
        {/* Sotto i 1024px le regole in sections/process.css la centrano. */}
        <h2 id="process-title" className="section-title max-w-[30rem]">{title}</h2>
        <p className="mt-5 max-w-[30rem] leading-relaxed text-[var(--fg-muted)]">{intro}</p>
        </Reveal>

        {/* Le voci si accoppiano al contenuto per posizione. */}
        <Reveal as="ol" data-process-list motion="sides">
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
