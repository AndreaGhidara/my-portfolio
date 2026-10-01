"use client";

import { useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { numeroLivello, type LivelloProps } from "./livelli";
import { Icona, type IconaNodo } from "./icone";
import { BOTTEGA, ILLUSTRAZIONI, VIEWBOX_ILLUSTRAZIONI, variabiliSito } from "./sitoFinto";
import { GIORNO_PIENO, Scena, TORTA_FINITA, type StatoNodo, type TestiScene } from "./logicheScene";

/**
 * Livello 2, dietro lo schermo. Si parte dalla schermata del Forno Aurora
 * costruita al livello 1: premendo «Prenota la torta» l'ordine (il pacco)
 * corre in un circuito di sei nodi, e a ogni nodo lo porta avanti chi gioca.
 * Oppure prova a rompere il sito, e vede la regola che lo salva.
 *
 * Nessun timer: il pacco si sposta con una transizione CSS, e il suo
 * pulsare riparte a ogni nodo perche' l'onda ha per chiave il nodo. Per
 * questo `visibile` qui non serve.
 */

type Nodo = {
  nome: string;
  titolo: string;
  spiega: string;
  fai: string;
  rompi: string;
  errore: string;
  regola: { se: string; allora: string };
};

const ICONE: readonly IconaNodo[] = ["area", "catalogo", "prenotazioni", "pagamenti", "contatti", "gestionale"];

/** Dove stanno i sei nodi nel circuito, in percentuale: un anello. */
const POS: readonly (readonly [number, number])[] = [
  [16, 34],
  [50, 30],
  [84, 34],
  [84, 74],
  [50, 78],
  [16, 74],
];

const PARTENZA = -1;
const FINE = ICONE.length;

/** Il pacco prima di partire sta sopra il circuito, alla fine sotto. */
const dovePacco = (n: number): readonly [number, number] =>
  n === PARTENZA ? [50, -10] : n === FINE ? [50, 112] : POS[n];

const vuoti = (): StatoNodo[] => ICONE.map(() => ({}));

const STILE_SITO = variabiliSito(BOTTEGA.colori) as CSSProperties;

export function Logiche({ onAvanti }: LivelloProps) {
  const t = useTranslations("services.gioco.logiche");
  const comune = useTranslations("services.gioco.comune");
  const locale = useLocale();
  const nodi = t.raw("nodi") as Nodo[];
  const scene = t.raw("scene") as TestiScene;

  // `n` e' dove sta l'ordine: PARTENZA, un nodo (0..5) o FINE.
  const [n, setN] = useState(PARTENZA);
  const [stati, setStati] = useState<StatoNodo[]>(vuoti);
  // Rotto in questa visita: su un nodo gia' fatto l'incidente si vede solo
  // appena rotto, e tornandoci non c'e' piu'.
  const [appena, setAppena] = useState(false);

  const s = stati[n] ?? {};
  const rotti = stati.filter((x) => x.rotto).length;

  const cambia = (dati: StatoNodo) => setStati((v) => v.map((x, i) => (i === n ? { ...x, ...dati } : x)));

  const vai = (i: number) => {
    setN(i);
    setAppena(false);
  };

  const fai = () => {
    cambia({ ok: true, ...(n === 1 && { scelta: 1 }), ...(n === 2 && { giorno: 5 }) });
    setAppena(false);
  };

  const rompi = () => {
    if (s.rotto) return;
    cambia({ rotto: true });
    setAppena(true);
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate([20, 40, 20]);
  };

  const sceglie = (dati: StatoNodo) => {
    cambia({ ...dati, ok: true });
    setAppena(false);
  };

  const ricomincia = () => {
    setStati(vuoti());
    vai(PARTENZA);
  };

  const [px, py] = dovePacco(n);

  return (
    <div className="banco" data-gioco-livello="logiche">
      <div className="sopra reticolo">
        <svg className="fili" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <g className="tratteggio">
            {POS.slice(1).map(([x2, y2], i) => (
              <line key={i} x1={POS[i][0]} y1={POS[i][1]} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
          <g className="fatti">
            {POS.slice(1).map(([x2, y2], i) =>
              stati[i].ok ? (
                <line key={i} x1={POS[i][0]} y1={POS[i][1]} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />
              ) : null,
            )}
          </g>
        </svg>

        <div className="testa">
          <span className="livello">{comune("etichetta", { numero: numeroLivello("logiche"), nome: comune("livelli.logiche") })}</span>
          <span className="destra regole">
            {t("regole")}
            {stati.map((x, i) => (
              <i key={i} className={x.rotto ? "si" : undefined} aria-hidden="true" />
            ))}
          </span>
        </div>

        {nodi.map((nodo, i) => {
          const stato = stati[i];
          const classi = ["nodo", i === n && "qui", stato.ok && "fatto", stato.rotto && "rotto"].filter(Boolean);
          return (
            <button
              key={i}
              type="button"
              className={classi.join(" ")}
              style={{ left: `${POS[i][0]}%`, top: `${POS[i][1]}%` }}
              aria-label={t("nodo", { numero: i + 1, nome: nodo.nome })}
              aria-current={i === n ? "step" : undefined}
              // Un nodo gia' fatto si riapre, per rompere quello che manca;
              // quelli dopo no.
              disabled={!stato.ok && i !== n}
              onClick={() => {
                if (i !== n) vai(i);
              }}
            >
              <span className="chip">
                <Icona nome={ICONE[i]} />
                <i className="num">{i + 1}</i>
              </span>
              <span className="nome">{nodo.nome}</span>
            </button>
          );
        })}

        <span className="pacco" style={{ left: `${px}%`, top: `${py}%` }} aria-hidden="true">
          🎂
          {n >= 0 && n < FINE && <i key={n} className="onda" />}
        </span>
      </div>

      {n === PARTENZA ? (
        <Partenza onVia={() => vai(0)} />
      ) : n === FINE ? (
        <div className="console">
          <div className="capo">
            <span className="chip" aria-hidden="true">
              🧾
            </span>
            <div>
              <p className="mono">{t("fine.occhiello", { trovate: rotti })}</p>
              <h3>{t("fine.titolo")}</h3>
            </div>
          </div>
          <p className="spiega">{rotti < ICONE.length ? t("fine.mancano") : t("fine.tutte")}</p>
          <div className="palco">
            <div className="foglietto">
              <b>{t("fine.negozio")}</b>
              <hr />
              <span>{t("fine.ordine")}</span>
              <span>
                {scene.torte[stati[1].scelta ?? 1].nome.toLocaleUpperCase(locale)} ·{" "}
                {(t.raw("fine.giorni") as string[])[stati[2].giorno ?? 5].toLocaleUpperCase(locale)}
              </span>
              <span>{t("fine.caparra")}</span>
              <hr />
              <span>{t("fine.laboratorio")}</span>
            </div>
          </div>
          <div className="azioni due">
            <button type="button" onClick={ricomincia}>
              <b aria-hidden="true">↺</b>
              {t("fine.ricomincia")}
            </button>
            <button type="button" className="rompi" onClick={onAvanti}>
              {t("fine.livello3")} <b aria-hidden="true">→</b>
            </button>
          </div>
        </div>
      ) : (
        <div className="console">
          <div className="capo">
            <span className="chip">
              <Icona nome={ICONE[n]} />
            </span>
            <div>
              <p className="mono">{t("nodo", { numero: n + 1, nome: nodi[n].nome })}</p>
              <h3>{nodi[n].titolo}</h3>
            </div>
          </div>
          <p className="spiega">{nodi[n].spiega}</p>
          <div className="palco">
            {/* L'incidente prende il posto della scena, nella stessa scatola. */}
            {s.rotto && (!s.ok || appena) ? (
              <div className="incidente" role="status">
                <div className="errore">
                  <span aria-hidden="true">⚠</span>
                  {nodi[n].errore}
                </div>
                <div className="regola">
                  <p>
                    <span>{t("incidente.se")}</span>
                    {nodi[n].regola.se}
                  </p>
                  <p>
                    <span>{t("incidente.allora")}</span>
                    {nodi[n].regola.allora}
                  </p>
                </div>
                <p className="salvato">
                  <span aria-hidden="true">✓ </span>
                  {t("incidente.salvato")}
                </p>
              </div>
            ) : (
              <>
                <Scena
                  nodo={n}
                  stato={s}
                  testi={scene}
                  onTorta={(i) => (i === TORTA_FINITA ? rompi() : sceglie({ scelta: i }))}
                  onGiorno={(i) => (i === GIORNO_PIENO ? rompi() : sceglie({ giorno: i }))}
                />
                {s.rotto && (
                  <span className="trovata">
                    <span aria-hidden="true">⚡ </span>
                    {t("trovata")}
                  </span>
                )}
              </>
            )}
          </div>
          <div className={`azioni${s.ok && s.rotto ? "" : " due"}`}>
            {s.ok ? (
              <button type="button" className={s.rotto ? "solo" : "verde"} onClick={() => vai(n + 1)}>
                {n === FINE - 1 ? t("stampa") : t("avanti", { nome: nodi[n + 1].nome })} <b aria-hidden="true">→</b>
              </button>
            ) : (
              <button type="button" onClick={fai}>
                <b aria-hidden="true">✓</b>
                {nodi[n].fai}
              </button>
            )}
            {!(s.ok && s.rotto) && (
              <button type="button" className="rompi" disabled={s.rotto} onClick={rompi}>
                <b aria-hidden="true">⚡</b>
                {s.rotto ? t("giaRotto") : nodi[n].rompi}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** La partenza: lo schermo costruito al livello 1, e sotto l'appunto. */
function Partenza({ onVia }: { onVia: () => void }) {
  const t = useTranslations("services.gioco.logiche.partenza");
  return (
    <div className="console">
      <div className="partenza">
        <p className="mono">{t("occhiello")}</p>
        <div className="telefono" style={STILE_SITO}>
          <div className="barra" aria-hidden="true">
            <i />
            <i />
            <i />
            <span>{t("indirizzo")}</span>
          </div>
          <div className="sito">
            <div className="menu">
              <b>{t("nome")}</b>
              <span>{t("menu")}</span>
            </div>
            <div className="testo">
              <small>{t("via")}</small>
              <h4>
                {t("titolo")}
                <br />
                <em>{t("titoloAccento")}</em>
              </h4>
              <p>{t("testo")}</p>
              <button type="button" className="prenota" onClick={onVia}>
                {t("prenota")} <span aria-hidden="true">→</span>
                <span className="dito" aria-hidden="true">
                  👆
                </span>
              </button>
            </div>
            <div className="foto">
              <svg
                viewBox={VIEWBOX_ILLUSTRAZIONI}
                aria-hidden="true"
                focusable="false"
                // Il pane e' una stringa fissa di sitoFinto.ts, nessun dato da fuori.
                dangerouslySetInnerHTML={{ __html: ILLUSTRAZIONI.pane }}
              />
            </div>
          </div>
        </div>
        <button type="button" className="appunto" onClick={onVia}>
          <span className="ic" aria-hidden="true">
            🎂
          </span>
          <span>
            <b>{t("appuntoTitolo")}</b>
            <span>{t("appuntoTesto")}</span>
          </span>
          <span className="mini" aria-hidden="true">
            {[true, true, false, true, false, true].map((si, i) => (
              <i key={i} className={si ? "si" : undefined} />
            ))}
          </span>
        </button>
      </div>
    </div>
  );
}
