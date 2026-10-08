"use client";

import { useTranslations } from "next-intl";
import { LIVELLI, type LivelloProps } from "./levels";

/**
 * La fine del giro: il cielo della notte del livello 4 si fa giorno, e sotto
 * i quattro strati in fila, uno per livello. Il cielo e' tutto CSS
 * (finale.css): qui non c'e' un timer.
 *
 * Per il finale `onAvanti` e' «torna al sito», cioe' il giro da capo dal
 * livello 1. «Parliamone» non e' un pulsante: e' il link ai Contatti, e sul
 * telefono e' l'unica via ai Contatti dentro la sezione.
 */
export function Finale({ onAvanti }: LivelloProps) {
  const t = useTranslations("services.gioco.finale");

  return (
    <div className="banco" data-gioco-livello="finale">
      <div className="sopra">
        <div className="stelle" aria-hidden="true" />
        <div className="testa">
          <span className="livello">{t("testa")}</span>
          <span className="destra" aria-hidden="true">☀</span>
        </div>
        <div className="alba">
          <p>
            <b>{t("alba")}</b>
            <small>{t("dopoAlba")}</small>
          </p>
        </div>
      </div>

      <div className="console">
        <div>
          <p className="mono">{t("occhiello")}</p>
          <h3>{t("titolo")}</h3>
        </div>
        <div />
        <div className="palco">
          <ol className="strati">
            {LIVELLI.map((id, i) => (
              <li key={id}>
                <span aria-hidden="true">{i + 1}</span>
                {t(`strati.${id}`)}
              </li>
            ))}
          </ol>
        </div>
        <div className="azioni due">
          <button type="button" onClick={onAvanti}>
            <b aria-hidden="true">↺</b>
            {t("tornaAlSito")}
          </button>
          <a href="#contact" className="arancio">
            {t("parliamone")} <b aria-hidden="true">→</b>
          </a>
        </div>
      </div>
    </div>
  );
}
