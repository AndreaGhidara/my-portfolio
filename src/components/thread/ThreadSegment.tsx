"use client";

import { useRef } from "react";
import { FINESTRE_FILO } from "@/animations/finestre";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { THREAD_ANCHORS, type SectionId } from "./anchors";

/**
 * Un segmento del filo. Il viewBox è 100x100 con preserveAspectRatio
 * disattivato: le coordinate diventano percentuali e il tratto si adatta
 * a qualsiasi altezza di sezione senza ricalcoli in JavaScript.
 */
export function ThreadSegment({
  section,
  scrub = true,
  intro = true,
  className,
}: {
  section: SectionId;
  /**
   * Agganciato allo scroll per default: il filo e' un'idea sola che
   * attraversa la pagina, e disegnandosi a scatti quando ogni sezione entra
   * si leggeva come sette animazioni diverse. Legato allo scroll diventa una
   * cosa che scorrendo si tesse sotto di te — ed e' anche l'unico indicatore
   * di avanzamento del sito, senza sembrarlo.
   * `weave` lo ignora fuori dal livello "full": su touch lo scrub e' la
   * prima causa di scatti.
   */
  scrub?: boolean;
  /**
   * Il tratto si disegna al caricamento invece di essere gia' li'. Acceso su
   * tutte, non solo sull'apertura: su uno schermo alto la riga di tessitura al
   * primo fotogramma cade gia' dentro la SECONDA sezione, che quindi partirebbe
   * con un pezzo gia' fatto. Le corse piu' in basso non ci perdono niente,
   * perche' la testa dell'entrata non arriva mai fino a loro.
   */
  intro?: boolean;
  className?: string;
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const { in: entry, out: exit } = THREAD_ANCHORS[section];
  /**
   * La finestra e' una proprieta' della SEZIONE, non qualcosa che il genitore
   * passa: la si guarda qui, dentro il lato client, esattamente come gli
   * ancoraggi due righe sopra. Passata come proprieta' funzionava finche' il
   * genitore era un componente client, e per i Lavori non lo e': vedi il
   * commento in cima a finestre.ts, e' costato tre correzioni a vuoto.
   */
  const finestra = FINESTRE_FILO[section];

  // Cubica con controlli a metà altezza: la curva resta morbida
  // qualunque sia il rapporto fra larghezza e altezza della sezione.
  const d = `M${entry} 0 C${entry} 45, ${exit} 55, ${exit} 100`;

  useSectionAnimation(({ level, presets }) => {
    const { weave } = presets;
    const paths = Array.from(scope.current?.querySelectorAll("path") ?? []);
    const tl = weave(paths as SVGPathElement[], {
      level,
      trigger: scope.current,
      scrub,
      intro,
      start: finestra?.inizio,
      end: finestra?.fine,
    });

    /**
     * Il tratteggio si rimisura anche quando cambia altezza la SEZIONE, non
     * solo la finestra.
     *
     * La lunghezza del tratto si calcola in pixel di schermo, quindi dipende da
     * quanto e' alta la sezione. `weave` la ristende su `onRefreshInit`, ma
     * ScrollTrigger si aggiorna al resize della FINESTRA: se e' la sezione a
     * crescere da sola — un titolo che passa da una riga a due, un font che
     * arriva tardi, un'immagine che si carica — nessuno lo dice a nessuno. Il
     * tratteggio resta quello di prima, piu' corto del tracciato, e il fondo
     * della sezione resta scoperto per sempre. Non e' un caso limite: e'
     * successo cambiando la larghezza di un titolo.
     *
     * Si aggiorna solo la SUA corsa, non tutte quante: la pagina ne ha sei, e
     * rimisurarle in blocco ogni volta che una cresce di un pixel e' lavoro
     * che nessuno ha chiesto. La soglia di un pixel evita il ciclo infinito
     * fra l'osservatore e la ristesa che lui stesso provoca.
     */
    const el = scope.current;
    const st = tl?.scrollTrigger;
    if (!el || !st) return;
    let altezza = el.getBoundingClientRect().height;
    const osservatore = new ResizeObserver(([voce]) => {
      const nuova = voce.contentRect.height;
      if (Math.abs(nuova - altezza) < 1) return;
      altezza = nuova;
      st.refresh();
    });
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, scope, [intro, finestra?.inizio, finestra?.fine]);

  return (
    <div ref={scope} className={className} data-thread={section}>
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
        <path
          d={d}
          fill="none"
          stroke="var(--filo)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
