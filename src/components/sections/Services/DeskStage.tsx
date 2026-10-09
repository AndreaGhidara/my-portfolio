"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import { useMotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { DeskTable, type DeskLayerData } from "./DeskTable";
import { Game } from "./game/Game";
import { CENTRE, FIRST_RING_REACH, SHAPE_BOX, cameraScale } from "./layers";

/** Quanta parte dell'altezza del palco occupa il laptop al fotogramma zero. */
const OPENING_FILL = 0.7;

// Altezza del laptop in frazione della LARGHEZZA del piano, derivata da CENTRE
// e SHAPE_BOX: una copia a mano resterebbe indietro quando il centro cambia.
const LAPTOP_ON_SURFACE = (CENTRE.width / 100) * (SHAPE_BOX.laptop.h / SHAPE_BOX.laptop.w);

// Resta costante il prodotto fra scala d'apertura e raggio del primo anello,
// non la scala: 4,2 su un raggio di 25,2, la taratura fatta a mano.
const OPENING_REACH = 4.2 * 25.2;

// Sotto il minimo la camera sussulta invece di arretrare; oltre il massimo il
// primo anello si accende fuori dallo schermo. Il massimo segue il raggio vero.
const OPENING = { min: 1.6, max: OPENING_REACH / FIRST_RING_REACH };

// Per jsdom o per un piano che non ha ancora una larghezza.
const OPENING_FALLBACK = 3.3;

// Su un portatile da 1280x800 a camera ferma su 1 la tesi finisce sui disegni,
// e alzarla non si puo' (il palco ha overflow: clip). Si ferma prima. Mille px
// di viewport prendono portatili e 1080p, non i pannelli piu' alti.
const CLOSING = { tall: 1, short: 0.88 };
const SHORT_STAGE = 1000;

// Un solo ScrollTrigger che scrive --p e --s, le opacita' le calcola il CSS.
// Niente pin (sticky dentro un track di 380vh, niente pin-spacer contro Lenis).
// La scala d'apertura si rimisura solo su onRefresh: mai un layout a fotogramma.
export function DeskStage({
  eyebrow,
  title,
  lead,
  centre,
  blank,
  note,
  punch,
  layers,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  centre: string;
  blank: string;
  note: string;
  punch: string;
  layers: DeskLayerData[];
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const camera = useRef<ScrollTriggerType | null>(null);
  const level = useMotionLevel();

  // Si esce da "full" in tre modi, e in nessuno basta smettere di scrivere: --p
  // resterebbe all'ultimo valore e l'opacita', che la legge sempre, lascerebbe
  // il tavolo fermo mezzo trasparente.
  const teardown = useCallback(() => {
    camera.current?.kill();
    camera.current = null;
    stage.current?.style.removeProperty("--p");
    stage.current?.style.removeProperty("--s");
  }, []);

  // Rete che spegne la camera a ogni livello diverso da "full". Layout e non
  // passivo: deve stare nel commit che toglie il CSS della camera, o il browser
  // dipinge un fotogramma con --p ancora appiccicata.
  useLayoutEffect(() => {
    if (level !== "full") teardown();
  }, [level, teardown]);

  useSectionAnimation(({ level: resolved, ScrollTrigger, presets }) => {
    const { fromBehind } = presets;
    const stageEl = stage.current;
    const trackEl = track.current;

    // Senza camera la testata entra come quella di ogni altra sezione.
    if (resolved !== "full") {
      // In jsdom ogni rettangolo e' alto zero e la creazione del trigger scoppia.
      if (!scope.current || scope.current.offsetHeight === 0) return;

      const header = scope.current?.querySelector<HTMLElement>("[data-desk-title]");
      if (header) {
        fromBehind(Array.from(header.children), {
          level: resolved,
          trigger: header,
          stagger: 0.08,
        });
      }

      return;
    }

    if (!stageEl || !trackEl) return;

    // Il piano e non il mondo: le percentuali di layers.ts misurano il piano, e
    // il mondo comprende anche le didascalie.
    const surface = stageEl.querySelector<HTMLElement>(
      '[data-desk-world][data-layout="wide"] [data-desk-surface]',
    );
    let from = OPENING_FALLBACK;
    let to = CLOSING.tall;

    const measure = () => {
      const laptop = (surface?.clientWidth ?? 0) * LAPTOP_ON_SURFACE;
      const wanted = (stageEl.clientHeight * OPENING_FILL) / laptop;
      from = laptop > 0 ? Math.min(Math.max(wanted, OPENING.min), OPENING.max) : OPENING_FALLBACK;
      // Rimisurato con l'apertura: ruotare lo schermo ricalcola anche l'arrivo.
      to = stageEl.clientHeight < SHORT_STAGE ? CLOSING.short : CLOSING.tall;
    };

    const write = (p: number) => {
      stageEl.style.setProperty("--p", p.toFixed(4));
      stageEl.style.setProperty("--s", cameraScale(p, from, to).toFixed(4));
    };

    measure();
    write(0);

    camera.current = ScrollTrigger.create({
      trigger: trackEl,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onRefresh: (self) => {
        measure();
        write(self.progress);
      },
      onUpdate: (self) => write(self.progress),
    });

    // Chiamato allo smontaggio e a ogni cambio di livello: restasse --p = 0,
    // il tavolo resterebbe vuoto per sempre.
    return teardown;
  }, scope);

  // Col Tab il post-it, ingrandito e ritagliato al fotogramma zero, prende il
  // fuoco fuori vista: si salta al fotogramma di riposo, fine del track. Effetto
  // suo con [level], perche' il revert di gsap.context al cambio di livello non
  // arriva. Solo :focus-visible: un click deve andare ai contatti.
  useEffect(() => {
    const stageEl = stage.current;
    const trackEl = track.current;
    if (level !== "full" || !stageEl || !trackEl) return;

    const jumpToRestFrame = (event: FocusEvent) => {
      const focused = event.target as HTMLElement | null;
      if (!focused?.closest("[data-desk-blank]") || !focused.matches(":focus-visible")) return;
      const restTop = trackEl.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
      // "instant" e non "auto": con scroll-behavior smooth su html diventerebbe
      // un'animazione per chi ha chiesto meno movimento.
      window.scrollTo({ top: restTop, behavior: "instant" });
    };

    stageEl.addEventListener("focusin", jumpToRestFrame);
    return () => stageEl.removeEventListener("focusin", jumpToRestFrame);
  }, [level]);

  return (
    <div ref={scope} data-desk data-motion={level}>
      <div ref={track} data-desk-track>
        <div ref={stage} data-desk-stage>
          <header data-desk-title>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="services-title" className="section-title">{title}</h2>
            <p>{lead}</p>
          </header>

          <DeskTable
            layers={layers}
            centre={centre}
            blank={blank}
            note={note}
          />
          {/* Il cambio col tavolo lo fa il CSS: una soglia in JavaScript vorrebbe
              dire un primo fotogramma sbagliato. */}
          <Game />

          <p data-desk-punch>{punch}</p>
        </div>
      </div>
    </div>
  );
}
