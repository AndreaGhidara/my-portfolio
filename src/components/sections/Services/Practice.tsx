"use client";

import { useRef } from "react";
import { practiceScenes } from "@/content/practice";
import { useMotionLevel } from "@/animations/motionPolicy";
import { PracticeBlock } from "./PracticeBlock";
import type { ServiceItem } from "./ServicesView";

/**
 * La seconda scena della sezione del tavolo. Il tavolo e' lo spettacolo, questa
 * e' la sostanza — e conserva la risposta 1:1 alle quattro frasi di «Cosa stai
 * cercando?», nel loro ordine.
 *
 * `data-motion` porta il livello risolto fino al CSS, che e' l'unico posto in
 * cui il movimento esiste: a "full" le voci non attive sbiadiscono e la scena
 * si accende; a "reduced" e a "none" non si applica una riga e restano quattro
 * voci ferme e leggibili. useMotionLevel dice "none" in SSR e al primo render,
 * quindi ferma e completa e' anche quello che si vede senza JavaScript.
 */
export function Practice({
  practice,
  intro,
  items,
}: {
  practice: string;
  intro: string;
  items: ServiceItem[];
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const level = useMotionLevel();

  return (
    <div ref={scope} data-pratica data-motion={level}>
      <h3>{practice}</h3>
      <p data-pratica-intro>{intro}</p>

      <ol data-practice>
        {items.map((item, index) => (
          <PracticeBlock
            key={item.id}
            item={item}
            index={index}
            // L'ordine e' garantito da una prova sul contenuto: i quattro
            // blocchi corrispondono, in ordine, ai quattro servizi.
            scene={practiceScenes[index]}
          />
        ))}
      </ol>

      {/* Lo spazio in cui la freccia fara' il suo 180 prima di consegnare il
          filo ai Lavori. E' vuoto apposta: e' respiro, non un blocco mancante.
          Serve gia' adesso perche' la strada lo misura (Task 5 e 6). */}
      <div data-pratica-coda aria-hidden="true" />
    </div>
  );
}
