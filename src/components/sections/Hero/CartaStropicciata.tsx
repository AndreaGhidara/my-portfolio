"use client";

import { useEffect, useRef } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { GRADINI, RAGGIO, maglia, veloPer, type Vertice } from "./carta/geometria";
import { accartoccia, sorgente } from "./carta/disegno";
import { aRiposo, lancio, passo, type Pezzo } from "./carta/fisica";

/**
 * Le lettere del nome sono fogli: si sgualciscono al passaggio, si prendono,
 * si lanciano, cadono in fondo allo schermo e scendono con chi scorre.
 *
 * Il vincolo che decide la forma di questo componente: le `<img>` del nome NON
 * si toccano. Sono l'elemento LCP della pagina, e `HeroMotion` le timbra
 * all'ingresso e poi le fa seguire il puntatore con un parallasse. Quindi qui
 * non si sostituisce niente: si sovrappone una tela alla singola lettera che
 * si sta toccando, posizionata sul suo rettangolo — che il parallasse lo porta
 * gia' dentro, quindi lo eredita gratis. A riposo non esiste una tela, non
 * gira un ciclo, e il nome e' esattamente quello di prima.
 *
 * Solo a "full": e' un gesto che si fa col puntatore, e fermo non vuol dire
 * niente. A "reduced", a "none" e senza JavaScript non si monta nemmeno, e
 * l'hero resta quello che e' sempre stato — che e' anche il motivo per cui in
 * jsdom (dove il livello e' sempre "none") questo componente non disegna mai:
 * una tela li' non ha un contesto 2D.
 */
export function CartaStropicciata() {
  const livello = useMotionLevel();
  const strato = useRef<HTMLDivElement | null>(null);

  /** Rimette il nome com'era. Vive fuori dall'effetto perche' lo chiamano in
   *  tre: il ritorno in cima, lo smontaggio e il cambio di livello. */
  const rimetti = useRef<() => void>(() => {});

  useEffect(() => {
    if (livello !== "full") return;
    const overlay = strato.current;
    if (!overlay) return;

    const nome = document.querySelector<HTMLElement>("#hero [role='img']");
    const immagini = Array.from(
      document.querySelectorAll<HTMLImageElement>("#hero .wordmark-letter"),
    );
    if (!nome || immagini.length === 0) return;

    const stile = getComputedStyle(document.body);
    const carta = stile.getPropertyValue("--bg").trim() || "#F5F1E8";
    const riga = stile.getPropertyValue("--line").trim() || "#D9D3C4";
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    type Lettera = {
      img: HTMLImageElement;
      mesh: Vertice[];
      tele: Map<number, HTMLCanvasElement>;
      tela: HTMLCanvasElement | null;
      t: number;
      mira: number;
      via: boolean;
      indice: number;
    };

    const lettere: Lettera[] = immagini.map((img, indice) => ({
      img,
      mesh: maglia(11 + indice * 13),
      tele: new Map(),
      tela: null,
      t: 0,
      mira: 0,
      via: false,
      indice,
    }));

    const pezzi: Array<Pezzo & { el: HTMLCanvasElement; misura: number; L: Lettera }> = [];
    let presa: (typeof pezzi)[number] | null = null;
    let storia: Array<{ x: number; y: number; t: number }> = [];
    let scarto = 0;
    let ultimoY = window.scrollY;
    let vivo = false;
    let ticchetta = 0;

    const tessuto = (L: Lettera, t: number) => {
      const k = veloPer(t);
      let tex = L.tele.get(k);
      if (!tex) {
        tex = sorgente(L.img, k / (GRADINI - 1), carta, riga);
        L.tele.set(k, tex);
      }
      return tex;
    };

    /** Una tela grande quanto la lettera, appoggiata dove sta adesso. */
    const tela = (L: Lettera) => {
      const r = L.img.getBoundingClientRect();
      const misura = Math.max(r.width, r.height);
      if (!L.tela) {
        L.tela = document.createElement("canvas");
        L.tela.setAttribute("data-carta-lettera", "");
        overlay.appendChild(L.tela);
      }
      const px = Math.round(misura * dpr);
      if (L.tela.width !== px) {
        L.tela.width = px;
        L.tela.height = px;
      }
      L.tela.style.width = `${misura}px`;
      L.tela.style.height = `${misura}px`;
      L.tela.style.transform = `translate(${r.left + r.width / 2 - misura / 2}px,${
        r.top + r.height / 2 - misura / 2
      }px)`;
      return { el: L.tela, misura };
    };

    const disegna = (L: Lettera) => {
      const { el, misura } = tela(L);
      const g = el.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      accartoccia(g, tessuto(L, L.t), L.mesh, L.t, misura, misura * 0.94);
      L.img.style.opacity = L.t > 0.012 ? "0" : "";
    };

    const stacca = (L: Lettera) => {
      if (L.via) return null;
      const r = L.img.getBoundingClientRect();
      const misura = Math.max(r.width, r.height);
      const el = document.createElement("canvas");
      el.setAttribute("data-carta-pezzo", "");
      el.width = el.height = Math.round(misura * dpr);
      el.style.width = el.style.height = `${misura}px`;
      const g = el.getContext("2d");
      if (g) {
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        accartoccia(g, tessuto(L, 1), L.mesh, 1, misura, misura * 0.94);
      }
      overlay.appendChild(el);
      L.via = true;
      L.img.style.opacity = "0";
      L.tela?.remove();
      L.tela = null;
      const p = {
        el,
        misura,
        L,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        vx: 0,
        vy: 0,
        rot: 0,
        vrot: 0,
        raggio: misura * (RAGGIO + 0.04),
        tenuta: false,
      };
      pezzi.push(p);
      return p;
    };

    const sveglia = () => {
      if (vivo) return;
      vivo = true;
      ticchetta = requestAnimationFrame(giro);
    };

    let prima = performance.now();
    function giro(ora: number) {
      const dt = Math.min(0.032, (ora - prima) / 1000);
      prima = ora;
      const muri = { largo: window.innerWidth, alto: window.innerHeight };
      const applica = scarto;
      scarto = 0;
      let daFare = false;

      for (const L of lettere) {
        if (L.via) continue;
        const p = L.t;
        L.t += (L.mira - L.t) * 0.16;
        if (Math.abs(L.t - L.mira) < 0.003) L.t = L.mira;
        if (Math.abs(L.t - p) > 0.0005 || (L.t > 0 && L.tela)) {
          disegna(L);
          if (L.t === 0 && L.mira === 0) {
            L.tela?.remove();
            L.tela = null;
            L.img.style.opacity = "";
          }
        }
        if (L.t !== L.mira) daFare = true;
      }

      for (const p of pezzi) {
        passo(p, dt, muri, applica);
        p.el.style.transform = `translate(${(p.x - p.misura / 2).toFixed(1)}px,${(
          p.y - p.misura / 2
        ).toFixed(1)}px) rotate(${p.rot.toFixed(1)}deg)`;
        if (!aRiposo(p, muri)) daFare = true;
      }

      if (daFare || presa) ticchetta = requestAnimationFrame(giro);
      else vivo = false;
    }

    const dentro = (e: PointerEvent) =>
      lettere.find((L) => !L.via && L.img === (e.target as Node));

    const sopra = (e: PointerEvent) => {
      const L = dentro(e);
      if (L) { L.mira = 0.55; sveglia(); }
    };
    const fuori = (e: PointerEvent) => {
      const L = dentro(e);
      if (L && !presa) { L.mira = 0; sveglia(); }
    };
    const giu = (e: PointerEvent) => {
      const L = dentro(e);
      if (!L) return;
      e.preventDefault();
      L.t = 1;
      const p = stacca(L);
      if (!p) return;
      p.tenuta = true;
      storia = [];
      presa = p;
      // Trascinando sopra il claim partiva la selezione del testo e il gesto
      // si rompeva a meta'.
      document.body.setAttribute("data-carta-presa", "");
      (p as unknown as { dx: number; dy: number }).dx = p.x - e.clientX;
      (p as unknown as { dx: number; dy: number }).dy = p.y - e.clientY;
      sveglia();
    };
    const muovi = (e: PointerEvent) => {
      if (!presa) return;
      const d = presa as unknown as { dx: number; dy: number };
      presa.x = e.clientX + d.dx;
      presa.y = e.clientY + d.dy;
      presa.el.style.transform = `translate(${presa.x - presa.misura / 2}px,${
        presa.y - presa.misura / 2
      }px) rotate(${presa.rot}deg)`;
      storia.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (storia.length > 6) storia.shift();
    };
    const su = () => {
      if (!presa) return;
      const v = lancio(storia);
      presa.vx = v.vx;
      presa.vy = v.vy;
      presa.vrot = v.vx * 1.4;
      presa.tenuta = false;
      presa = null;
      document.body.removeAttribute("data-carta-presa");
      sveglia();
    };
    const scorri = () => {
      const y = window.scrollY;
      scarto += Math.max(-160, Math.min(160, y - ultimoY));
      ultimoY = y;
      if (pezzi.length) sveglia();
      // Tornando in cima il nome si rimette da solo: non puo' restare rotto
      // per chi torna indietro a cercarlo.
      if (y < 40 && pezzi.length && pezzi.every((p) => !p.tenuta && Math.abs(p.vy) < 25)) {
        rimetti.current();
      }
    };

    rimetti.current = () => {
      for (const p of pezzi) p.el.remove();
      pezzi.length = 0;
      presa = null;
      for (const L of lettere) {
        L.via = false;
        L.t = 0;
        L.mira = 0;
        L.tela?.remove();
        L.tela = null;
        L.img.style.opacity = "";
      }
    };

    nome.addEventListener("pointerover", sopra);
    nome.addEventListener("pointerout", fuori);
    nome.addEventListener("pointerdown", giu);
    window.addEventListener("pointermove", muovi);
    window.addEventListener("pointerup", su);
    window.addEventListener("scroll", scorri, { passive: true });

    return () => {
      cancelAnimationFrame(ticchetta);
      nome.removeEventListener("pointerover", sopra);
      nome.removeEventListener("pointerout", fuori);
      nome.removeEventListener("pointerdown", giu);
      window.removeEventListener("pointermove", muovi);
      window.removeEventListener("pointerup", su);
      window.removeEventListener("scroll", scorri);
      // Lo stile inline sulle immagini non lo toglierebbe nessun altro:
      // restasse appiccicato a opacity 0, il nome sparirebbe per sempre.
      rimetti.current();
      rimetti.current = () => {};
      document.body.removeAttribute("data-carta-presa");
    };
  }, [livello]);

  // Lo strato c'e' sempre nel DOM ma e' vuoto e non riceve il puntatore: e'
  // solo il posto dove le tele vanno a stare. Decorativo per intero — il nome
  // che uno screen reader legge resta quello del wordmark.
  return <div ref={strato} data-carta aria-hidden="true" />;
}
