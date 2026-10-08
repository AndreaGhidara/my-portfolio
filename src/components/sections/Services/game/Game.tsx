"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { useTranslations } from "next-intl";
import { palette } from "@/styles/palette";
import { useVisible } from "./useVisible";
import { LEVELS, levelNumber, type LevelId, type LevelProps } from "./levels";
import { Screen } from "./Screen";
import { Logic } from "./Logic";
import { Panel } from "./Panel";
import { Night } from "./Night";
import { Ending } from "./Ending";

export { LEVELS, type LevelId, type LevelProps };

/**
 * Il gioco del metodo: sotto i 1024px prende il posto del tavolo. Quattro
 * livelli in fila e un finale, in un banco alto uguale per tutti.
 *
 * Il guscio tiene solo il giro: dove sei, fin dove sei arrivato, le quattro
 * barrette e la riga che dice cosa si fa nel livello. Il resto e' dei livelli.
 *
 * IL CONTRATTO DEI LIVELLI (Schermo, Logiche, Pannello, Notte, Finale):
 *
 * - Props: `LevelProps = { onNext: () => void; visible: boolean }`, e
 *   nient'altro. onNext porta al livello dopo (nel finale ricomincia dal
 *   primo); visibile e' false quando il gioco e' uscito dallo schermo, e li'
 *   i timer del livello si fermano.
 * - Radice: un solo elemento `.bench` con `data-game-level="<id>"`
 *   (schermo, logiche, pannello, notte, finale). Ogni regola del suo CSS
 *   (un file per livello in src/styles/game/) sta sotto quell'attributo; i pezzi comuni
 *   sono in base.css, sotto [data-game].
 * - Testi: ognuno se li legge da se' con
 *   `useTranslations("services.gioco.<id>")`, e `t.raw` per le strutture.
 *   Il provider di layout.tsx passa gia' tutti i messaggi al client.
 * - Stato: cambiando livello il componente si rimonta (la key e' l'id), quindi
 *   riparte pulito ogni volta. Niente stato da tenere fra un'apertura e
 *   l'altra.
 * - Prove: `renderWithMessages` (src/test/renderWithMessages.tsx) per i testi veri,
 *   `installIntersectionObserver` (src/test/intersectionObserver.ts) per
 *   pilotare `visible` passando dal guscio.
 */

/** I quattro livelli e il finale, nell'ordine. Il finale e' il quinto passo. */
type Step = LevelId | "finale";
const STEPS: readonly Step[] = [...LEVELS, "finale"];
const ENDING = LEVELS.length;

const COMPONENTS: Record<Step, ComponentType<LevelProps>> = {
  schermo: Screen,
  logiche: Logic,
  pannello: Panel,
  notte: Night,
  finale: Ending,
};

/**
 * I tre token fissi che fra le variabili globali non ci sono: tokens.css ha
 * --verde, che col tema cambia, e il grigio chiaro solo dentro --fg-muted del
 * tema scuro. Il banco non segue il tema, quindi li prende da palette.ts e li
 * scrive sulla sua radice, dove base.css e i livelli li trovano.
 */
const FIXED_TOKENS = {
  "--mutedDark": palette.mutedDark,
  "--green": palette.green,
  "--greenDark": palette.greenDark,
} as CSSProperties;

/**
 * Quanto dura la guardia sul doppio tocco. Il banco e' alto uguale per tutti e
 * i pulsanti dello stato dopo compaiono nello stesso punto di quelli di prima:
 * il secondo tocco di un doppio tocco premerebbe quello appena comparso
 * («avanti» e poi «fai» del nodo dopo, «livello 4» e poi «vai a dormire»).
 */
const DOUBLE_TAP = 350;

export function Game() {
  const t = useTranslations("services.gioco.comune");
  const root = useRef<HTMLDivElement | null>(null);
  const visible = useVisible(root);

  // `current` e' il passo aperto (0..3 i livelli, 4 il finale); `reached` il
  // piu' lontano a cui si e' arrivati, ed e' quello che decide cosa si riapre.
  const [current, setCurrent] = useState(0);
  const [reached, setReached] = useState(0);

  const step = STEPS[current];
  const Level = COMPONENTS[step];

  // Il timeStamp dell'ultimo tocco accettato su un pulsante delle azioni, e se
  // da allora il livello e' cambiato.
  const lastTap = useRef<number | null>(null);
  const justChanged = useRef(false);

  /*
   * In cattura sulla radice, prima che il pulsante lo senta. La guardia vale
   * solo dove il doppio tocco fa danni: un pulsante delle azioni, oppure il
   * primo tocco nel banco dopo un cambio di livello. Le scelte multiple (gli
   * interruttori della notte, gli attrezzi del livello 1) restano libere, e
   * cosi' le barrette, che non stanno nel banco. timeStamp e non Date: e'
   * l'ora dell'evento, non quella in cui lo si guarda.
   */
  const guard = (e: MouseEvent<HTMLDivElement>) => {
    const pressed = (e.target as Element).closest("button, a");
    if (!pressed || !pressed.closest("[data-game-level]")) return;
    const isAction = pressed.closest(".actions") !== null;
    const tooSoon = lastTap.current !== null && e.timeStamp - lastTap.current < DOUBLE_TAP;
    if (tooSoon && (isAction || justChanged.current)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    justChanged.current = false;
    if (isAction) lastTap.current = e.timeStamp;
  };

  /*
   * Al cambio di livello (non al primo montaggio: li' nessuno ha chiesto
   * niente) il fuoco va sul banco nuovo. Il pulsante premuto non c'e' piu', e
   * il fuoco finirebbe sul body: chi naviga da tastiera ripartirebbe dalla
   * cima della pagina. preventScroll perche' il banco e' gia' dove si guarda.
   */
  const isFirst = useRef(true);
  useEffect(() => {
    justChanged.current = true;
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const bench = root.current?.querySelector<HTMLElement>("[data-game-level]");
    if (!bench) return;
    bench.tabIndex = -1;
    bench.focus({ preventScroll: true });
  }, [step]);

  const go = (i: number) => {
    setCurrent(i);
    setReached((r) => Math.max(r, i));
  };

  // «Torna al sito»: il giro da capo, e i livelli dopo il primo si richiudono.
  const restart = () => {
    setCurrent(0);
    setReached(0);
  };

  return (
    <div ref={root} data-game style={FIXED_TOKENS} onClickCapture={guard}>
      <div data-game-bars role="group" aria-label={t("barrette")}>
        {LEVELS.map((id, i) => {
          // Nel finale nessuna barretta e' «qui»: sono tutte fatte.
          const state = i === current ? "current" : i <= reached ? "done" : "next";
          return (
            <button
              key={id}
              type="button"
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
              // Il livello aperto non si disabilita: chi ci e' arrivato da
              // tastiera perderebbe il fuoco nel momento in cui lo apre.
              aria-disabled={state === "current" || undefined}
              disabled={state === "next"}
              onClick={() => {
                if (state === "done") go(i);
              }}
            >
              <i aria-hidden="true" />
              {t("etichetta", { numero: levelNumber(id), nome: t(`livelli.${id}`) })}
            </button>
          );
        })}
      </div>

      {/* La regione resta la stessa e cambia il testo dentro: una regione
          appena nata non la annuncia nessuno. Il testo ha la sua key per
          rientrare in dissolvenza. */}
      <div data-game-line aria-live="polite">
        <p key={`line-${step}`}>{t(`righe.${step}`)}</p>
      </div>

      <Level
        key={`bench-${step}`}
        visible={visible}
        onNext={current === ENDING ? restart : () => go(current + 1)}
      />
    </div>
  );
}
