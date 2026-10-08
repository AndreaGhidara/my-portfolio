"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useMotionLevel, type MotionLevel } from "@/animations/motionPolicy";
import { CATEGORIES, type CategoryId, type NewsCollection } from "@/lib/news/types";
import { collectedLabel, fillTemplate, layoutBalls, storyTitle, type Ball } from "./format";
import { NewsClipping } from "./NewsClipping";
import type { NewsCopy } from "./types";

/** Sotto questa larghezza il giornale sta sotto la macchina: la stessa soglia e' in sections/news.css. */
export const PHONE_QUERY = "(max-width: 959px)";

type Status = { kind: "loading" } | { kind: "error" } | { kind: "ready"; collection: NewsCollection };
type Drawn = { cat: CategoryId; i: number; tilt: number };

const NONE: Record<CategoryId, number> = { ia: 0, design: 0, codice: 0 };

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

function isCollection(r: unknown): r is NewsCollection {
  const c = (r as NewsCollection | null)?.categories;
  return !!c && CATEGORIES.every((k) => Array.isArray(c[k]));
}

// Vive in <body> e non nella sezione: vola sopra tutto, e la sezione non ha
// niente da tagliare. A "reduced" fa la stessa strada, piu' corta e senza girare.
async function fly(cat: CategoryId, origin: HTMLElement, target: HTMLElement, level: MotionLevel) {
  const v = document.createElement("span");
  v.setAttribute("data-news-flying", "");
  v.setAttribute("aria-hidden", "true");
  v.dataset.cat = cat;
  document.body.appendChild(v);
  try {
    if (typeof v.animate !== "function") return;
    const s = origin.getBoundingClientRect();
    const g = target.getBoundingClientRect();
    const x0 = s.left + s.width / 2;
    const y0 = s.top + s.height / 2;
    const x1 = g.left + Math.min(g.width / 2, 200);
    const y1 = Math.max(80, Math.min(g.top + 40, window.innerHeight - 40));
    v.style.left = `${x0}px`;
    v.style.top = `${y0}px`;
    const full = level === "full";
    await v.animate(
      [
        { transform: "translate(0, 0) scale(.6)" },
        {
          transform: `translate(${(x1 - x0) * 0.5}px, ${Math.min(0, y1 - y0) - (full ? 70 : 30)}px) scale(1.1) rotate(${full ? 200 : 0}deg)`,
          offset: 0.5,
        },
        { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(.9) rotate(${full ? 400 : 0}deg)` },
      ],
      { duration: full ? 650 : 420, easing: "cubic-bezier(.4, 0, .3, 1)" },
    ).finished;
  } catch {
    // Un'animazione interrotta non deve fermare la notizia.
  } finally {
    v.remove();
  }
}

type Grip = { id: number; x0: number; y0: number; cx: number; cy: number; last: number; total: number };

/** Oltre quanti pixel dal punto in cui si e' preso il gesto e' un trascinamento, non un tocco. */
const DRAG_THRESHOLD_PX = 6;
/** Vicino al centro l'angolo non vuol dire niente: un pixel di tremito vale decine di gradi. */
const DEAD_ZONE_PX = 12;

// Le notizie si chiedono quando la sezione si avvicina alla vista, non al
// caricamento; se non arrivano, il giro dopo riprova. Trascinata in tondo, un giro
// intero di manopola e' una pallina. La rotella non si intercetta: lo scroll
// della pagina resta di chi scorre.
export function NewsStand({ copy, locale }: { copy: NewsCopy; locale: string }) {
  const level = useMotionLevel();
  const root = useRef<HTMLDivElement>(null);
  const machine = useRef<HTMLDivElement>(null);
  const hatch = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [selected, setSelected] = useState<CategoryId>("ia");
  const [drawn, setDrawn] = useState(NONE);
  const [printed, setPrinted] = useState<Drawn[]>([]);
  const [shown, setShown] = useState<number | null>(null);
  const [exhausted, setExhausted] = useState<CategoryId | null>(null);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [turns, setTurns] = useState(0);
  const [angle, setAngle] = useState(0);
  const busy = useRef(false);
  const requested = useRef(false);
  const grip = useRef<Grip | null>(null);
  const dragged = useRef(false);
  // Copie fresche di drawn e printed: turn() le rilegge dopo l'await, quando la
  // closure del render puo' essere gia' vecchia (manopola girata senza fermarsi).
  const drawnRef = useRef(NONE);
  const printedRef = useRef<Drawn[]>([]);

  const load = useCallback(async () => {
    setStatus({ kind: "loading" });
    try {
      const r = await fetch("/api/notizie");
      if (!r.ok) throw new Error(String(r.status));
      const collection: unknown = await r.json();
      if (!isCollection(collection)) throw new Error("shape");
      const counts = { ...NONE };
      for (const c of CATEGORIES) counts[c] = collection.categories[c].length;
      if (CATEGORIES.every((c) => counts[c] === 0)) throw new Error("empty");
      setBalls(layoutBalls(counts));
      drawnRef.current = NONE;
      setDrawn(NONE);
      setStatus({ kind: "ready", collection });
    } catch {
      setStatus({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || requested.current) return;
    const request = () => {
      if (requested.current) return;
      requested.current = true;
      void load();
    };
    if (typeof IntersectionObserver === "undefined") {
      request();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        request();
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  function shake() {
    const m = machine.current;
    if (!m) return;
    // Tolto e rimesso dopo un reflow, perche' l'animazione riparta a ogni giro.
    m.removeAttribute("data-turn");
    void m.offsetWidth;
    m.setAttribute("data-turn", "");
  }

  async function turn() {
    if (busy.current) return;
    if (status.kind === "error") {
      void load();
      return;
    }
    if (status.kind !== "ready") return;
    const cat = selected;
    const i = drawnRef.current[cat];
    setTurns((g) => g + 1);
    if (i >= status.collection.categories[cat].length) {
      setExhausted(cat);
      return;
    }
    setExhausted(null);
    busy.current = true;
    drawnRef.current = { ...drawnRef.current, [cat]: i + 1 };
    setDrawn(drawnRef.current);
    if (level !== "none" && hatch.current && sheet.current) {
      shake();
      await wait(level === "full" ? 420 : 200);
      await fly(cat, hatch.current, sheet.current, level);
    }
    printedRef.current = [...printedRef.current, { cat, i, tilt: Math.random() * 1.4 - 0.7 }];
    setPrinted(printedRef.current);
    setShown(printedRef.current.length - 1);
    busy.current = false;
    // Sul telefono il giornale sta sotto la macchina, spesso fuori dallo schermo.
    if (window.matchMedia(PHONE_QUERY).matches) {
      requestAnimationFrame(() =>
        sheet.current?.scrollIntoView?.({ behavior: level === "none" ? "auto" : "smooth", block: "start" }),
      );
    }
  }

  function select(cat: CategoryId) {
    setSelected(cat);
    setExhausted(null);
  }

  const center = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  function grab(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    const { cx, cy } = center(e);
    grip.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      cx,
      cy,
      last: Math.atan2(e.clientY - cy, e.clientX - cx),
      total: 0,
    };
    dragged.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function drag(e: PointerEvent<HTMLButtonElement>) {
    const p = grip.current;
    if (!p || e.pointerId !== p.id) return;
    if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > DRAG_THRESHOLD_PX) dragged.current = true;
    const dx = e.clientX - p.cx;
    const dy = e.clientY - p.cy;
    const a = Math.atan2(dy, dx);
    if (Math.hypot(dx, dy) < DEAD_ZONE_PX) {
      p.last = a;
      return;
    }
    let d = a - p.last;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    p.last = a;
    // In senso orario (sullo schermo l'angolo cresce verso il basso). Indietro fa un po' di resistenza e basta.
    p.total = Math.max(-20, p.total + (d * 180) / Math.PI);
    if (p.total >= 360) {
      if (busy.current) {
        p.total = 360;
      } else {
        p.total -= 360;
        void turn();
      }
    }
    setAngle(p.total);
  }

  function release(e: PointerEvent<HTMLButtonElement>) {
    if (grip.current?.id !== e.pointerId) return;
    grip.current = null;
    setAngle(0);
    // Il clic che chiude il trascinamento arriva subito dopo, nello stesso giro
    // di eventi; se non arriva (col dito puo' capitare) il prossimo clic vale.
    setTimeout(() => {
      dragged.current = false;
    }, 0);
  }

  function click() {
    // Un trascinamento finisce con un clic: il giro l'ha gia' dato il trascinamento.
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    void turn();
  }

  const ready = status.kind === "ready" ? status.collection : null;
  const remaining = ready ? ready.categories[selected].length - drawn[selected] : null;
  const name = copy.categories[selected].name;
  const plate =
    remaining === null ? `${name} · …` : fillTemplate(remaining === 1 ? copy.plateOne : copy.plate, { categoria: name, n: remaining });
  const current = shown !== null ? printed[shown] : null;
  const story = current && ready ? ready.categories[current.cat][current.i] : null;
  const now = new Date();

  // Quello che la macchina dice di se': l'errore e la categoria finita si
  // annunciano, l'attesa e l'invito no.
  const notice =
    status.kind === "error"
      ? copy.error
      : exhausted
        ? fillTemplate(copy.exhausted, { categoria: copy.categories[exhausted].name })
        : null;
  const message = status.kind === "loading" ? copy.waiting : status.kind === "ready" ? copy.empty : null;
  const masthead = exhausted ?? current?.cat;
  // La data si scrive solo sul client (le notizie arrivano li'): il server
  // potrebbe stare in un altro giorno, o in un altro fuso.
  const today = ready
    ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now)
    : "\u00a0";
  // La fila parte dalla seconda: la prima e' gia' sulla pagina. L'ultima uscita in cima.
  const queue = printed.length > 1 ? printed.map((u, k) => ({ ...u, k })).reverse() : [];

  return (
    <div ref={root} data-news-scene data-motion={level}>
      <div data-news-bench>
        <div ref={machine} data-news-machine data-cat={selected}>
          <span data-news-cap aria-hidden="true" />
          <div data-news-globe aria-hidden="true">
            {balls.map((p) => (
              <span
                key={`${p.cat}-${p.i}`}
                data-cat={p.cat}
                data-off={p.cat !== selected ? "" : undefined}
                data-gone={p.i < drawn[p.cat] ? "" : undefined}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              />
            ))}
          </div>
          <span data-news-neck aria-hidden="true" />
          <div data-news-body>
            <p data-news-nameplate>{plate}</p>
            <div data-news-buttons role="group" aria-label={copy.group}>
              {CATEGORIES.map((c) => (
                <button key={c} type="button" data-cat={c} aria-pressed={selected === c} onClick={() => select(c)}>
                  <i aria-hidden="true" />
                  <span>{copy.categories[c].name}</span>
                </button>
              ))}
            </div>
            <div data-news-controls>
              <button
                type="button"
                data-news-knob
                data-drag={angle !== 0 ? "" : undefined}
                aria-label={copy.knob}
                style={{ "--turns": turns, "--angle": `${angle}deg` } as CSSProperties}
                onClick={click}
                onPointerDown={grab}
                onPointerMove={drag}
                onPointerUp={release}
                onPointerCancel={release}
              />
            </div>
            <div ref={hatch} data-news-hatch aria-hidden="true" />
          </div>
          <span data-news-foot aria-hidden="true" />
        </div>
        <p data-news-help>{copy.help}</p>
      </div>

      <div ref={sheet} data-news-sheet>
        <div data-sheet-head>
          <b>
            {masthead ? <i aria-hidden="true" data-cat={masthead} /> : null}
            {masthead ? copy.categories[masthead].masthead : copy.masthead}
          </b>
          <span>{today}</span>
        </div>
        {/* Si annunciano solo testata e titolo: l'articolo intero, e la fila
            delle gia' uscite, si vanno a leggere. */}
        <p className="sr-only" aria-live="polite" data-news-announcement>
          {story && current ? `${copy.categories[current.cat].masthead}: ${storyTitle(story, copy)}` : ""}
        </p>
        <div data-sheet-body>
          {/* Notizia, pannello vuoto e categoria finita: stessa scatola, stessa misura. */}
          <div data-sheet-story>
            {/* Sempre montato, vuoto quando non c'e' niente da dire: una regione
                che nasce insieme al suo testo spesso non viene letta. */}
            <p data-news-notice role="status">
              {notice ?? ""}
            </p>
            {notice ? null : story && current ? (
              <NewsClipping
                key={shown}
                story={story}
                cat={current.cat}
                tilt={current.tilt}
                copy={copy}
                locale={locale}
                now={now}
              />
            ) : message ? (
              <p data-news-message>{message}</p>
            ) : null}
          </div>
          <div data-sheet-column>
            <p data-sheet-label>{copy.alreadyDrawn}</p>
            {/* La colonna scorre dentro di se': senza, Lenis prende la rotella
                e scorre la pagina anche col puntatore sulla lista. */}
            <ol data-sheet-drawn data-lenis-prevent>
              {queue.length === 0 ? <li data-sheet-none>{copy.noneDrawn}</li> : null}
              {queue.map((u) => {
                const n = ready?.categories[u.cat][u.i];
                if (!n) return null;
                const title = storyTitle(n, copy);
                return (
                  <li key={u.k}>
                    <button
                      type="button"
                      data-cat={u.cat}
                      aria-current={u.k === shown && !exhausted ? "true" : undefined}
                      aria-label={`${copy.categories[u.cat].name}: ${title}`}
                      onClick={() => {
                        setExhausted(null);
                        setShown(u.k);
                      }}
                    >
                      <i aria-hidden="true" />
                      <span lang={n.stamp === "release" ? undefined : "en"}>{title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p data-news-collected>{ready ? collectedLabel(ready.collectedAt, locale, now, copy) : "\u00a0"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
