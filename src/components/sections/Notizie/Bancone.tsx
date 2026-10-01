"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useMotionLevel, type MotionLevel } from "@/animations/motionPolicy";
import { CATEGORIE, type CategoriaId, type Raccolta } from "@/lib/notizie/tipi";
import { disponi, raccolte, riempi, titoloDi, type Pallina } from "./formato";
import { Ritaglio } from "./Ritaglio";
import type { TestiNotizie } from "./tipi";

/** Sotto questa larghezza il giornale sta sotto la macchina: la stessa soglia e' in sezioni/notizie.css. */
export const TELEFONO = "(max-width: 959px)";

type Stato = { tipo: "attesa" } | { tipo: "errore" } | { tipo: "pronto"; raccolta: Raccolta };
type Uscita = { cat: CategoriaId; i: number; storto: number };

const NESSUNA: Record<CategoriaId, number> = { ia: 0, design: 0, codice: 0 };

const aspetta = (ms: number) => new Promise((fatto) => setTimeout(fatto, ms));

function valida(r: unknown): r is Raccolta {
  const c = (r as Raccolta | null)?.categorie;
  return !!c && CATEGORIE.every((k) => Array.isArray(c[k]));
}

/**
 * La pallina che esce dallo sportello e vola al giornale. Vive in <body> e
 * non nella sezione: vola sopra tutto, e la sezione non ha niente da tagliare.
 * A "reduced" fa la stessa strada, piu' corta e senza girare su se stessa.
 */
async function vola(cat: CategoriaId, da: HTMLElement, a: HTMLElement, level: MotionLevel) {
  const v = document.createElement("span");
  v.setAttribute("data-notizie-volante", "");
  v.setAttribute("aria-hidden", "true");
  v.dataset.cat = cat;
  document.body.appendChild(v);
  try {
    if (typeof v.animate !== "function") return;
    const s = da.getBoundingClientRect();
    const g = a.getBoundingClientRect();
    const x0 = s.left + s.width / 2;
    const y0 = s.top + s.height / 2;
    const x1 = g.left + Math.min(g.width / 2, 200);
    const y1 = Math.max(80, Math.min(g.top + 40, window.innerHeight - 40));
    v.style.left = `${x0}px`;
    v.style.top = `${y0}px`;
    const pieno = level === "full";
    await v.animate(
      [
        { transform: "translate(0, 0) scale(.6)" },
        {
          transform: `translate(${(x1 - x0) * 0.5}px, ${Math.min(0, y1 - y0) - (pieno ? 70 : 30)}px) scale(1.1) rotate(${pieno ? 200 : 0}deg)`,
          offset: 0.5,
        },
        { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(.9) rotate(${pieno ? 400 : 0}deg)` },
      ],
      { duration: pieno ? 650 : 420, easing: "cubic-bezier(.4, 0, .3, 1)" },
    ).finished;
  } catch {
    // Un'animazione interrotta non deve fermare la notizia.
  } finally {
    v.remove();
  }
}

type Presa = { id: number; x0: number; y0: number; cx: number; cy: number; ultimo: number; somma: number };

/** Oltre quanti pixel dal punto in cui si e' preso il gesto e' un trascinamento, non un tocco. */
const SOGLIA_PX = 6;
/** Vicino al centro l'angolo non vuol dire niente: un pixel di tremito vale decine di gradi. */
const ZONA_MORTA_PX = 12;

/**
 * Il bancone: il globo con le palline delle tre categorie, i tre pulsanti da
 * sala giochi, la manopola, e accanto il giornale dove si stampa la notizia.
 *
 * Le notizie si chiedono a /api/notizie quando la sezione si avvicina alla
 * vista, non al caricamento della pagina. Se non arrivano la macchina lo dice,
 * e il giro dopo riprova.
 *
 * La manopola si gira in tre modi: un clic, Invio o Spazio (e' un bottone), o
 * trascinandola in tondo col puntatore o col dito, in senso orario. Un giro
 * intero e' una pallina. La rotella non si intercetta: lo scroll della pagina
 * resta di chi scorre.
 */
export function Bancone({ testi, locale }: { testi: TestiNotizie; locale: string }) {
  const level = useMotionLevel();
  const radice = useRef<HTMLDivElement>(null);
  const macchina = useRef<HTMLDivElement>(null);
  const sportello = useRef<HTMLDivElement>(null);
  const giornale = useRef<HTMLDivElement>(null);
  const [stato, setStato] = useState<Stato>({ tipo: "attesa" });
  const [scelta, setScelta] = useState<CategoriaId>("ia");
  const [uscite, setUscite] = useState(NESSUNA);
  const [storia, setStoria] = useState<Uscita[]>([]);
  const [mostrata, setMostrata] = useState<number | null>(null);
  const [finita, setFinita] = useState<CategoriaId | null>(null);
  const [palline, setPalline] = useState<Pallina[]>([]);
  const [giri, setGiri] = useState(0);
  const [angolo, setAngolo] = useState(0);
  const occupato = useRef(false);
  const chiesta = useRef(false);
  const presa = useRef<Presa | null>(null);
  const trascinata = useRef(false);

  const carica = useCallback(async () => {
    setStato({ tipo: "attesa" });
    try {
      const r = await fetch("/api/notizie");
      if (!r.ok) throw new Error(String(r.status));
      const raccolta: unknown = await r.json();
      if (!valida(raccolta)) throw new Error("forma");
      const conte = { ...NESSUNA };
      for (const c of CATEGORIE) conte[c] = raccolta.categorie[c].length;
      if (CATEGORIE.every((c) => conte[c] === 0)) throw new Error("vuote");
      setPalline(disponi(conte));
      setUscite(NESSUNA);
      setStato({ tipo: "pronto", raccolta });
    } catch {
      setStato({ tipo: "errore" });
    }
  }, []);

  useEffect(() => {
    const el = radice.current;
    if (!el || chiesta.current) return;
    const chiedi = () => {
      if (chiesta.current) return;
      chiesta.current = true;
      void carica();
    };
    if (typeof IntersectionObserver === "undefined") {
      chiedi();
      return;
    }
    const osservatore = new IntersectionObserver(
      ([voce]) => {
        if (!voce?.isIntersecting) return;
        osservatore.disconnect();
        chiedi();
      },
      { rootMargin: "800px 0px" },
    );
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, [carica]);

  function mescola() {
    const m = macchina.current;
    if (!m) return;
    // Tolto e rimesso dopo un reflow, perche' l'animazione riparta a ogni giro.
    m.removeAttribute("data-gira");
    void m.offsetWidth;
    m.setAttribute("data-gira", "");
  }

  async function gira() {
    if (occupato.current) return;
    if (stato.tipo === "errore") {
      void carica();
      return;
    }
    if (stato.tipo !== "pronto") return;
    const cat = scelta;
    const i = uscite[cat];
    setGiri((g) => g + 1);
    if (i >= stato.raccolta.categorie[cat].length) {
      setFinita(cat);
      return;
    }
    setFinita(null);
    occupato.current = true;
    setUscite((u) => ({ ...u, [cat]: i + 1 }));
    if (level !== "none" && sportello.current && giornale.current) {
      mescola();
      await aspetta(level === "full" ? 420 : 200);
      await vola(cat, sportello.current, giornale.current, level);
    }
    setStoria([...storia, { cat, i, storto: Math.random() * 1.4 - 0.7 }]);
    setMostrata(storia.length);
    occupato.current = false;
    // Sul telefono il giornale sta sotto la macchina, spesso fuori dallo schermo.
    if (window.matchMedia(TELEFONO).matches) {
      requestAnimationFrame(() =>
        giornale.current?.scrollIntoView?.({ behavior: level === "none" ? "auto" : "smooth", block: "start" }),
      );
    }
  }

  function scegli(cat: CategoriaId) {
    setScelta(cat);
    setFinita(null);
  }

  const centro = (e: PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  function prendi(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    const { cx, cy } = centro(e);
    presa.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      cx,
      cy,
      ultimo: Math.atan2(e.clientY - cy, e.clientX - cx),
      somma: 0,
    };
    trascinata.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function trascina(e: PointerEvent<HTMLButtonElement>) {
    const p = presa.current;
    if (!p || e.pointerId !== p.id) return;
    if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > SOGLIA_PX) trascinata.current = true;
    const dx = e.clientX - p.cx;
    const dy = e.clientY - p.cy;
    const a = Math.atan2(dy, dx);
    if (Math.hypot(dx, dy) < ZONA_MORTA_PX) {
      p.ultimo = a;
      return;
    }
    let d = a - p.ultimo;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    p.ultimo = a;
    // In senso orario (sullo schermo l'angolo cresce verso il basso). Indietro fa un po' di resistenza e basta.
    p.somma = Math.max(-20, p.somma + (d * 180) / Math.PI);
    if (p.somma >= 360) {
      if (occupato.current) {
        p.somma = 360;
      } else {
        p.somma -= 360;
        void gira();
      }
    }
    setAngolo(p.somma);
  }

  function lascia(e: PointerEvent<HTMLButtonElement>) {
    if (presa.current?.id !== e.pointerId) return;
    presa.current = null;
    setAngolo(0);
    // Il clic che chiude il trascinamento arriva subito dopo, nello stesso giro
    // di eventi; se non arriva (col dito puo' capitare) il prossimo clic vale.
    setTimeout(() => {
      trascinata.current = false;
    }, 0);
  }

  function clic() {
    // Un trascinamento finisce con un clic: il giro l'ha gia' dato il trascinamento.
    if (trascinata.current) {
      trascinata.current = false;
      return;
    }
    void gira();
  }

  const pronta = stato.tipo === "pronto" ? stato.raccolta : null;
  const restano = pronta ? pronta.categorie[scelta].length - uscite[scelta] : null;
  const nome = testi.categorie[scelta].nome;
  const targa =
    restano === null ? `${nome} · …` : riempi(restano === 1 ? testi.targaUna : testi.targa, { categoria: nome, n: restano });
  const uscita = mostrata !== null ? storia[mostrata] : null;
  const notizia = uscita && pronta ? pronta.categorie[uscita.cat][uscita.i] : null;
  const adesso = new Date();

  // Quello che la macchina dice di se': l'errore e la categoria finita si
  // annunciano, l'attesa e l'invito no.
  const avviso =
    stato.tipo === "errore"
      ? testi.errore
      : finita
        ? riempi(testi.finite, { categoria: testi.categorie[finita].nome })
        : null;
  const messaggio = stato.tipo === "attesa" ? testi.attesa : stato.tipo === "pronto" ? testi.vuota : null;
  const testata = finita ?? uscita?.cat;
  // La data si scrive solo sul client (le notizie arrivano li'): il server
  // potrebbe stare in un altro giorno, o in un altro fuso.
  const oggi = pronta
    ? new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(adesso)
    : "\u00a0";
  // La fila parte dalla seconda: la prima e' gia' sulla pagina. L'ultima uscita in cima.
  const fila = storia.length > 1 ? storia.map((u, k) => ({ ...u, k })).reverse() : [];

  return (
    <div ref={radice} data-notizie-scena data-motion={level}>
      <div data-notizie-banco>
        <div ref={macchina} data-notizie-macchina data-cat={scelta}>
          <span data-notizie-tappo aria-hidden="true" />
          <div data-notizie-globo aria-hidden="true">
            {palline.map((p) => (
              <span
                key={`${p.cat}-${p.i}`}
                data-cat={p.cat}
                data-spenta={p.cat !== scelta ? "" : undefined}
                data-via={p.i < uscite[p.cat] ? "" : undefined}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              />
            ))}
          </div>
          <span data-notizie-collo aria-hidden="true" />
          <div data-notizie-corpo>
            <p data-notizie-targa>{targa}</p>
            <div data-notizie-pulsanti role="group" aria-label={testi.gruppo}>
              {CATEGORIE.map((c) => (
                <button key={c} type="button" data-cat={c} aria-pressed={scelta === c} onClick={() => scegli(c)}>
                  <i aria-hidden="true" />
                  <span>{testi.categorie[c].nome}</span>
                </button>
              ))}
            </div>
            <div data-notizie-comandi>
              <button
                type="button"
                data-notizie-manopola
                data-trascina={angolo !== 0 ? "" : undefined}
                aria-label={testi.manopola}
                style={{ "--giri": giri, "--angolo": `${angolo}deg` } as CSSProperties}
                onClick={clic}
                onPointerDown={prendi}
                onPointerMove={trascina}
                onPointerUp={lascia}
                onPointerCancel={lascia}
              />
            </div>
            <div ref={sportello} data-notizie-sportello aria-hidden="true" />
          </div>
          <span data-notizie-piede aria-hidden="true" />
        </div>
        <p data-notizie-aiuto>{testi.aiuto}</p>
      </div>

      <div ref={giornale} data-notizie-foglio>
        <div data-foglio-testa>
          <b>
            {testata ? <i aria-hidden="true" data-cat={testata} /> : null}
            {testata ? testi.categorie[testata].testata : testi.testata}
          </b>
          <span>{oggi}</span>
        </div>
        {/* Si annunciano solo testata e titolo: l'articolo intero, e la fila
            delle gia' uscite, si vanno a leggere. */}
        <p className="sr-only" aria-live="polite" data-notizie-annuncio>
          {notizia && uscita ? `${testi.categorie[uscita.cat].testata}: ${titoloDi(notizia, testi)}` : ""}
        </p>
        <div data-foglio-corpo>
          {/* La notizia, il pannello vuoto e quello della categoria finita
              stanno nella stessa scatola, della stessa misura. */}
          <div data-foglio-notizia>
            {/* Sempre montato, vuoto quando non c'e' niente da dire: una regione
                che nasce insieme al suo testo spesso non viene letta. */}
            <p data-notizie-avviso role="status">
              {avviso ?? ""}
            </p>
            {avviso ? null : notizia && uscita ? (
              <Ritaglio
                key={mostrata}
                notizia={notizia}
                cat={uscita.cat}
                storto={uscita.storto}
                testi={testi}
                locale={locale}
                adesso={adesso}
              />
            ) : messaggio ? (
              <p data-notizie-messaggio>{messaggio}</p>
            ) : null}
          </div>
          <div data-foglio-colonna>
            <p data-foglio-etichetta>{testi.giaUscite}</p>
            {/* La colonna scorre dentro di se': senza, Lenis prende la rotella
                e scorre la pagina anche col puntatore sulla lista. */}
            <ol data-foglio-uscite data-lenis-prevent>
              {fila.length === 0 ? <li data-foglio-nessuna>{testi.nessunaUscita}</li> : null}
              {fila.map((u) => {
                const n = pronta?.categorie[u.cat][u.i];
                if (!n) return null;
                const titolo = titoloDi(n, testi);
                return (
                  <li key={u.k}>
                    <button
                      type="button"
                      data-cat={u.cat}
                      aria-current={u.k === mostrata && !finita ? "true" : undefined}
                      aria-label={`${testi.categorie[u.cat].nome}: ${titolo}`}
                      onClick={() => {
                        setFinita(null);
                        setMostrata(u.k);
                      }}
                    >
                      <i aria-hidden="true" />
                      <span lang={n.timbro === "release" ? undefined : "en"}>{titolo}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p data-notizie-raccolte>{pronta ? raccolte(pronta.raccolteAlle, locale, adesso, testi) : "\u00a0"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
