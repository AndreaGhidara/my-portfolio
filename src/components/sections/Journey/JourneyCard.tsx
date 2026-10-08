import type { CSSProperties } from "react";
import type { Pose } from "./track";
import type { JourneyEntryView } from "./JourneyView";

/**
 * Una tappa: un tesserino appuntato sopra il foglio della lezione.
 *
 * I due pezzi non sono uno dentro l'altro. Il cartellino sborda dal bordo alto
 * del foglio, e per farlo deve stare fuori dal suo flusso: il foglio si porta
 * dietro il respiro che gli serve (padding in cima), il cartellino ci si
 * appoggia sopra in assoluto. Il contenitore su cui si posiziona è il <li>, che
 * è largo quanto il foglio: appeso a qualcosa di più largo finirebbe a mezza
 * colonna di distanza dalla cosa a cui dovrebbe essere appuntato.
 *
 * `data-tesserino="no"` sta sul <li> e non sul cartellino perché da lì scende
 * sia il tratteggio del cartellino sia tutto quello che un domani volesse
 * distinguere quella tappa: un posto che non ti dà un tesserino è un fatto
 * della tappa, non del disegno.
 *
 * La posa arriva in linea da POSE, per posizione nella fila: con nth-child
 * l'onda, che e' il primo <li>, sposterebbe tutti i conti di uno. Lo
 * scostamento sta anche in `data-scostamento`, perche' l'onda deve passare
 * dove il foglio e' spostato e offsetTop un translate non lo vede.
 */
export function JourneyCard({
  entry,
  present,
  noBadge: senzaTesserino,
  lessonLabel: etichettaLezione,
  pose: posa,
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
      data-offset={posa.offset}
      style={{ "--r": `${posa.rotation}deg`, "--dy": `${posa.offset}rem` } as CSSProperties}
    >
      <div data-journey-badge>
        <span data-journey-clip aria-hidden="true" />
        <div data-journey-badge-body>
          <p className="eyebrow">
            <time dateTime={String(entry.year)}>{entry.year}</time>
            {entry.present ? ` ${present}` : null}
          </p>
          <h3>{entry.role}</h3>
          <p data-journey-company>{entry.badge ? entry.company : senzaTesserino}</p>
        </div>
      </div>

      <div data-journey-sheet>
        <p data-journey-label>{etichettaLezione}</p>
        <p data-journey-lesson>{entry.lesson}</p>
        <p data-journey-body>{entry.body}</p>
      </div>
    </li>
  );
}
