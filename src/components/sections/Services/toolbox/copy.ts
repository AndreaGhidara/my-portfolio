import { ATTREZZI, CAPI, ZONE } from "@/content/toolbox";
import { attrezziDi } from "./graph";
import type { TestiCassetta } from "./types";

/** Quello che serve per tradurre: la `t` di next-intl, sul namespace `cassetta`. */
type Traduci = (chiave: string, valori?: Record<string, number>) => string;

/**
 * Tutti i testi della cassetta, dal namespace `cassetta` di messages. Sta fuori
 * dal componente server perche' le prove lo costruiscono dagli stessi file di
 * lingua, con lo stesso codice: una chiave che manca si vede nei test.
 */
export function testiCassetta(tc: Traduci): TestiCassetta {
  return {
    cuciPer: tc("cuciPer"),
    tutta: tc("tutta"),
    partenza: tc("partenza"),
    elenco: tc("elenco"),
    radice: { nome: tc("radice.nome"), cosa: tc("radice.cosa") },
    zone: Object.fromEntries(
      ZONE.map((z) => [
        z.id,
        {
          nome: tc(`zone.${z.id}.nome`),
          snodo: tc(`zone.${z.id}.snodo`),
          corto: tc(`zone.${z.id}.corto`),
          chiave: tc(`zone.${z.id}.chiave`),
          cosa: tc(`zone.${z.id}.cosa`),
          conta: tc("attrezziZona", { n: attrezziDi(z.id).length }),
        },
      ]),
    ) as TestiCassetta["zone"],
    attrezzi: Object.fromEntries(
      ATTREZZI.map((a) => [
        a.id,
        {
          cosa: tc(`attrezzi.${a.id}.cosa`),
          breve: tc(`attrezzi.${a.id}.breve`),
        },
      ]),
    ),
    capi: Object.fromEntries(
      CAPI.map((c) => [
        c.id,
        {
          nome: tc(`capi.${c.id}.nome`),
          slug: tc(`capi.${c.id}.slug`),
          perche: tc(`capi.${c.id}.perche`),
          alt: Object.fromEntries(
            c.alt.map(({ da }) => [da, tc(`capi.${c.id}.alt.${da}`)]),
          ),
          taglia: tc("etichetta.taglia", { n: c.usa.length }),
          stato: tc("editor.stato", { n: c.usa.length }),
        },
      ]),
    ),
    etichetta: {
      nome: tc("etichetta.nome"),
      marca: tc("etichetta.marca"),
      composizione: tc("etichetta.composizione"),
      stima: tc("etichetta.stima"),
      fibre: tc("etichetta.fibre"),
      cura: tc("etichetta.cura"),
      curaSe: tc("etichetta.curaSe"),
      alPosto: tc("etichetta.alPosto"),
      contiene: tc("etichetta.contiene"),
      scomparto: tc("etichetta.scomparto"),
      entraIn: tc("etichetta.entraIn"),
      suRichiesta: tc("etichetta.suRichiesta"),
      siAbbina: tc("etichetta.siAbbina"),
      provato: tc("etichetta.provato"),
      lavoro: tc("etichetta.lavoro"),
      conosciuto: tc("etichetta.conosciuto"),
      tagliaUno: tc("etichetta.taglia", { n: 1 }),
      indietro: tc("etichetta.indietro"),
      chiudi: tc("etichetta.chiudi"),
    },
    editor: {
      nome: tc("editor.nome"),
      cartelle: tc("editor.cartelle"),
      file: tc("editor.file"),
      cartella: tc("editor.cartella"),
      pacchetto: tc("editor.pacchetto"),
      funzione: tc("editor.funzione"),
      tipo: tc("editor.tipo"),
      vuoto: tc("editor.vuoto"),
      seServe: tc("editor.seServe"),
      serve: tc("editor.serve"),
      zeroErrori: tc("editor.zeroErrori"),
    },
  };
}
