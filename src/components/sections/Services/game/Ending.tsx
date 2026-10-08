"use client";

import { useTranslations } from "next-intl";
import { LEVELS, type LevelProps } from "./levels";

// L'alba e' tutta in ending.css: qui nessun timer. «Parliamone» e' un link e
// non un pulsante perche' sul telefono e' l'unica via ai Contatti dalla sezione.
export function Ending({ onNext }: LevelProps) {
  const t = useTranslations("services.gioco.finale");

  return (
    <div className="bench" data-game-level="finale">
      <div className="above">
        <div className="stars" aria-hidden="true" />
        <div className="head">
          <span className="level">{t("testa")}</span>
          <span className="right" aria-hidden="true">☀</span>
        </div>
        <div className="dawn">
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
        <div className="stage">
          <ol className="layers">
            {LEVELS.map((id, i) => (
              <li key={id}>
                <span aria-hidden="true">{i + 1}</span>
                {t(`strati.${id}`)}
              </li>
            ))}
          </ol>
        </div>
        <div className="actions two">
          <button type="button" onClick={onNext}>
            <b aria-hidden="true">↺</b>
            {t("tornaAlSito")}
          </button>
          <a href="#contact" className="orange">
            {t("parliamone")} <b aria-hidden="true">→</b>
          </a>
        </div>
      </div>
    </div>
  );
}
