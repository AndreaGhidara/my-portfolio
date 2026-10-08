import type { Garment, ZoneId } from "@/content/toolbox";
import { toolsIn, toolById as attrezzoPerId, byZone } from "./graph";
import type { ToolboxCopy } from "./types";

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

export type CodeLine = { pieces: Pezzo[]; isNew?: boolean };

const nomeDi = (id: string) => attrezzoPerId(id)?.name ?? id;

const t = (testo: string): Pezzo => ({ tipo: "t", testo });
const attrezzo = (id: string): Pezzo => ({
  tipo: "a",
  id,
  testo: `"${nomeDi(id)}"`,
});

/** Il file del sito: vuoto finche' non si sceglie un lavoro, poi riscritto con i suoi attrezzi. */
export function configLines(capo: Garment | null, testi: ToolboxCopy): CodeLine[] {
  const e = testi.editor;
  const righe: CodeLine[] = [
    {
      pieces: [
        { tipo: "k", testo: "import" },
        t(" { "),
        { tipo: "p", testo: e.func },
        t(" } "),
        { tipo: "k", testo: "from" },
        t(" "),
        { tipo: "s", testo: `"${e.package}"` },
      ],
    },
    { pieces: [] },
  ];
  const apertura: CodeLine = {
    pieces: [
      { tipo: "k", testo: "export default" },
      t(" "),
      { tipo: "p", testo: e.func },
      t("({"),
    ],
  };

  if (!capo) {
    righe.push(
      { pieces: [{ tipo: "c", testo: `// ${e.empty}` }] },
      apertura,
      { pieces: [t(`  ${e.type}: `), { tipo: "s", testo: '"?"' }, t(",")] },
      { pieces: [t("})")] },
    );
    return righe;
  }

  const c = testi.garments[capo.id];
  righe.push({ pieces: [{ tipo: "c", testo: `// ${c.why}` }] }, apertura, {
    pieces: [t(`  ${e.type}: `), { tipo: "s", testo: `"${c.slug}"` }, t(",")],
    isNew: true,
  });
  for (const { zone: zona, tools: usati } of byZone(capo)) {
    const lista: Pezzo[] = [];
    usati.forEach((id, i) => {
      if (i) lista.push(t(", "));
      lista.push(attrezzo(id));
    });
    righe.push({
      pieces: [
        t("  "),
        { tipo: "p", testo: testi.zones[zona].key },
        t(": ["),
        ...lista,
        t("],"),
      ],
      isNew: true,
    });
  }
  righe.push(
    { pieces: [] },
    { pieces: [{ tipo: "c", testo: `  // ${e.ifNeeded}` }] },
  );
  for (const { from: da, to: a } of capo.alt) {
    righe.push({
      pieces: [
        {
          tipo: "c",
          testo: `  // ${nomeDi(a)} ${testi.label.insteadOf} ${nomeDi(da)}, ${c.alt[da]}`,
        },
      ],
      isNew: true,
    });
  }
  righe.push({ pieces: [t("})")] });
  return righe;
}

/** Il file di uno scomparto: la sua descrizione, e i suoi attrezzi con quello che fanno. */
export function zoneLines(
  zona: ZoneId,
  capo: Garment | null,
  testi: ToolboxCopy,
): CodeLine[] {
  const z = testi.zones[zona];
  const righe: CodeLine[] = [
    { pieces: [{ tipo: "c", testo: `// ${z.what}` }] },
    {
      pieces: [
        { tipo: "k", testo: "export const" },
        t(" "),
        { tipo: "p", testo: z.key },
        t(" = {"),
      ],
    },
  ];
  for (const a of toolsIn(zona)) {
    const pezzi: Pezzo[] = [
      t("  "),
      attrezzo(a.id),
      t(": "),
      { tipo: "s", testo: `"${testi.tools[a.id].brief}"` },
      t(","),
    ];
    if (capo?.uses.includes(a.id))
      pezzi.push(t(" "), { tipo: "n", testo: `// ${testi.editor.needed}` });
    righe.push({ pieces: pezzi });
  }
  righe.push({ pieces: [t("}")] });
  return righe;
}
