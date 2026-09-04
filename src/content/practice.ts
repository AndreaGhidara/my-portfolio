import { deskLayers, type DeskShape, type SampleId } from "./desk";

/** Da che parte sta il disegno. Il testo sta dall'altra. */
export type Lato = "dx" | "sx";

/**
 * Un disegno dentro una voce. `object` e' l'id di un oggetto del tavolo: la
 * sagoma e il campione vengono da li' e non si ridichiarano, cosi' il giorno
 * in cui «I pagamenti» cambia campione cambia in tutti e due i posti perche' e'
 * LO STESSO OGGETTO, non una sua copia.
 *
 * Le misure sono quelle trovate a mano nel prototipo del 5 settembre 2026:
 * `width` in pixel alla larghezza di riferimento del palco, il resto in
 * percentuale della scatola del disegno. `layer` e' chi sta sopra chi.
 */
export type PracticeShape = {
  object: string;
  width: number;
  rotate: number;
  x: number;
  y: number;
  layer: number;
};

export type PracticeBlock = {
  /** E' anche la chiave di traduzione: services.list.<service>.* */
  service: string;
  lato: Lato;
  shapes: PracticeShape[];
};

/**
 * L'ordine e' quello di `services`, e una prova lo verifica: queste quattro
 * voci sono le stesse quattro, vestite. I lati si alternano perche' la freccia
 * deve passare solo sopra i disegni — due voci di fila dallo stesso lato e la
 * strada attraverserebbe un paragrafo.
 */
export const practiceBlocks: PracticeBlock[] = [
  {
    service: "sites",
    lato: "dx",
    shapes: [
      { object: "sections", width: 250, rotate: -3, x: 2, y: 2, layer: 2 },
      { object: "colors", width: 186, rotate: 4, x: 46, y: 48, layer: 1 },
      { object: "mobile", width: 96, rotate: 2, x: 72, y: 4, layer: 3 },
    ],
  },
  {
    service: "ecommerce",
    lato: "sx",
    shapes: [
      { object: "catalog", width: 245, rotate: -2, x: 0, y: 8, layer: 2 },
      { object: "payments", width: 216, rotate: 4, x: 40, y: 48, layer: 3 },
    ],
  },
  {
    service: "webapp",
    lato: "dx",
    shapes: [
      { object: "database", width: 206, rotate: -2, x: 2, y: 4, layer: 2 },
      { object: "account", width: 216, rotate: 3, x: 38, y: 52, layer: 3 },
    ],
  },
  {
    service: "ai",
    lato: "sx",
    shapes: [
      { object: "ai", width: 188, rotate: -4, x: 4, y: 4, layer: 2 },
      { object: "automation", width: 176, rotate: 3, x: 46, y: 46, layer: 3 },
    ],
  },
];

/** Un disegno con la sua sagoma e il suo campione, presi dal tavolo. */
export type PracticeDrawing = PracticeShape & { shape: DeskShape; sample: SampleId };

export type PracticeScene = { service: string; lato: Lato; drawings: PracticeDrawing[] };

/**
 * La risoluzione avviene qui, al caricamento del modulo, e non nel componente:
 * un id che non esiste deve far fallire la build, non far esplodere una pagina.
 * Il campione e' obbligatorio, e non e' la regola del tavolo: li' un oggetto
 * senza campione ci sta (`hosting`, il post-it bianco), qui il disegno e' largo
 * duecentocinquanta pixel e un contorno vuoto a quella misura e' un buco.
 */
const sulTavolo = new Map(deskLayers.flatMap((l) => l.objects).map((o) => [o.id, o]));

export const practiceScenes: PracticeScene[] = practiceBlocks.map((block) => ({
  service: block.service,
  lato: block.lato,
  drawings: block.shapes.map((shape) => {
    const oggetto = sulTavolo.get(shape.object);
    if (!oggetto) throw new Error(`«${shape.object}» non e' un oggetto del tavolo`);
    if (!oggetto.sample) throw new Error(`«${shape.object}» non ha un campione da mostrare`);
    return { ...shape, shape: oggetto.shape, sample: oggetto.sample };
  }),
}));
