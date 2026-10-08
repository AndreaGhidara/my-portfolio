"use client";

import { useEffect, useReducer, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { levelNumber, type LevelProps } from "./levels";
import { Icon, type ServiceIcon } from "./icons";

/**
 * Livello 3, i servizi: il pannello del sito un mese dopo il lancio, in un
 * minuto. Si accende, le spie arrivano da sole una alla volta, si tocca il
 * modulo rosso e si interviene. Finche' una spia resta accesa la salute del
 * sito scende. Alla fine il resoconto del mese, servizio per servizio.
 *
 * IL TEMPO. Un battito solo, ogni 200 ms, muove tutto: la salute (1,2 punti
 * ogni due battiti, cioe' ogni 400 ms, come nel prototipo) e l'attesa del
 * prossimo avviso (1,4 s la prima, 2,6 s dopo un intervento). L'attesa e' un
 * conto alla rovescia dentro lo stato, non un setTimeout: quando il gioco esce
 * dallo schermo il battito si ferma, e al rientro riparte dal punto in cui
 * era, senza un orologio da leggere.
 *
 * Lo stato vive in un reducer puro e il battito e' l'unico timer, con la sua
 * pulizia nell'effetto: lo StrictMode monta l'effetto due volte, ma ne resta
 * acceso uno solo.
 */

/** I cinque moduli, nell'ordine del pannello. */
const SERVICES = ["assistenza", "automazioni", "numeri", "trovare", "manutenzione"] as const satisfies readonly ServiceIcon[];

/**
 * Di chi e' ogni avviso, nell'ordine in cui arrivano. I testi stanno nei
 * messaggi (pannello.eventi), uno per voce e nello stesso ordine: la prova
 * controlla che siano tanti quanti questi.
 */
export const SEQUENCE: readonly ServiceIcon[] = [
  "manutenzione",
  "assistenza",
  "numeri",
  "automazioni",
  "trovare",
  "manutenzione",
];

const TICK = 200;
const DROP = 1.2;
const MIN_HEALTH = 40;
const FIRST_WAIT = 1400;
const WAIT_AFTER = 2600;
/** Sotto questa soglia il numero e il tubo diventano rossi. */
const LOW_THRESHOLD = 80;
/** Da qui in su, a fine mese, «il sito non se n'e' accorto». */
const GOOD_THRESHOLD = 90;

type PanelEvent = { testo: string; intervento: string; esito: string };

type State = {
  phase: "off" | "on" | "done";
  health: number;
  ticks: number;
  /** Il prossimo avviso da accendere, indice in SEQUENCE. */
  next: number;
  /** L'avviso con la spia accesa adesso. */
  active: number | null;
  /** L'ultimo avviso risolto: lo dice la coda, e la console finche' `done`. */
  solved: number | null;
  done: boolean;
  chosen: ServiceIcon | null;
  /** Millisecondi al prossimo avviso; null se non se ne aspetta uno. */
  wait: number | null;
};

type Action =
  | { type: "switchOn" }
  | { type: "tick" }
  | { type: "select"; service: ServiceIcon }
  | { type: "intervene" }
  | { type: "restart" };

const INITIAL: State = {
  phase: "off",
  health: 100,
  ticks: 0,
  next: 0,
  active: null,
  solved: null,
  done: false,
  chosen: null,
  wait: null,
};

function arrive(s: State): State {
  if (s.next >= SEQUENCE.length) return { ...s, phase: "done", wait: null, chosen: null, done: false };
  return { ...s, active: s.next, next: s.next + 1, wait: null, chosen: null, done: false };
}

function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "switchOn":
      return s.phase === "off" ? { ...s, phase: "on", wait: FIRST_WAIT } : s;
    case "tick": {
      if (s.phase !== "on") return s;
      const ticks = s.ticks + 1;
      const drops = s.active !== null && ticks % 2 === 0;
      let after: State = { ...s, ticks, health: drops ? Math.max(MIN_HEALTH, s.health - DROP) : s.health };
      if (after.wait !== null) {
        const wait = after.wait - TICK;
        after = wait > 0 ? { ...after, wait } : arrive(after);
      }
      return after;
    }
    case "select":
      return s.phase === "on" ? { ...s, chosen: a.service, done: false } : s;
    case "intervene":
      if (s.active === null || SEQUENCE[s.active] !== s.chosen) return s;
      return { ...s, solved: s.active, active: null, done: true, wait: WAIT_AFTER };
    case "restart":
      return INITIAL;
  }
}

export function Panel({ onNext, visible }: LevelProps) {
  const t = useTranslations("services.gioco.pannello");
  const common = useTranslations("services.gioco.comune");
  const events = t.raw("eventi") as PanelEvent[];
  const [s, dispatch] = useReducer(reduce, INITIAL);

  const running = s.phase === "on" && visible;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => dispatch({ type: "tick" }), TICK);
    return () => clearInterval(id);
  }, [running]);

  const name = (k: ServiceIcon) => t(`servizi.${k}`);
  const alarm = s.active !== null ? SEQUENCE[s.active] : null;
  const low = s.health < LOW_THRESHOLD;
  const health = Math.round(s.health);

  const counter =
    s.phase === "off"
      ? t("conta.spento")
      : s.phase === "done"
        ? t("conta.fine")
        : s.next === 0
          ? t("conta.acceso")
          : t("conta.avviso", { n: s.next, totale: SEQUENCE.length });

  // La riga di coda: una chiave per testo, cosi' ogni cambio rientra.
  const tail =
    s.phase === "done" ? (
      <span key="done">{t("coda.fine")}</span>
    ) : s.active !== null ? (
      <span key={`warning-${s.active}`}>
        <b>{name(SEQUENCE[s.active])}</b> · {events[s.active].testo}
      </span>
    ) : s.solved !== null ? (
      <span key={`solved-${s.solved}`}>{t("coda.risolto", { nome: name(SEQUENCE[s.solved]) })}</span>
    ) : (
      <span key="waiting">{t("coda.attesa")}</span>
    );

  return (
    <div className="bench" data-game-level="pannello">
      <div className="above lattice">
        <div className="head">
          <span className="level">{common("etichetta", { numero: levelNumber("pannello"), nome: common("livelli.pannello") })}</span>
          <span className="right">{counter}</span>
        </div>

        <div className="health">
          <b className={low ? "down" : undefined}>{health}%</b>
          <div className="tube" aria-hidden="true">
            <i className={low ? "down" : undefined} style={{ "--p": `${s.health}%` } as CSSProperties} />
          </div>
          <small>{t("salute")}</small>
        </div>

        <div className="tail" role="status">
          <span aria-hidden="true">›</span>
          {tail}
        </div>

        <div className="modules">
          {SERVICES.map((k) => (
            <button
              key={k}
              type="button"
              className={[alarm === k && "alarm", s.chosen === k && "chosen"].filter(Boolean).join(" ") || undefined}
              data-form
              aria-pressed={s.chosen === k}
              disabled={s.phase !== "on"}
              onClick={() => dispatch({ type: "select", service: k })}
            >
              <span className="led" aria-hidden="true" />
              <span className="ic">
                <Icon name={k} />
              </span>
              {name(k)}
              <span className="screws" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="console">
        {s.phase === "off" ? (
          <>
            <div>
              <p className="mono">{t("spento.occhiello")}</p>
              <h3>{t("spento.titolo")}</h3>
            </div>
            <p className="explain">{t("spento.spiega")}</p>
            <div className="stage">
              <Calm sign="🔌" text={t("spento.calma")} />
            </div>
            <div className="actions">
              <button type="button" className="green" onClick={() => dispatch({ type: "switchOn" })}>
                <b aria-hidden="true">⏻</b>
                {t("spento.accendi")}
              </button>
            </div>
          </>
        ) : s.phase === "done" ? (
          <>
            <div>
              <p className="mono">{t("fine.occhiello")}</p>
              <h3>{s.health >= GOOD_THRESHOLD ? t("fine.bene") : t("fine.male")}</h3>
            </div>
            <p className="explain">{t("fine.spiega", { salute: health })}</p>
            <div className="stage">
              <ul className="report">
                {SERVICES.map((k) => (
                  <li key={k}>
                    <span className="ic">
                      <Icon name={k} />
                    </span>
                    <span>
                      <b>{name(k)}</b> · {t("fine.avvisi", { n: SEQUENCE.filter((x) => x === k).length })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="actions two">
              <button type="button" onClick={() => dispatch({ type: "restart" })}>
                <b aria-hidden="true">↺</b>
                {t("fine.ricomincia")}
              </button>
              <button type="button" className="yellow" onClick={onNext}>
                {t("fine.avanti")} <b aria-hidden="true">→</b>
              </button>
            </div>
          </>
        ) : s.chosen === null ? (
          <>
            <div>
              <p className="mono">{t("acceso.occhiello")}</p>
              <h3>{alarm ? t("acceso.spia.titolo") : t("acceso.verde.titolo")}</h3>
            </div>
            <p className="explain">{alarm ? t("acceso.spia.spiega") : t("acceso.verde.spiega")}</p>
            <div className="stage">
              {alarm ? (
                <Calm key="alarm" sign="👆" text={t("acceso.spia.calma")} />
              ) : (
                <Calm key="green" sign="☕" text={t("acceso.verde.calma")} />
              )}
            </div>
            <div />
          </>
        ) : (
          <ServiceModule
            chosen={s.chosen}
            name={name(s.chosen)}
            active={s.active}
            solved={s.done ? s.solved : null}
            events={events}
            onIntervene={() => dispatch({ type: "intervene" })}
          />
        )}
      </div>
    </div>
  );
}

/** Il palco tranquillo: un segno e una riga, al centro. */
function Calm({ sign, text }: { sign: string; text: string }) {
  return (
    <div className="calm">
      <p>
        <span aria-hidden="true">{sign}</span>
        {text}
      </p>
    </div>
  );
}

/**
 * La console di un modulo toccato: il suo avviso se la spia e' la sua, il
 * «fatto» dopo l'intervento, altrimenti che li' e' tutto a posto.
 */
function ServiceModule({
  chosen,
  name,
  active,
  solved,
  events,
  onIntervene,
}: {
  chosen: ServiceIcon;
  name: string;
  active: number | null;
  solved: number | null;
  events: PanelEvent[];
  onIntervene: () => void;
}) {
  const t = useTranslations("services.gioco.pannello.modulo");
  const warning = active !== null && SEQUENCE[active] === chosen ? events[active] : null;
  const isTheirs = warning !== null;

  return (
    <>
      <div>
        <p className="mono">{t("occhiello", { nome: name })}</p>
        <h3>{solved !== null ? t("fatto") : isTheirs ? t("cosa") : t("aPosto")}</h3>
      </div>
      {/* Nel prototipo questa riga c'e' anche col pannello tutto verde; qui
          solo quando la spia accesa e' davvero un'altra. */}
      <p className="explain">{solved === null && !isTheirs && active !== null ? t("altra") : ""}</p>
      <div className="stage">
        {solved !== null ? (
          <div key="solved" className="problem solved">
            <small>
              <span aria-hidden="true">✓ </span>
              {t("risolto")}
            </small>
            <p>{events[solved].esito}</p>
          </div>
        ) : warning ? (
          <div key="warning" className="problem">
            <small>
              <span aria-hidden="true">⚠ </span>
              {t("avviso")}
            </small>
            <p>{warning.testo}</p>
          </div>
        ) : (
          <Calm key="calm" sign="✓" text={t("nessuno", { nome: name.toLowerCase() })} />
        )}
      </div>
      <div className="actions">
        {warning ? (
          <button type="button" className="yellow" onClick={onIntervene}>
            <b aria-hidden="true">⚡</b>
            {warning.intervento}
          </button>
        ) : (
          <button type="button" disabled>
            {solved !== null ? t("aspetta") : t("niente")}
          </button>
        )}
      </div>
    </>
  );
}
