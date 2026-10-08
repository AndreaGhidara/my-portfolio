"use client";

import { gsap } from "./gsap";
import type { MotionLevel } from "./motionPolicy";
// La riga d'innesco sta in ./finestre: e' un modulo di soli dati, senza
// "use client", cosi' la possono leggere anche i Server Component.
import { ENTRANCE_START } from "./timing";
export { ENTRANCE_START } from "./timing";

/**
 * La pulizia di fine entrata, fatta a mano.
 *
 * Serve dove il foglio di stile usa `transform` anche per altro: le cartelle
 * dei Lavori si alzano di 6px al passaggio del mouse, e un `transform` scritto
 * in linea dall'entrata batte il CSS per sempre.
 *
 * Perche' non `clearProps`, che GSAP ha apposta: con quello attivo ogni
 * fotogramma di ogni entrata lanciava «Cannot read properties of undefined
 * (reading 'split')» da dentro il plugin, e scorrendo la pagina la console si
 * riempiva di eccezioni. Le animazioni giravano lo stesso, ma una console che
 * urla e' una console che nessuno legge piu'. Verificato bisezionando: spento
 * clearProps, zero errori; riacceso, tornano.
 *
 * Qui si toglie la proprieta' e basta, a mano, quando il movimento e' finito.
 * Restituisce un oggetto VUOTO se non c'e' niente da pulire: nessuna chiave
 * fantasma nelle vars.
 */
/**
 * Quello che GSAP scrive in linea quando muove qualcosa, e che va tolto per
 * restituire il comando al foglio di stile.
 *
 * `translate`, `rotate` e `scale` non sono di troppo: Tailwind v4 NON compila
 * piu' le utility di trasformazione dentro `transform`, le scrive nelle
 * proprieta' indipendenti: `-translate-y-[16%]` diventa `translate: 0 -16%`.
 * GSAP, per non litigare con loro, le azzera in linea (`translate: none`).
 * Togliendo solo `transform` si lascia addosso quell'azzeramento, e l'elemento
 * resta senza la trasformazione che il CSS gli dava: il ritratto
 * dell'apertura, finita l'entrata, tornava dentro il cerchio da cui doveva
 * sporgere. Verificato leggendo lo stile in linea a fine tween.
 */
const MOTION_PROPS = "transform,opacity,translate,rotate,scale,transform-origin";

export function cleanup(
  targets: gsap.TweenTarget,
  clearProps?: boolean | string,
): gsap.TweenVars {
  if (!clearProps) return {};

  const props = (typeof clearProps === "string" ? clearProps : MOTION_PROPS)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    onComplete: () => {
      for (const el of gsap.utils.toArray<Element>(targets)) {
        if (!(el instanceof HTMLElement)) continue;
        for (const prop of props) el.style.removeProperty(prop);
      }
    },
  };
}

/** La riga d'innesco che tocca a questo livello. Vedi INIZIO_ENTRATA. */
function entranceStart(level: MotionLevel): string {
  return level === "full" ? ENTRANCE_START.full : ENTRANCE_START.reduced;
}

type Common = {
  level: MotionLevel;
  /** Elemento che fa scattare l'animazione entrando nel viewport. */
  trigger?: Element | null;
};

/**
 * SI TIMBRA: arriva sovradimensionato e storto, e si assesta con un
 * rimbalzo. Su "reduced" battono tutti insieme, senza rotazione.
 */
export function stamp(
  targets: gsap.TweenTarget,
  { level, trigger, stagger = 0.08 }: Common & { stagger?: number },
): gsap.core.Timeline | null {
  if (level === "none") return null;

  const timeline = gsap.timeline({
    scrollTrigger: trigger ? { trigger, start: "top 80%", once: true } : undefined,
  });

  timeline.from(targets, {
    opacity: 0,
    scale: level === "full" ? 1.6 : 1.15,
    rotate: () => (level === "full" ? gsap.utils.random(-3, 3) : 0),
    duration: level === "full" ? 0.55 : 0.4,
    ease: "back.out(1.7)",
    stagger: level === "full" ? stagger : 0,
  });

  return timeline;
}

/**
 * SI TESSE: i tratti si disegnano da capo a coda. Oggi lo usa solo la
 * ragnatela, che non ha `vector-effect: non-scaling-stroke`: il tratteggio e'
 * in unita' di viewBox, e `getTotalLength()` e' gia' la lunghezza giusta.
 */
export function weave(
  paths: SVGPathElement[],
  { level, trigger, stagger = 0.12 }: Common & { stagger?: number },
): gsap.core.Timeline | null {
  if (level === "none" || paths.length === 0) return null;

  paths.forEach((path) => {
    const length = path.getTotalLength?.() ?? 0;
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  });

  const timeline = gsap.timeline({
    scrollTrigger: trigger ? { trigger, start: "top 85%", once: true } : undefined,
  });

  timeline.to(paths, {
    strokeDashoffset: 0,
    duration: level === "full" ? 1.1 : 0.6,
    ease: "power2.inOut",
    stagger: level === "full" ? stagger : 0,
  });

  return timeline;
}

/**
 * SI DIPINGE: il colore avanza sotto una maschera invece di comparire.
 * Anima la custom property --paint, non la geometria.
 */
export function paint(
  target: Element | null,
  { level, trigger }: Common,
): gsap.core.Tween | null {
  if (level === "none" || !target) return null;

  gsap.set(target, { "--paint": "0%" });
  return gsap.to(target, {
    "--paint": "100%",
    duration: level === "full" ? 0.9 : 0.5,
    ease: "power2.inOut",
    scrollTrigger: trigger ? { trigger, start: "top 80%", once: true } : undefined,
  });
}

/**
 * CRESCE: arriva grande come un punto e si apre fino alla sua misura.
 *
 * Nato per il ritratto dell'apertura, che e' l'unica immagine del sito a stare
 * dentro un altro disegno: il cerchio si dipinge, e mentre si dipinge la testa
 * ci cresce dentro. Senza, il ritratto era li' dal primo fotogramma e il
 * cerchio sembrava arrivare sotto una cosa gia' successa.
 *
 * `origine` esiste per questo: il punto da cui si cresce non e' il centro
 * dell'immagine ma il centro del CERCHIO, che sta piu' in basso perche' il
 * ritratto e' alzato per fargli uscire la testa. Crescendo dal proprio centro,
 * la testa si aprirebbe a cavallo del bordo invece che da dentro.
 *
 * `back.out` e non un'uscita liscia: una cosa che si apre e si ferma netta
 * sembra uno zoom, una che sfora di un soffio e torna sembra una cosa che si
 * posa.
 */
export function grow(
  target: Element | null,
  {
    level,
    trigger,
    origin = "50% 50%",
    delay = 0,
  }: Common & { origin?: string; delay?: number },
): gsap.core.Tween | null {
  if (level === "none" || !target) return null;

  return gsap.from(target, {
    /* Minuscolo davvero: a 0.3 non si legge come "cresce", si legge come
       "era gia' li' e si e' assestato". */
    scale: level === "full" ? 0.05 : 0.08,
    opacity: 0,
    transformOrigin: origin,
    duration: level === "full" ? 0.8 : 0.6,
    ease: "back.out(1.4)",
    delay,
    /* Il ritratto porta un translate scritto nel CSS: e' alzato del 16% per
       far uscire la testa dal cerchio. Un `from` lascerebbe in linea la
       matrice d'arrivo, che quel translate lo contiene ma congelato in pixel:
       cambiando larghezza dello schermo il cerchio cambia misura e la testa
       resterebbe alzata dei pixel di prima. Si toglie, e il CSS torna
       padrone. */
    ...cleanup(target, true),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}

/** Ingresso sobrio per tutto il resto: sale e compare. Mai una dissolvenza sola. */
export function reveal(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    stagger = 0.07,
    delay = 0,
    clearProps = false,
  }: Common & { stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  return gsap.from(targets, {
    opacity: 0,
    y: level === "full" ? 28 : 16,
    /* Un filo piu' lunghe di prima, e con un'uscita piu' morbida: a 0,45s il
       movimento finiva mentre l'occhio ci arrivava sopra, e si leggeva come uno
       scatto invece che come una cosa che si posa. */
    duration: level === "full" ? 0.75 : 0.58,
    ease: "power3.out",
    delay,
    stagger,
    /* Un `from` finisce lasciando scritto nello stile in linea lo stato
       d'arrivo, e uno stile in linea batte il foglio di stile per sempre. Dove
       il CSS usa `transform` per qualcos'altro (le cartelle dei Lavori si
       alzano di 6px al passaggio del mouse), l'entrata gli lascia addosso un
       translate(0,0) e quel sollevamento non succede piu'. Qui si ripulisce
       quello che l'entrata ha scritto, e il CSS torna padrone. */
    ...cleanup(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}

/**
 * ARRIVA DI LATO: entra scorrendo dal bordo che gli e' stato assegnato.
 *
 * Il verso non se lo inventa l'animazione: le quattro consegne portano gia'
 * un `data-lato`, che e' il lato da cui il disegno sta gia' impaginato. Facendoli entrare da li', il movimento e'
 * l'impaginato che si compone, non un effetto appiccicato sopra.
 *
 * Le distanze sono corte apposta: un blocco che attraversa mezzo schermo su un
 * telefono e' una pagina che balla, e chi scorre veloce lo prende in faccia a
 * meta' strada.
 */
export function fromSide(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    direction,
    stagger = 0,
    delay = 0,
    clearProps = false,
  }: Common & { direction: "left" | "right"; stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  const distance = (level === "full" ? 90 : 56) * (direction === "left" ? -1 : 1);

  return gsap.from(targets, {
    opacity: 0,
    x: distance,
    duration: level === "full" ? 0.85 : 0.68,
    ease: "power3.out",
    delay,
    stagger,
    ...cleanup(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}

/**
 * ARRIVA DA DIETRO: cresce dal fondo e si mette a fuoco.
 *
 * Non e' uno zoom: la scala parte vicina a 1 e il movimento vero e' il fatto
 * che la cosa era piu' lontana un attimo prima. Sopra il 10% di scala si legge
 * come un ingrandimento, e un ingrandimento su un titolo grande e' un effetto.
 */
export function fromBehind(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    stagger = 0.06,
    delay = 0,
    clearProps = false,
  }: Common & { stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  return gsap.from(targets, {
    opacity: 0,
    scale: level === "full" ? 0.9 : 0.94,
    y: level === "full" ? 18 : 12,
    duration: level === "full" ? 0.8 : 0.64,
    ease: "power3.out",
    delay,
    stagger,
    ...cleanup(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}

/**
 * CADE E SI ATTACCA: scende da sopra e si ferma con un rimbalzo corto.
 *
 * E' il gesto di appuntare: un tesserino sul foglio, un francobollo sulla
 * busta. Il rimbalzo (`back.out`) e' quello che lo fa leggere come una cosa
 * appoggiata da una mano invece che come un blocco che scivola.
 */
export function fromAbove(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    stagger = 0.08,
    delay = 0,
    clearProps = false,
  }: Common & { stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  return gsap.from(targets, {
    opacity: 0,
    y: level === "full" ? -56 : -40,
    duration: level === "full" ? 0.72 : 0.6,
    /* Rimbalzo appena piu' corto di prima: con 1.6 e una durata piu' lunga il
       tesserino ballava. */
    ease: "back.out(1.4)",
    delay,
    stagger,
    ...cleanup(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}
