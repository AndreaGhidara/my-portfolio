// Niente testo qui: le etichette stanno in messages/*.json sotto
// services.layers.<layer>.objects.<object>, perche' un id non e' bilingue.
export type DeskShape = "sheet" | "phone" | "card" | "rack" | "plate" | "postit";

// Un campione e' un frammento della cosa, mai un suo simbolo. Il tipo sta col
// contenuto perche' SPECIMENS e' un Record su di lui: un campione senza
// disegno non compila.
export type SampleId =
  | "colori"
  | "caratteri"
  | "sezioni"
  | "testi"
  | "immagini"
  | "telefono"
  | "contatti"
  | "riservata"
  | "catalogo"
  | "pagamenti"
  | "prenotazioni"
  | "gestionale"
  | "dati"
  | "copie"
  | "dominio"
  | "sicurezza"
  | "velocita"
  | "assistente"
  | "automazioni"
  | "numeri"
  | "trovare"
  | "manutenzione";

export type DeskObject = {
  id: string;
  shape: DeskShape;
  // Manca a `hosting` (non ha una faccia) e a `blank` (il suo testo va tradotto).
  // La lista con le ragioni sta in DeskSpecimen.test.tsx.
  sample?: SampleId;
  // L'unico oggetto senza etichetta, ed e' un comando: il suo nome e' `blank`
  // nei messaggi, quello che ci sta scritto sopra e' `note`.
  mute?: true;
};

export type DeskLayer = { id: string; objects: DeskObject[] };

// L'ordine e' la distanza dal laptop, cioe' il movimento della camera.
export const deskLayers: DeskLayer[] = [
  {
    id: "site",
    objects: [
      { id: "colors", shape: "sheet", sample: "colori" },
      { id: "type", shape: "sheet", sample: "caratteri" },
      { id: "sections", shape: "sheet", sample: "sezioni" },
      { id: "copy", shape: "sheet", sample: "testi" },
      { id: "images", shape: "sheet", sample: "immagini" },
      { id: "mobile", shape: "phone", sample: "telefono" },
    ],
  },
  {
    id: "logic",
    objects: [
      { id: "forms", shape: "card", sample: "contatti" },
      { id: "account", shape: "card", sample: "riservata" },
      { id: "catalog", shape: "card", sample: "catalogo" },
      { id: "payments", shape: "card", sample: "pagamenti" },
      { id: "booking", shape: "card", sample: "prenotazioni" },
      { id: "erp", shape: "card", sample: "gestionale" },
    ],
  },
  {
    id: "infra",
    objects: [
      // Senza campione apposta: ogni disegno dell'hosting sarebbe un simbolo.
      { id: "hosting", shape: "rack" },
      { id: "database", shape: "rack", sample: "dati" },
      { id: "backups", shape: "rack", sample: "copie" },
      { id: "domain", shape: "plate", sample: "dominio" },
      { id: "security", shape: "plate", sample: "sicurezza" },
      { id: "speed", shape: "plate", sample: "velocita" },
    ],
  },
  {
    id: "growth",
    objects: [
      { id: "ai", shape: "postit", sample: "assistente" },
      { id: "automation", shape: "postit", sample: "automazioni" },
      { id: "analytics", shape: "postit", sample: "numeri" },
      // Dall'indice dipende dove cade sull'anello: spostarlo vuol dire ritarare
      // il tavolo (vedi ANGLE_OFFSET in layers.ts).
      { id: "blank", shape: "postit", mute: true },
      { id: "seo", shape: "postit", sample: "trovare" },
      { id: "care", shape: "postit", sample: "manutenzione" },
    ],
  },
];
