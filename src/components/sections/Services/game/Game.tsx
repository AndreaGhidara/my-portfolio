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

// Contratto dei livelli: una sola radice `.bench` con `data-game-level="<id>"`,
// e ogni regola del suo CSS sta sotto quell'attributo. Ogni livello legge da
// se' i suoi testi. Al cambio di livello la key lo rimonta pulito: niente
// stato da tenere fra un'apertura e l'altra.

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

// Il banco non segue il tema: questi tre token fissi fra le variabili globali
// non ci sono (il verde di tokens.css cambia col tema), quindi si scrivono
// sulla radice da palette.ts.
const FIXED_TOKENS = {
  "--mutedDark": palette.mutedDark,
  "--green": palette.green,
  "--greenDark": palette.greenDark,
} as CSSProperties;

// I pulsanti dello stato dopo compaiono nello stesso punto di quelli di prima:
// senza guardia il secondo tocco di un doppio tocco premerebbe quello appena
// comparso.
const DOUBLE_TAP = 350;

export function Game() {
  const t = useTranslations("services.gioco.comune");
  const root = useRef<HTMLDivElement | null>(null);
  const visible = useVisible(root);

  // `reached` e' il passo piu' lontano raggiunto: decide quali barrette si riaprono.
  const [current, setCurrent] = useState(0);
  const [reached, setReached] = useState(0);

  const step = STEPS[current];
  const Level = COMPONENTS[step];

  const lastTap = useRef<number | null>(null);
  const justChanged = useRef(false);

  // In cattura, prima che il pulsante lo senta. Vale solo per i pulsanti delle
  // azioni e per il primo tocco dopo un cambio di livello: le scelte multiple
  // e le barrette restano libere. timeStamp e non Date: conta l'ora dell'evento.
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

  // Il pulsante premuto non c'e' piu': senza questo il fuoco finirebbe sul body
  // e la tastiera ripartirebbe dalla cima della pagina. Non al primo montaggio.
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
