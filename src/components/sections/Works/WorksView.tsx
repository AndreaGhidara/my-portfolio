import { Reveal } from "@/animations/components/Reveal";
import { QuoteFrame } from "@/components/brand/QuoteFrame";
import { WorksShelf } from "./WorksShelf";
import type { WorkCaseData, WorkCaseLabels } from "./types";

export type WorksViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  labels: WorkCaseLabels;
  items: WorkCaseData[];
};

export function WorksView({ eyebrow, title, intro, labels, items }: WorksViewProps) {
  return (
    <section id="works" aria-labelledby="titolo-works" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <Reveal className="mx-auto max-w-4xl" moto="dietro" stagger={0.08}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="titolo-works" className="titolo-sezione">{title}</h2>
          </div>
          <QuoteFrame variant="close" className="block w-10 shrink-0 lg:w-14" />
        </div>

        <p className="mt-5 max-w-2xl text-[var(--fg-muted)]">{intro}</p>
      </Reveal>

      {/* L'archivio esce dalla colonna del testo: ogni cartella e' larga quanto
          la pagina, tolto il gutter. */}
      <WorksShelf lavori={items} labels={labels} />
    </section>
  );
}
