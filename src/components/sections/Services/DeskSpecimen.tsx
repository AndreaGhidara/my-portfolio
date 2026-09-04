import type { CSSProperties, ReactNode } from "react";
import type { SampleId } from "@/content/desk";

/**
 * I campioni: quello che ogni oggetto del tavolo mostra di se' stesso.
 *
 * La regola, e non e' negoziabile: un campione e' un FRAMMENTO della cosa, mai
 * un suo simbolo. "I colori" sono i tre colori veri del brand, non una tavolozza
 * stilizzata. "Il dominio" e' un dominio scritto, non un globo. "Le copie" sono
 * la stessa sagoma ripetuta tre volte, perche' una copia E' una ripetizione.
 * La differenza si sente: un simbolo dice "questo significa sicurezza", un
 * campione fa vedere com'e' fatta — e su un portfolio e' la differenza fra
 * dichiarare di saper fare una cosa e mostrarne un pezzo.
 *
 * Perche' e' DOM e non un'altra maschera come le sagome: una maschera CSS
 * dipinge un colore solo, e questi disegni sono a piu' colori per costruzione —
 * i tre campioni de "I colori" non esistono in un colore solo. Non e' un
 * precedente nuovo: lo schermo dentro il laptop al centro (data-desk-screen) e'
 * gia' DOM sovrapposto alla sagoma, e per la stessa identica ragione.
 *
 * Ognuno e' decorazione dichiarata: aria-hidden, sempre. Il nome dell'oggetto lo
 * porta gia' l'etichetta sotto, e un campione che entrasse nell'albero di
 * accessibilita' farebbe leggere "I colori, I colori" — o peggio, "Aa".
 *
 * Il vocabolario e' volutamente corto. Ventidue disegni fatti ognuno con i suoi
 * elementi sarebbero ventidue disegni da mantenere; qui sono composizioni di
 * poche marche ricorrenti — una riga, un blocco, una tessera, un testo mono — e
 * il foglio di stile ne dichiara la forma una volta sola. Quello che cambia da
 * un campione all'altro e' la DISPOSIZIONE, che sta in tokens.css accanto a
 * tutto il resto del tavolo.
 */

/** Una riga di testo finto, larga quanto le si dice. La larghezza e' un dato del
 *  disegno — quanto e' lunga quella riga — non una scelta di stile. */
const Riga = ({ w }: { w: number }) => (
  <i data-m="riga" style={{ "--w": `${w}%` } as CSSProperties} />
);

/** Una barra dell'istogramma, alta quanto le si dice. Stessa ragione. */
const Barra = ({ h }: { h: number }) => (
  <i data-m="barra" style={{ "--h": `${h}%` } as CSSProperties} />
);

const griglia = (n: number, marca: string, preso?: number) =>
  Array.from({ length: n }, (_, i) => (
    <i key={i} data-m={marca} data-preso={i === preso ? "" : undefined} />
  ));

/**
 * La tavola dei disegni. E' un Record su SampleId, che e' il tipo dichiarato dal
 * CONTENUTO: un campione dichiarato senza disegno non compila, e un disegno che
 * nessuno chiama non ha dove stare. La copertura non e' una prova da ricordarsi
 * di scrivere, e' il compilatore.
 */
export const SPECIMENS: Record<SampleId, ReactNode> = {
  // ── Il sito ──────────────────────────────────────────────────────────────
  /** I tre colori veri, dai token del brand. E' il campione piu' letterale del
   *  tavolo, ed e' anche quello che spiega la regola meglio di un commento. */
  colori: (
    <>
      <i data-m="tinta" data-t="carta" />
      <i data-m="tinta" data-t="accento" />
      <i data-m="tinta" data-t="inchiostro" />
    </>
  ),
  /** La Archivo Black, che e' il carattere dei titoli del sito. Non "una A
   *  stilizzata": proprio quella, nel suo peso. */
  caratteri: <b data-m="aa">Aa</b>,
  sezioni: (
    <>
      <i data-m="blocco" data-b="testata" />
      <span data-m="colonne">
        <i data-m="blocco" data-b="larga" />
        <i data-m="blocco" data-b="stretta" />
      </span>
      <i data-m="blocco" data-b="piede" />
    </>
  ),
  /** Quattro righe di lunghezza diversa: e' come si vede un testo da lontano, ed
   *  e' esattamente quello che questo oggetto e'. */
  testi: (
    <>
      <Riga w={100} />
      <Riga w={88} />
      <Riga w={96} />
      <Riga w={58} />
    </>
  ),
  immagini: (
    <>
      <i data-m="cielo" />
      <i data-m="sole" />
      <i data-m="monte" />
    </>
  ),
  /** Un impaginato mobile dentro lo schermo del telefono: testata, tre blocchi,
   *  e il pulsante. La stessa struttura di "Le sezioni", in una colonna sola —
   *  che e' precisamente cosa vuol dire mettere un sito su un telefono. */
  telefono: (
    <>
      <i data-m="blocco" data-b="testata" />
      <Riga w={100} />
      <Riga w={100} />
      <Riga w={80} />
      <i data-m="cta" />
    </>
  ),

  // ── Le logiche ───────────────────────────────────────────────────────────
  contatti: (
    <>
      <i data-m="campo" />
      <i data-m="campo" />
      <i data-m="cta" />
    </>
  ),
  /** Un campo e una password: i pallini sono la sola cosa che si vede davvero di
   *  un'area riservata, ed e' per questo che sono il suo campione. */
  riservata: (
    <>
      <i data-m="campo" />
      <span data-m="pallini">{griglia(6, "pallino")}</span>
      <i data-m="cta" data-piccolo="" />
    </>
  ),
  /** Una scheda prodotto, non una griglia. Quattro tessere sono anche "Le
   *  sezioni" e "Le immagini" — una griglia e' la forma piu' generica che
   *  esista, e tre oggetti con la stessa forma non distinguono niente. Quello
   *  che rende un catalogo un catalogo, e non una galleria, e' il prezzo. */
  catalogo: (
    <span data-m="scheda">
      <i data-m="tessera" data-grande="" />
      <span data-m="dettaglio">
        <Riga w={100} />
        <Riga w={70} />
        <i data-m="prezzo" />
      </span>
    </span>
  ),
  /**
   * Una ricevuta: tre voci, la linea di strappo, il totale in accento.
   *
   * Prima qui c'era una carta di credito — banda magnetica e gruppi di cifre —
   * ed erano due errori in uno. Il primo si vedeva: una carta disegnata dentro
   * una scheda che ha gia' la forma di una carta. Il secondo no, ed e' quello
   * grave: una carta e' il SIMBOLO del pagamento, non il pagamento. Era l'unico
   * dei ventidue campioni ad aver sfondato la regola.
   *
   * Una ricevuta e' l'unico oggetto FISICO fra tutti i modi di disegnare un
   * pagamento, e questo e' un tavolo con delle cose sopra: tutti gli altri
   * candidati — l'importo col bottone, i metodi, le rate — erano interfacce
   * disegnate dentro una scheda.
   */
  pagamenti: (
    <span data-m="ricevuta">
      <Riga w={78} />
      <Riga w={62} />
      <Riga w={70} />
      <i data-m="strappo" />
      <span data-m="voce" data-totale="">
        <Riga w={38} />
        <i data-m="importo" />
      </span>
    </span>
  ),
  /** Un mese, con un giorno preso. Il giorno preso e' in accento: e' l'unica
   *  cosa che una prenotazione aggiunge a un calendario. */
  prenotazioni: (
    <>
      <i data-m="riga" data-testa="" style={{ "--w": "100%" } as CSSProperties} />
      <span data-m="mese">{griglia(18, "giorno", 9)}</span>
    </>
  ),
  /**
   * Un codice articolo e una quantita'. La prima stesura metteva qui una
   * tabella — e "I dati", due anelli piu' in la', e' una tabella piu' fitta:
   * due oggetti con lo stesso disegno, che e' esattamente il difetto che i
   * campioni dovevano risolvere. Un gestionale guardato da lontano e' una
   * tabella come lo e' qualunque altra cosa; guardato da vicino e' codici e
   * quantita', e solo la seconda cosa e' sua.
   */
  gestionale: (
    <>
      <b data-m="mono">ART-0412</b>
      <Riga w={64} />
      <span data-m="qta">
        <Riga w={34} />
        <b data-m="mono" data-piccolo="">
          ×24
        </b>
      </span>
    </>
  ),

  // ── L'infrastruttura ─────────────────────────────────────────────────────
  dati: <span data-m="tabella" data-fitta="">{griglia(18, "cella")}</span>,
  /** La stessa sagoma tre volte, sfalsata. Nessun simbolo: una copia e' una
   *  ripetizione, e mostrarne tre e' letteralmente mostrare delle copie. */
  copie: (
    <>
      <i data-m="copia" data-i="3" />
      <i data-m="copia" data-i="2" />
      <i data-m="copia" data-i="1" />
    </>
  ),
  /** Un dominio non si disegna, si scrive: e' testo, ed e' sempre stato testo. */
  dominio: <b data-m="mono">nome.it</b>,
  /** Il lucchetto senza il lucchetto. Quello che di una connessione sicura si
   *  vede davvero sono quei sette caratteri nella barra degli indirizzi. */
  sicurezza: <b data-m="mono">https://</b>,
  /** La velocita' e' l'unica cosa di questo anello che si misura in un numero,
   *  e un numero e' il suo campione. */
  velocita: <b data-m="mono">0,4 s</b>,

  // ── I servizi ────────────────────────────────────────────────────────────
  assistente: (
    <>
      <i data-m="bolla" data-lato="qui" />
      <i data-m="bolla" data-lato="la" />
    </>
  ),
  automazioni: (
    <span data-m="flusso">
      <i data-m="nodo" />
      <i data-m="nodo" />
      <i data-m="nodo" />
    </span>
  ),
  numeri: (
    <span data-m="istogramma">
      <Barra h={38} />
      <Barra h={58} />
      <Barra h={46} />
      <Barra h={78} />
      <Barra h={100} />
    </span>
  ),
  /**
   * Tre risultati di ricerca, e il primo in accento. Non "un risultato": farsi
   * trovare non e' esistere in una lista — esistono tutti — e' stare in cima.
   * La differenza fra il campione di prima e questo e' una riga in piu' e tutto
   * il significato.
   */
  trovare: (
    <>
      {[
        [86, 52],
        [64, 40],
        [58, 44],
      ].map(([titolo, url], i) => (
        <span key={i} data-m="risultato" data-primo={i === 0 ? "" : undefined}>
          <i data-m="riga" style={{ "--w": `${titolo}%` } as CSSProperties} />
          <i data-m="riga" data-url="" style={{ "--w": `${url}%` } as CSSProperties} />
        </span>
      ))}
    </>
  ),
  manutenzione: <b data-m="mono">v2.4 → v2.5</b>,
};

/**
 * Il campione dentro un oggetto. Sta accanto alla sagoma e non dentro di lei:
 * [data-desk-shape] porta l'ombra dell'oggetto, e un'ombra su ognuna delle
 * marche di un campione impasterebbe un disegno che a 98 px ha gia' poco da
 * spendere. Come fratello prende lo stesso rettangolo — il <li> e' alto quanto
 * la sagoma — senza ereditarne il filtro.
 */
export function DeskSpecimen({ sample }: { sample: SampleId }) {
  return (
    <span data-desk-sample={sample} aria-hidden="true">
      {SPECIMENS[sample]}
    </span>
  );
}
