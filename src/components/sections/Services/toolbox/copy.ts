import { TOOLS, GARMENTS, ZONES } from "@/content/toolbox";
import { toolsIn } from "./graph";
import type { ToolboxCopy } from "./types";

/** Quello che serve per tradurre: la `t` di next-intl, sul namespace `cassetta`. */
type Traduci = (chiave: string, valori?: Record<string, number>) => string;

/**
 * Tutti i testi della cassetta, dal namespace `cassetta` di messages. Sta fuori
 * dal componente server perche' le prove lo costruiscono dagli stessi file di
 * lingua, con lo stesso codice: una chiave che manca si vede nei test.
 */
export function toolboxCopy(tc: Traduci): ToolboxCopy {
  return {
    sewFor: tc("cuciPer"),
    whole: tc("tutta"),
    start: tc("partenza"),
    list: tc("elenco"),
    root: { name: tc("radice.nome"), what: tc("radice.cosa") },
    zones: Object.fromEntries(
      ZONES.map((z) => [
        z.id,
        {
          name: tc(`zone.${z.id}.nome`),
          junction: tc(`zone.${z.id}.snodo`),
          short: tc(`zone.${z.id}.corto`),
          key: tc(`zone.${z.id}.chiave`),
          what: tc(`zone.${z.id}.cosa`),
          count: tc("attrezziZona", { n: toolsIn(z.id).length }),
        },
      ]),
    ) as ToolboxCopy["zones"],
    tools: Object.fromEntries(
      TOOLS.map((a) => [
        a.id,
        {
          what: tc(`attrezzi.${a.id}.cosa`),
          brief: tc(`attrezzi.${a.id}.breve`),
        },
      ]),
    ),
    garments: Object.fromEntries(
      GARMENTS.map((c) => [
        c.id,
        {
          name: tc(`capi.${c.id}.nome`),
          slug: tc(`capi.${c.id}.slug`),
          why: tc(`capi.${c.id}.perche`),
          alt: Object.fromEntries(
            c.alt.map(({ from: da }) => [da, tc(`capi.${c.id}.alt.${da}`)]),
          ),
          size: tc("etichetta.taglia", { n: c.uses.length }),
          status: tc("editor.stato", { n: c.uses.length }),
        },
      ]),
    ),
    label: {
      name: tc("etichetta.nome"),
      brand: tc("etichetta.marca"),
      composition: tc("etichetta.composizione"),
      estimate: tc("etichetta.stima"),
      fibres: tc("etichetta.fibre"),
      care: tc("etichetta.cura"),
      careIf: tc("etichetta.curaSe"),
      insteadOf: tc("etichetta.alPosto"),
      contains: tc("etichetta.contiene"),
      compartment: tc("etichetta.scomparto"),
      fitsIn: tc("etichetta.entraIn"),
      onRequest: tc("etichetta.suRichiesta"),
      pairsWith: tc("etichetta.siAbbina"),
      tried: tc("etichetta.provato"),
      atWork: tc("etichetta.lavoro"),
      known: tc("etichetta.conosciuto"),
      sizeOne: tc("etichetta.taglia", { n: 1 }),
      back: tc("etichetta.indietro"),
      close: tc("etichetta.chiudi"),
    },
    editor: {
      name: tc("editor.nome"),
      folders: tc("editor.cartelle"),
      file: tc("editor.file"),
      folder: tc("editor.cartella"),
      package: tc("editor.pacchetto"),
      func: tc("editor.funzione"),
      type: tc("editor.tipo"),
      empty: tc("editor.vuoto"),
      ifNeeded: tc("editor.seServe"),
      needed: tc("editor.serve"),
      zeroErrors: tc("editor.zeroErrori"),
    },
  };
}
