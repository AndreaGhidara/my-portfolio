"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { weave } from "@/animations/presets";
import { useMotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { THREAD_ANCHORS } from "@/components/thread/anchors";

const { in: ENTRY, out: EXIT } = THREAD_ANCHORS.services;

/**
 * I due capi. Entrano dove esce «Cosa stai cercando?» ed escono dove entrano i
 * Lavori, e le loro x sono percentuali della FINESTRA: stanno nella scatola di
 * giunzione (vedi sotto).
 */
const ENDS = [
  `M${ENTRY} 0 C${ENTRY} 30, 34 42, 50 50`,
  `M50 50 C68 58, ${EXIT} 72, ${EXIT} 100`,
];

/**
 * La derivazione che scende nel rack dello strato infrastruttura — che sta
 * davvero li': a (23,4 / 80,6) nel mondo orizzontale, a (17,7 / 76,2) in quello
 * verticale, e la derivazione finisce dentro tutti e due. Le sue x sono
 * percentuali del PIANO, perche' del piano sono percentuali le coordinate del
 * rack.
 */
const BRANCH = `M50 50 C50 66, 30 72, 22 82`;

/**
 * I cavi. Sono il segmento di filo di questa sezione, e non una sua citazione:
 * la stessa linea che cuce la pagina qui esce dal retro del laptop e va a finire
 * nel rack. E' l'unico punto in cui il filo smette di essere astratto, e per
 * questo ServicesView non disegna un <ThreadSegment>: due tratti sovrapposti
 * sarebbero due fili.
 *
 * Gli ancoraggi non sono negoziabili: il filo entra al 14% ed esce all'88%
 * perche' li' escono e entrano le sezioni vicine, e ThreadSegment.test.tsx lo
 * verifica. Il disegno si adatta al vincolo, non il contrario.
 *
 * I cavi stanno DENTRO il piano, quindi la camera li ingrandisce insieme al
 * laptop da cui escono. E' il prezzo, ed e' il prezzo giusto: agganciarli alla
 * pagina invece che al mondo li staccherebbe dall'oggetto che li tiene, che e'
 * tutto il punto.
 *
 * Due SVG e non uno, ed e' l'unica ragione per cui sono due: il 14% e l'88%
 * sono percentuali della PAGINA — e' li' che escono e entrano le sezioni
 * vicine — mentre il rack in cui finisce la derivazione e' una percentuale del
 * PIANO. Il piano e' largo min(94vw, 62rem) e centrato, quindi i due 14% non
 * coincidono: misurato a 1440, il filo faceva un gradino di 161px in entrata e
 * 170px in uscita. Cosi' i capi vivono in una scatola larga quanto la finestra
 * e la derivazione in una larga quanto il piano; le due scatole sono
 * concentriche e alte uguali, quindi il (50 / 50) da cui partono tutti e tre i
 * tratti resta lo stesso punto, che e' il laptop. Le regole stanno in
 * tokens.css, sotto [data-desk-cables-ends] e [data-desk-cables-branch].
 *
 * Al fotogramma d'apertura il mondo e' a 4,2x (misurato a 1440x900) e i due
 * capi stanno fuori dallo schermo; la continuita' col resto della pagina si
 * legge al fotogramma a riposo — l'ultimo della camera, e l'unico che esista a
 * "reduced", a "none" e senza JavaScript. Detto altrimenti: il filo non e' gia'
 * al suo posto, ci arriva mentre la camera arretra.
 *
 * viewBox 100x100 con preserveAspectRatio disattivato: le coordinate sono
 * percentuali della scatola e il tratto si adatta a qualsiasi proporzione, come
 * per ThreadSegment. Lo spessore resta sottile grazie a non-scaling-stroke,
 * altrimenti la camera che arretra ingrasserebbe il cavo di quattro volte.
 *
 * Il conto di non-scaling-stroke, misurato e non dedotto: con quel vector-effect
 * Chrome calcola anche il TRATTEGGIO nello spazio dello schermo, mentre
 * getTotalLength() — quello con cui `weave` si da' lo strokeDasharray — misura
 * in unita' del viewBox. I due numeri differiscono di un fattore dieci, quindi
 * il tratto non si disegna da capo a coda: sfila un tratteggio. Non e' una cosa
 * di questa sezione — e' cosi' per tutti e sette i segmenti del filo, dal primo
 * commit — e i cavi restano deliberatamente identici agli altri, perche' il
 * giorno in cui si aggiusta si aggiusti in un posto solo. Vedi il rapporto di
 * Task 5.
 */
export function DeskCables() {
  const scope = useRef<HTMLDivElement | null>(null);
  const cavo = useRef<gsap.core.Timeline | null>(null);
  const level = useMotionLevel();

  /**
   * Staccare il cavo dallo scorrimento. `weave` restituisce una timeline con il
   * suo ScrollTrigger appeso al track della camera, e non basta che smetta di
   * essere usata: finche' e' viva riscrive lo strokeDashoffset a ogni giro di
   * rotellina. Si uccidono tutti e due — il trigger non se ne va con la
   * timeline.
   */
  const spegni = useCallback(() => {
    cavo.current?.scrollTrigger?.kill();
    cavo.current?.kill();
    cavo.current = null;
  }, []);

  // Dichiarato PRIMA della build, ed e' l'ordine a far funzionare la cosa: al
  // cambio di livello React chiama i cleanup in ordine di dichiarazione e poi
  // gli effetti, quindi il cavo vecchio muore prima che ne nasca uno nuovo.
  //
  // Serve perche' useGSAP con delle dipendenze rimanda il revert allo
  // smontaggio, non al cambio di livello: senza, chi esce da "full" — la
  // riduzione del movimento accesa a meta' strada, la finestra che scende sotto
  // i 1024, un puntatore grosso che arriva — si terrebbe addosso lo scrub di
  // prima, che continua a tessere addosso a chi ha appena chiesto di non
  // muovere niente. E' la stessa mancanza che DeskStage copre con spegni().
  //
  // A ogni cambio, non solo all'uscita da "full": sopra "none" `weave` ne crea
  // comunque uno nuovo, e due cavi sullo stesso track sono due.
  useLayoutEffect(() => spegni, [level, spegni]);

  useSectionAnimation((livello) => {
    const nodes = Array.from(scope.current?.querySelectorAll("path") ?? []);
    // Il trigger e la finestra sono quelli della camera, non quelli di default
    // del filo. Il piano vive dentro un palco sticky e la camera lo scala:
    // misurato da se' stesso, il cavo finirebbe la sua corsa nei primi
    // centimetri della sezione e poi starebbe fermo per 380vh. E con la
    // finestra larga del filo — dal basso dello schermo fino a sezione uscita —
    // al fotogramma a riposo il tratto non sarebbe ancora arrivato al suo stato
    // finale: misurato, dieci pixel di scostamento su sessantasette.
    // "top top" / "bottom bottom" sono gli stessi estremi che DeskStage da'
    // alla camera: il filo arriva al suo posto nell'istante esatto in cui la
    // camera smette di arretrare.
    const trigger = scope.current?.closest("[data-desk-track]") ?? scope.current;
    cavo.current = weave(nodes, {
      level: livello,
      trigger,
      scrub: true,
      start: "top top",
      end: "bottom bottom",
    });

    // Anche lo smontaggio passa di qui: gsap.context di useGSAP chiama questa
    // al revert.
    return spegni;
  }, scope);

  return (
    <div ref={scope} data-desk-cables aria-hidden="true">
      <Scatola box="ends" paths={ENDS} />
      <Scatola box="branch" paths={[BRANCH]} />
    </div>
  );
}

/** Una scatola di cavi. Fra le due cambia solo la larghezza, e la decide il CSS. */
function Scatola({ box, paths }: { box: "ends" | "branch"; paths: string[] }) {
  const attr =
    box === "ends" ? { "data-desk-cables-ends": "" } : { "data-desk-cables-branch": "" };

  return (
    <svg
      {...attr}
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="var(--line)"
          strokeWidth="0.35"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
