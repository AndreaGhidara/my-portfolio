"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ScrollTrigger as ScrollTriggerInstance } from "gsap/ScrollTrigger";
import { ENTRANCE_START } from "@/animations/timing";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { withoutShift } from "@/animations/withoutShift";
import {
  MIN_HEIGHT,
  TRACK_PARAMS,
  arrived,
  filledLine,
  phases,
  trackRoute,
  travel,
  wavePath,
  type TrackPoint,
} from "./track";

// Le misure arrivano al CSS dal markup del server: il numero vive solo in
// track.ts. Stringhe costanti, che server e client serializzano uguali.
const TRACK_VARS = {
  "--wide": `min(${TRACK_PARAMS.sheet.rem}rem, ${TRACK_PARAMS.sheet.vw}vw)`,
  "--air": `${TRACK_PARAMS.air}rem`,
  "--arrival": `min(${TRACK_PARAMS.arrival.rem}rem, ${TRACK_PARAMS.arrival.vw}vw)`,
  "--tail": TRACK_PARAMS.tail,
  "--speed-fine": TRACK_PARAMS.speed.fine,
  "--speed-coarse": TRACK_PARAMS.speed.coarse,
};

// Da una sonda alta 100svh: in colonna il palco e' alto quanto il contenuto,
// e una media query `min-height` sul telefono misura il viewport grande.
const stageTallEnough = (probe: HTMLElement | null) =>
  (probe?.offsetHeight ?? 0) >= MIN_HEIGHT;

/** Un track alto quanto la corsa e un palco sticky, con un solo ScrollTrigger e
 *  niente `pin`: il pin-spacer litiga con Lenis. `data-scene` si scrive DOPO il
 *  trigger e si toglie nella pulizia: se GSAP non arriva resta la colonna. */
export function JourneyTrack({
  n,
  startYear,
  header,
  hint,
  children,
}: {
  /** Arrivo escluso: entra nella formula dell'altezza del track. */
  n: number;
  /** Quello che l'anno grande dice all'aggancio. */
  startYear: number;
  header: ReactNode;
  hint: string;
  /** Le tappe e, ultimo, il foglio dei numeri. */
  children: ReactNode;
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const list = useRef<HTMLOListElement | null>(null);
  const probe = useRef<HTMLDivElement | null>(null);
  const activeTrigger = useRef<ScrollTriggerInstance | null>(null);
  const [tallEnough, setTallEnough] = useState(false);

  // Mai a meta' corsa per un cambio di sola altezza: la barra di Safari non
  // deve far saltare la sezione da una forma all'altra sotto il pollice.
  useEffect(() => {
    let width = window.innerWidth;
    const decide = () => setTallEnough(stageTallEnough(probe.current));
    const onResize = () => {
      const widthChanged = window.innerWidth !== width;
      width = window.innerWidth;
      if (widthChanged || !activeTrigger.current?.isActive) decide();
    };
    decide();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useSectionAnimation(
    ({ level: resolved, gsap, ScrollTrigger, presets }) => {
      const root = scope.current;
      const trackEl = track.current;
      const stageEl = stage.current;
      const listEl = list.current;
      if (!root || !trackEl || !stageEl || !listEl) return;

      const stops = [...listEl.querySelectorAll<HTMLElement>("[data-journey-item]")];

      if (!tallEnough) {
        // Un trigger per tappa: un'entrata di gruppo le farebbe partire tutte quando
        // si affaccia la prima.
        const { fromBehind, fromAbove } = presets;
        for (const stop of stops) {
          const sheet = stop.querySelector("[data-journey-sheet]");
          const badge = stop.querySelector("[data-journey-badge]");
          if (!sheet || !badge) continue;
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: stop,
              start: resolved === "full" ? ENTRANCE_START.full : ENTRANCE_START.reduced,
              once: true,
            },
          });
          // clearProps: l'inclinazione la porta il CSS, e un translate lasciato in
          // linea ci combatterebbe contro.
          timeline.add(fromBehind(sheet, { level: resolved, clearProps: true }) ?? gsap.timeline());
          timeline.add(
            fromAbove(badge, { level: resolved, clearProps: true }) ?? gsap.timeline(),
            "-=0.28",
          );
        }
        return;
      }

      const arrival = listEl.querySelector<HTMLElement>("[data-journey-arrival]");
      const svg = listEl.querySelector<SVGSVGElement>("[data-journey-wave] svg");
      const faint = svg?.querySelector<SVGPathElement>("[data-journey-wave-faint]");
      const full = svg?.querySelector<SVGPathElement>("[data-journey-wave-full]");
      const done = svg?.querySelector<SVGRectElement>("[data-journey-done]");
      const year = root.querySelector<HTMLElement>("[data-journey-year]");
      const hintEl = root.querySelector<HTMLElement>("[data-journey-hint]");
      if (!arrival || !svg || !faint || !full || !done || !year) return;

      // Misure rifatte solo su onRefresh, che arriva anche a ogni cambio di
      // larghezza: leggere offsetLeft a ogni update sarebbe un layout per fotogramma.
      let width = 0;
      let routePx = 0;
      let travelPx = 0;
      let height = 0;
      let arrivalEdge = 0;
      let arrivalEnd = 0;
      let centres: number[] = [];
      let writtenYear = "";

      const measure = () => {
        // ScrollTrigger.create chiama onRefresh prima che la scena sia accesa, coi
        // fogli ancora in colonna: l'onda la disegna il refresh che segue.
        if (!root.hasAttribute("data-scene")) return;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        height = stageEl.offsetHeight;
        width = stageEl.clientWidth;
        travelPx = travel({ track: trackEl.offsetHeight, stage: height, tail: TRACK_PARAMS.tail });
        const air = parseFloat(getComputedStyle(listEl).columnGap) || 0;
        routePx = trackRoute({
          n: stops.length,
          sheet: stops[0]?.offsetWidth ?? 0,
          air,
          arrival: arrival.offsetWidth,
        });
        arrivalEdge = arrival.offsetLeft;
        arrivalEnd = arrival.offsetLeft + arrival.offsetWidth;
        centres = stops.map((t) => t.offsetLeft + t.offsetWidth / 2);

        // Lo scostamento e' un translate, che offsetTop non vede: si somma qui.
        const W = listEl.offsetWidth;
        const H = listEl.offsetHeight;
        const y0 = H / 2;
        const points: TrackPoint[] = [[0, y0]];
        for (const [i, t] of stops.entries()) {
          points.push([centres[i], y0 + parseFloat(t.dataset.offset ?? "0") * rem]);
        }
        points.push([arrival.offsetLeft + arrival.offsetWidth / 2, y0]);
        svg.setAttribute("width", String(W));
        svg.setAttribute("height", String(H));
        const d = wavePath(points, TRACK_PARAMS.amplitude * rem, TRACK_PARAMS.waves);
        faint.setAttribute("d", d);
        full.setAttribute("d", d);
      };

      const write = (self: ScrollTriggerInstance) => {
        const scrolled = Math.max(0, self.scroll() - self.start);
        const f = phases({ done: scrolled, travel: travelPx, tail: TRACK_PARAMS.tail, height });
        const x = f.p * routePx;

        listEl.style.setProperty("--x", x.toFixed(2));
        done.setAttribute(
          "width",
          filledLine({ x, width, arrivalEdge, arrivalEnd, q: f.q }).toFixed(1),
        );
        arrival.style.setProperty("--light", f.light.toFixed(4));
        arrival.style.setProperty("--jolt", f.jolt.toFixed(4));
        arrival.style.setProperty("--fall", f.fall.toFixed(4));
        root.style.setProperty("--progress", self.progress.toFixed(4));
        hintEl?.toggleAttribute("data-moved", scrolled > 20);

        let seen = stops[0]?.dataset.year ?? "";
        for (const [i, t] of stops.entries()) {
          const hasArrived = arrived({ stopCentre: centres[i], x, width });
          if (hasArrived !== t.hasAttribute("data-arrived")) t.toggleAttribute("data-arrived", hasArrived);
          if (hasArrived) seen = t.dataset.year ?? seen;
        }
        if (seen !== writtenYear) {
          year.textContent = seen;
          writtenYear = seen;
        }
      };

      // Gia' il default di GSAP sui touch, scritto perche' la corsa regge solo se
      // la barra del browser non la rimisura.
      ScrollTrigger.config({ ignoreMobileResize: true });

      const trigger = ScrollTrigger.create({
        trigger: trackEl,
        start: "top top",
        // Misurati come in travel(): mai window.innerHeight.
        end: () => `+=${Math.max(0, trackEl.offsetHeight - stageEl.offsetHeight)}`,
        onRefresh: (self) => {
          measure();
          write(self);
        },
        onUpdate: write,
      });

      activeTrigger.current = trigger;
      const section = root.closest("section") ?? root;
      withoutShift(section, () => {
        root.setAttribute("data-scene", "horizontal");
        // La sezione e' appena cresciuta di migliaia di pixel: va rimisurato tutto
        // quello che sta sotto, questo trigger compreso.
        ScrollTrigger.refresh();
      });

      // Un carattere che arriva dopo cambia l'altezza dei fogli e i centri dell'onda.
      let alive = true;
      void document.fonts?.ready.then(() => {
        if (alive) trigger.refresh();
      });

      return () => {
        alive = false;
        activeTrigger.current = null;
        trigger.kill();
        root.style.removeProperty("--progress");
        listEl.style.removeProperty("--x");
        for (const p of ["--light", "--jolt", "--fall"]) arrival.style.removeProperty(p);
        for (const t of stops) t.removeAttribute("data-arrived");
        year.textContent = String(startYear);
        hintEl?.removeAttribute("data-moved");
        // Chi sta sotto deve sapere che la sezione torna colonna.
        withoutShift(section, () => {
          root.removeAttribute("data-scene");
          ScrollTrigger.refresh();
        });
      };
    },
    scope,
    [tallEnough],
  );

  return (
    <div
      ref={scope}
      data-journey
      style={{ ...TRACK_VARS, "--n": n } as CSSProperties}
    >
      {/* Alta 100svh, larga zero: dice quanto e' alto il palco anche quando il
          palco, in colonna, e' alto quanto il suo contenuto. */}
      <div ref={probe} data-journey-probe aria-hidden="true" />
      <div ref={track} data-journey-track>
        <div ref={stage} data-journey-stage>
          <div data-journey-header>
            {header}
            <p data-journey-year aria-hidden="true">
              {startYear}
            </p>
          </div>

          <ol ref={list} data-journey-list>
            {/* L'onda sta nella lista perche' scorre con lei. */}
            <li data-journey-wave aria-hidden="true">
              <svg>
                <defs>
                  <clipPath id="journey-done">
                    <rect data-journey-done x="0" y="-9999" width="0" height="99999" />
                  </clipPath>
                </defs>
                <path data-journey-wave-faint />
                <path data-journey-wave-full clipPath="url(#journey-done)" />
              </svg>
            </li>
            {children}
          </ol>

          <p data-journey-hint>
            <span aria-hidden="true">&rarr;</span> {hint}
          </p>
          <div data-journey-progress aria-hidden="true">
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}
