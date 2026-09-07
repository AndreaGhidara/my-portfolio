import type { ProcessDelivery } from "@/content/process";
import { DeskShapeArt } from "../Services/DeskObject";
import { ProcessSpecimen } from "./ProcessSpecimen";
import type { ProcessDeliveryView } from "./ProcessView";

/**
 * Una consegna. Da una parte il testo, dall'altra il disegno, e i lati si
 * alternano scendendo, che qui non e' la regola della freccia di «E in
 * pratica?» (li' il tracciato non deve passare sopra un paragrafo) ma una cosa
 * piu' semplice: quattro voci dallo stesso lato sono una colonna di testo con
 * mezza pagina bianca accanto.
 *
 * Il testo e' in quattro tempi, ed e' l'ordine che regge la voce della sezione:
 * quando arriva, cosa contiene, cosa NON e', e perche' quella cosa li'
 * conviene. Il terzo tempo e' quello che tiene la sezione lontana dal
 * depliant («non e' un preventivo», «non e' la grafica finita») ed e' il
 * motivo per cui una prova conta che ci sia in tutte e quattro.
 *
 * Il disegno e' la sagoma del tavolo col suo campione. Livello 3: le consegne
 * sono figlie del titolo della sezione, non di un altro titolo.
 */
export function ProcessBlock({
  delivery,
  piece,
  index,
}: {
  delivery: ProcessDeliveryView;
  piece: ProcessDelivery;
  index: number;
}) {
  return (
    <li data-process-item data-lato={piece.lato}>
      <div data-process-text>
        <p className="eyebrow">
          {String(index + 1).padStart(2, "0")} · {delivery.quando}
        </p>
        <h3>{delivery.titolo}</h3>
        <p data-process-lead>{delivery.lead}</p>

        <ul data-process-dentro>
          {delivery.dentro.map((voce) => (
            <li key={voce}>{voce}</li>
          ))}
        </ul>

        <p data-process-non>{delivery.nonlo}</p>
        <p data-process-perche>{delivery.perche}</p>
      </div>

      {/* Decorazione, per intero: quello che il disegno dice lo dicono gia' il
          titolo e il testo accanto. `data-desk-piece` («un pezzo disegnato»)
          e non `data-desk-object`, che conta i ventiquattro oggetti sul tavolo:
          una consegna sul tavolo non ci sta. E' da quel gancio che pendono la
          tavola dei materiali e la scatola del campione. */}
      <div data-process-art aria-hidden="true">
        <span data-desk-piece data-shape={piece.shape}>
          <DeskShapeArt drawing={piece.shape} />
          <ProcessSpecimen sample={piece.campione} />
        </span>
      </div>
    </li>
  );
}
