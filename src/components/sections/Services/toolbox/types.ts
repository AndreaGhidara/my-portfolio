import type { ZoneId } from "@/content/toolbox";

// Tradotti dal server e passati al client una volta sola: mappa, editor ed
// etichetta leggono tutti da qui.
export type ToolboxCopy = {
  sewFor: string;
  whole: string;
  start: string;
  list: string;
  root: { name: string; what: string };
  zones: Record<
    ZoneId,
    {
      name: string;
      junction: string;
      short: string;
      key: string;
      what: string;
      count: string;
    }
  >;
  tools: Record<string, { what: string; brief: string }>;
  garments: Record<
    string,
    {
      name: string;
      /** Il tipo del capo nel codice finto dell'editor, nella lingua della pagina. */
      slug: string;
      why: string;
      alt: Record<string, string>;
      size: string;
      status: string;
    }
  >;
  label: {
    name: string;
    brand: string;
    composition: string;
    estimate: string;
    fibres: string;
    care: string;
    careIf: string;
    insteadOf: string;
    contains: string;
    compartment: string;
    fitsIn: string;
    onRequest: string;
    pairsWith: string;
    tried: string;
    atWork: string;
    known: string;
    /** La taglia di un attrezzo o di uno scomparto, che e' sempre un pezzo. */
    sizeOne: string;
    back: string;
    close: string;
  };
  editor: {
    name: string;
    folders: string;
    file: string;
    folder: string;
    package: string;
    func: string;
    type: string;
    empty: string;
    ifNeeded: string;
    needed: string;
    zeroErrors: string;
  };
};

/** `node` vale per attrezzi, snodi e cartellino. */
export type ToolboxStep = { kind: "node"; id: string } | { kind: "garment"; id: string };
