"use client";

import type { CSSProperties, Ref } from "react";
import { useTranslations } from "next-intl";
import {
  ILLUSTRATIONS,
  ILLUSTRATION_VIEWBOX,
  type FakeFontPair,
  type IllustrationId,
  type LayoutId,
  type FakeScale,
} from "./fakeSite";

/**
 * Un'illustrazione del sito finto. Il markup e' una stringa fissa di
 * sitoFinto.ts, nessun dato da fuori: dangerouslySetInnerHTML qui e' sicuro.
 */
export function Illustration({ id }: { id: IllustrationId }) {
  return (
    <svg
      viewBox={ILLUSTRATION_VIEWBOX}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ILLUSTRATIONS[id] }}
    />
  );
}

type SitoProps = {
  layout: LayoutId;
  illustration: IllustrationId;
  pair: FakeFontPair;
  scale: FakeScale;
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
export function FakeSite({ layout: impaginazione, illustration: illustrazione, pair: coppia, scale: scala, ref }: SitoProps) {
  const t = useTranslations("services.gioco.schermo.sito");

  const stile = {
    "--ft": coppia.heading,
    "--fw": coppia.weight,
    "--fp": coppia.body,
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
      <Illustration id={illustrazione} />
    </div>
  );
  const em = <em>{t("titoloEm")}</em>;

  let corpo;
  if (impaginazione === "manifesto") {
    corpo = (
      <div className="l-poster">
        {nav}
        <div className="hero">
          <p className="s-title" data-title>
            {t("titolo")}
            <br />
            {em}
          </p>
          <div className="seal" data-img>
            <Illustration id={illustrazione} />
          </div>
          <span className="seal-text">{t("bollo")}</span>
        </div>
        <div className="band">
          <span>
            {t("fascia")}
            {t("fascia")}
          </span>
        </div>
      </div>
    );
  } else if (impaginazione === "copertina") {
    corpo = (
      <div className="l-cover">
        {immagine}
        {nav}
        <div className="header">
          <span>{t("numero")}</span>
          <i>{t("sfornato")}</i>
        </div>
        <span className="large">Aurora</span>
        <span className="side">{t("lato")}</span>
        <div className="foot">
          <div>
            <p className="s-title" data-title>
              {t("titolo")}
              <br />
              {em}
            </p>
            <p>{t("indirizzo")}</p>
          </div>
          <div className="sticker">
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
        <div className="grid">
          <div className="t-title">
            <small>{t("quartiere")}</small>
            <p className="s-title" data-title>
              {t("titolo")} {em}
            </p>
            <span className="points">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="t-img">
            {immagine}
            <span className="label">✦ {t("sfornato")}</span>
          </div>
          <div className="t-num">
            <b>6</b>
            <span>{t("tipi")}</span>
          </div>
          <div className="t-cta">
            <span>{t("prenotaTorta")}</span>
            <i aria-hidden="true">→</i>
          </div>
          <div className="t-time">
            <b>6 · 13</b>
            <span className="days">
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
      <div className="l-classic">
        {nav}
        <div className="hero">
          <div>
            <p className="s-title" data-title>
              {t("titolo")} {em}
            </p>
            <p className="note-p">{t("nota")}</p>
            <span className="cta">{t("cta")}</span>
          </div>
          {immagine}
        </div>
        <div className="cards">
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
    <div ref={ref} className="site" style={stile}>
      {corpo}
    </div>
  );
}
