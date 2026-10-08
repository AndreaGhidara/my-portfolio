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
const SERVIZI = ["assistenza", "automazioni", "numeri", "trovare", "manutenzione"] as const satisfies readonly ServiceIcon[];

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

const BATTITO = 200;
const CALO = 1.2;
const MINIMO = 40;
const PRIMA_ATTESA = 1400;
const ATTESA_DOPO = 2600;
/** Sotto questa soglia il numero e il tubo diventano rossi. */
const SOGLIA_GIU = 80;
/** Da qui in su, a fine mese, «il sito non se n'e' accorto». */
const SOGLIA_BENE = 90;

type Evento = { testo: string; intervento: string; esito: string };

type Stato = {
  fase: "spento" | "acceso" | "fine";
  salute: number;
  battiti: number;
  /** Il prossimo avviso da accendere, indice in SEQUENZA. */
  prossimo: number;
  /** L'avviso con la spia accesa adesso. */
  attivo: number | null;
  /** L'ultimo avviso risolto: lo dice la coda, e la console finche' `fatto`. */
  risolto: number | null;
  fatto: boolean;
  scelto: ServiceIcon | null;
  /** Millisecondi al prossimo avviso; null se non se ne aspetta uno. */
  attesa: number | null;
};

type Azione =
  | { tipo: "accendi" }
  | { tipo: "batti" }
  | { tipo: "tocca"; servizio: ServiceIcon }
  | { tipo: "intervieni" }
  | { tipo: "ricomincia" };

const INIZIO: Stato = {
  fase: "spento",
  salute: 100,
  battiti: 0,
  prossimo: 0,
  attivo: null,
  risolto: null,
  fatto: false,
  scelto: null,
  attesa: null,
};

function arriva(s: Stato): Stato {
  if (s.prossimo >= SEQUENCE.length) return { ...s, fase: "fine", attesa: null, scelto: null, fatto: false };
  return { ...s, attivo: s.prossimo, prossimo: s.prossimo + 1, attesa: null, scelto: null, fatto: false };
}

function avanza(s: Stato, a: Azione): Stato {
  switch (a.tipo) {
    case "accendi":
      return s.fase === "spento" ? { ...s, fase: "acceso", attesa: PRIMA_ATTESA } : s;
    case "batti": {
      if (s.fase !== "acceso") return s;
      const battiti = s.battiti + 1;
      const cala = s.attivo !== null && battiti % 2 === 0;
      let dopo: Stato = { ...s, battiti, salute: cala ? Math.max(MINIMO, s.salute - CALO) : s.salute };
      if (dopo.attesa !== null) {
        const attesa = dopo.attesa - BATTITO;
        dopo = attesa > 0 ? { ...dopo, attesa } : arriva(dopo);
      }
      return dopo;
    }
    case "tocca":
      return s.fase === "acceso" ? { ...s, scelto: a.servizio, fatto: false } : s;
    case "intervieni":
      if (s.attivo === null || SEQUENCE[s.attivo] !== s.scelto) return s;
      return { ...s, risolto: s.attivo, attivo: null, fatto: true, attesa: ATTESA_DOPO };
    case "ricomincia":
      return INIZIO;
  }
}

export function Panel({ onNext: onAvanti, visible: visibile }: LevelProps) {
  const t = useTranslations("services.gioco.pannello");
  const comune = useTranslations("services.gioco.comune");
  const eventi = t.raw("eventi") as Evento[];
  const [s, manda] = useReducer(avanza, INIZIO);

  const corre = s.fase === "acceso" && visibile;
  useEffect(() => {
    if (!corre) return;
    const id = setInterval(() => manda({ tipo: "batti" }), BATTITO);
    return () => clearInterval(id);
  }, [corre]);

  const nome = (k: ServiceIcon) => t(`servizi.${k}`);
  const allarme = s.attivo !== null ? SEQUENCE[s.attivo] : null;
  const giu = s.salute < SOGLIA_GIU;
  const salute = Math.round(s.salute);

  const conta =
    s.fase === "spento"
      ? t("conta.spento")
      : s.fase === "fine"
        ? t("conta.fine")
        : s.prossimo === 0
          ? t("conta.acceso")
          : t("conta.avviso", { n: s.prossimo, totale: SEQUENCE.length });

  // La riga di coda: una chiave per testo, cosi' ogni cambio rientra.
  const coda =
    s.fase === "fine" ? (
      <span key="fine">{t("coda.fine")}</span>
    ) : s.attivo !== null ? (
      <span key={`avviso-${s.attivo}`}>
        <b>{nome(SEQUENCE[s.attivo])}</b> · {eventi[s.attivo].testo}
      </span>
    ) : s.risolto !== null ? (
      <span key={`risolto-${s.risolto}`}>{t("coda.risolto", { nome: nome(SEQUENCE[s.risolto]) })}</span>
    ) : (
      <span key="attesa">{t("coda.attesa")}</span>
    );

  return (
    <div className="bench" data-game-level="pannello">
      <div className="above lattice">
        <div className="head">
          <span className="level">{comune("etichetta", { numero: levelNumber("pannello"), nome: comune("livelli.pannello") })}</span>
          <span className="right">{conta}</span>
        </div>

        <div className="health">
          <b className={giu ? "down" : undefined}>{salute}%</b>
          <div className="tube" aria-hidden="true">
            <i className={giu ? "down" : undefined} style={{ "--p": `${s.salute}%` } as CSSProperties} />
          </div>
          <small>{t("salute")}</small>
        </div>

        <div className="tail" role="status">
          <span aria-hidden="true">›</span>
          {coda}
        </div>

        <div className="modules">
          {SERVIZI.map((k) => (
            <button
              key={k}
              type="button"
              className={[allarme === k && "alarm", s.scelto === k && "chosen"].filter(Boolean).join(" ") || undefined}
              data-form
              aria-pressed={s.scelto === k}
              disabled={s.fase !== "acceso"}
              onClick={() => manda({ tipo: "tocca", servizio: k })}
            >
              <span className="led" aria-hidden="true" />
              <span className="ic">
                <Icon name={k} />
              </span>
              {nome(k)}
              <span className="screws" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="console">
        {s.fase === "spento" ? (
          <>
            <div>
              <p className="mono">{t("spento.occhiello")}</p>
              <h3>{t("spento.titolo")}</h3>
            </div>
            <p className="explain">{t("spento.spiega")}</p>
            <div className="stage">
              <Calma segno="🔌" testo={t("spento.calma")} />
            </div>
            <div className="actions">
              <button type="button" className="green" onClick={() => manda({ tipo: "accendi" })}>
                <b aria-hidden="true">⏻</b>
                {t("spento.accendi")}
              </button>
            </div>
          </>
        ) : s.fase === "fine" ? (
          <>
            <div>
              <p className="mono">{t("fine.occhiello")}</p>
              <h3>{s.salute >= SOGLIA_BENE ? t("fine.bene") : t("fine.male")}</h3>
            </div>
            <p className="explain">{t("fine.spiega", { salute })}</p>
            <div className="stage">
              <ul className="report">
                {SERVIZI.map((k) => (
                  <li key={k}>
                    <span className="ic">
                      <Icon name={k} />
                    </span>
                    <span>
                      <b>{nome(k)}</b> · {t("fine.avvisi", { n: SEQUENCE.filter((x) => x === k).length })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="actions two">
              <button type="button" onClick={() => manda({ tipo: "ricomincia" })}>
                <b aria-hidden="true">↺</b>
                {t("fine.ricomincia")}
              </button>
              <button type="button" className="yellow" onClick={onAvanti}>
                {t("fine.avanti")} <b aria-hidden="true">→</b>
              </button>
            </div>
          </>
        ) : s.scelto === null ? (
          <>
            <div>
              <p className="mono">{t("acceso.occhiello")}</p>
              <h3>{allarme ? t("acceso.spia.titolo") : t("acceso.verde.titolo")}</h3>
            </div>
            <p className="explain">{allarme ? t("acceso.spia.spiega") : t("acceso.verde.spiega")}</p>
            <div className="stage">
              {allarme ? (
                <Calma key="spia" segno="👆" testo={t("acceso.spia.calma")} />
              ) : (
                <Calma key="verde" segno="☕" testo={t("acceso.verde.calma")} />
              )}
            </div>
            <div />
          </>
        ) : (
          <Modulo
            scelto={s.scelto}
            nome={nome(s.scelto)}
            attivo={s.attivo}
            risolto={s.fatto ? s.risolto : null}
            eventi={eventi}
            intervieni={() => manda({ tipo: "intervieni" })}
          />
        )}
      </div>
    </div>
  );
}

/** Il palco tranquillo: un segno e una riga, al centro. */
function Calma({ segno, testo }: { segno: string; testo: string }) {
  return (
    <div className="calm">
      <p>
        <span aria-hidden="true">{segno}</span>
        {testo}
      </p>
    </div>
  );
}

/**
 * La console di un modulo toccato: il suo avviso se la spia e' la sua, il
 * «fatto» dopo l'intervento, altrimenti che li' e' tutto a posto.
 */
function Modulo({
  scelto,
  nome,
  attivo,
  risolto,
  eventi,
  intervieni,
}: {
  scelto: ServiceIcon;
  nome: string;
  attivo: number | null;
  risolto: number | null;
  eventi: Evento[];
  intervieni: () => void;
}) {
  const t = useTranslations("services.gioco.pannello.modulo");
  const avviso = attivo !== null && SEQUENCE[attivo] === scelto ? eventi[attivo] : null;
  const tocca = avviso !== null;

  return (
    <>
      <div>
        <p className="mono">{t("occhiello", { nome })}</p>
        <h3>{risolto !== null ? t("fatto") : tocca ? t("cosa") : t("aPosto")}</h3>
      </div>
      {/* Nel prototipo questa riga c'e' anche col pannello tutto verde; qui
          solo quando la spia accesa e' davvero un'altra. */}
      <p className="explain">{risolto === null && !tocca && attivo !== null ? t("altra") : ""}</p>
      <div className="stage">
        {risolto !== null ? (
          <div key="risolto" className="problem solved">
            <small>
              <span aria-hidden="true">✓ </span>
              {t("risolto")}
            </small>
            <p>{eventi[risolto].esito}</p>
          </div>
        ) : avviso ? (
          <div key="avviso" className="problem">
            <small>
              <span aria-hidden="true">⚠ </span>
              {t("avviso")}
            </small>
            <p>{avviso.testo}</p>
          </div>
        ) : (
          <Calma key="calma" segno="✓" testo={t("nessuno", { nome: nome.toLowerCase() })} />
        )}
      </div>
      <div className="actions">
        {avviso ? (
          <button type="button" className="yellow" onClick={intervieni}>
            <b aria-hidden="true">⚡</b>
            {avviso.intervento}
          </button>
        ) : (
          <button type="button" disabled>
            {risolto !== null ? t("aspetta") : t("niente")}
          </button>
        )}
      </div>
    </>
  );
}
