"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMotionLevel } from "@/animations/motionPolicy";
import { palette } from "@/styles/palette";
import { RADIUS, SHADE_STEPS, buildMesh, veilFor, type Vertex } from "./paper/geometry";
import { crumple, drawSource } from "./paper/drawing";
import { atRest, fling, physicsStep, type Piece } from "./paper/physics";

/**
 * Le lettere del nome sono fogli: si sgualciscono al passaggio, si prendono,
 * si lanciano, cadono in fondo allo schermo e scendono con chi scorre.
 *
 * Il vincolo che decide la forma di questo componente: le `<img>` del nome NON
 * si toccano. Sono l'elemento LCP della pagina, e `HeroMotion` le timbra
 * all'ingresso e poi le fa seguire il puntatore con un parallasse. Quindi qui
 * non si sostituisce niente: si sovrappone una tela alla singola lettera che
 * si sta toccando, posizionata sul suo rettangolo, che il parallasse lo porta
 * gia' dentro, quindi lo eredita gratis. A riposo non esiste una tela, non
 * gira un ciclo, e il nome e' esattamente quello di prima.
 *
 * Solo a "full": e' un gesto che si fa col puntatore, e fermo non vuol dire
 * niente. A "reduced", a "none" e senza JavaScript non si monta nemmeno, e
 * l'hero resta quello che e' sempre stato, che e' anche il motivo per cui in
 * jsdom (dove il livello e' sempre "none") questo componente non disegna mai:
 * una tela li' non ha un contesto 2D.
 */
export function CrumpledPaper() {
  const level = useMotionLevel();
  const layer = useRef<HTMLDivElement | null>(null);

  /** Rimette il nome com'era. Vive fuori dall'effetto perche' lo chiamano in
   *  tre: il ritorno in cima, lo smontaggio e il cambio di livello. */
  const restore = useRef<() => void>(() => {});

  useEffect(() => {
    if (level !== "full") return;
    const overlay = layer.current;
    if (!overlay) return;

    const wordmark = document.querySelector<HTMLElement>("#hero [role='img']");
    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>("#hero .wordmark-letter"),
    );
    if (!wordmark || images.length === 0) return;

    const style = getComputedStyle(document.body);
    const paperColor = style.getPropertyValue("--bg").trim() || palette.paper;
    const lineColor = style.getPropertyValue("--line").trim() || palette.graph;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    type Letter = {
      img: HTMLImageElement;
      mesh: Vertex[];
      textures: Map<number, HTMLCanvasElement>;
      canvas: HTMLCanvasElement | null;
      t: number;
      target: number;
      detached: boolean;
      index: number;
    };

    const letters: Letter[] = images.map((img, index) => ({
      img,
      mesh: buildMesh(11 + index * 13),
      textures: new Map(),
      canvas: null,
      t: 0,
      target: 0,
      detached: false,
      index,
    }));

    const pieces: Array<Piece & { el: HTMLCanvasElement; size: number; L: Letter }> = [];
    let grabbed: (typeof pieces)[number] | null = null;
    let trail: Array<{ x: number; y: number; t: number }> = [];
    let scrollDelta = 0;
    let lastY = window.scrollY;
    let running = false;
    let frame = 0;

    const texture = (L: Letter, t: number) => {
      const k = veilFor(t);
      let tex = L.textures.get(k);
      if (!tex) {
        tex = drawSource(L.img, k / (SHADE_STEPS - 1), paperColor, lineColor);
        L.textures.set(k, tex);
      }
      return tex;
    };

    /** Una tela grande quanto la lettera, appoggiata dove sta adesso. */
    const placeCanvas = (L: Letter) => {
      const r = L.img.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      if (!L.canvas) {
        L.canvas = document.createElement("canvas");
        L.canvas.setAttribute("data-paper-letter", "");
        overlay.appendChild(L.canvas);
      }
      const px = Math.round(size * dpr);
      if (L.canvas.width !== px) {
        L.canvas.width = px;
        L.canvas.height = px;
      }
      L.canvas.style.width = `${size}px`;
      L.canvas.style.height = `${size}px`;
      L.canvas.style.transform = `translate(${r.left + r.width / 2 - size / 2}px,${
        r.top + r.height / 2 - size / 2
      }px)`;
      return { el: L.canvas, size };
    };

    const draw = (L: Letter) => {
      const { el, size } = placeCanvas(L);
      const g = el.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      crumple(g, texture(L, L.t), L.mesh, L.t, size, size * 0.94);
      L.img.style.opacity = L.t > 0.012 ? "0" : "";
    };

    const detach = (L: Letter) => {
      if (L.detached) return null;
      const r = L.img.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const el = document.createElement("canvas");
      el.setAttribute("data-paper-piece", "");
      el.width = el.height = Math.round(size * dpr);
      el.style.width = el.style.height = `${size}px`;
      const g = el.getContext("2d");
      if (g) {
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        crumple(g, texture(L, 1), L.mesh, 1, size, size * 0.94);
      }
      overlay.appendChild(el);
      L.detached = true;
      L.img.style.opacity = "0";
      L.canvas?.remove();
      L.canvas = null;
      const p = {
        el,
        size,
        L,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        vx: 0,
        vy: 0,
        rot: 0,
        vrot: 0,
        radius: size * (RADIUS + 0.04),
        held: false,
      };
      pieces.push(p);
      return p;
    };

    const wake = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    let lastTime = performance.now();
    function loop(time: number) {
      const dt = Math.min(0.032, (time - lastTime) / 1000);
      lastTime = time;
      const walls = { width: window.innerWidth, height: window.innerHeight };
      const delta = scrollDelta;
      scrollDelta = 0;
      let pending = false;

      for (const L of letters) {
        if (L.detached) continue;
        const p = L.t;
        L.t += (L.target - L.t) * 0.16;
        if (Math.abs(L.t - L.target) < 0.003) L.t = L.target;
        if (Math.abs(L.t - p) > 0.0005 || (L.t > 0 && L.canvas)) {
          draw(L);
          if (L.t === 0 && L.target === 0) {
            L.canvas?.remove();
            L.canvas = null;
            L.img.style.opacity = "";
          }
        }
        if (L.t !== L.target) pending = true;
      }

      for (const p of pieces) {
        physicsStep(p, dt, walls, delta);
        p.el.style.transform = `translate(${(p.x - p.size / 2).toFixed(1)}px,${(
          p.y - p.size / 2
        ).toFixed(1)}px) rotate(${p.rot.toFixed(1)}deg)`;
        if (!atRest(p, walls)) pending = true;
      }

      if (pending || grabbed) frame = requestAnimationFrame(loop);
      else running = false;
    }

    const letterAt = (e: PointerEvent) =>
      letters.find((L) => !L.detached && L.img === (e.target as Node));

    /* Una lettera che sta andando sotto il foglio della stampante (SottoIlFoglio
       scrive --copertura su #hero) non si sgualcisce e non si prende: la tela
       e la pallina stanno sopra il velo, e si accenderebbe una lettera sola
       in mezzo alle altre scurite. Lo stile inline e non quello calcolato:
       e' li' che il componente lo scrive, e leggerlo non costa un layout. */
    const hero = document.getElementById("hero");
    const underSheet = () =>
      (parseFloat(hero?.style.getPropertyValue("--coverage") ?? "") || 0) > 0;

    const onOver = (e: PointerEvent) => {
      const L = letterAt(e);
      if (L && !underSheet()) { L.target = 0.55; wake(); }
    };
    const onOut = (e: PointerEvent) => {
      const L = letterAt(e);
      if (L && !grabbed) { L.target = 0; wake(); }
    };
    const onDown = (e: PointerEvent) => {
      const L = letterAt(e);
      if (!L || underSheet()) return;
      e.preventDefault();
      L.t = 1;
      const p = detach(L);
      if (!p) return;
      p.held = true;
      trail = [];
      grabbed = p;
      // Trascinando sopra il claim partiva la selezione del testo e il gesto
      // si rompeva a meta'.
      document.body.setAttribute("data-paper-grabbed", "");
      (p as unknown as { dx: number; dy: number }).dx = p.x - e.clientX;
      (p as unknown as { dx: number; dy: number }).dy = p.y - e.clientY;
      wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!grabbed) return;
      const d = grabbed as unknown as { dx: number; dy: number };
      grabbed.x = e.clientX + d.dx;
      grabbed.y = e.clientY + d.dy;
      grabbed.el.style.transform = `translate(${grabbed.x - grabbed.size / 2}px,${
        grabbed.y - grabbed.size / 2
      }px) rotate(${grabbed.rot}deg)`;
      trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (trail.length > 6) trail.shift();
    };
    const onUp = () => {
      if (!grabbed) return;
      const v = fling(trail);
      grabbed.vx = v.vx;
      grabbed.vy = v.vy;
      grabbed.vrot = v.vx * 1.4;
      grabbed.held = false;
      grabbed = null;
      document.body.removeAttribute("data-paper-grabbed");
      wake();
    };
    const onScroll = () => {
      const y = window.scrollY;
      scrollDelta += Math.max(-160, Math.min(160, y - lastY));
      lastY = y;
      if (pieces.length) wake();
      // Tornando in cima il nome si rimette da solo: non puo' restare rotto
      // per chi torna indietro a cercarlo.
      if (y < 40 && pieces.length && pieces.every((p) => !p.held && Math.abs(p.vy) < 25)) {
        restore.current();
      }
    };

    restore.current = () => {
      for (const p of pieces) p.el.remove();
      pieces.length = 0;
      grabbed = null;
      for (const L of letters) {
        L.detached = false;
        L.t = 0;
        L.target = 0;
        L.canvas?.remove();
        L.canvas = null;
        L.img.style.opacity = "";
      }
    };

    wordmark.addEventListener("pointerover", onOver);
    wordmark.addEventListener("pointerout", onOut);
    wordmark.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      wordmark.removeEventListener("pointerover", onOver);
      wordmark.removeEventListener("pointerout", onOut);
      wordmark.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      // Lo stile inline sulle immagini non lo toglierebbe nessun altro:
      // restasse appiccicato a opacity 0, il nome sparirebbe per sempre.
      restore.current();
      restore.current = () => {};
      document.body.removeAttribute("data-paper-grabbed");
    };
  }, [level]);

  // Lo strato c'e' sempre nel DOM ma e' vuoto e non riceve il puntatore: e'
  // solo il posto dove le tele vanno a stare. Decorativo per intero: il nome
  // che uno screen reader legge resta quello del wordmark.
  const overlayNode = <div ref={layer} data-paper aria-hidden="true" />;
  /* A "full" lo strato va in fondo a <body>, fuori da #hero. Quando la
     stampante passa sopra Hero (SottoIlFoglio), #hero e' sticky, e un elemento sticky
     apre sempre un contesto di impilamento suo, z-index o no: lo z-index 40
     dello strato varrebbe solo dentro Hero, e la pallina lanciata finirebbe
     sotto il foglio arancione. Da <body> se la gioca con il resto della
     pagina, com'era prima. Solo a "full" perche' e' l'unico livello in cui
     lo strato disegna qualcosa; negli altri resta dov'e', anche sul server. */
  return level === "full" ? createPortal(overlayNode, document.body) : overlayNode;
}
