import type { CSSProperties } from "react";
import type { DeskShape } from "@/content/desk";
import {
  CAPTION_BEATS,
  CENTRE,
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
  blank,
  layout,
  ghost = false,
}: {
  layers: DeskLayerData[];
  centre: string;
  /** Il nome del comando sul post-it bianco: l'unico oggetto che si preme. */
  blank: string;
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

          {/* Il sito finito, dentro lo schermo. La sezione si apre su "un sito
              finito riempie lo schermo" e si chiude dicendo che quello schermo
              e' UNA delle cose sul tavolo: se al centro c'e' una cornice vuota,
              la frase indica un rettangolo nero e non dice piu' niente.

              Non puo' stare dentro laptop.svg: le sagome sono maschere a un
              colore solo, e una maschera l'arancio non lo sa portare. Qui e'
              DOM vero, appoggiato sopra il disegno e misurato sulla scatola del
              laptop (lo schermo, nel viewBox 360x240, va da 9,9 a 351,209).

              E' decorazione e basta: nessun testo, niente da annunciare. Il nome
              del centro e' gia' la didascalia "il progetto" qui sotto. */}
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
            {/* La finestra viene da CAPTION_BEATS, non ricalcolata a mano: il
                conteggio delle fasi vive in un posto solo. Ha due estremi e non
                uno: sotto la camera le quattro didascalie stanno tutte nello
                stesso posto, e si danno il cambio. */}
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
                  // L'oggetto senza etichetta e' il post-it bianco, e non ce
                  // n'e' un altro: e' il posto per la cosa che non e' ancora
                  // stata raccontata, quindi porta dove la si racconta. Il
                  // segnale e' l'etichetta che manca, che e' lo stesso `mute`
                  // di content/desk.ts arrivato fin qui.
                  //
                  // Nel gemello no. Non e' prudenza: li' questo post-it e' il
                  // sesto oggetto del suo strato, e il mondo verticale ne
                  // disegna quattro — data-off, display:none. Un <a> in quella
                  // copia non si potrebbe ne' premere ne' raggiungere, e
                  // sarebbe comunque un secondo comando per la stessa porta
                  // dentro un aria-hidden. Il comando sta nel mondo che si
                  // legge, che sotto i 1024px e' quello a un pixel: li' il
                  // post-it non e' disegnato, ma nell'elenco c'e' e si annuncia.
                  // Il prezzo e' una fermata del Tab che non si vede, sotto i
                  // 1024. Non c'e' una regola CSS che tolga un elemento dal
                  // giro dei Tab senza toglierlo anche allo screen reader, e
                  // fra le due si tiene quella che parla.
                  href={!ghost && object.label === null ? "#contact" : undefined}
                  action={!ghost && object.label === null ? blank : undefined}
                />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
