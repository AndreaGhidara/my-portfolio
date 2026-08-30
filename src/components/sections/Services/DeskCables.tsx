"use client";

import { useRef, type RefObject } from "react";
import { weave } from "@/animations/presets";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { THREAD_ANCHORS } from "@/components/thread/anchors";

const { in: ENTRY, out: EXIT } = THREAD_ANCHORS.services;

/**
 * Tre tratti. Dal bordo di sopra al laptop, dal laptop al bordo di sotto, e una
 * derivazione che scende verso il rack dello strato infrastruttura — che sta
 * davvero li': a (23,4 / 80,6) nel mondo orizzontale, a (17,7 / 76,2) in quello
 * verticale, e la derivazione finisce dentro tutti e due. Il primo tratto e il
 * terzo passano sotto la scocca: il laptop e' disegnato dopo, nello stesso
 * piano, e li copre. E' per questo che i cavi escono dal RETRO e non da un
 * fianco.
 */
const PATHS = [
  `M${ENTRY} 0 C${ENTRY} 30, 34 42, 50 50`,
  `M50 50 C68 58, ${EXIT} 72, ${EXIT} 100`,
  `M50 50 C50 66, 30 72, 22 82`,
];

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
 * tutto il punto. Al fotogramma d'apertura il mondo e' a 4,2x (misurato a
 * 1440x900) e i due capi stanno fuori dallo schermo; la continuita' col resto
 * della pagina si legge al fotogramma a riposo — l'ultimo della camera, e
 * l'unico che esista a "reduced", a "none" e senza JavaScript. Detto
 * altrimenti: il filo non e' gia' al suo posto, ci arriva mentre la camera
 * arretra.
 *
 * viewBox 100x100 con preserveAspectRatio disattivato: le coordinate sono
 * percentuali e il tratto si adatta a qualsiasi proporzione del mondo, come per
 * ThreadSegment. Lo spessore resta sottile grazie a non-scaling-stroke,
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
  const scope = useRef<SVGSVGElement | null>(null);

  useSectionAnimation((level) => {
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
    weave(nodes, { level, trigger, scrub: true, start: "top top", end: "bottom bottom" });
  }, scope as RefObject<HTMLElement | null>);

  return (
    <svg
      ref={scope}
      data-desk-cables
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
    >
      {PATHS.map((d) => (
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
