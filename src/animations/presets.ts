"use client";

import { gsap, ScrollTrigger } from "./gsap";
import type { MotionLevel } from "./motionPolicy";

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
export function pulizia(
  targets: gsap.TweenTarget,
  clearProps?: boolean | string,
): gsap.TweenVars {
  if (!clearProps) return {};

  const quali = (typeof clearProps === "string" ? clearProps : "transform,opacity")
    .split(",")
    .map((nome) => nome.trim())
    .filter(Boolean);

  return {
    onComplete: () => {
      for (const bersaglio of gsap.utils.toArray<Element>(targets)) {
        if (!(bersaglio instanceof HTMLElement)) continue;
        for (const prop of quali) bersaglio.style.removeProperty(prop);
      }
    },
  };
}

/** La riga d'innesco che tocca a questo livello. Vedi INIZIO_ENTRATA. */
function inizio(level: MotionLevel): string {
  return level === "full" ? INIZIO_ENTRATA.pieno : INIZIO_ENTRATA.ridotto;
}

type Common = {
  level: MotionLevel;
  /** Elemento che fa scattare l'animazione entrando nel viewport. */
  trigger?: Element | null;
};

/**
 * SI TIMBRA — arriva sovradimensionato e storto, e si assesta con un
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
 * SI TESSE — i tratti si disegnano da capo a coda.
 * Lo scrub è consentito solo al livello "full": su touch è la prima
 * causa di scatti.
 */
// Le finestre di scorrimento stanno in ./finestre: e' un modulo di soli dati,
// senza "use client", cosi' lo possono leggere anche i Server Component.
export { TESSITURA, FINESTRA, CORSA_FRECCIA, TESSITURA_LAVORI, FINESTRE_FILO, INIZIO_ENTRATA } from "./finestre";
import { TESSITURA, FINESTRA, INIZIO_ENTRATA } from "./finestre";

/**
 * Quanto e' disegnata UNA corsa quando la testa del filo sta a `testa` pixel
 * dalla cima della finestra.
 *
 * E' quello che rende l'entrata una testa sola che scende invece di sette
 * corse che si accendono insieme. Su uno schermo alto la riga di tessitura al
 * caricamento cade gia' dentro la seconda sezione: dando a ognuna la propria
 * entrata, le prime due si disegnerebbero in parallelo. Facendo scendere la
 * testa da 0 fino alla riga, invece, ogni corsa si disegna quando la testa
 * attraversa la SUA fascia, e le altre stanno ferme. Alla fine della corsa la
 * testa e' esattamente dove la vuole lo scorrimento, quindi la consegna e'
 * senza salti.
 */
export function frazioneDiEntrata(testa: number, cima: number, altezza: number): number {
  if (altezza <= 0) return 0;
  return Math.min(1, Math.max(0, (testa - cima) / altezza));
}

export const INTRO_FILO = { ritardo: 1.1, durata: 1.3 } as const;

/**
 * La lunghezza da dare a `stroke-dasharray` perche' il tratto si disegni da
 * capo a coda, misurata NELLO SPAZIO IN CUI IL BROWSER CALCOLA IL TRATTEGGIO.
 *
 * Difetto vero, in pagina dal primo commit e diventato visibile solo quando il
 * filo ha smesso di essere quasi invisibile. Con `vector-effect:
 * non-scaling-stroke` il tratteggio si calcola in PIXEL DI SCHERMO, mentre
 * `getTotalLength()` misura in UNITA' DI VIEWBOX. I sei segmenti del filo
 * vivono in un viewBox 0-100 stirato a tutta pagina, quindi i due numeri
 * differiscono di un fattore che dipende da quanto e' grande la sezione:
 * misurato 7,6x su una corsa larga 1200px. Col dasharray in unita' di viewBox
 * il tratto non si disegna affatto: sfila un tratteggio di sette trattini.
 *
 * `pathLength` non serve: Chrome lo onora, ma lo risolve in unita' di viewBox
 * e poi non-scaling-stroke ri-scala lo stesso, quindi l'errore sopravvive.
 * Provato su banco, non dedotto.
 *
 * Senza quel vector-effect il tratteggio e' gia' in unita' di viewBox e
 * `getTotalLength()` e' la risposta giusta: e' il caso della ragnatela.
 */
export function lunghezzaDelTratteggio(path: SVGPathElement): number {
  const lunghezza = path.getTotalLength?.() ?? 0;
  if (!lunghezza) return 0;
  // L'attributo e non lo stile calcolato: tutti e tre i tratti del filo lo
  // dichiarano in JSX, e getComputedStyle qui costerebbe un reflow per path.
  if (path.getAttribute?.("vector-effect") !== "non-scaling-stroke") return lunghezza;

  const matrice = path.getScreenCTM?.();
  if (!matrice || !path.getPointAtLength) return lunghezza;

  const CAMPIONI = 128;
  let pixel = 0;
  let prima: { x: number; y: number } | null = null;
  for (let i = 0; i <= CAMPIONI; i++) {
    const q = path.getPointAtLength((lunghezza * i) / CAMPIONI);
    const p = {
      x: q.x * matrice.a + q.y * matrice.c + matrice.e,
      y: q.x * matrice.b + q.y * matrice.d + matrice.f,
    };
    if (prima) pixel += Math.hypot(p.x - prima.x, p.y - prima.y);
    prima = p;
  }
  return pixel || lunghezza;
}

export function weave(
  paths: SVGPathElement[],
  {
    level,
    trigger,
    scrub = false,
    stagger = 0.12,
    start,
    end,
    intro = false,
  }: Common & {
    scrub?: boolean;
    stagger?: number;
    /**
     * La finestra dello scrub, per chi ne ha una sua. Il default e' TESSITURA:
     * apre e chiude sulla stessa riga dello schermo, perche' il filo si legga
     * come una testa sola che scende invece che come sette corse che partono
     * quando vogliono. Chi lo sovrascrive rinuncia alla consegna esatta con la
     * sezione vicina, e deve avere un motivo: i cavi del tavolo devono
     * arrivare al loro stato finale esattamente quando ci arriva la camera,
     * che e' il fotogramma a riposo e l'unico in cui il filo va a posto.
     * Ignorati fuori dallo scrub.
     */
    start?: string;
    end?: string;
    /**
     * Il filo si disegna al caricamento invece di essere gia' li'. Serve
     * all'apertura: quando la pagina si apre la riga di tessitura e' gia'
     * oltre il fondo di quella sezione, quindi senza entrata il suo tratto
     * risulta fatto prima che qualcuno lo guardi. Ignorato fuori da "full":
     * a movimento ridotto il filo c'e' e basta.
     */
    intro?: boolean;
  },
): gsap.core.Timeline | null {
  if (level === "none" || paths.length === 0) return null;

  const useScrub = scrub && level === "full";
  const conIntro = intro && level === "full";

  // Quanto e' tessuta ogni corsa, da 0 a 1. Il tween anima QUESTI numeri e non
  // direttamente lo stroke-dashoffset, e il giro in piu' si paga da solo:
  //  - l'entrata al caricamento e lo scorrimento si MOLTIPLICANO invece di
  //    contendersi la stessa proprieta', quindi l'entrata disegna fino al
  //    punto in cui lo scorrimento e' gia' arrivato, e da li' si prosegue
  //    senza salti;
  //  - il dasharray puo' cambiare a ogni riflow senza che il tween ne sappia
  //    niente, perche' il tween va sempre da 0 a 1. Prima serviva invalidate()
  //    per rifargli imparare il valore di partenza.
  const quote = paths.map(() => ({ v: 0 }));
  const entrata = { v: conIntro ? 0 : 1 };
  let lunghezze: number[] = paths.map(() => 0);

  // Mentre l'entrata e' in corso comanda lei e lo scorrimento aspetta: sono due
  // descrizioni della stessa cosa (dove sta la testa del filo), e se
  // scrivessero tutte e due si contenderebbero la stessa proprieta'.
  //
  // Il riquadro della sezione si rilegge a ogni fotogramma invece di
  // memorizzarlo al caricamento, ed e' la scelta che semplifica tutto: se la
  // pagina si muove durante l'entrata il filo la segue da solo, e quando
  // l'entrata finisce la testa E' la riga di tessitura, cioe' esattamente dove
  // la vuole lo scorrimento, a qualunque altezza si sia arrivati. Niente resa
  // da negoziare e nessun ascoltatore da staccare: la prima versione ne aveva
  // uno, e Lenis lo faceva scattare all'avvio senza che la pagina si fosse
  // mossa, uccidendo l'entrata a intermittenza.
  const scrivi = () => {
    let entrante: number | null = null;
    if (entrata.v < 1 && trigger instanceof Element) {
      const riquadro = trigger.getBoundingClientRect();
      entrante = frazioneDiEntrata(
        entrata.v * FINESTRA * window.innerHeight,
        riquadro.top,
        riquadro.height,
      );
    }
    paths.forEach((path, i) => {
      gsap.set(path, { strokeDashoffset: lunghezze[i] * (1 - (entrante ?? quote[i].v)) });
    });
  };

  // La lunghezza a schermo dipende da quanto e' grande la sezione, quindi
  // cambia a ogni riflow, mentre quella in unita' di viewBox non cambiava mai:
  // e' il prezzo di misurare nello spazio giusto. ScrollTrigger si aggiorna da
  // solo al resize, e `onRefreshInit` e' il momento in cui ristendere.
  const stendi = () => {
    lunghezze = paths.map(lunghezzaDelTratteggio);
    paths.forEach((path, i) => gsap.set(path, { strokeDasharray: lunghezze[i] }));
    scrivi();
  };
  stendi();

  const timeline = gsap.timeline({
    scrollTrigger: trigger
      ? {
          trigger,
          start: useScrub ? (start ?? TESSITURA.inizio) : "top 85%",
          end: useScrub ? (end ?? TESSITURA.fine) : undefined,
          scrub: useScrub ? 0.6 : false,
          once: !useScrub,
          onRefreshInit: stendi,
        }
      : undefined,
  });

  timeline.to(quote, {
    v: 1,
    duration: level === "full" ? 1.1 : 0.6,
    ease: useScrub ? "none" : "power2.inOut",
    stagger: level === "full" ? stagger : 0,
    onUpdate: scrivi,
    onComplete: scrivi,
  });

  if (conIntro) {
    scrivi();
    gsap.to(entrata, {
      v: 1,
      duration: INTRO_FILO.durata,
      delay: INTRO_FILO.ritardo,
      ease: "power2.inOut",
      onUpdate: scrivi,
      onComplete: scrivi,
    });
  }

  return timeline;
}

/**
 * SI DIPINGE — il colore avanza sotto una maschera invece di comparire.
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
       il CSS usa `transform` per qualcos'altro — le cartelle dei Lavori si
       alzano di 6px al passaggio del mouse — l'entrata gli lascia addosso un
       translate(0,0) e quel sollevamento non succede piu'. Qui si ripulisce
       quello che l'entrata ha scritto, e il CSS torna padrone. */
    ...pulizia(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: inizio(level), once: true } : undefined,
  });
}

/**
 * ARRIVA DI LATO — entra scorrendo dal bordo che gli e' stato assegnato.
 *
 * Il verso non se lo inventa l'animazione: i blocchi di «E in pratica?» e le
 * quattro consegne portano gia' un `data-lato`, che e' il lato da cui il
 * disegno sta gia' impaginato. Facendoli entrare da li', il movimento e'
 * l'impaginato che si compone, non un effetto appiccicato sopra.
 *
 * Le distanze sono corte apposta: un blocco che attraversa mezzo schermo su un
 * telefono e' una pagina che balla, e chi scorre veloce lo prende in faccia a
 * meta' strada.
 */
export function daLato(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    verso,
    stagger = 0,
    delay = 0,
    clearProps = false,
  }: Common & { verso: "sx" | "dx"; stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  const distanza = (level === "full" ? 90 : 56) * (verso === "sx" ? -1 : 1);

  return gsap.from(targets, {
    opacity: 0,
    x: distanza,
    duration: level === "full" ? 0.85 : 0.68,
    ease: "power3.out",
    delay,
    stagger,
    ...pulizia(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: inizio(level), once: true } : undefined,
  });
}

/**
 * ARRIVA DA DIETRO — cresce dal fondo e si mette a fuoco.
 *
 * Non e' uno zoom: la scala parte vicina a 1 e il movimento vero e' il fatto
 * che la cosa era piu' lontana un attimo prima. Sopra il 10% di scala si legge
 * come un ingrandimento, e un ingrandimento su un titolo grande e' un effetto.
 */
export function daDietro(
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
    ...pulizia(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: inizio(level), once: true } : undefined,
  });
}

/**
 * CADE E SI ATTACCA — scende da sopra e si ferma con un rimbalzo corto.
 *
 * E' il gesto di appuntare: un tesserino sul foglio, un francobollo sulla
 * busta. Il rimbalzo (`back.out`) e' quello che lo fa leggere come una cosa
 * appoggiata da una mano invece che come un blocco che scivola.
 */
export function dallAlto(
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
    ...pulizia(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: inizio(level), once: true } : undefined,
  });
}

/** Da chiamare quando cambia il layout in un modo che ScrollTrigger non può dedurre. */
export function refreshTriggers(): void {
  ScrollTrigger.refresh();
}
