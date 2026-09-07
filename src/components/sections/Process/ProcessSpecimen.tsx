import type { CSSProperties, ReactNode } from "react";
import type { ProcessSample } from "@/content/process";

/**
 * I campioni delle quattro consegne: quello che ognuna mostra di se' stessa.
 *
 * Valgono le regole del tavolo, che sono due. La prima: un campione e' un
 * FRAMMENTO della cosa, mai un suo simbolo: «un documento» non e' l'icona di
 * un documento, e' la struttura di quello che ricevi, due titoli e il testo
 * sotto. La seconda: il vocabolario e' corto. Non c'e' una marca nuova qui
 * dentro, sono le stesse di DeskSpecimen (una riga, un blocco, un pulsante, un
 * testo mono) e il foglio di stile ne dichiara la forma una volta sola.
 *
 * Perche' una tavola sua e non quella del tavolo: la prova di DeskSpecimen
 * esige che ogni disegno sia reclamato da uno dei ventiquattro oggetti, e
 * questi quattro non lo sono: non sono livelli di un sito, sono cose che ti
 * restano in mano. Aggiungerli li' avrebbe rotto quella prova, e la prova ha
 * ragione. Le SAGOME invece si riusano tali e quali: quelle sono materiale, e
 * il materiale del sito e' uno solo.
 */

/** Una riga di testo finto, larga quanto le si dice. La larghezza e' un dato
 *  del disegno (quanto e' lunga quella riga) non una scelta di stile. */
const Riga = ({ w, ...attr }: { w: number; "data-titolo"?: string; "data-url"?: string }) => (
  <i data-m="riga" {...attr} style={{ "--w": `${w}%` } as CSSProperties} />
);

export const PROCESS_SPECIMENS: Record<ProcessSample, ReactNode> = {
  /**
   * «L'accordo». Non e' del testo scritto: quello e' gia' «I testi» sul
   * tavolo, e' la struttura di un documento che dice DUE cose: cosa deve
   * succedere, in accento, e cosa resta fuori, piu' sotto e piu' scuro. La
   * seconda meta' e' quella che nessuno scrive, ed e' meta' del disegno.
   */
  accordo: (
    <>
      <Riga w={46} data-titolo="" />
      <Riga w={100} />
      <Riga w={88} />
      <Riga w={96} />
      <Riga w={38} data-url="" />
      <Riga w={74} />
      <Riga w={58} />
    </>
  ),
  /**
   * «La bozza». E' l'impaginato di una schermata con dentro l'azione, ed e'
   * quella l'unica differenza da «Le sezioni» del tavolo: un impaginato senza
   * azione e' un layout, con l'azione e' una decisione, che e' esattamente
   * cosa si va a guardare in questa consegna.
   */
  bozza: (
    <>
      <i data-m="blocco" data-b="testata" />
      <span data-m="colonne">
        <i data-m="blocco" data-b="larga" />
        <i data-m="blocco" data-b="stretta" />
      </span>
      <i data-m="cta" data-piccolo="" />
    </>
  ),
  /**
   * «L'indirizzo». Lo schermo del telefono con la barra dell'indirizzo sopra,
   * in accento. Il campione «Il telefono» del tavolo e' lo stesso impaginato
   * SENZA la barra, e non e' una svista: li' la cosa e' «un sito su un
   * telefono», qui e' «un indirizzo che apri». La barra e' tutta la differenza.
   */
  indirizzo: (
    <>
      <Riga w={100} data-titolo="" />
      <i data-m="blocco" data-b="testata" />
      <Riga w={100} />
      <Riga w={100} />
      <Riga w={80} />
      <i data-m="cta" />
    </>
  ),
  /**
   * «Il numero». La scheda porta la linguetta: e' una cosa che si archivia e si
   * ritrova, che e' precisamente cosa fai con un numero di telefono.
   *
   * E il numero NON c'e': c'e' la sua forma, con le cifre vuote. Inventarne uno
   * sarebbe la bugia che la casella ha gia' rifiutato col mittente inventato;
   * scriverne uno vero e' una decisione che riguarda i Contatti, non questa
   * sezione. Il giorno in cui si prende, questo e' il primo posto in cui va.
   */
  numero: (
    <>
      <Riga w={54} />
      <b data-m="mono">+39 ___ ___ ____</b>
      <Riga w={34} data-url="" />
    </>
  ),
};

/**
 * Il campione dentro una consegna. Sta accanto alla sagoma e non dentro di lei,
 * per la stessa ragione del tavolo: [data-desk-shape] porta l'ombra, e un'ombra
 * su ognuna delle marche impasterebbe il disegno.
 */
export function ProcessSpecimen({ sample }: { sample: ProcessSample }) {
  return (
    <span data-desk-sample={sample} aria-hidden="true">
      {PROCESS_SPECIMENS[sample]}
    </span>
  );
}
