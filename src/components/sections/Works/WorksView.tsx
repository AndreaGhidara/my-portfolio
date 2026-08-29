import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { QuoteFrame } from "@/components/brand/QuoteFrame";
import { WorkCase, type WorkCaseData, type WorkCaseLabels } from "./WorkCase";

export type WorksViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  labels: WorkCaseLabels;
  items: WorkCaseData[];
};

export function WorksView({ eyebrow, title, intro, labels, items }: WorksViewProps) {
  return (
    <section id="works" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <ThreadSegment section="works" className="pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-3 text-3xl lg:text-5xl">{title}</h2>
          </div>
          <QuoteFrame variant="close" className="block w-10 shrink-0 lg:w-14 [&_img]:h-auto [&_img]:w-full" />
        </div>

        <p className="mt-5 max-w-2xl text-[var(--fg-muted)]">{intro}</p>

        <div className="mt-10 border-b border-[var(--line)]">
          {items.map((item, index) => (
            <WorkCase key={item.id} data={item} labels={labels} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
