import type { ProcessDelivery } from "@/content/process";
import { pad2 } from "@/lib/format";
import { DeskShapeArt } from "../Services/DeskObject";
import { ProcessSpecimen } from "./ProcessSpecimen";
import type { ProcessDeliveryView } from "./ProcessView";

/** Una prova conta che il «cosa NON e'» ci sia in tutte e quattro. Livello 3:
 *  le consegne sono figlie del titolo della sezione. */
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
    <li data-process-item data-side={piece.side}>
      <div data-process-text>
        <p className="eyebrow">
          {pad2(index + 1)} · {delivery.when}
        </p>
        <h3>{delivery.title}</h3>
        <p data-process-lead>{delivery.lead}</p>

        <ul data-process-includes>
          {delivery.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p data-process-excludes>{delivery.excludes}</p>
        <p data-process-why>{delivery.why}</p>
      </div>

      {/* `data-desk-piece` e non `data-desk-object`, che conta i ventiquattro
          oggetti sul tavolo: da questo gancio pendono la tavola dei materiali e la
          scatola del campione. */}
      <div data-process-art aria-hidden="true">
        <span data-desk-piece data-shape={piece.shape}>
          <DeskShapeArt drawing={piece.shape} />
          <ProcessSpecimen sample={piece.sample} />
        </span>
      </div>
    </li>
  );
}
