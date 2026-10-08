"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Illustration } from "./screenSite";
import {
  FAKE_FONTS,
  FAKE_LAYOUTS,
  ILLUSTRATION_ORDER,
  FAKE_PALETTES,
  FAKE_SCALES,
  type IllustrationId,
  type MiniLayout,
  type MiniTone,
} from "./fakeSite";

/** I sei attrezzi, nell'ordine delle linguette. Sono anche i nomi delle icone. */
export const DRAWER_TOOLS = ["colori", "caratteri", "testi", "sezioni", "immagini", "telefono"] as const;
export type DrawerToolId = (typeof DRAWER_TOOLS)[number];

export type Viewport = "pc" | "cell";

/** Quello che gli attrezzi hanno scelto: indici nelle liste di sitoFinto.ts. */
export type Choices = {
  palette: number;
  fonts: number;
  scale: number;
  layout: number;
  img: IllustrationId;
  view: Viewport;
};

const TONI: Record<MiniTone, string> = {
  ink: "var(--ink)",
  muted: "var(--muted)",
  mutedDark: "var(--mutedDark)",
  orange: "var(--orange)",
};

/** Il disegnino di un'impaginazione, sul suo pulsante. */
function Mini({ mini }: { mini: MiniLayout }) {
  return (
    <span
      className="mini-lay"
      data-in-fondo={mini.atBottom || undefined}
      style={{
        gridTemplateColumns: mini.columns,
        gridTemplateRows: mini.rows,
        background: mini.background && TONI[mini.background],
      }}
    >
      {mini.cells.map((c, i) => (
        <i
          key={i}
          style={{
            background: c.tone && TONI[c.tone],
            gridColumn: c.column,
            gridRow: c.row,
            inlineSize: c.width,
            blockSize: c.height,
          }}
        />
      ))}
    </span>
  );
}

type CassettoProps = {
  active: DrawerToolId;
  choices: Choices;
  tried: boolean;
  /** La riga scura in fondo: le viti, o il ritorno al computer. */
  message: ReactNode;
  onChoose: <C extends keyof Choices>(campo: C, valore: Choices[C]) => void;
};

/** Il cassetto dell'attrezzo aperto: cosa fa, e le sue scelte. */
export function Drawer({ active: attivo, choices: scelte, tried: provato, message: messaggio, onChoose: onScegli }: CassettoProps) {
  const t = useTranslations("services.gioco.schermo");
  const titolo = t(`attrezzo.${attivo}.titolo`);

  const scelta = <C extends keyof Choices>(campo: C, valore: Choices[C], contenuto: ReactNode, chiave: string) => (
    <button key={chiave} type="button" aria-pressed={scelte[campo] === valore} onClick={() => onScegli(campo, valore)}>
      {contenuto}
    </button>
  );

  let corpo: ReactNode = null;
  if (attivo === "colori") {
    corpo = (
      <div className="scelte tre" role="group" aria-label={titolo}>
        {FAKE_PALETTES.map((p, i) =>
          scelta(
            "palette",
            i,
            <>
              <span className="pal" aria-hidden="true">
                {Object.values(p.colors).map((c, j) => (
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
        {FAKE_FONTS.map((c, i) =>
          scelta(
            "fonts",
            i,
            <>
              <span className="aa" aria-hidden="true" style={{ fontFamily: c.heading, fontWeight: c.weight }}>
                Aa
              </span>
              {c.name}
            </>,
            c.id,
          ),
        )}
      </div>
    );
  } else if (attivo === "testi") {
    const s = FAKE_SCALES[scelte.scale];
    corpo = (
      <>
        <div className="scelte tre" role="group" aria-label={titolo}>
          {FAKE_SCALES.map((x, i) =>
            scelta(
              "scale",
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
        {FAKE_LAYOUTS.map((l, i) =>
          scelta(
            "layout",
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
        {ILLUSTRATION_ORDER.map((k) =>
          scelta(
            "img",
            k,
            <>
              <span className="mini-img">
                <Illustration id={k} />
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
        {(["pc", "cell"] as const).map((v) => scelta("view", v, t(`vista.${v}`), v))}
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
