"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ScrollTrigger as TipoScrollTrigger } from "gsap/ScrollTrigger";
import { INIZIO_ENTRATA } from "@/animations/finestre";
import { useMotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { DeskTable, type DeskLayerData } from "./DeskTable";
import { CENTRE, FIRST_RING_REACH, SHAPE_BOX, cameraScale } from "./layers";

/** Quanta parte dell'altezza del palco occupa il laptop al fotogramma zero. */
const OPENING_FILL = 0.7;

/**
 * Quanto e' alto il laptop, in frazione della LARGHEZZA del piano. Non e' un
 * numero scelto qui: e' la larghezza dichiarata da CENTRE per il rapporto della
 * sua scatola. Scriverlo a mano — 240/920, o qualunque altra coppia che
 * somiglia — vorrebbe dire tenerne una seconda copia che il giorno in cui il
 * centro cambia misura nessuno aggiorna, e la camera aprirebbe sull'inquadratura
 * sbagliata senza che niente lo dica.
 */
const LAPTOP_ON_SURFACE = (CENTRE.width / 100) * (SHAPE_BOX.laptop.h / SHAPE_BOX.laptop.w);

/**
 * Quanto vale, in questa scena, "il primo anello arriva giusto al bordo mentre
 * compare": e' il PRODOTTO fra la scala d'apertura e il raggio verticale del
 * primo anello, ed e' quel prodotto — non la scala da sola — a restare costante
 * quando i raggi cambiano. La coppia da cui viene e' 4,2 su un raggio di 25,2,
 * cioe' l'apertura tarata a mano prima che gli anelli venissero separati.
 */
const OPENING_REACH = 4.2 * 25.2;

/**
 * Gli estremi dell'inquadratura d'apertura. Il minimo perche' sotto non si
 * legge come una camera che arretra ma come un tavolo che sussulta; il massimo
 * perche' piu' in la' il primo anello comincia ad accendersi fuori dallo
 * schermo, e da li' in poi e' la camera che lo porta dentro.
 *
 * Il massimo non e' piu' una cifra scritta: e' OPENING_REACH diviso il raggio
 * che il primo anello ha ADESSO. Con gli anelli separati quel raggio e' passato
 * da 25,2 a 28,68, e il massimo scende di conseguenza da 4,2 a circa 3,69 —
 * l'anello e' piu' in fuori, quindi per tenerlo allo stesso punto dello schermo
 * serve meno ingrandimento. Scritto a mano, il 4,2 sarebbe rimasto li' a far
 * accendere il primo strato oltre il bordo.
 */
const OPENING = { min: 1.6, max: OPENING_REACH / FIRST_RING_REACH };

/** La scala d'apertura quando non c'e' niente da misurare (jsdom, o un piano
 *  che non ha ancora una larghezza). */
const OPENING_FALLBACK = 3.3;

/**
 * Dove si ferma la camera. A tavolo finito la tesi («quello che chiami un sito
 * e' lo schermo al centro») vive nella stessa cella del mondo, appoggiata in
 * fondo: su uno schermo alto le due cose non si toccano, su un portatile da
 * 1280x800 il piano arriva fin giu' e la frase finisce addosso ai disegni.
 *
 * Alzare la frase non basta, e non e' un'opzione: il palco ha `overflow: clip`,
 * quindi spostare il mondo in su gli taglia il bordo di sopra invece di
 * liberare spazio. L'unica leva che una fascia in fondo la libera davvero e'
 * fermare la camera un po' prima di 1.
 *
 * Non per tutti pero': dove il problema non c'e' il tavolo resta grande quanto
 * e' stato disegnato. La soglia e' sull'altezza del palco, che e' il viewport e
 * non lo schermo: su un monitor 1080p la finestra ne lascia sui 950, quindi
 * mille prende i portatili e i 1080p e lascia stare i pannelli piu' alti.
 */
const CLOSING = { tall: 1, short: 0.88 };
const SHORT_STAGE = 1000;

/**
 * Il palco. Un solo ScrollTrigger, e non tocca un elemento: scrive due custom
 * property sul palco — --p (la progressione) e --s (la scala della camera) — e
 * le ventiquattro opacita' le calcola il CSS. E' lo stesso principio del filo,
 * che usa un viewBox in percentuali per non ricalcolare niente.
 *
 * Niente `pin`: il palco e' sticky dentro un track alto 380vh, cosi' non c'e'
 * un pin-spacer da far litigare con Lenis.
 *
 * La scala d'apertura si rimisura solo su onRefresh, mai per fotogramma:
 * leggere clientWidth a ogni update vorrebbe dire un layout per fotogramma.
 *
 * `data-motion` porta il livello risolto fino al CSS, che e' l'unico posto dove
 * il movimento esiste: a "full" il track diventa alto 380vh e i tre blocchi si
 * sovrappongono, a "reduced" e a "none" non si applica una riga e resta il
 * tavolo fermo di prima. useMotionLevel dice "none" in SSR e al primo render,
 * quindi fermo e completo e' anche quello che si vede senza JavaScript.
 */
export function DeskStage({
  eyebrow,
  title,
  lead,
  centre,
  composto,
  blank,
  note,
  punch,
  layers,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  centre: string;
  /** Il titolino sopra gli strati, solo sotto i 1024px. */
  composto: string;
  blank: string;
  /** La nota sul post-it grigio. */
  note: string;
  punch: string;
  layers: DeskLayerData[];
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const camera = useRef<TipoScrollTrigger | null>(null);
  const level = useMotionLevel();

  /**
   * Smontare la camera e cancellare le due property. Serve una funzione sola
   * perche' i modi di uscire da "full" sono tre — la finestra si stringe sotto
   * i 1024, arriva un puntatore grosso, l'utente accende la riduzione del
   * movimento — e in nessuno dei tre basta smettere di scrivere: --p resterebbe
   * appiccicata all'ultimo valore, e siccome l'opacita' degli oggetti la legge
   * SEMPRE (e' il patto del fallback, `var(--p, 1)`), il tavolo fermo si
   * ritroverebbe mezzo trasparente. E il vecchio ScrollTrigger continuerebbe a
   * riscriverla a ogni giro di rotellina.
   */
  const spegni = useCallback(() => {
    camera.current?.kill();
    camera.current = null;
    stage.current?.style.removeProperty("--p");
    stage.current?.style.removeProperty("--s");
  }, []);

  // useGSAP con delle dipendenze rimanda il revert allo smontaggio, non al
  // cambio di livello — e a livello "none" useSectionAnimation non chiama
  // nemmeno la build. Chi esce da "full" non avrebbe quindi nessuno a spegnergli
  // la camera: questo effetto e' quel qualcuno.
  //
  // useLayoutEffect e non useEffect: il commit che porta via il CSS della camera
  // e questa pulizia devono stare nello stesso giro. Passivo, si spegne DOPO che
  // il browser ha gia' dipinto un fotogramma senza le regole di "full" ma con
  // --p ancora appiccicata all'ultimo valore, e quel fotogramma e' un tavolo
  // mezzo trasparente. In SSR non gira, e non e' un problema: un cambio di
  // livello sul server non esiste.
  useLayoutEffect(() => {
    if (level !== "full") spegni();
  }, [level, spegni]);

  useSectionAnimation(({ level: resolved, gsap, ScrollTrigger, presets }) => {
    const { daDietro, reveal } = presets;
    const stageEl = stage.current;
    const trackEl = track.current;

    /* Sotto il livello pieno la camera non scende: il tavolo sta fermo e la
       testata comparirebbe e basta. Le si da' l'entrata che hanno tutte le
       altre sezioni, e la sezione smette di essere l'unica che appare secca. */
    if (resolved !== "full") {
      /* Senza impaginazione non c'e' niente da animare, e ScrollTrigger non ha
         metriche da cui partire: in jsdom ogni rettangolo e' alto zero e la
         creazione del trigger scoppia. E' anche la risposta giusta nel browser:
         un palco alto zero non e' sullo schermo di nessuno. */
      if (!scope.current || scope.current.offsetHeight === 0) return;

      const testata = scope.current?.querySelector<HTMLElement>("[data-desk-title]");
      if (testata) {
        daDietro(Array.from(testata.children), {
          level: resolved,
          trigger: testata,
          stagger: 0.08,
        });
      }

      /* I quattro strati, uno alla volta mentre scendi.
         Dentro ogni strato l'ordine e' quello con cui si leggono: prima il
         nome («Il sito»), poi la riga che lo spiega, poi i quattro disegni che
         si compongono dentro. Non insieme: il nome deve arrivare prima, o i
         disegni si guardano senza sapere di cosa sono.

         Il mondo e' quello "tall": sotto i 1024px e' l'unico che si vede
         (l'altro il CSS lo riduce a un pixel), ed e' il gemello, quindi tutto
         quello che c'e' dentro e' gia' aria-hidden. */
      const mondo = scope.current?.querySelector<HTMLElement>(
        '[data-desk-world][data-layout="tall"]',
      );

      /* Il progetto: il laptop al centro del tavolo, con dentro il sito finito.
         Da telefono e da tablet non aveva entrata ed era l'unica cosa della
         sezione che compariva secca.
         Arriva da dietro, poi il sito dentro lo schermo si compone riga per
         riga — la barra, il titolo, le tre righe, il bottone arancione — e per
         ultima cade la didascalia. E' la stessa cosa che dice la sezione: un
         sito finito e' l'ultima cosa che si vede, non la prima che si fa.
         clearProps su transform perche' il CSS tiene laptop ed etichetta
         centrati con un translate in percentuale: uno in pixel scritto in
         linea smetterebbe di seguire la scatola quando cambia misura. */
      const centro = mondo?.querySelector<HTMLElement>("[data-desk-centre]");
      if (centro && mondo && mondo.offsetHeight > 1) {
        const schermo = [...centro.querySelectorAll<HTMLElement>("[data-desk-screen] > *")];
        const etichetta = centro.querySelector<HTMLElement>("[data-desk-centre-label]");

        const linea = gsap.timeline({
          scrollTrigger: { trigger: centro, start: INIZIO_ENTRATA.ridotto, once: true },
        });
        linea.add(
          daDietro(centro, { level: resolved, clearProps: "transform" }) ?? gsap.timeline(),
        );
        if (schermo.length) {
          linea.add(
            daDietro(schermo, { level: resolved, stagger: 0.07, clearProps: "transform" }) ??
              gsap.timeline(),
            "-=0.32",
          );
        }
        if (etichetta) {
          linea.add(
            reveal(etichetta, { level: resolved, clearProps: "transform" }) ?? gsap.timeline(),
            "-=0.25",
          );
        }
      }

      // `offsetHeight` a zero vuol dire che questo mondo non e' quello mostrato
      // (sopra i 1024px il CSS lo riduce a un pixel): li' non c'e' niente da far
      // entrare.
      const strati = mondo && mondo.offsetHeight > 1
        ? mondo.querySelectorAll<HTMLElement>("[data-desk-layer]")
        : [];

      for (const strato of strati) {
        const didascalia = strato.querySelector<HTMLElement>("[data-desk-caption]");
        const nome = didascalia?.querySelectorAll<HTMLElement>("[data-desk-num], h3");
        const riga = didascalia?.querySelector<HTMLElement>("p");
        // Sul telefono ne entrano quattro per strato: gli altri sono
        // display:none, e offsetParent e' il modo di chiederlo al browser
        // invece di ricontare qui una regola che vive nel CSS.
        const disegni = [
          ...strato.querySelectorAll<HTMLElement>("[data-desk-object]"),
        ].filter((el) => el.offsetParent !== null);

        /* Due inneschi e non uno, ed e' la stessa lezione dello schedario: il
           blocco di uno strato e' alto mezzo schermo abbondante, e agganciando
           tutto alla sua cima i quattro disegni si componevano mentre erano
           ancora sotto la piega. La didascalia scatta sulla didascalia, i
           disegni sulla griglia dei disegni: ognuno entra quando e' lui a
           entrare nello schermo. */
        if (didascalia && (nome?.length || riga)) {
          const linea = gsap.timeline({
            // Qui siamo per forza sotto il livello pieno: la riga e' quella.
            scrollTrigger: { trigger: didascalia, start: INIZIO_ENTRATA.ridotto, once: true },
          });
          if (nome?.length) {
            linea.add(daDietro([...nome], { level: resolved, stagger: 0.06 }) ?? gsap.timeline());
          }
          if (riga) {
            linea.add(reveal(riga, { level: resolved }) ?? gsap.timeline(), "-=0.28");
          }
        }

        const griglia = strato.querySelector<HTMLElement>("ul");
        if (griglia && disegni.length) {
          /* L'opacita' di questi pezzi la scrive React in linea, e non e' un
             numero: e' `clamp(0, (var(--p) - var(--from)) / var(--span), 1)`,
             cioe' la camera che li accende uno strato alla volta. GSAP non sa
             interpolare verso una funzione CSS: arrivato al suo turno metteva
             direttamente il valore finale, e il disegno compariva di scatto
             invece di dissolversi. Si vedeva, ed e' il difetto per cui questa
             riga esiste.
             A livello ridotto quella clamp vale comunque 1 (--p non lo scrive
             nessuno, e senza vale 1): fissarla a 1 non cambia cosa si vede, e
             da' a GSAP un numero su cui lavorare. Al cambio di livello il
             contesto di useGSAP rimette l'originale, camera compresa. */
          gsap.set(disegni, { opacity: 1 });

          /* clearProps solo su `transform`: l'opacita' deve restare quella che
             l'entrata lascia, o al prossimo giro si torna alla funzione che
             GSAP non sa animare. */
          daDietro(disegni, {
            level: resolved,
            trigger: griglia,
            stagger: 0.09,
            clearProps: "transform",
          });
        }
      }

      return;
    }

    if (!stageEl || !trackEl) return;

    // Il piano, non il mondo: le percentuali di layers.ts misurano il piano, e
    // il mondo e' il piano PIU' le didascalie. Misurando il mondo, l'apertura
    // sbaglierebbe di quanto e' alto un blocco di testo.
    const surface = stageEl.querySelector<HTMLElement>(
      '[data-desk-world][data-layout="wide"] [data-desk-surface]',
    );
    let from = OPENING_FALLBACK;
    let to = CLOSING.tall;

    const measure = () => {
      const laptop = (surface?.clientWidth ?? 0) * LAPTOP_ON_SURFACE;
      const voluta = (stageEl.clientHeight * OPENING_FILL) / laptop;
      from = laptop > 0 ? Math.min(Math.max(voluta, OPENING.min), OPENING.max) : OPENING_FALLBACK;
      // Si rimisura insieme all'apertura, cosi' ruotare un portatile o aprire
      // gli strumenti da sviluppatore ricalcola anche dove la camera si ferma.
      // Il corpo della tesi si adatta da se' con un min() sull'altezza: qui non
      // c'e' una soglia gemella da tenere allineata.
      to = stageEl.clientHeight < SHORT_STAGE ? CLOSING.short : CLOSING.tall;
    };

    const write = (p: number) => {
      stageEl.style.setProperty("--p", p.toFixed(4));
      stageEl.style.setProperty("--s", cameraScale(p, from, to).toFixed(4));
    };

    measure();
    write(0);

    camera.current = ScrollTrigger.create({
      trigger: trackEl,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onRefresh: (self) => {
        measure();
        write(self.progress);
      },
      onUpdate: (self) => write(self.progress),
    });

    // Anche lo smontaggio passa di qui: gsap.context di useGSAP chiama questa
    // al revert. Le due property nessun altro le toglierebbe, e restassero
    // appiccicate a --p = 0 il tavolo resterebbe vuoto per sempre.
    return spegni;
  }, scope);

  /**
   * Il Tab non e' una rotellina. L'unico comando del tavolo sta su un oggetto
   * dell'anello piu' esterno, e al fotogramma zero quell'anello e' ingrandito
   * quattro volte e ritagliato via dall'overflow del palco. Il browser porta
   * "in vista" l'elemento che prende il fuoco leggendone il rettangolo, e il
   * rettangolo del clip non sa niente: misurato a 1440, il fuoco finiva su un
   * post-it a (-80, 251) che sotto quel punto non c'era — anello arancione
   * compreso, cioe' nessun anello che si veda.
   *
   * Qui la pagina va al fotogramma di riposo, che di una scena guidata dallo
   * scorrimento e' l'unico punto fisso: dove l'oggetto sta e' funzione di dove
   * sta la pagina, e l'unico posto dove le due cose non si rincorrono e' la fine
   * del track — li' il tavolo e' completo e ogni oggetto e' dov'e' disegnato.
   * Con lo scrub, il tavolo si compone mentre il fuoco lo raggiunge.
   *
   * Sta in un effetto suo, con [level], e non dentro la build della camera:
   * quella si disfa solo al revert di gsap.context, che al cambio di livello non
   * arriva (e' la stessa mancanza che l'effetto qui sopra copre a mano per --p e
   * --s). Restando attaccato, un ascoltatore appeso qui farebbe saltare la
   * pagina proprio nei due stati in cui questa sezione deve stare ferma — la
   * finestra che si stringe sotto i 1024 e il movimento ridotto acceso a meta'
   * strada — e sotto i 1024 per una fermata del Tab che nemmeno si vede. React
   * il suo cleanup lo chiama a ogni cambio di level, e questo e' tutto quello
   * che serve.
   *
   * Solo da tastiera: :focus-visible e' falso per un click, e un click sul
   * post-it deve andare ai contatti, non far saltare la pagina prima.
   */
  useEffect(() => {
    const stageEl = stage.current;
    const trackEl = track.current;
    if (level !== "full" || !stageEl || !trackEl) return;

    const alFotogrammaDiRiposo = (event: FocusEvent) => {
      const preso = event.target as HTMLElement | null;
      if (!preso?.closest("[data-desk-blank]") || !preso.matches(":focus-visible")) return;
      const fine = trackEl.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      // "instant" e non "auto": auto vuol dire "quello che dice scroll-behavior",
      // e il giorno che qualcuno scrive smooth su html questo salto diventerebbe
      // un'animazione — proprio quella che chi ha ridotto il movimento non deve
      // vedere. Qui non ci arriva, ma la riga deve reggere da sola.
      window.scrollTo({ top: fine, behavior: "instant" });
    };

    stageEl.addEventListener("focusin", alFotogrammaDiRiposo);
    return () => stageEl.removeEventListener("focusin", alFotogrammaDiRiposo);
  }, [level]);

  return (
    <div ref={scope} data-desk data-motion={level}>
      <div ref={track} data-desk-track>
        <div ref={stage} data-desk-stage>
          <header data-desk-title>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{lead}</p>
          </header>

          <DeskTable
            layers={layers}
            centre={centre}
            composto={composto}
            blank={blank}
            note={note}
            layout="wide"
          />
          <DeskTable
            layers={layers}
            centre={centre}
            composto={composto}
            blank={blank}
            note={note}
            layout="tall"
            ghost
          />

          <p data-desk-punch>{punch}</p>
        </div>
      </div>
    </div>
  );
}
