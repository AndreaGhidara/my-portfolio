import type { CSSProperties } from "react";
import { Reveal } from "@/animations/components/Reveal";
import { ARRIVAL_POSE, poseAt } from "./track";
import { JourneyTrack } from "./JourneyTrack";
import { JourneyCard } from "./JourneyCard";

export type JourneyEntryView = {
  id: string;
  company: string;
  role: string;
  body: string;
  /** Senza, restano voci di curriculum e il titolo promette un'altra cosa. */
  lesson: string;
  year: number;
  badge: boolean;
  present?: boolean;
};

export type JourneyStat = { id: string; value: string; label: string };

export type JourneyViewProps = {
  eyebrow: string;
  title: string;
  present: string;
  noBadge: string;
  lessonLabel: string;
  note: string;
  /** Sotto la fila, finche' non si scorre. */
  hint: string;
  /** Dalla prima tappa a oggi. */
  entries: JourneyEntryView[];
  stats: JourneyStat[];
};

export function JourneyView({
  eyebrow,
  title,
  present,
  noBadge,
  lessonLabel,
  note,
  hint,
  entries,
  stats,
}: JourneyViewProps) {
  return (
    // clip e non hidden: hidden fa un contenitore di scorrimento e lo sticky non
    // aggancia. Sui due assi, a differenza di #services e #process (vedi
    // sections/works.css): in y il foglio dei numeri che cade deve sparire sul
    // bordo della sezione.
    <section id="journey" aria-labelledby="titolo-journey" className="relative overflow-clip bg-[var(--accent)]">
      <JourneyTrack
        n={entries.length}
        startYear={entries[0]?.year ?? 0}
        hint={hint}
        header={
          // Sull'arancio --on-accent non si ribalta col tema, --fg-muted si'.
          <Reveal motion="dietro" stagger={0.08}>
            <p className="eyebrow !text-[var(--on-accent)]">{eyebrow}</p>
            <h2 id="titolo-journey" className="section-title">{title}</h2>
          </Reveal>
        }
      >
        {entries.map((entry, i) => (
          <JourneyCard
            key={entry.id}
            entry={entry}
            pose={poseAt(i)}
            present={present}
            noBadge={noBadge}
            lessonLabel={lessonLabel}
          />
        ))}

        {/* La <dl> e' piatta, niente conteggio: in un palco agganciato l'innesco
            verticale del contatore scatterebbe all'aggancio e non all'arrivo. */}
        <li
          data-journey-arrival
          style={{ "--r": `${ARRIVAL_POSE.rotation}deg` } as CSSProperties}
        >
          <dl>
            {stats.map((stat) => (
              // L'etichetta una volta sola, in <dt>: il CSS mostra il numero sopra.
              <div key={stat.id}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
          <p data-journey-note>{note}</p>
        </li>
      </JourneyTrack>
    </section>
  );
}
