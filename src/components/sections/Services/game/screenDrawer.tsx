"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Illustrazione } from "./screenSite";
import {
  CARATTERI_FINTI,
  IMPAGINAZIONI_FINTE,
  ORDINE_ILLUSTRAZIONI,
  PALETTE_FINTE,
  SCALE_FINTE,
  type IdIllustrazione,
  type MiniImpaginazione,
  type TonoMini,
} from "./fakeSite";

/** I sei attrezzi, nell'ordine delle linguette. Sono anche i nomi delle icone. */
export const ATTREZZI = ["colori", "caratteri", "testi", "sezioni", "immagini", "telefono"] as const;
export type IdAttrezzo = (typeof ATTREZZI)[number];

export type Vista = "pc" | "cell";

/** Quello che gli attrezzi hanno scelto: indici nelle liste di sitoFinto.ts. */
export type Scelte = {
  palette: number;
  caratteri: number;
  scala: number;
  impaginazione: number;
  img: IdIllustrazione;
  vista: Vista;
};

const TONI: Record<TonoMini, string> = {
  ink: "var(--ink)",
  muted: "var(--muted)",
  mutedDark: "var(--mutedDark)",
  orange: "var(--orange)",
};

/** Il disegnino di un'impaginazione, sul suo pulsante. */
function Mini({ mini }: { mini: MiniImpaginazione }) {
  return (
    <span
      className="mini-lay"
      data-in-fondo={mini.inFondo || undefined}
      style={{
        gridTemplateColumns: mini.colonne,
        gridTemplateRows: mini.righe,
        background: mini.fondo && TONI[mini.fondo],
      }}
    >
      {mini.celle.map((c, i) => (
        <i
          key={i}
          style={{
            background: c.tono && TONI[c.tono],
            gridColumn: c.colonna,
            gridRow: c.riga,
            inlineSize: c.larghezza,
            blockSize: c.altezza,
          }}
        />
      ))}
    </span>
  );
}

type CassettoProps = {
  attivo: IdAttrezzo;
  scelte: Scelte;
  provato: boolean;
  /** La riga scura in fondo: le viti, o il ritorno al computer. */
  messaggio: ReactNode;
  onScegli: <C extends keyof Scelte>(campo: C, valore: Scelte[C]) => void;
};

/** Il cassetto dell'attrezzo aperto: cosa fa, e le sue scelte. */
export function Cassetto({ attivo, scelte, provato, messaggio, onScegli }: CassettoProps) {
  const t = useTranslations("services.gioco.schermo");
  const titolo = t(`attrezzo.${attivo}.titolo`);

  const scelta = <C extends keyof Scelte>(campo: C, valore: Scelte[C], contenuto: ReactNode, chiave: string) => (
    <button key={chiave} type="button" aria-pressed={scelte[campo] === valore} onClick={() => onScegli(campo, valore)}>
      {contenuto}
    </button>
  );

  let corpo: ReactNode = null;
  if (attivo === "colori") {
    corpo = (
      <div className="scelte tre" role="group" aria-label={titolo}>
        {PALETTE_FINTE.map((p, i) =>
          scelta(
            "palette",
            i,
            <>
              <span className="pal" aria-hidden="true">
                {Object.values(p.colori).map((c, j) => (
                  <i key={j} style={{ background: c }} />
                ))}
              </span>
              {t(`palette.${p.id}`)}
            </>,
            p.id,
          ),
        )}
      </div>
    );
  } else if (attivo === "caratteri") {
    corpo = (
      <div className="scelte" role="group" aria-label={titolo}>
        {CARATTERI_FINTI.map((c, i) =>
          scelta(
            "caratteri",
            i,
            <>
              <span className="aa" aria-hidden="true" style={{ fontFamily: c.titolo, fontWeight: c.peso }}>
                Aa
              </span>
              {c.nome}
            </>,
            c.id,
          ),
        )}
      </div>
    );
  } else if (attivo === "testi") {
    const s = SCALE_FINTE[scelte.scala];
    corpo = (
      <>
        <div className="scelte tre" role="group" aria-label={titolo}>
          {SCALE_FINTE.map((x, i) =>
            scelta(
              "scala",
              i,
              <>
                <span className="aa-scala" aria-hidden="true" style={{ fontSize: `${0.6 + i * 0.3}rem` }}>
                  Aa
                </span>
                {t(`scale.${x.id}`)}
              </>,
              x.id,
            ),
          )}
        </div>
        {/* Le misure del campione sono quelle del prototipo: i pixel veri divisi
            per quanto il cassetto e' piu' piccolo di una pagina. */}
        <div className="scala-campione">
          <div>
            <b className="h1" style={{ fontSize: `${s.h1 / 80}rem` }}>
              {t("campione.h1")}
            </b>
            <small>{s.h1}px</small>
          </div>
          <div>
            <b style={{ fontSize: `${s.h2 / 46}rem` }}>{t("campione.h2")}</b>
            <small>{s.h2}px</small>
          </div>
          <div>
            <span style={{ fontSize: `${s.p / 30}rem` }}>{t("campione.p")}</span>
            <small>{s.p}px</small>
          </div>
        </div>
      </>
    );
  } else if (attivo === "sezioni") {
    corpo = (
      <div className="scelte" role="group" aria-label={titolo}>
        {IMPAGINAZIONI_FINTE.map((l, i) =>
          scelta(
            "impaginazione",
            i,
            <>
              <Mini mini={l.mini} />
              {t(`impaginazioni.${l.id}`)}
            </>,
            l.id,
          ),
        )}
      </div>
    );
  } else if (attivo === "immagini") {
    corpo = (
      <div className="scelte" role="group" aria-label={titolo}>
        {ORDINE_ILLUSTRAZIONI.map((k) =>
          scelta(
            "img",
            k,
            <>
              <span className="mini-img">
                <Illustrazione id={k} />
              </span>
              {t(`illustrazioni.${k}`)}
            </>,
            k,
          ),
        )}
      </div>
    );
  } else {
    corpo = (
      <div className="leva-vista" role="group" aria-label={titolo}>
        {(["pc", "cell"] as const).map((v) => scelta("vista", v, t(`vista.${v}`), v))}
      </div>
    );
  }

  return (
    <div className="cassetto">
      <p className="mono">
        {t(`attrezzo.${attivo}.nome`)} · {t(provato ? "stato.provato" : "stato.prova")}
      </p>
      <h3>{titolo}</h3>
      <p className="spiega">{t(`attrezzo.${attivo}.testo`)}</p>
      {corpo}
      <div className="ok" data-acceso={messaggio ? true : undefined} aria-live="polite">
        {messaggio && (
          <>
            <span aria-hidden="true">✦</span>
            <span>{messaggio}</span>
          </>
        )}
      </div>
    </div>
  );
}
