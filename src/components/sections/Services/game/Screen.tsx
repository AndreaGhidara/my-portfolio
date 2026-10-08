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

/**
 * Livello 1, lo schermo. Sotto il portatile sei attrezzi cambiano davvero la
 * landing del Forno Aurora (colori, caratteri, misure, sezioni, immagini,
 * telefono). Provati tutti, compaiono quattro viti: svitate, lo schermo cade
 * in avanti, si vede il circuito che c'era dietro e il gioco passa da solo al
 * livello 2.
 *
 * I tempi sono quelli del prototipo: le viti 0,4 s dopo l'ultimo attrezzo,
 * il circuito 0,85 s dopo l'ultima vite, il livello dopo a 2,8 s. Fuori dallo
 * schermo si fermano, e al rientro ripartono da capo.
 */

const INIZIALI: Choices = {
  palette: 0,
  fonts: 0,
  scale: FAKE_SCALES.indexOf(INITIAL_SCALE),
  layout: 0,
  img: "pane",
  view: "pc",
};

const DOPO_ATTREZZI = 400;
const DOPO_VITI = 850;
const AL_LIVELLO_DOPO = 2800;

/** Le quattro viti agli angoli della cornice, ognuna col taglio storto a modo suo. */
const VITI = [
  { x: "1rem", y: "1rem" },
  { x: "calc(100% - 1rem)", y: "1rem" },
  { x: "1rem", y: "calc(100% - 1rem)" },
  { x: "calc(100% - 1rem)", y: "calc(100% - 1rem)" },
].map((v, i) => ({ ...v, r: `${30 + i * 40}deg` }));

type Lampo = { campo: DrawerToolId; n: number };

/** Dove lampeggia la landing dopo una scelta: il punto appena cambiato. */
function bersaglio(sito: HTMLElement, campo: DrawerToolId): Element | null {
  if (campo === "caratteri" || campo === "testi") return sito.querySelector("[data-title]");
  if (campo === "immagini") return sito.querySelector("[data-img]");
  if (campo === "telefono") return null;
  return sito;
}

/**
 * «Ricomincia», nell'anteprima del circuito, rifa' il livello da capo: si
 * rimonta il banco, e con lui spariscono stato e timer.
 */
export function Screen(props: LevelProps) {
  const [giro, setGiro] = useState(0);
  return <Banco key={giro} {...props} onRicomincia={() => setGiro((g) => g + 1)} />;
}

function Banco({ onNext: onAvanti, visible: visibile, onRicomincia }: LevelProps & { onRicomincia: () => void }) {
  const t = useTranslations("services.gioco.schermo");
  const comune = useTranslations("services.gioco.comune");

  const [scelte, setScelte] = useState<Choices>(INIZIALI);
  const [attivo, setAttivo] = useState<DrawerToolId>("colori");
  const [fatti, setFatti] = useState<readonly DrawerToolId[]>([]);
  const [pronto, setPronto] = useState(false);
  const [svitate, setSvitate] = useState<readonly boolean[]>(() => VITI.map(() => false));
  const [dietro, setDietro] = useState(false);
  const [lampo, setLampo] = useState<Lampo | null>(null);

  const tuttiFatti = fatti.length === DRAWER_TOOLS.length;
  const aperto = svitate.every(Boolean);
  const sulTelefono = scelte.view === "cell";

  // Il guscio passa una funzione nuova a ogni render: il timer dei 2,8 s non
  // deve ripartire per questo, solo quando cambia la visibilita'.
  const avanti = useRef(onAvanti);
  useEffect(() => {
    avanti.current = onAvanti;
  }, [onAvanti]);

  useEffect(() => {
    if (pronto || !tuttiFatti || sulTelefono || !visibile) return;
    const id = setTimeout(() => setPronto(true), DOPO_ATTREZZI);
    return () => clearTimeout(id);
  }, [pronto, tuttiFatti, sulTelefono, visibile]);

  useEffect(() => {
    if (!aperto || !visibile) return;
    const giu = setTimeout(() => setDietro(true), DOPO_VITI);
    const via = setTimeout(() => avanti.current(), AL_LIVELLO_DOPO);
    return () => {
      clearTimeout(giu);
      clearTimeout(via);
    };
  }, [aperto, visibile]);

  // Il lampo e' una classe tolta e rimessa sul nodo vero: e' l'unico modo di
  // far ripartire un'animazione CSS sullo stesso elemento, scelta dopo scelta.
  const sitoPc = useRef<HTMLDivElement | null>(null);
  const sitoCell = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!lampo) return;
    for (const sito of [sitoPc.current, sitoCell.current]) {
      const el = sito && bersaglio(sito, lampo.campo);
      if (!(el instanceof HTMLElement)) continue;
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    }
  }, [lampo]);

  const scegli = <C extends keyof Choices>(campo: C, valore: Choices[C]) => {
    setScelte((s) => ({ ...s, [campo]: valore }));
    setFatti((f) => (f.includes(attivo) ? f : [...f, attivo]));
    setLampo((l) => ({ campo: attivo, n: (l?.n ?? 0) + 1 }));
  };

  // Le viti stanno sul portatile: un attrezzo che non e' il telefono riporta
  // la vista al computer.
  const apri = (k: DrawerToolId) => {
    setAttivo(k);
    if (k !== "telefono" && sulTelefono) setScelte((s) => ({ ...s, view: "pc" }));
  };

  const svita = (i: number) => setSvitate((v) => v.map((x, j) => x || j === i));

  const messaggio =
    tuttiFatti && sulTelefono
      ? t.rich("tornaAlComputer", { b: (c) => <b>{c}</b> })
      : pronto
        ? t.rich("pronto", { b: (c) => <b>{c}</b> })
        : null;

  const sito = {
    layout: FAKE_LAYOUTS[scelte.layout].id,
    illustration: scelte.img,
    pair: FAKE_FONTS[scelte.fonts],
    scale: FAKE_SCALES[scelte.scale],
  };

  return (
    <div
      className="bench"
      data-game-level="schermo"
      data-view={scelte.view}
      data-ready={pronto || undefined}
      data-open={aperto || undefined}
      data-back={dietro || undefined}
      style={siteVariables(FAKE_PALETTES[scelte.palette].colors) as CSSProperties}
    >
      <div className="step-1" inert={dietro}>
        <div className="head">
          <span className="level">{comune("etichetta", { numero: levelNumber("schermo"), nome: comune("livelli.schermo") })}</span>
          <span className="dots" aria-hidden="true">
            {DRAWER_TOOLS.map((a, i) => (
              <i key={a} className={i < fatti.length ? "yes" : undefined} />
            ))}
          </span>
        </div>

        <div className="laptop" inert={sulTelefono}>
          <div className="frame-pc">
            <div className="screen">
              <FakeSite ref={sitoPc} {...sito} />
            </div>
            {pronto &&
              VITI.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  className={svitate[i] ? "screw gone" : "screw"}
                  style={{ left: v.x, top: v.y, "--r": v.r } as CSSProperties}
                  aria-label={t("vite", { numero: i + 1 })}
                  disabled={svitate[i]}
                  onClick={() => svita(i)}
                />
              ))}
          </div>
          <div className="base-pc" />
        </div>

        <div className="cell" inert={!sulTelefono}>
          <div className="screen">
            <FakeSite ref={sitoCell} {...sito} />
          </div>
        </div>

        <div className="tools" role="group" aria-label={t("attrezzi")}>
          {DRAWER_TOOLS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={a === attivo}
              className={fatti.includes(a) ? "done" : undefined}
              onClick={() => apri(a)}
            >
              <Icon name={a} />
              {t(`attrezzo.${a}.nome`)}
            </button>
          ))}
        </div>

        <Drawer
          active={attivo}
          choices={scelte}
          tried={fatti.includes(attivo)}
          message={messaggio}
          onChoose={scegli}
        />
      </div>

      <div className="step-2" inert={!dietro}>
        {aperto && <ScreenBack onRestart={onRicomincia} />}
      </div>
    </div>
  );
}
