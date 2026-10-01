"use client";

import type { CSSProperties, Ref } from "react";
import { useTranslations } from "next-intl";
import {
  ILLUSTRAZIONI,
  VIEWBOX_ILLUSTRAZIONI,
  type CoppiaFinta,
  type IdIllustrazione,
  type IdImpaginazione,
  type ScalaFinta,
} from "./sitoFinto";

/**
 * Un'illustrazione del sito finto. Il markup e' una stringa fissa di
 * sitoFinto.ts, nessun dato da fuori: dangerouslySetInnerHTML qui e' sicuro.
 */
export function Illustrazione({ id }: { id: IdIllustrazione }) {
  return (
    <svg
      viewBox={VIEWBOX_ILLUSTRAZIONI}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ILLUSTRAZIONI[id] }}
    />
  );
}

type SitoProps = {
  impaginazione: IdImpaginazione;
  illustrazione: IdIllustrazione;
  coppia: CoppiaFinta;
  scala: ScalaFinta;
  ref?: Ref<HTMLDivElement>;
};

/**
 * La landing del Forno Aurora, quella che gli attrezzi cambiano davvero. I
 * colori arrivano dalle variabili --sf..--sm che il livello scrive sul banco;
 * qui si scrivono solo carattere e scala.
 *
 * Il titolo non e' un heading: e' il disegno di un sito dentro la pagina, e
 * chi naviga per titoli non deve trovarci il pane fra le sezioni del
 * portfolio. `data-titolo` e `data-img` sono i bersagli del lampo.
 */
export function SitoFinto({ impaginazione, illustrazione, coppia, scala, ref }: SitoProps) {
  const t = useTranslations("services.gioco.schermo.sito");

  const stile = {
    "--ft": coppia.titolo,
    "--fw": coppia.peso,
    "--fp": coppia.paragrafo,
    "--k": scala.k,
  } as CSSProperties;

  const nav = (
    <div className="s-nav">
      <b>Forno Aurora</b>
      <span>{t("nav.pane")}</span>
      <span>{t("nav.torte")}</span>
      <span>{t("nav.orari")}</span>
      <i>{t("nav.prenota")}</i>
    </div>
  );
  const immagine = (
    <div className="s-img" data-img>
      <Illustrazione id={illustrazione} />
    </div>
  );
  const em = <em>{t("titoloEm")}</em>;

  let corpo;
  if (impaginazione === "manifesto") {
    corpo = (
      <div className="l-manifesto">
        {nav}
        <div className="eroe">
          <p className="s-titolo" data-titolo>
            {t("titolo")}
            <br />
            {em}
          </p>
          <div className="bollo" data-img>
            <Illustrazione id={illustrazione} />
          </div>
          <span className="bollo-testo">{t("bollo")}</span>
        </div>
        <div className="fascia">
          <span>
            {t("fascia")}
            {t("fascia")}
          </span>
        </div>
      </div>
    );
  } else if (impaginazione === "copertina") {
    corpo = (
      <div className="l-copertina">
        {immagine}
        {nav}
        <div className="testata">
          <span>{t("numero")}</span>
          <i>{t("sfornato")}</i>
        </div>
        <span className="grande">Aurora</span>
        <span className="lato">{t("lato")}</span>
        <div className="piede">
          <div>
            <p className="s-titolo" data-titolo>
              {t("titolo")}
              <br />
              {em}
            </p>
            <p>{t("indirizzo")}</p>
          </div>
          <div className="bollino">
            {t("aperto")}
            <b>6·13</b>
            {t("oggi")}
          </div>
        </div>
      </div>
    );
  } else if (impaginazione === "bento") {
    const giorni = [...t("giorni")];
    corpo = (
      <div className="l-bento">
        {nav}
        <div className="griglia">
          <div className="t-titolo">
            <small>{t("quartiere")}</small>
            <p className="s-titolo" data-titolo>
              {t("titolo")} {em}
            </p>
            <span className="punti">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="t-img">
            {immagine}
            <span className="etichetta">✦ {t("sfornato")}</span>
          </div>
          <div className="t-num">
            <b>6</b>
            <span>{t("tipi")}</span>
          </div>
          <div className="t-cta">
            <span>{t("prenotaTorta")}</span>
            <i aria-hidden="true">→</i>
          </div>
          <div className="t-ora">
            <b>6 · 13</b>
            <span className="giorni">
              {giorni.map((g, i) => (
                // L'ultimo giorno, la domenica, il forno e' chiuso.
                <span key={i} className={i === giorni.length - 1 ? "no" : undefined}>
                  {g}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    );
  } else {
    corpo = (
      <div className="l-classica">
        {nav}
        <div className="eroe">
          <div>
            <p className="s-titolo" data-titolo>
              {t("titolo")} {em}
            </p>
            <p className="nota-p">{t("nota")}</p>
            <span className="cta">{t("cta")}</span>
          </div>
          {immagine}
        </div>
        <div className="schede">
          {(["pane", "torte", "dove"] as const).map((k) => (
            <div key={k}>
              <b>{t(`schede.${k}.titolo`)}</b>
              <span>{t(`schede.${k}.testo`)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="sito" style={stile}>
      {corpo}
    </div>
  );
}
