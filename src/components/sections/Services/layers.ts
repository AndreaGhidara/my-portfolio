import { deskLayers, type DeskShape } from "@/content/desk";

export type DeskLayout = "wide" | "tall";
export type Placement = { x: number; y: number; rotate: number };
export type Beat = { from: number; span: number };

/**
 * Le proporzioni del mondo, e nient'altro. Le coordinate degli oggetti sono
 * in percentuale: il mondo prende la misura che vuole dal CSS (aspect-ratio
 * piu' width) e qui dentro non si sa quanto e' grande lo schermo. E' lo stesso
 * trucco del filo, che usa un viewBox in percentuali per non ricalcolare nulla.
 */
export const WORLD: Record<DeskLayout, { width: number; height: number }> = {
  wide: { width: 1440, height: 920 },
  tall: { width: 720, height: 1280 },
};

/** Il laptop non e' uno degli oggetti dello schedario: e' il centro, ed e' una
 *  sagoma anche lui. */
export type DeskDrawing = DeskShape | "laptop";

/**
 * Il viewBox di ogni sagoma, identico a quello che scrive scripts/build-desk.mjs
 * (un test lo verifica: i due file non possono divergere). La misura di un
 * disegno e' un dato del disegno, non una percentuale scelta nel CSS: a una
 * larghezza unica per tutti il telefono, che e' 74x148, verrebbe alto il doppio
 * di un foglio e uscirebbe dal tavolo.
 *
 * Stanno qui e non nel componente perche' servono anche ai test: e' con questi
 * che si sa dove finisce il bordo di un oggetto, e non solo dov'e' il suo centro.
 */
export const SHAPE_BOX: Record<DeskDrawing, { w: number; h: number }> = {
  sheet: { w: 150, h: 96 },
  card: { w: 152, h: 78 },
  postit: { w: 126, h: 126 },
  plate: { w: 118, h: 54 },
  rack: { w: 132, h: 104 },
  phone: { w: 74, h: 148 },
  laptop: { w: 360, h: 240 },
};

/**
 * Quanto si disegna piu' piccolo nel mondo verticale. A misura naturale un
 * foglio occuperebbe un quinto della larghezza del telefono (150 su 720) e i
 * quattro strati non ci starebbero: il mondo verticale e' largo la meta' di
 * quello orizzontale, e i disegni lo seguono.
 */
export const DRAW_SCALE: Record<DeskLayout, number> = { wide: 1, tall: 0.5 };

/**
 * Le cifre con cui una percentuale arriva al CSS. Non e' una rifinitura: quel
 * numero viene serializzato due volte, una dal server dentro l'HTML e una dal
 * client dentro la prop, e le due serializzazioni non danno la stessa stringa —
 * 76.60017417717651 diventa "76.6002" da una parte e resta intero dall'altra.
 * React lo vede come un attributo che non combacia e lo dice in console a ogni
 * caricamento. Arrotondando alla sorgente le due stringhe sono la stessa.
 *
 * Quattro decimali sono molto sotto quello che il disegno sa esprimere: a 1440
 * un decimillesimo di percentuale e' un millesimo di pixel, e il punto piu'
 * stretto di questo tavolo si misura in punti interi.
 */
const CIFRE = 4;
const quota = (n: number) => +n.toFixed(CIFRE);

/**
 * Larghezza del disegno, in percentuale della larghezza del mondo. E' l'unica
 * misura che il CSS riceve: l'altezza la porta l'aspect-ratio della sagoma.
 *
 * Arrotondata come tutte le percentuali che finiscono in uno style inline: vedi
 * la nota di CIFRE.
 */
export function drawWidth(layout: DeskLayout, shape: DeskDrawing): number {
  return quota((DRAW_SCALE[layout] * SHAPE_BOX[shape].w * 100) / WORLD[layout].width);
}

/**
 * Altezza del disegno, in percentuale dell'ALTEZZA del mondo. Il mondo non e'
 * quadrato: una percentuale orizzontale e una verticale non misurano lo stesso
 * lato, ed e' esattamente la trappola in cui si cade scrivendone una sola.
 *
 * Si ricava dalla larghezza ARROTONDATA, non dal viewBox: nel browser l'altezza
 * non e' un numero che qualcuno scrive, e' la larghezza vera moltiplicata per
 * l'aspect-ratio della sagoma. Ripartendo dal viewBox il modello misurerebbe un
 * rettangolo alto qualche millesimo piu' di quello disegnato — poco, ma un
 * modello che non parte da quello che il browser ha in mano non e' il modello.
 */
export function drawHeight(layout: DeskLayout, shape: DeskDrawing): number {
  const { w, h } = SHAPE_BOX[shape];
  return (drawWidth(layout, shape) * h * WORLD[layout].width) / (w * WORLD[layout].height);
}

/**
 * Mezza larghezza e mezza altezza del solo DISEGNO, inclinazione compresa, in
 * percentuale del mondo. Non riscrive niente: chiede a objectFootprint lo stesso
 * rettangolo, senza etichetta. Senza etichetta l'ingombro e' simmetrico attorno
 * al centro, quindi il lato destro e il lato basso sono gia' le due mezze
 * estensioni. Una copia sola della rotazione, che e' la parte che si sbaglia.
 *
 * Attenzione: questo e' il disegno, non l'oggetto. L'oggetto e' il disegno PIU'
 * la sua etichetta, e si misura con objectFootprint().
 */
export function objectExtent(
  layout: DeskLayout,
  shape: DeskDrawing,
  rotate: number,
): { x: number; y: number } {
  const f = objectFootprint(layout, shape, rotate, false);
  return { x: f.x1, y: f.y1 };
}

/**
 * L'etichetta. Un oggetto su questo tavolo non e' la sua sagoma: e' la sagoma
 * piu' la parola che ci sta sotto, e finche' la striscia della parola non entra
 * nell'ingombro nessuna misura vede la collisione che si vede a occhio.
 *
 * La striscia si misura come uno SPAZIO RISERVATO e non come il testo vero:
 * "I dati" e' meta' di "Le prenotazioni", ma la geometria del tavolo non puo'
 * dipendere da quanto e' lunga una traduzione. Il posto e' sempre quello, il
 * testo ci sta dentro, e chi traduce non puo' far collassare il disegno.
 *
 * `width` e' la larghezza massima della striscia (max-width, in em: ci sta la
 * parola piu' lunga senza sbordare — 12 caratteri, 7,2em di avanzamento, piu'
 * il respiro laterale). `height` sono due righe piu' il respiro. `em` e' quanto
 * vale 1em in percentuale della LARGHEZZA del mondo: nel mondo orizzontale il
 * carattere e' fissato in rem su un mondo largo al piu' 62rem, in quello
 * verticale segue il contenitore (cqw). Sono i valori piu' larghi dei due
 * intervalli, perche' un ingombro sbagliato deve sbagliare in eccesso.
 *
 * Nessuno di questi quattro numeri e' scelto qui: sono tutti la traduzione di
 * una dichiarazione di tokens.css (interlinea e respiro per `height`, `top`
 * per `gap`, il corpo del carattere e la larghezza del mondo per `em`). E'
 * un contratto fra due file che non si parlano, e i test lo leggono davvero —
 * cambiare il foglio di stile senza cambiare qui fa cadere una prova. Serviva:
 * una prova di sovrapposizione e' cieca, per costruzione, a un ingombro che si
 * restringe, quindi rimpicciolire uno di questi numeri lascerebbe tutto verde.
 */
export const LABEL = {
  width: 7.7,
  height: 2.6,
  /** Stacco sotto il disegno, in frazione della sua altezza (in CSS: top 104%). */
  gap: 0.04,
  em: { wide: 1.197, tall: 2.72 } as Record<DeskLayout, number>,
};

/**
 * L'ingombro vero di un oggetto: il disegno, la striscia dell'etichetta sotto,
 * il tutto inclinato attorno al centro del disegno. Sono scostamenti dal centro,
 * in percentuale del mondo. Non e' simmetrico — l'etichetta sta solo sotto —
 * quindi non basta una mezza estensione per lato.
 */
export function objectFootprint(
  layout: DeskLayout,
  shape: DeskDrawing,
  rotate: number,
  labelled: boolean,
): { x0: number; x1: number; y0: number; y1: number } {
  const halfX = drawWidth(layout, shape) / 2;
  const halfY = drawHeight(layout, shape) / 2;
  let x0 = -halfX;
  let x1 = halfX;
  const y0 = -halfY;
  let y1 = halfY;
  if (labelled) {
    const em = LABEL.em[layout];
    const labelX = (LABEL.width * em) / 2;
    // L'altezza dell'etichetta e' in em, cioe' in frazioni della LARGHEZZA del
    // mondo: va riportata sull'altezza, o il mondo verticale la conta due volte.
    const labelY =
      LABEL.height * em * (WORLD[layout].width / WORLD[layout].height);
    x0 = Math.min(x0, -labelX);
    x1 = Math.max(x1, labelX);
    y1 = halfY + LABEL.gap * halfY * 2 + labelY;
  }
  const radians = (rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  // La rotazione del CSS avviene in PIXEL, e qui le due coordinate non hanno la
  // stessa unita': x e' una quota della larghezza del mondo, y una quota della
  // sua altezza. Ruotare quella coppia mista con la matrice isotropa
  // [cos -sin; sin cos] misura un rettangolo che il browser non disegna mai —
  // nel mondo orizzontale (1440x920) tiene troppo largo e troppo poco alto.
  // Si passa in pixel, si ruota, si torna: k e' altezza/larghezza del mondo.
  //   x' = x·cos − y·k·sin      y' = x·sin/k + y·cos
  const k = WORLD[layout].height / WORLD[layout].width;
  const corners = [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ].map(([x, y]) => [x * cos - y * k * sin, (x * sin) / k + y * cos]);
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

/**
 * Il centro. La sua misura non viene dal viewBox come per gli altri: e' il
 * centro della composizione, e la decide la composizione. `caption` e' la
 * striscia sotto il laptop dove sta la parola: fa parte dell'ingombro, perche'
 * e' li' che il primo strato non deve arrivare.
 */
export const CENTRE = { width: 21, caption: 3.0 };

/** Il rettangolo occupato dal centro, in percentuale del mondo. */
export function centreBox(layout: DeskLayout): {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
} {
  const halfX = CENTRE.width / 2;
  const halfY =
    ((CENTRE.width * SHAPE_BOX.laptop.h) / SHAPE_BOX.laptop.w / 2) *
    (WORLD[layout].width / WORLD[layout].height);
  return { x0: 50 - halfX, x1: 50 + halfX, y0: 50 - halfY, y1: 50 + halfY + CENTRE.caption };
}

/**
 * Sul telefono si mostrano quattro oggetti per strato invece di sei. I due che
 * restano fuori spariscono dal DISEGNO, non dalla lista: il DOM e' lo stesso.
 */
export const OBJECTS_PER_LAYER: Record<DeskLayout, number> = { wide: 6, tall: 4 };

/**
 * I raggi di ogni strato, in percentuale del mondo, contati dal centro. Gli
 * oggetti stanno sul perimetro di un rettangolo e non di un'ellisse: un tavolo
 * e' rettangolare, e agli angoli di un cerchio resta spazio sprecato.
 *
 * Questi otto raggi e i quattro angoli di partenza sono tarati insieme, contro
 * l'ingombro vero di objectFootprint(): sagoma PIU' etichetta, per tutte e 24 le
 * coppie del tavolo e non solo dentro uno strato. Il vincolo che li lega non e'
 * il raggio ma l'incastro: due strati vicini si toccano sull'asse verticale, e
 * l'unico modo di tenerli separati e' che dove uno sta in alto l'altro stia di
 * lato. Per questo gli anelli non sono omotetici — uno e' largo e basso, il
 * successivo stretto e alto — e per questo gli angoli non sono regolari.
 *
 * La taratura non punta a "non si sovrappongono" ma a un pavimento di aria
 * dichiarato: fra due cose qualsiasi del tavolo — due oggetti, un oggetto e il
 * centro, un oggetto e il bordo — resta piu' di 1,2 punti di altezza del mondo
 * (a 1440 sono piu' di sette pixel). Insieme ai raggi e agli angoli si tara
 * ANGLE_OFFSET, che e' quello che rende il pavimento raggiungibile: a passo
 * regolare il soffitto misurato e' 0,64 punti, e non si supera con nessuna
 * scelta di raggi.
 * Cambiarne uno solo a occhio rompe il tavolo: la prova sta in layers.test.ts.
 */
const RADII: Record<DeskLayout, { rx: number; ry: number }[]> = {
  wide: [
    { rx: 15.1, ry: 22.8 },
    { rx: 27.3, ry: 25.5 },
    { rx: 39.1, ry: 28.2 },
    { rx: 41.2, ry: 33.3 },
  ],
  tall: [
    { rx: 15.7, ry: 11.6 },
    { rx: 26.5, ry: 23.8 },
    { rx: 29.9, ry: 31.5 },
    { rx: 44.6, ry: 36.8 },
  ],
};

/** Da dove parte a distribuire gli oggetti ogni strato. Sfalsati apposta:
 *  allineati, i quattro strati formavano dei raggi e sembrava un sole. */
const START_ANGLE: Record<DeskLayout, number[]> = {
  wide: [159, -81, 120, -36],
  tall: [123, 164, -59, -149],
};

/**
 * Quanto ogni oggetto si scosta, in gradi, dal posto regolare che gli toccava
 * sull'anello. Su una scrivania vera le cose non stanno a distanze uguali: sei
 * oggetti ogni sessanta gradi si leggono come il quadrante di un orologio, non
 * come un piano su cui qualcuno lavora.
 *
 * E' anche l'unica cosa che fa spazio. A passo regolare il minimo raggiungibile
 * a 1440 e' 0,64% dell'altezza del mondo — quattro pixel, e li' finisce: non e'
 * una taratura sfortunata, e' il soffitto di quel modello, misurato. Con lo
 * scostamento si arriva a 1,58%, dieci pixel, con gli anelli che tornano anche
 * a crescere in tutte e due le direzioni invece di accavallarsi.
 *
 * Dipende dall'INDICE e non dallo strato: sei numeri per il mondo orizzontale e
 * quattro per quello verticale, non ventiquattro e sedici. I quattro strati non
 * si allineano lo stesso, perche' ognuno parte da un angolo suo. Chi li ritara
 * rilegga la nota su RADII: si muovono tutti insieme, e la prova che li tiene e'
 * "fra due cose qualsiasi resta aria vera".
 */
const ANGLE_OFFSET: Record<DeskLayout, number[]> = {
  wide: [11, 3, -16, 11, 3, -16],
  tall: [20, 8, 20, 8],
};

/** Distanza fra il perimetro dello strato e il centro dell'oggetto, in % di mezzo mondo. */
const PAD = 2.4;

/**
 * Intersezione fra un raggio e il perimetro di un rettangolo. Restituisce lo
 * scostamento dal centro, in percentuale di mezza larghezza / mezza altezza.
 */
function onRect(angle: number, rx: number, ry: number): [number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = Math.min(rx / Math.max(Math.abs(c), 1e-6), ry / Math.max(Math.abs(s), 1e-6));
  return [t * c, t * s];
}

/**
 * Il rettangolo che un oggetto occupa sul tavolo, in percentuale del mondo.
 * E' qui e non nei test perche' e' il modello: se il disegno e la prova
 * partissero da due misure diverse, la prova non proverebbe il disegno.
 */
export function objectBox(
  layout: DeskLayout,
  layer: number,
  index: number,
): { x0: number; x1: number; y0: number; y1: number } {
  const object = deskLayers[layer].objects[index];
  const placement = placeObject(layout, layer, index);
  const f = objectFootprint(layout, object.shape, placement.rotate, !object.mute);
  return {
    x0: placement.x + f.x0,
    x1: placement.x + f.x1,
    y0: placement.y + f.y0,
    y1: placement.y + f.y1,
  };
}

export function placeObject(layout: DeskLayout, layer: number, index: number): Placement {
  const count = OBJECTS_PER_LAYER[layout];
  const { rx, ry } = RADII[layout][layer];
  const angle =
    ((START_ANGLE[layout][layer] + index * (360 / count) + ANGLE_OFFSET[layout][index]) * Math.PI) /
    180;
  const [dx, dy] = onRect(angle, rx + PAD, ry + PAD);
  // Deterministico: nessun Math.random. Il tavolo deve uscire identico a ogni
  // render, o server e client disegnano due tavoli diversi e React protesta.
  const rotate = (((layer * 7 + index * 13) % 11) - 5) * 1.4;
  // Arrotondati qui e non nel componente: la prova della geometria deve misurare
  // gli stessi numeri che il browser disegna, non quelli da cui vengono.
  return { x: quota(50 + dx), y: quota(50 + dy), rotate: quota(rotate) };
}

/**
 * Le quattro finestre si sovrappongono: prima che uno strato abbia finito di
 * entrare, il successivo e' gia' cominciato. E' questo che fa stare in 380vh
 * l'arco che nel prototipo occupava 560vh.
 */
const BEAT_SPAN = 0.26;
const BEAT_STEP = 0.18;
const FIRST_LAYER_AT = 0.1;

export const LAYER_BEATS: Beat[] = deskLayers.map((_, i) => ({
  from: +(FIRST_LAYER_AT + i * BEAT_STEP).toFixed(4),
  span: BEAT_SPAN,
}));

/** Il titolo se ne va prima che entri il primo foglio: non si leggono insieme. */
export const TITLE_BEAT: Beat = { from: 0.02, span: 0.08 };

/** La tesi arriva a tavolo completo, e non un attimo prima. */
export const PUNCH_BEAT: Beat = { from: 0.9, span: 0.07 };

/**
 * La finestra di una didascalia. A tavolo fermo le quattro stanno in colonna e
 * si leggono tutte insieme; sotto la camera stanno tutte nello STESSO posto —
 * la fascia sotto l'angolo sinistro del piano — e allora una alla volta e'
 * l'unica lettura possibile: entra col suo strato, esce quando comincia il
 * successivo. L'ultima resta finche' non arriva la tesi, che e' la frase che la
 * sostituisce.
 *
 * E' l'unica finestra a due estremi del tavolo: gli oggetti entrano e restano,
 * queste si danno il cambio. Per questo `until` e non `span`.
 */
export type CaptionBeat = { from: number; until: number };

export const CAPTION_BEATS: CaptionBeat[] = LAYER_BEATS.map((beat, i) => ({
  from: beat.from,
  until: LAYER_BEATS[i + 1]?.from ?? PUNCH_BEAT.from,
}));

/**
 * Dentro uno strato gli oggetti non compaiono tutti insieme: si sfalsano sul
 * primo terzo della finestra, e finiscono comunque insieme allo strato.
 */
export function objectBeat(layer: number, index: number, count: number): Beat {
  const { from, span } = LAYER_BEATS[layer];
  const stagger = span * 0.35;
  return {
    from: +(from + (stagger * index) / count).toFixed(4),
    span: +(span - stagger).toFixed(4),
  };
}

/**
 * Interpolazione esponenziale, non lineare: una telecamera che arretra a
 * velocita' costante copre in percentuale sempre la stessa distanza, non in
 * pixel. Lineare, il movimento sembra frenare alla fine.
 */
export function cameraScale(p: number, from: number, to: number): number {
  const t = Math.min(Math.max(p, 0), 1);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return from * Math.pow(to / from, eased);
}
