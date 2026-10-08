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

// Sono anche i nomi delle icone e le chiavi dei messaggi.
export const DRAWER_TOOLS = ["colori", "caratteri", "testi", "sezioni", "immagini", "telefono"] as const;
export type DrawerToolId = (typeof DRAWER_TOOLS)[number];

export type Viewport = "pc" | "cell";

// Indici nelle liste di fakeSite.ts.
export type Choices = {
  palette: number;
  fonts: number;
  scale: number;
  layout: number;
  img: IllustrationId;
  view: Viewport;
};

const TONES: Record<MiniTone, string> = {
  ink: "var(--ink)",
  muted: "var(--muted)",
  mutedDark: "var(--mutedDark)",
  orange: "var(--orange)",
};

function Mini({ mini }: { mini: MiniLayout }) {
  return (
    <span
      className="mini-lay"
      data-at-bottom={mini.atBottom || undefined}
      style={{
        gridTemplateColumns: mini.columns,
        gridTemplateRows: mini.rows,
        background: mini.background && TONES[mini.background],
      }}
    >
      {mini.cells.map((c, i) => (
        <i
          key={i}
          style={{
            background: c.tone && TONES[c.tone],
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

type DrawerProps = {
  active: DrawerToolId;
  choices: Choices;
  tried: boolean;
  // La riga scura in fondo: le viti, o il ritorno al computer.
  message: ReactNode;
  onChoose: <C extends keyof Choices>(field: C, value: Choices[C]) => void;
};

export function Drawer({ active, choices, tried, message, onChoose }: DrawerProps) {
  const t = useTranslations("services.gioco.schermo");
  const title = t(`attrezzo.${active}.titolo`);

  const choice = <C extends keyof Choices>(field: C, value: Choices[C], content: ReactNode, key: string) => (
    <button key={key} type="button" aria-pressed={choices[field] === value} onClick={() => onChoose(field, value)}>
      {content}
    </button>
  );

  let body: ReactNode = null;
  if (active === "colori") {
    body = (
      <div className="choices three" role="group" aria-label={title}>
        {FAKE_PALETTES.map((p, i) =>
          choice(
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
  } else if (active === "caratteri") {
    body = (
      <div className="choices" role="group" aria-label={title}>
        {FAKE_FONTS.map((c, i) =>
          choice(
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
  } else if (active === "testi") {
    const s = FAKE_SCALES[choices.scale];
    body = (
      <>
        <div className="choices three" role="group" aria-label={title}>
          {FAKE_SCALES.map((x, i) =>
            choice(
              "scale",
              i,
              <>
                <span className="aa-scale" aria-hidden="true" style={{ fontSize: `${0.6 + i * 0.3}rem` }}>
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
        <div className="scale-sample">
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
  } else if (active === "sezioni") {
    body = (
      <div className="choices" role="group" aria-label={title}>
        {FAKE_LAYOUTS.map((l, i) =>
          choice(
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
  } else if (active === "immagini") {
    body = (
      <div className="choices" role="group" aria-label={title}>
        {ILLUSTRATION_ORDER.map((k) =>
          choice(
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
    body = (
      <div className="view-lever" role="group" aria-label={title}>
        {(["pc", "cell"] as const).map((v) => choice("view", v, t(`vista.${v}`), v))}
      </div>
    );
  }

  return (
    <div className="drawer">
      <p className="mono">
        {t(`attrezzo.${active}.nome`)} · {t(tried ? "stato.provato" : "stato.prova")}
      </p>
      <h3>{title}</h3>
      <p className="explain">{t(`attrezzo.${active}.testo`)}</p>
      {body}
      <div className="ok" data-lit={message ? true : undefined} aria-live="polite">
        {message && (
          <>
            <span aria-hidden="true">✦</span>
            <span>{message}</span>
          </>
        )}
      </div>
    </div>
  );
}
