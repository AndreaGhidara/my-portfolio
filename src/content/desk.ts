/**
 * Il tavolo: cosa c'e' sopra, e con che sagoma e' disegnato.
 * Qui non c'e' testo. Le etichette stanno in messages/*.json sotto
 * services.layers.<layer>.objects.<object>, come per services.ts:
 * il contenuto e' bilingue, e un id non lo e'.
 */
export type DeskShape = "sheet" | "phone" | "card" | "rack" | "plate" | "postit";

/**
 * Il campione che un oggetto porta dentro la sua sagoma.
 *
 * Un campione non e' un'icona: e' un FRAMMENTO della cosa. "I colori" non sono
 * una tavolozza stilizzata, sono i tre colori veri del brand; "Il dominio" non
 * e' un globo, e' un dominio scritto. La differenza non e' estetica — un simbolo
 * dice "questo significa sicurezza", un campione fa vedere com'e' fatta — ed e'
 * l'unica regola che tiene questi ventidue disegni lontani dal catalogo di
 * icone che il tavolo non vuole essere.
 *
 * Il tipo sta qui, col contenuto, e non col componente che lo disegna: e' il
 * tavolo a dichiarare cosa ha da mostrare, non il disegnatore a decidere cosa
 * gli va di disegnare. Il verso di questa dipendenza e' anche quello che rende
 * la copertura una questione di compilazione invece che di attenzione — la
 * tavola dei disegni e' un Record su questo tipo, e un campione senza disegno
 * non compila.
 */
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
  /**
   * Il frammento che questo oggetto mostra di se'. Due oggetti non ce l'hanno,
   * e in tutti e due i casi e' una scelta dichiarata e non una dimenticanza —
   * la prova in DeskSpecimen.test.tsx tiene la lista e la ragione di ognuno:
   *
   * - `hosting` ("Dove sta") perche' l'hosting non ha una faccia, e qualunque
   *   cosa gli si metta dentro sarebbe un simbolo travestito da campione. Il
   *   primo che sfonda la regola la sfonda per tutti;
   * - `blank`, il post-it grigio, per una ragione tecnica e non di regola: sopra
   *   ci sta scritto qualcosa (il conto dei caffe'), ma quel testo va TRADOTTO,
   *   e i campioni sono disegni fissi dentro un componente. Arriva quindi dalle
   *   traduzioni come `blank` e `note`, non da SPECIMENS. Se un giorno un altro
   *   oggetto avesse bisogno di un campione con del testo tradotto, la strada e'
   *   quella — non un'eccezione in piu' in questa lista.
   */
  sample?: SampleId;
  /**
   * Il post-it grigio. E' l'unico oggetto senza ETICHETTA, e senza apposta: gli
   * altri ventitre' sono pezzi di lavoro e portano il loro nome sotto, questo e'
   * l'unica cosa sul tavolo che non e' lavoro — ci sta scritto il conto dei
   * caffe' — ed e' l'unica che si preme. Quello che ci sta sopra arriva dalle
   * traduzioni (`note`), e la domanda che compare al passaggio del mouse e' il
   * nome del comando (`blank`).
   */
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
      // Senza campione, e non per dimenticanza: l'hosting non ha una faccia.
      // Una nuvola, un globo, un server sarebbero simboli travestiti da
      // frammenti, e la regola dei campioni vale finche' non la si sfonda una
      // volta sola. Un vuoto dichiarato in mezzo a ventidue prove si legge come
      // una scelta; la prova in DeskSpecimen.test.tsx lo tiene tale.
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
      // Quarto e non ultimo, e l'ordine qui e' l'ordine del disegno: il mondo
      // verticale disegna i primi quattro oggetti di ogni strato, e questo e'
      // l'unico oggetto del tavolo che porta da qualche parte. Un comando che
      // sul telefono non si vede e' un comando che sul telefono non c'e'.
      // Il posto se lo prende da "Farsi trovare", che scala in quinta e sul
      // telefono resta nell'elenco senza stare nel disegno.
      { id: "blank", shape: "postit", mute: true },
      { id: "seo", shape: "postit", sample: "trovare" },
      { id: "care", shape: "postit", sample: "manutenzione" },
    ],
  },
];
