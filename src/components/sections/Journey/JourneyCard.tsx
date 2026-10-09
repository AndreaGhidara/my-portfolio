import type { CSSProperties } from "react";
import type { Pose } from "./track";
import type { JourneyEntryView } from "./JourneyView";

/** Il cartellino sborda dal bordo alto del foglio, quindi sta fuori dal suo
 *  flusso e si posiziona sul <li>, largo quanto il foglio. La posa arriva in
 *  linea e non da nth-child, che conterebbe anche l'onda; `data-offset` c'e'
 *  perche' l'onda deve passare dove il foglio e' spostato, e offsetTop non vede i translate. */
export function JourneyCard({
  entry,
  present,
  noBadge,
  lessonLabel,
  pose,
}: {
  entry: JourneyEntryView;
  pose: Pose;
  present: string;
  noBadge: string;
  lessonLabel: string;
}) {
  return (
    <li
      data-journey-item
      data-badge={entry.badge ? undefined : "no"}
      data-year={entry.year}
      data-offset={pose.offset}
      style={{ "--r": `${pose.rotation}deg`, "--dy": `${pose.offset}rem` } as CSSProperties}
    >
      <div data-journey-badge>
        <span data-journey-clip aria-hidden="true" />
        <div data-journey-badge-body>
          <p className="eyebrow">
            <time dateTime={String(entry.year)}>{entry.year}</time>
            {entry.present ? ` ${present}` : null}
          </p>
          <h3>{entry.role}</h3>
          <p data-journey-company>{entry.badge ? entry.company : noBadge}</p>
        </div>
      </div>

      <div data-journey-sheet>
        <p data-journey-label>{lessonLabel}</p>
        <p data-journey-lesson>{entry.lesson}</p>
        <p data-journey-body>{entry.body}</p>
      </div>
    </li>
  );
}
