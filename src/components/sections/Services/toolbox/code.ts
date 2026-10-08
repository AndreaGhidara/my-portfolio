import type { Capo, ZonaId } from "@/content/toolbox";
import { attrezziDi, attrezzo as attrezzoPerId, perZona } from "./graph";
import type { TestiCassetta } from "./types";

/**
 * Il codice finto dell'editor, come dati: ogni riga e' una fila di pezzi con
 * il loro colore di sintassi. Il componente li disegna e basta; qui si decide
 * cosa c'e' scritto, e si prova senza un browser.
 *
 * - `k` parola chiave, `p` nome, `s` stringa, `c` commento, `n` nota a margine
 * - `a` un attrezzo: la stringa col suo nome, che si tocca e apre l'etichetta
 */
type Pezzo =
  | { tipo: "t" | "k" | "p" | "s" | "c" | "n"; testo: string }
  | { tipo: "a"; id: string; testo: string };

export type Riga = { pezzi: Pezzo[]; nuova?: boolean };

const nomeDi = (id: string) => attrezzoPerId(id)?.nome ?? id;

const t = (testo: string): Pezzo => ({ tipo: "t", testo });
const attrezzo = (id: string): Pezzo => ({
  tipo: "a",
  id,
  testo: `"${nomeDi(id)}"`,
});

/** Il file del sito: vuoto finche' non si sceglie un lavoro, poi riscritto con i suoi attrezzi. */
export function righeConfig(capo: Capo | null, testi: TestiCassetta): Riga[] {
  const e = testi.editor;
  const righe: Riga[] = [
    {
      pezzi: [
        { tipo: "k", testo: "import" },
        t(" { "),
        { tipo: "p", testo: e.funzione },
        t(" } "),
        { tipo: "k", testo: "from" },
        t(" "),
        { tipo: "s", testo: `"${e.pacchetto}"` },
      ],
    },
    { pezzi: [] },
  ];
  const apertura: Riga = {
    pezzi: [
      { tipo: "k", testo: "export default" },
      t(" "),
      { tipo: "p", testo: e.funzione },
      t("({"),
    ],
  };

  if (!capo) {
    righe.push(
      { pezzi: [{ tipo: "c", testo: `// ${e.vuoto}` }] },
      apertura,
      { pezzi: [t(`  ${e.tipo}: `), { tipo: "s", testo: '"?"' }, t(",")] },
      { pezzi: [t("})")] },
    );
    return righe;
  }

  const c = testi.capi[capo.id];
  righe.push({ pezzi: [{ tipo: "c", testo: `// ${c.perche}` }] }, apertura, {
    pezzi: [t(`  ${e.tipo}: `), { tipo: "s", testo: `"${c.slug}"` }, t(",")],
    nuova: true,
  });
  for (const { zona, attrezzi: usati } of perZona(capo)) {
    const lista: Pezzo[] = [];
    usati.forEach((id, i) => {
      if (i) lista.push(t(", "));
      lista.push(attrezzo(id));
    });
    righe.push({
      pezzi: [
        t("  "),
        { tipo: "p", testo: testi.zone[zona].chiave },
        t(": ["),
        ...lista,
        t("],"),
      ],
      nuova: true,
    });
  }
  righe.push(
    { pezzi: [] },
    { pezzi: [{ tipo: "c", testo: `  // ${e.seServe}` }] },
  );
  for (const { da, a } of capo.alt) {
    righe.push({
      pezzi: [
        {
          tipo: "c",
          testo: `  // ${nomeDi(a)} ${testi.etichetta.alPosto} ${nomeDi(da)}, ${c.alt[da]}`,
        },
      ],
      nuova: true,
    });
  }
  righe.push({ pezzi: [t("})")] });
  return righe;
}

/** Il file di uno scomparto: la sua descrizione, e i suoi attrezzi con quello che fanno. */
export function righeZona(
  zona: ZonaId,
  capo: Capo | null,
  testi: TestiCassetta,
): Riga[] {
  const z = testi.zone[zona];
  const righe: Riga[] = [
    { pezzi: [{ tipo: "c", testo: `// ${z.cosa}` }] },
    {
      pezzi: [
        { tipo: "k", testo: "export const" },
        t(" "),
        { tipo: "p", testo: z.chiave },
        t(" = {"),
      ],
    },
  ];
  for (const a of attrezziDi(zona)) {
    const pezzi: Pezzo[] = [
      t("  "),
      attrezzo(a.id),
      t(": "),
      { tipo: "s", testo: `"${testi.attrezzi[a.id].breve}"` },
      t(","),
    ];
    if (capo?.usa.includes(a.id))
      pezzi.push(t(" "), { tipo: "n", testo: `// ${testi.editor.serve}` });
    righe.push({ pezzi });
  }
  righe.push({ pezzi: [t("}")] });
  return righe;
}
