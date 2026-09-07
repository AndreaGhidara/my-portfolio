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
 */
export function JourneyCard({
  entry,
  present,
  senzaTesserino,
  etichettaLezione,
}: {
  entry: JourneyEntryView;
  present: string;
  senzaTesserino: string;
  etichettaLezione: string;
}) {
  return (
    <li data-journey-item data-tesserino={entry.tesserino ? undefined : "no"}>
      <div data-journey-badge>
        <span data-journey-clip aria-hidden="true" />
        <div data-journey-badge-body>
          <p className="eyebrow">
            <time dateTime={String(entry.year)}>{entry.year}</time>
            {entry.present ? ` ${present}` : null}
          </p>
          <h3>{entry.role}</h3>
          <p data-journey-company>{entry.tesserino ? entry.company : senzaTesserino}</p>
        </div>
      </div>

      <div data-journey-sheet>
        <p data-journey-label>{etichettaLezione}</p>
        <p data-journey-lesson>{entry.lezione}</p>
        <p data-journey-body>{entry.body}</p>
      </div>
    </li>
  );
}
