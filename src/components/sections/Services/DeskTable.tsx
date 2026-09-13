import type { CSSProperties } from "react";
import type { DeskShape, SampleId } from "@/content/desk";
import {
  CAPTION_BEATS,
  CENTRE,
  OBJECTS_PER_LAYER,
  WORLD,
  objectBeat,
  placeObject,
  type DeskLayout,
} from "./layers";
import { DeskObject, DeskShapeArt } from "./DeskObject";

export type DeskLayerData = {
  id: string;
  title: string;
  lead: string;
  objects: { id: string; shape: DeskShape; label: string | null; sample?: SampleId }[];
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
  composto,
  blank,
  note,
  layout,
  ghost = false,
}: {
  layers: DeskLayerData[];
  centre: string;
  /** Il titolino sopra gli strati. Il CSS lo mostra solo sotto i 1024px. */
  composto: string;
  /** Il nome del comando sul post-it bianco: l'unico oggetto che si preme. */
  blank: string;
  /** Quello che c'e' scritto sul post-it prima che lo si prema. */
  note: string;
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

        <div data-desk-centre style={{ width: `${CENTRE.width}%` }}>
          {/* Due strati come ogni altra sagoma, ed e' il pieno scuro della
              scocca che fa leggere acceso lo schermo qui sotto: un sito chiaro
              dentro un contorno vuoto era un disegno appoggiato sul tavolo. */}
          <DeskShapeArt drawing="laptop" />

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

      {/* Sotto i 1024px gli strati diventano un elenco, e un elenco vuole un
          nome: senza, quattro titoli si leggono come quattro sezioni nuove
          invece che come le parti di una cosa sola. */}
      <p data-desk-composto className="eyebrow">{composto}</p>

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
              {/* Il numero e' presentazione, non contenuto: dice che gli
                  strati sono quattro e che questo e' l'ennesimo. Da desktop
                  il CSS lo nasconde, perche' li' gli strati arrivano uno alla
                  volta e contarli non serve. */}
              <span data-desk-num aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
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
                  sample={object.sample}
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
                  // Anche nel gemello, che sotto i 1024px e' il disegno vero:
                  // il post-it e' il quarto oggetto del suo strato apposta, e
                  // sul telefono si vede. Come si comporta li' lo decide
                  // DeskObject — si preme, non si tabula.
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
