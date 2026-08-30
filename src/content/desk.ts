/**
 * Il tavolo: cosa c'e' sopra, e con che sagoma e' disegnato.
 * Qui non c'e' testo. Le etichette stanno in messages/*.json sotto
 * services.layers.<layer>.objects.<object>, come per services.ts:
 * il contenuto e' bilingue, e un id non lo e'.
 */
export type DeskShape = "sheet" | "phone" | "card" | "rack" | "plate" | "postit";

export type DeskObject = {
  id: string;
  shape: DeskShape;
  /** Il post-it bianco. E' l'unico oggetto senza etichetta, ed e' muto apposta:
   *  e' il posto per la cosa che non e' ancora stata raccontata. */
  mute?: true;
};

export type DeskLayer = { id: string; objects: DeskObject[] };

/**
 * L'ordine e' il movimento della telecamera: dal piu' vicino al laptop al piu'
 * lontano. Non e' un ordine di importanza, e' un ordine di distanza.
 */
export const deskLayers: DeskLayer[] = [
  {
    id: "site",
    objects: [
      { id: "colors", shape: "sheet" },
      { id: "type", shape: "sheet" },
      { id: "sections", shape: "sheet" },
      { id: "copy", shape: "sheet" },
      { id: "images", shape: "sheet" },
      { id: "mobile", shape: "phone" },
    ],
  },
  {
    id: "logic",
    objects: [
      { id: "forms", shape: "card" },
      { id: "account", shape: "card" },
      { id: "catalog", shape: "card" },
      { id: "payments", shape: "card" },
      { id: "booking", shape: "card" },
      { id: "erp", shape: "card" },
    ],
  },
  {
    id: "infra",
    objects: [
      { id: "hosting", shape: "rack" },
      { id: "database", shape: "rack" },
      { id: "backups", shape: "rack" },
      { id: "domain", shape: "plate" },
      { id: "security", shape: "plate" },
      { id: "speed", shape: "plate" },
    ],
  },
  {
    id: "growth",
    objects: [
      { id: "ai", shape: "postit" },
      { id: "automation", shape: "postit" },
      { id: "analytics", shape: "postit" },
      // Quarto e non ultimo, e l'ordine qui e' l'ordine del disegno: il mondo
      // verticale disegna i primi quattro oggetti di ogni strato, e questo e'
      // l'unico oggetto del tavolo che porta da qualche parte. Un comando che
      // sul telefono non si vede e' un comando che sul telefono non c'e'.
      // Il posto se lo prende da "Farsi trovare", che scala in quinta e sul
      // telefono resta nell'elenco senza stare nel disegno.
      { id: "blank", shape: "postit", mute: true },
      { id: "seo", shape: "postit" },
      { id: "care", shape: "postit" },
    ],
  },
];
