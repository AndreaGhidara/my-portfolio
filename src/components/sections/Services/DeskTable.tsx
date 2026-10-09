import type { CSSProperties } from "react";
import type { DeskShape, SampleId } from "@/content/desk";
import {
  CAPTION_BEATS,
  CENTRE,
  OBJECTS_PER_LAYER,
  WORLD,
  objectBeat,
  placeObject,
} from "./layers";
import { DeskObject, DeskShapeArt } from "./DeskObject";

export type DeskLayerData = {
  id: string;
  title: string;
  lead: string;
  objects: { id: string; shape: DeskShape; label: string | null; sample?: SampleId }[];
};

// La lista e' il disegno: niente versione accessibile parallela da allineare.
// Il piano e' un elemento a se' perche' le percentuali degli oggetti si
// contano su di lui: sul blocco intero ogni riga di didascalia sposterebbe il
// tavolo. Sotto i 1024px il CSS lo toglie e resta il gioco (game/Game.tsx).
export function DeskTable({
  layers,
  centre,
  blank,
  note,
}: {
  layers: DeskLayerData[];
  centre: string;
  blank: string;
  note: string;
}) {
  return (
    <div
      data-desk-world
      // Il formato e' uno solo, ma la camera di DeskStage e il CSS cercano questo.
      data-layout="wide"
      style={
        {
          "--world-w": WORLD.width,
          "--world-h": WORLD.height,
        } as CSSProperties
      }
    >
      <div data-desk-surface>

        <div data-desk-centre style={{ width: `${CENTRE.width}%` }}>
          <DeskShapeArt drawing="laptop" />

          {/* DOM e non laptop.svg: una maschera porta un colore solo, e qui
              serve l'arancio. Misurato sul viewBox 360x240 (schermo da 9,9 a
              351,209). Decorazione: il nome del centro e' la didascalia. */}
          <span data-desk-screen aria-hidden="true">
            <span data-desk-screen-bar />
            <span data-desk-screen-head />
            <span data-desk-screen-line />
            <span data-desk-screen-line />
            <span data-desk-screen-line />
            <span data-desk-screen-cta />
          </span>

          <span data-desk-centre-label>{centre}</span>
        </div>
      </div>

      <ol data-desk-layers>
        {layers.map((layer, index) => (
          <li key={layer.id} data-desk-layer={layer.id}>
            {/* Due estremi e non uno: sotto la camera le didascalie stanno
                nello stesso posto e si danno il cambio. */}
            <div
              data-desk-caption
              style={
                {
                  "--from": CAPTION_BEATS[index].from,
                  "--until": CAPTION_BEATS[index].until,
                } as CSSProperties
              }
            >
              <h3>{layer.title}</h3>
              <p>{layer.lead}</p>
            </div>

            <ul>
              {layer.objects.map((object, i) => (
                <DeskObject
                  key={object.id}
                  shape={object.shape}
                  label={object.label}
                  sample={object.sample}
                  placement={placeObject(index, i)}
                  beat={objectBeat(index, i, OBJECTS_PER_LAYER)}
                  // L'etichetta che manca e' il `mute` di content/desk.ts:
                  // l'unico oggetto senza e' il post-it bianco, il comando.
                  href={object.label === null ? "#contact" : undefined}
                  action={object.label === null ? blank : undefined}
                  note={object.label === null ? note : undefined}
                />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
