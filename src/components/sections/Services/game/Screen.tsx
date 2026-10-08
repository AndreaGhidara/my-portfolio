"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { levelNumber, type LevelProps } from "./levels";
import { Icon } from "./icons";
import {
  FAKE_FONTS,
  FAKE_LAYOUTS,
  FAKE_PALETTES,
  INITIAL_SCALE,
  FAKE_SCALES,
  siteVariables,
} from "./fakeSite";
import { FakeSite } from "./screenSite";
import { DRAWER_TOOLS, Drawer, type DrawerToolId, type Choices } from "./screenDrawer";
import { ScreenBack } from "./screenBack";

// Tempi del prototipo: le viti 0,4 s dopo l'ultimo attrezzo, il circuito
// 0,85 s dopo l'ultima vite, il livello dopo a 2,8 s. Fuori dallo schermo si
// fermano, e al rientro ripartono da capo.

const INITIAL_CHOICES: Choices = {
  palette: 0,
  fonts: 0,
  scale: FAKE_SCALES.indexOf(INITIAL_SCALE),
  layout: 0,
  img: "pane",
  view: "pc",
};

const AFTER_TOOLS = 400;
const AFTER_SCREWS = 850;
const TO_NEXT_LEVEL = 2800;

const SCREWS = [
  { x: "1rem", y: "1rem" },
  { x: "calc(100% - 1rem)", y: "1rem" },
  { x: "1rem", y: "calc(100% - 1rem)" },
  { x: "calc(100% - 1rem)", y: "calc(100% - 1rem)" },
].map((v, i) => ({ ...v, r: `${30 + i * 40}deg` }));

type Flash = { field: DrawerToolId; n: number };

function flashTarget(site: HTMLElement, field: DrawerToolId): Element | null {
  if (field === "caratteri" || field === "testi") return site.querySelector("[data-title]");
  if (field === "immagini") return site.querySelector("[data-img]");
  if (field === "telefono") return null;
  return site;
}

// «Ricomincia» rimonta il banco: con lui spariscono stato e timer.
export function Screen(props: LevelProps) {
  const [round, setRound] = useState(0);
  return <Bench key={round} {...props} onRestart={() => setRound((g) => g + 1)} />;
}

function Bench({ onNext, visible, onRestart }: LevelProps & { onRestart: () => void }) {
  const t = useTranslations("services.gioco.schermo");
  const common = useTranslations("services.gioco.comune");

  const [choices, setChoices] = useState<Choices>(INITIAL_CHOICES);
  const [active, setActive] = useState<DrawerToolId>("colori");
  const [done, setDone] = useState<readonly DrawerToolId[]>([]);
  const [ready, setReady] = useState(false);
  const [unscrewed, setUnscrewed] = useState<readonly boolean[]>(() => SCREWS.map(() => false));
  const [back, setBack] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  const allDone = done.length === DRAWER_TOOLS.length;
  const open = unscrewed.every(Boolean);
  const onPhone = choices.view === "cell";

  // Il guscio passa una funzione nuova a ogni render: il timer dei 2,8 s non
  // deve ripartire per questo, solo quando cambia la visibilita'.
  const onNextRef = useRef(onNext);
  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    if (ready || !allDone || onPhone || !visible) return;
    const id = setTimeout(() => setReady(true), AFTER_TOOLS);
    return () => clearTimeout(id);
  }, [ready, allDone, onPhone, visible]);

  useEffect(() => {
    if (!open || !visible) return;
    const fall = setTimeout(() => setBack(true), AFTER_SCREWS);
    const advance = setTimeout(() => onNextRef.current(), TO_NEXT_LEVEL);
    return () => {
      clearTimeout(fall);
      clearTimeout(advance);
    };
  }, [open, visible]);

  // Il lampo e' una classe tolta e rimessa sul nodo vero: e' l'unico modo di
  // far ripartire un'animazione CSS sullo stesso elemento, scelta dopo scelta.
  const sitePc = useRef<HTMLDivElement | null>(null);
  const siteCell = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!flash) return;
    for (const site of [sitePc.current, siteCell.current]) {
      const el = site && flashTarget(site, flash.field);
      if (!(el instanceof HTMLElement)) continue;
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    }
  }, [flash]);

  const choose = <C extends keyof Choices>(field: C, value: Choices[C]) => {
    setChoices((s) => ({ ...s, [field]: value }));
    setDone((f) => (f.includes(active) ? f : [...f, active]));
    setFlash((l) => ({ field: active, n: (l?.n ?? 0) + 1 }));
  };

  // Le viti stanno sul portatile: un attrezzo che non e' il telefono riporta
  // la vista al computer.
  const openTool = (k: DrawerToolId) => {
    setActive(k);
    if (k !== "telefono" && onPhone) setChoices((s) => ({ ...s, view: "pc" }));
  };

  const unscrew = (i: number) => setUnscrewed((v) => v.map((x, j) => x || j === i));

  const message =
    allDone && onPhone
      ? t.rich("tornaAlComputer", { b: (c) => <b>{c}</b> })
      : ready
        ? t.rich("pronto", { b: (c) => <b>{c}</b> })
        : null;

  const site = {
    layout: FAKE_LAYOUTS[choices.layout].id,
    illustration: choices.img,
    pair: FAKE_FONTS[choices.fonts],
    scale: FAKE_SCALES[choices.scale],
  };

  return (
    <div
      className="bench"
      data-game-level="schermo"
      data-view={choices.view}
      data-ready={ready || undefined}
      data-open={open || undefined}
      data-back={back || undefined}
      style={siteVariables(FAKE_PALETTES[choices.palette].colors) as CSSProperties}
    >
      <div className="step-1" inert={back}>
        <div className="head">
          <span className="level">{common("etichetta", { numero: levelNumber("schermo"), nome: common("livelli.schermo") })}</span>
          <span className="dots" aria-hidden="true">
            {DRAWER_TOOLS.map((a, i) => (
              <i key={a} className={i < done.length ? "yes" : undefined} />
            ))}
          </span>
        </div>

        <div className="laptop" inert={onPhone}>
          <div className="frame-pc">
            <div className="screen">
              <FakeSite ref={sitePc} {...site} />
            </div>
            {ready &&
              SCREWS.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  className={unscrewed[i] ? "screw gone" : "screw"}
                  style={{ left: v.x, top: v.y, "--r": v.r } as CSSProperties}
                  aria-label={t("vite", { numero: i + 1 })}
                  disabled={unscrewed[i]}
                  onClick={() => unscrew(i)}
                />
              ))}
          </div>
          <div className="base-pc" />
        </div>

        <div className="cell" inert={!onPhone}>
          <div className="screen">
            <FakeSite ref={siteCell} {...site} />
          </div>
        </div>

        <div className="tools" role="group" aria-label={t("attrezzi")}>
          {DRAWER_TOOLS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={a === active}
              className={done.includes(a) ? "done" : undefined}
              onClick={() => openTool(a)}
            >
              <Icon name={a} />
              {t(`attrezzo.${a}.nome`)}
            </button>
          ))}
        </div>

        <Drawer
          active={active}
          choices={choices}
          tried={done.includes(active)}
          message={message}
          onChoose={choose}
        />
      </div>

      <div className="step-2" inert={!back}>
        {open && <ScreenBack onRestart={onRestart} />}
      </div>
    </div>
  );
}
