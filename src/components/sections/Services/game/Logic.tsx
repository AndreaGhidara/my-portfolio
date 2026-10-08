"use client";

import { useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { levelNumber, type LevelProps } from "./levels";
import { Icon, type NodeIcon } from "./icons";
import { SHOP_PALETTE, ILLUSTRATIONS, ILLUSTRATION_VIEWBOX, siteVariables } from "./fakeSite";
import { FULL_DAY, LogicScene, CAKE_DONE, type NodeState, type SceneCopy } from "./logicScenes";

// Nessun timer: il pacco si sposta con una transizione CSS, e l'onda ha per
// chiave il nodo perche' il pulsare riparta. Per questo `visible` non serve.

type LogicNode = {
  nome: string;
  titolo: string;
  spiega: string;
  fai: string;
  rompi: string;
  errore: string;
  regola: { se: string; allora: string };
};

const ICONS: readonly NodeIcon[] = ["area", "catalogo", "prenotazioni", "pagamenti", "contatti", "gestionale"];

const POS: readonly (readonly [number, number])[] = [
  [16, 34],
  [50, 30],
  [84, 34],
  [84, 74],
  [50, 78],
  [16, 74],
];

const START = -1;
const END = ICONS.length;

const parcelPosition = (n: number): readonly [number, number] =>
  n === START ? [50, -10] : n === END ? [50, 112] : POS[n];

const emptyStates = (): NodeState[] => ICONS.map(() => ({}));

const SITE_STYLE = siteVariables(SHOP_PALETTE.colors) as CSSProperties;

export function Logic({ onNext }: LevelProps) {
  const t = useTranslations("services.gioco.logiche");
  const common = useTranslations("services.gioco.comune");
  const locale = useLocale();
  const nodes = t.raw("nodi") as LogicNode[];
  const sceneCopy = t.raw("scene") as SceneCopy;

  // `n` e' dove sta l'ordine: START, un nodo (0..5) o END.
  const [n, setN] = useState(START);
  const [states, setStates] = useState<NodeState[]>(emptyStates);
  // Rotto in questa visita: su un nodo gia' fatto l'incidente si vede solo
  // appena rotto, e tornandoci non c'e' piu'.
  const [justBroken, setJustBroken] = useState(false);

  const s = states[n] ?? {};
  const brokenCount = states.filter((x) => x.broken).length;

  const update = (patch: NodeState) => setStates((v) => v.map((x, i) => (i === n ? { ...x, ...patch } : x)));

  const go = (i: number) => {
    setN(i);
    setJustBroken(false);
  };

  const complete = () => {
    update({ ok: true, ...(n === 1 && { choice: 1 }), ...(n === 2 && { day: 5 }) });
    setJustBroken(false);
  };

  const breakNode = () => {
    if (s.broken) return;
    update({ broken: true });
    setJustBroken(true);
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate([20, 40, 20]);
  };

  const pick = (patch: NodeState) => {
    update({ ...patch, ok: true });
    setJustBroken(false);
  };

  const restart = () => {
    setStates(emptyStates());
    go(START);
  };

  const [px, py] = parcelPosition(n);

  return (
    <div className="bench" data-game-level="logiche">
      <div className="above lattice">
        <svg className="threads" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <g className="dashes">
            {POS.slice(1).map(([x2, y2], i) => (
              <line key={i} x1={POS[i][0]} y1={POS[i][1]} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <g className="done-group">
            {POS.slice(1).map(([x2, y2], i) =>
              states[i].ok ? (
                <line key={i} x1={POS[i][0]} y1={POS[i][1]} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
              ) : null,
            )}
          </g>
        </svg>

        <div className="head">
          <span className="level">{common("etichetta", { numero: levelNumber("logiche"), nome: common("livelli.logiche") })}</span>
          <span className="right rules">
            {t("regole")}
            {states.map((x, i) => (
              <i key={i} className={x.broken ? "yes" : undefined} aria-hidden="true" />
            ))}
          </span>
        </div>

        {nodes.map((node, i) => {
          const state = states[i];
          const classes = ["node", i === n && "here", state.ok && "done", state.broken && "broken"].filter(Boolean);
          return (
            <button
              key={i}
              type="button"
              className={classes.join(" ")}
              style={{ left: `${POS[i][0]}%`, top: `${POS[i][1]}%` }}
              aria-label={t("nodo", { numero: i + 1, nome: node.nome })}
              aria-current={i === n ? "step" : undefined}
              // Un nodo gia' fatto si riapre, per rompere quello che manca;
              // quelli dopo no.
              disabled={!state.ok && i !== n}
              onClick={() => {
                if (i !== n) go(i);
              }}
            >
              <span className="chip">
                <Icon name={ICONS[i]} />
                <i className="num">{i + 1}</i>
              </span>
              <span className="name">{node.nome}</span>
            </button>
          );
        })}

        <span className="parcel" style={{ left: `${px}%`, top: `${py}%` }} aria-hidden="true">
          🎂
          {n >= 0 && n < END && <i key={n} className="wave" />}
        </span>
      </div>

      {n === START ? (
        <Start onGo={() => go(0)} />
      ) : n === END ? (
        <div className="console">
          <div className="garment">
            <span className="chip" aria-hidden="true">
              🧾
            </span>
            <div>
              <p className="mono">{t("fine.occhiello", { trovate: brokenCount })}</p>
              <h3>{t("fine.titolo")}</h3>
            </div>
          </div>
          <p className="explain">{brokenCount < ICONS.length ? t("fine.mancano") : t("fine.tutte")}</p>
          <div className="stage">
            <div className="slip">
              <b>{t("fine.negozio")}</b>
              <hr />
              <span>{t("fine.ordine")}</span>
              <span>
                {sceneCopy.torte[states[1].choice ?? 1].nome.toLocaleUpperCase(locale)} ·{" "}
                {(t.raw("fine.giorni") as string[])[states[2].day ?? 5].toLocaleUpperCase(locale)}
              </span>
              <span>{t("fine.caparra")}</span>
              <hr />
              <span>{t("fine.laboratorio")}</span>
            </div>
          </div>
          <div className="actions two">
            <button type="button" onClick={restart}>
              <b aria-hidden="true">↺</b>
              {t("fine.ricomincia")}
            </button>
            <button type="button" className="break" onClick={onNext}>
              {t("fine.livello3")} <b aria-hidden="true">→</b>
            </button>
          </div>
        </div>
      ) : (
        <div className="console">
          <div className="garment">
            <span className="chip">
              <Icon name={ICONS[n]} />
            </span>
            <div>
              <p className="mono">{t("nodo", { numero: n + 1, nome: nodes[n].nome })}</p>
              <h3>{nodes[n].titolo}</h3>
            </div>
          </div>
          <p className="explain">{nodes[n].spiega}</p>
          <div className="stage">
            {/* L'incidente prende il posto della scena, nella stessa scatola. */}
            {s.broken && (!s.ok || justBroken) ? (
              <div className="incident" role="status">
                <div className="error">
                  <span aria-hidden="true">⚠</span>
                  {nodes[n].errore}
                </div>
                <div className="rule">
                  <p>
                    <span>{t("incidente.se")}</span>
                    {nodes[n].regola.se}
                  </p>
                  <p>
                    <span>{t("incidente.allora")}</span>
                    {nodes[n].regola.allora}
                  </p>
                </div>
                <p className="saved">
                  <span aria-hidden="true">✓ </span>
                  {t("incidente.salvato")}
                </p>
              </div>
            ) : (
              <>
                <LogicScene
                  node={n}
                  state={s}
                  copy={sceneCopy}
                  onCake={(i) => (i === CAKE_DONE ? breakNode() : pick({ choice: i }))}
                  onDay={(i) => (i === FULL_DAY ? breakNode() : pick({ day: i }))}
                />
                {s.broken && (
                  <span className="found">
                    <span aria-hidden="true">⚡ </span>
                    {t("trovata")}
                  </span>
                )}
              </>
            )}
          </div>
          <div className={`actions${s.ok && s.broken ? "" : " two"}`}>
            {s.ok ? (
              <button type="button" className={s.broken ? "only" : "green"} onClick={() => go(n + 1)}>
                {n === END - 1 ? t("stampa") : t("avanti", { nome: nodes[n + 1].nome })} <b aria-hidden="true">→</b>
              </button>
            ) : (
              <button type="button" onClick={complete}>
                <b aria-hidden="true">✓</b>
                {nodes[n].fai}
              </button>
            )}
            {!(s.ok && s.broken) && (
              <button type="button" className="break" disabled={s.broken} onClick={breakNode}>
                <b aria-hidden="true">⚡</b>
                {s.broken ? t("giaRotto") : nodes[n].rompi}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Start({ onGo }: { onGo: () => void }) {
  const t = useTranslations("services.gioco.logiche.partenza");
  return (
    <div className="console">
      <div className="start">
        <p className="mono">{t("occhiello")}</p>
        <div className="phone" style={SITE_STYLE}>
          <div className="bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{t("indirizzo")}</span>
          </div>
          <div className="site">
            <div className="menu">
              <b>{t("nome")}</b>
              <span>{t("menu")}</span>
            </div>
            <div className="text">
              <small>{t("via")}</small>
              <h4>
                {t("titolo")}
                <br />
                <em>{t("titoloAccento")}</em>
              </h4>
              <p>{t("testo")}</p>
              <button type="button" className="book" onClick={onGo}>
                {t("prenota")} <span aria-hidden="true">→</span>
                <span className="finger" aria-hidden="true">
                  👆
                </span>
              </button>
            </div>
            <div className="photo">
              <svg
                viewBox={ILLUSTRATION_VIEWBOX}
                aria-hidden="true"
                focusable="false"
                // Il pane e' una stringa fissa di fakeSite.ts, nessun dato da fuori.
                dangerouslySetInnerHTML={{ __html: ILLUSTRATIONS.pane }}
              />
            </div>
          </div>
        </div>
        <button type="button" className="note" onClick={onGo}>
          <span className="ic" aria-hidden="true">
            🎂
          </span>
          <span>
            <b>{t("appuntoTitolo")}</b>
            <span>{t("appuntoTesto")}</span>
          </span>
          <span className="mini" aria-hidden="true">
            {[true, true, false, true, false, true].map((yes, i) => (
              <i key={i} className={yes ? "yes" : undefined} />
            ))}
          </span>
        </button>
      </div>
    </div>
  );
}
