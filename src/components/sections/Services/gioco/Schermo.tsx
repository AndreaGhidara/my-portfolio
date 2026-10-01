"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { numeroLivello, type LivelloProps } from "./livelli";
import { Icona } from "./icone";
import {
  CARATTERI_FINTI,
  IMPAGINAZIONI_FINTE,
  PALETTE_FINTE,
  SCALA_INIZIALE,
  SCALE_FINTE,
  variabiliSito,
} from "./sitoFinto";
import { SitoFinto } from "./schermoSito";
import { ATTREZZI, Cassetto, type IdAttrezzo, type Scelte } from "./schermoCassetto";
import { Dietro } from "./schermoDietro";

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

const INIZIALI: Scelte = {
  pal: 0,
  car: 0,
  sca: SCALE_FINTE.indexOf(SCALA_INIZIALE),
  lay: 0,
  img: "pane",
  vista: "pc",
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

type Lampo = { campo: IdAttrezzo; n: number };

/** Dove lampeggia la landing dopo una scelta: il punto appena cambiato. */
function bersaglio(sito: HTMLElement, campo: IdAttrezzo): Element | null {
  if (campo === "caratteri" || campo === "testi") return sito.querySelector("[data-titolo]");
  if (campo === "immagini") return sito.querySelector("[data-img]");
  if (campo === "telefono") return null;
  return sito;
}

/**
 * «Ricomincia», nell'anteprima del circuito, rifa' il livello da capo: si
 * rimonta il banco, e con lui spariscono stato e timer.
 */
export function Schermo(props: LivelloProps) {
  const [giro, setGiro] = useState(0);
  return <Banco key={giro} {...props} onRicomincia={() => setGiro((g) => g + 1)} />;
}

function Banco({ onAvanti, visibile, onRicomincia }: LivelloProps & { onRicomincia: () => void }) {
  const t = useTranslations("services.gioco.schermo");
  const comune = useTranslations("services.gioco.comune");

  const [scelte, setScelte] = useState<Scelte>(INIZIALI);
  const [attivo, setAttivo] = useState<IdAttrezzo>("colori");
  const [fatti, setFatti] = useState<readonly IdAttrezzo[]>([]);
  const [pronto, setPronto] = useState(false);
  const [svitate, setSvitate] = useState<readonly boolean[]>(() => VITI.map(() => false));
  const [dietro, setDietro] = useState(false);
  const [lampo, setLampo] = useState<Lampo | null>(null);

  const tuttiFatti = fatti.length === ATTREZZI.length;
  const aperto = svitate.every(Boolean);
  const sulTelefono = scelte.vista === "cell";

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
      el.classList.remove("lampo");
      void el.offsetWidth;
      el.classList.add("lampo");
    }
  }, [lampo]);

  const scegli = <C extends keyof Scelte>(campo: C, valore: Scelte[C]) => {
    setScelte((s) => ({ ...s, [campo]: valore }));
    setFatti((f) => (f.includes(attivo) ? f : [...f, attivo]));
    setLampo((l) => ({ campo: attivo, n: (l?.n ?? 0) + 1 }));
  };

  // Le viti stanno sul portatile: un attrezzo che non e' il telefono riporta
  // la vista al computer.
  const apri = (k: IdAttrezzo) => {
    setAttivo(k);
    if (k !== "telefono" && sulTelefono) setScelte((s) => ({ ...s, vista: "pc" }));
  };

  const svita = (i: number) => setSvitate((v) => v.map((x, j) => x || j === i));

  const messaggio =
    tuttiFatti && sulTelefono
      ? t.rich("tornaAlComputer", { b: (c) => <b>{c}</b> })
      : pronto
        ? t.rich("pronto", { b: (c) => <b>{c}</b> })
        : null;

  const sito = {
    impaginazione: IMPAGINAZIONI_FINTE[scelte.lay].id,
    illustrazione: scelte.img,
    coppia: CARATTERI_FINTI[scelte.car],
    scala: SCALE_FINTE[scelte.sca],
  };

  return (
    <div
      className="banco"
      data-gioco-livello="schermo"
      data-vista={scelte.vista}
      data-pronto={pronto || undefined}
      data-aperto={aperto || undefined}
      data-dietro={dietro || undefined}
      style={variabiliSito(PALETTE_FINTE[scelte.pal].colori) as CSSProperties}
    >
      <div className="passo-1" inert={dietro}>
        <div className="testa">
          <span className="livello">{comune("etichetta", { numero: numeroLivello("schermo"), nome: comune("livelli.schermo") })}</span>
          <span className="pallini" aria-hidden="true">
            {ATTREZZI.map((a, i) => (
              <i key={a} className={i < fatti.length ? "si" : undefined} />
            ))}
          </span>
        </div>

        <div className="portatile" inert={sulTelefono}>
          <div className="cornice-pc">
            <div className="schermo">
              <SitoFinto ref={sitoPc} {...sito} />
            </div>
            {pronto &&
              VITI.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  className={svitate[i] ? "vite via" : "vite"}
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
          <div className="schermo">
            <SitoFinto ref={sitoCell} {...sito} />
          </div>
        </div>

        <div className="attrezzi" role="group" aria-label={t("attrezzi")}>
          {ATTREZZI.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={a === attivo}
              className={fatti.includes(a) ? "fatto" : undefined}
              onClick={() => apri(a)}
            >
              <Icona nome={a} />
              {t(`attrezzo.${a}.nome`)}
            </button>
          ))}
        </div>

        <Cassetto
          attivo={attivo}
          scelte={scelte}
          provato={fatti.includes(attivo)}
          messaggio={messaggio}
          onScegli={scegli}
        />
      </div>

      <div className="passo-2" inert={!dietro}>
        {aperto && <Dietro onRicomincia={onRicomincia} />}
      </div>
    </div>
  );
}
