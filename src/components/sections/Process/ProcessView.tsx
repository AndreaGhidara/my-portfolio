import { Reveal } from "@/animations/components/Reveal";
import { ThreadSegment } from "@/components/thread/ThreadSegment";

export type ProcessStep = { id: string; title: string; body: string };

export type ProcessViewProps = {
  eyebrow: string;
  title: string;
  steps: ProcessStep[];
};

export function ProcessView({ eyebrow, title, steps }: ProcessViewProps) {
  return (
    <section id="process" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      {/* Qui il filo e' agganciato allo scroll: e' la sezione in cui la
          metafora coincide col contenuto, quindi merita lo scrub.
          Su mobile lo scrub viene ignorato da weave(). */}
      <ThreadSegment section="process" scrub className="pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-3xl lg:text-5xl">{title}</h2>

        <Reveal as="ol" className="mt-10 space-y-8" stagger={0.1}>
          {steps.map((step, index) => (
            <li key={step.id} className="flex gap-5">
              <span
                aria-hidden="true"
                className="mt-2 size-3 shrink-0 rounded-full bg-[var(--accent)]"
              />
              <div>
                <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-1 text-2xl font-bold text-[var(--fg)]">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-[var(--fg-muted)]">{step.body}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
