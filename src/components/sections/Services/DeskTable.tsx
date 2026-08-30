import type { CSSProperties } from "react";
import type { DeskShape } from "@/content/desk";
import {
  CENTRE,
  LAYER_BEATS,
  OBJECTS_PER_LAYER,
  SHAPE_BOX,
  WORLD,
  objectBeat,
  placeObject,
  type DeskLayout,
} from "./layers";
import { DeskObject } from "./DeskObject";
import { DeskCables } from "./DeskCables";

export type DeskLayerData = {
  id: string;
  title: string;
  lead: string;
  objects: { id: string; shape: DeskShape; label: string | null }[];
};

/**
 * Il mondo. Il DOM non e' una tela di etichette che galleggiano: e' una <ol> di
 * quattro strati, ognuno con il suo <h3> e la sua <ul> di oggetti. Uno screen
 * reader legge "Il sito: i colori, i caratteri, le sezioni...", in ordine e per
 * intero. Non c'e' una versione accessibile parallela da tenere allineata: c'e'
 * una cosa sola, guardata in due modi.
 *
 * Il mondo viene disegnato due volte, una per formato, e il CSS ne nasconde uno.
 * Le due geometrie sono troppo diverse per stare in un solo set di coordinate, e
 * sceglierle in JavaScript vorrebbe dire misurare lo schermo prima di disegnare:
 * il primo fotogramma sarebbe vuoto. Il costo e' un <ol> in piu' nel DOM, e le
 * etichette del gemello nascosto sono aria-hidden per non farle leggere due volte.
 *
 * Sotto il piano ci sono le didascalie dei quattro strati, in colonna sul
 * telefono e in quattro colonne da desktop. Il piano e' un elemento a se':
 * gli oggetti contano le loro percentuali su quello, non sul blocco intero, o
 * ogni riga di testo in piu' sposterebbe il tavolo.
 */
export function DeskTable({
  layers,
  centre,
  layout,
  ghost = false,
}: {
  layers: DeskLayerData[];
  centre: string;
  layout: DeskLayout;
  /** Il gemello che il CSS nasconde: sta nel DOM, ma non va letto due volte. */
  ghost?: boolean;
}) {
  const shown = OBJECTS_PER_LAYER[layout];

  return (
    <div
      data-desk-world
      data-layout={layout}
      aria-hidden={ghost || undefined}
      style={
        {
          "--world-w": WORLD[layout].width,
          "--world-h": WORLD[layout].height,
        } as CSSProperties
      }
    >
      <div data-desk-surface>
        <DeskCables />

        <div data-desk-centre style={{ width: `${CENTRE.width}%` }}>
          <span
            data-desk-shape
            style={{ aspectRatio: `${SHAPE_BOX.laptop.w} / ${SHAPE_BOX.laptop.h}` }}
          />
          <span data-desk-centre-label>{centre}</span>
        </div>
      </div>

      <ol data-desk-layers>
        {layers.map((layer, index) => (
          <li key={layer.id} data-desk-layer={layer.id}>
            {/* La finestra viene da LAYER_BEATS, non ricalcolata a mano: il
                conteggio delle fasi vive in un posto solo. */}
            <div
              data-desk-caption
              style={{ "--from": LAYER_BEATS[index].from } as CSSProperties}
            >
              <h3>{layer.title}</h3>
              <p>{layer.lead}</p>
            </div>

            <ul>
              {/* `i % shown`: gli oggetti oltre il quarto, sul telefono, riusano
                  la posizione del primo. Sono display:none e non li vede
                  nessuno — serve solo che placeObject riceva un indice valido. */}
              {layer.objects.map((object, i) => (
                <DeskObject
                  key={object.id}
                  shape={object.shape}
                  label={object.label}
                  layout={layout}
                  placement={placeObject(layout, index, i % shown)}
                  beat={objectBeat(index, i % shown, shown)}
                  ghost={ghost}
                  hidden={i >= shown}
                />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
