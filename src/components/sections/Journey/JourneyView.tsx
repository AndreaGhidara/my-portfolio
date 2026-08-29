import { Reveal } from "@/animations/components/Reveal";
import { ThreadSegment } from "@/components/thread/ThreadSegment";
import { Counter } from "./Counter";

export type JourneyEntryView = {
  id: string;
  company: string;
  role: string;
  body: string;
  year: number;
};

export type JourneyStat = { id: string; value: string; label: string };

export type JourneyViewProps = {
  eyebrow: string;
  title: string;
  present: string;
  entries: JourneyEntryView[];
  stats: JourneyStat[];
};

export function JourneyView({ eyebrow, title, present, entries, stats }: JourneyViewProps) {
  return (
    <section id="journey" className="relative px-[var(--gutter)] py-[var(--section-y)]">
      <ThreadSegment section="journey" className="pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-3xl lg:text-5xl">{title}</h2>

        <ol className="mt-10 space-y-7 border-l border-[var(--line)] pl-6">
          {entries.map((entry, index) => (
            <li key={entry.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.9rem] top-2 size-2.5 rounded-full bg-[var(--accent)]"
              />
              <p className="eyebrow">
                <time dateTime={String(entry.year)}>{entry.year}</time>
                {index === 0 ? ` — ${present}` : null}
              </p>
              <h3 className="mt-1 text-xl font-bold text-[var(--fg)]">{entry.role}</h3>
              <p className="text-sm font-semibold text-[var(--accent)]">{entry.company}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{entry.body}</p>
            </li>
          ))}
        </ol>

        <Reveal as="dl" className="mt-12 flex flex-wrap gap-10" stagger={0.1}>
          {stats.map((stat) => (
            <Counter key={stat.id} value={stat.value} label={stat.label} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
