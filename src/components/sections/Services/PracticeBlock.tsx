import type { CSSProperties } from "react";
import type { PracticeScene } from "@/content/practice";
import { DeskShapeArt } from "./DeskObject";
import { DeskSpecimen } from "./DeskSpecimen";
import type { ServiceItem } from "./ServicesView";

/**
 * Una voce. Da una parte il testo, dall'altra una pila di disegni — e i lati si
 * alternano, il che non e' una scelta di gusto: la freccia deve passare SOLO
 * sopra i disegni, mai sopra un paragrafo.
 *
 * I disegni non sono illustrazioni nuove: sono gli oggetti del tavolo, le
 * stesse sagome con gli stessi materiali e gli stessi campioni, solo molto piu'
 * grandi. E' la continuita' che rende la sezione una cosa sola invece di due:
 * prima la camera arretra e li vedi tutti da lontano, poi scendi e quattro di
 * quelli ti tornano addosso ingranditi.
 *
 * Livello 4 e non 3: stanno dentro «E in pratica?», che e' il loro <h3>.
 * Al livello 3 sarebbero fratelli del titolo che li contiene.
 */
export function PracticeBlock({
  item,
  index,
  scene,
}: {
  item: ServiceItem;
  index: number;
  scene: PracticeScene;
}) {
  return (
    <li data-practice-item data-lato={scene.lato}>
      <div data-practice-text>
        <span className="eyebrow">{String(index + 1).padStart(2, "0")}</span>
        <h4>{item.title}</h4>
        <p>{item.description}</p>
      </div>

      {/* Decorazione, per intero: quello che questi disegni dicono lo dicono
          gia' il titolo e il testo qui accanto. Le sagome sono maschere CSS,
          quindi dentro non c'e' niente che uno screen reader possa annunciare. */}
      <div data-practice-art aria-hidden="true">
        {scene.drawings.map((drawing, k) => (
          <span
            key={`${drawing.object}-${k}`}
            data-practice-drawing
            aria-hidden="true"
            style={
              {
                "--w": `${drawing.width}px`,
                "--rot": `${drawing.rotate}deg`,
                "--x": `${drawing.x}%`,
                "--y": `${drawing.y}%`,
                zIndex: drawing.layer,
              } as CSSProperties
            }
          >
            <DeskShapeArt drawing={drawing.shape} />
            <DeskSpecimen sample={drawing.sample} />
          </span>
        ))}
      </div>
    </li>
  );
}
