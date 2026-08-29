import { Reveal } from "@/animations/components/Reveal";
import { ThreadSegment } from "@/components/thread/ThreadSegment";

export type PactStep = { id: string; title: string; body: string };

export type PactViewProps = {
  eyebrow: string;
  title: string;
  intro: string;
  steps: PactStep[];
};

export function PactView({ eyebrow, title, intro, steps }: PactViewProps) {
  return (
    <section id="pact" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <ThreadSegment section="pact" className="pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-3xl lg:text-5xl">{title}</h2>
        <p className="mt-5 max-w-2xl text-[var(--fg-muted)]">{intro}</p>

        <Reveal as="ol" className="mt-10 grid gap-px bg-[var(--line)] sm:grid-cols-2" stagger={0.09}>
          {steps.map((step, index) => (
            <li key={step.id} className="bg-[var(--bg)] p-5">
              <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 text-lg font-bold text-[var(--fg)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{step.body}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
