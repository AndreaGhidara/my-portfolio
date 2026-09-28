"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import {
  INCROCI,
  RADICE,
  RAMI,
  ZONE,
  type Capo,
} from "@/content/cassetta";
import { Etichetta } from "./Etichetta";
import {
  NODI,
  altezza,
  attrezzo,
  cucitura,
  curva,
  larghezza,
  padre,
  strada,
  tappe,
  vicini,
} from "./grafo";
import type { Passo, TestiCassetta } from "./tipi";

const LARGO = 1200;
const ALTO = 820;
/** Oltre questi pixel di schermo un clic diventa un trascinamento. */
const SOGLIA_TRASCINA = 6;

type Punto = { x: number; y: number };
type Filo = { a: string; b: string; incrocio: boolean };

const FILI: Filo[] = [
  ...RAMI.map(([a, b]) => ({ a, b, incrocio: false })),
  ...INCROCI.map(([a, b]) => ({ a, b, incrocio: true })),
];

const riposo = new Map(NODI.map((n) => [n.id, { x: n.x, y: n.y }]));

/**
 * L'ordine dell'entrata: dal cartellino in giu', per rami, come un albero che
 * si apre. Ogni nodo parte dal punto in cui sta suo padre.
 */
const ENTRATA = (() => {
  const ordine: string[] = [RADICE.id];
  for (let i = 0; i < ordine.length; i++) {
    for (const [a, b] of RAMI)
      if (a === ordine[i] && !ordine.includes(b)) ordine.push(b);
  }
  for (const n of NODI) if (!ordine.includes(n.id)) ordine.push(n.id);
  return new Map(ordine.map((id, i) => [id, i]));
})();

/**
 * La mappa della cassetta: nove pezze di stoffa, gli attrezzi cuciti sopra
 * come etichette, i fili fra chi lavora con chi, e a destra l'etichetta di
 * quello che si e' aperto.
 *
 * Il server la rende gia' finita, nella sua scatola con le proporzioni del
 * banco: niente misure nel browser, niente scambio di vista dopo il montaggio,
 * e la sezione ha la stessa altezza prima e dopo il JavaScript.
 *
 * Tutto il movimento e' a "full": l'entrata dei nodi, il trascinamento con la
 * molla e l'ago che cuce. A "reduced" e a "none" la mappa sta ferma e il filo
 * di un capo e' gia' cucito. Il passaggio del mouse che accende la strada
 * fino al cartellino non e' movimento, e vale sempre.
 *
 * La mappa e' fuori dall'ordine di tabulazione e nascosta agli screen reader:
 * il percorso da tastiera sono i bottoni «cuci per» e l'etichetta qui accanto,
 * che da ogni nodo porta ai suoi vicini; chi legge ha l'elenco per scomparti.
 */
export function Mappa({
  testi,
  capo,
  passo,
  onNodo,
  onCapo,
  azioni,
  level,
  attiva,
}: {
  testi: TestiCassetta;
  capo: Capo | null;
  passo: Passo;
  onNodo: (id: string) => void;
  onCapo: (id: string) => void;
  azioni: ReactNode;
  level: MotionLevel;
  /** Se e' la vista che il CSS mostra adesso: l'altra non si anima. */
  attiva: boolean;
}) {
  const banco = useRef<HTMLDivElement | null>(null);
  const svg = useRef<SVGSVGElement | null>(null);
  const gruppi = useRef(new Map<string, SVGGElement>());
  const tracciati = useRef<(SVGPathElement | null)[]>([]);
  const cucituraRef = useRef<SVGPathElement | null>(null);
  const mascheraRef = useRef<SVGPathElement | null>(null);
  const agoRef = useRef<SVGGElement | null>(null);
  const gsapRef = useRef<typeof import("gsap").gsap | null>(null);
  const posizioni = useRef(
    new Map<string, Punto>([...riposo].map(([id, p]) => [id, { ...p }])),
  );
  const [acceso, setAcceso] = useState<string | null>(null);
  const [cuciti, setCuciti] = useState(Number.POSITIVE_INFINITY);
  const [entrata, setEntrata] = useState<"attesa" | "entra" | null>(null);
  const idMaschera = useId().replace(/:/g, "");

  const percorso = useMemo(() => (capo ? tappe(capo) : []), [capo]);
  const disegnoCucitura = useMemo(
    () => cucitura(percorso.map((id) => riposo.get(id)!)),
    [percorso],
  );

  // GSAP arriva dopo la prima pittura: la mappa lo tiene a portata di mano
  // per la molla e per l'ago, che partono da un clic e non da una build.
  useSectionAnimation(({ gsap }) => {
    gsapRef.current = gsap;
    return () => {
      gsapRef.current = null;
    };
  }, banco);

  const pieno = level === "full" && attiva;

  /* L'entrata, una volta sola e solo se la mappa non e' gia' in vista: chi
     ricarica a meta' pagina la trova ferma e completa. */
  useEffect(() => {
    const el = banco.current;
    if (!pieno || !el || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setEntrata("attesa");
    const osservatore = new IntersectionObserver(
      ([voce]) => {
        if (!voce.isIntersecting) return;
        setEntrata("entra");
        osservatore.disconnect();
      },
      { threshold: 0.2 },
    );
    osservatore.observe(el);
    return () => {
      osservatore.disconnect();
      setEntrata(null);
    };
  }, [pieno]);

  /** Riscrive solo i fili del nodo che si muove, non tutti e ottanta. */
  const ridisegna = (id: string) => {
    const pos = posizioni.current;
    FILI.forEach((f, i) => {
      if (f.a !== id && f.b !== id) return;
      tracciati.current[i]?.setAttribute(
        "d",
        curva(pos.get(f.a)!, pos.get(f.b)!),
      );
    });
    const p = pos.get(id)!;
    gruppi.current
      .get(id)
      ?.setAttribute(
        "transform",
        `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`,
      );
  };

  /* L'ago. Parte a ogni capo nuovo, solo a "full": il filo si scopre dietro di
     lui e le etichette si accendono quando ci passa. Altrimenti il capo e' gia'
     cucito. In fase di layout: il capo nuovo non deve mostrarsi gia' cucito per
     un fotogramma prima che l'ago parta. */
  useLayoutEffect(() => {
    const maschera = mascheraRef.current;
    const filo = cucituraRef.current;
    const ago = agoRef.current;
    const gsap = gsapRef.current;
    if (!capo || !maschera || !filo || !ago) {
      // Via il capo a meta' corsa: l'ago non deve restare fermo sulla mappa.
      if (agoRef.current) agoRef.current.style.opacity = "0";
      return;
    }

    const tutto = () => {
      maschera.style.strokeDasharray = "none";
      maschera.style.strokeDashoffset = "0";
      ago.style.opacity = "0";
      setCuciti(Number.POSITIVE_INFINITY);
    };
    if (!pieno || !gsap || typeof filo.getTotalLength !== "function") {
      tutto();
      return;
    }

    const lunghezza = filo.getTotalLength();
    // Dove sta ogni tappa lungo il filo: le curve parziali misurate da un
    // tracciato di servizio, dentro l'SVG perche' fuori il browser non misura.
    const prova = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    svg.current?.appendChild(prova);
    const soglie = disegnoCucitura.parziali.map((d) => {
      prova.setAttribute("d", d);
      return prova.getTotalLength();
    });
    prova.remove();

    maschera.style.strokeDasharray = `${lunghezza} ${lunghezza}`;
    maschera.style.strokeDashoffset = `${lunghezza}`;
    ago.style.opacity = "1";
    setCuciti(1);

    const stato = { q: 0 };
    let fatti = 1;
    const tween = gsap.to(stato, {
      q: 1,
      duration: Math.min(5.2, 0.26 * percorso.length),
      ease: "none",
      onUpdate: () => {
        const l = stato.q * lunghezza;
        maschera.style.strokeDashoffset = `${lunghezza - l}`;
        const p = filo.getPointAtLength(l);
        const p2 = filo.getPointAtLength(Math.min(lunghezza, l + 2));
        const angolo =
          (Math.atan2(p2.y - p.y, p2.x - p.x) * 180) / Math.PI + 90;
        const su = Math.sin(stato.q * 60) * 4;
        ago.setAttribute(
          "transform",
          `translate(${p.x} ${p.y + su}) rotate(${angolo})`,
        );
        let n = fatti;
        while (n < soglie.length && soglie[n] <= l + 0.5) n++;
        if (n !== fatti) {
          fatti = n;
          setCuciti(n);
        }
      },
      onComplete: tutto,
    });
    return () => {
      tween.kill();
      ago.style.opacity = "0";
      setCuciti(Number.POSITIVE_INFINITY);
    };
  }, [capo, pieno, disegnoCucitura, percorso.length]);

  /* Il trascinamento: a "full" un'etichetta si prende e si sposta, e al
     rilascio torna al suo posto con una molla di GSAP. Niente ciclo sempre
     acceso: si lavora solo mentre qualcosa si muove, e si riscrivono solo i
     fili del nodo preso. Sotto la soglia il gesto e' un clic. */
  const presa = useRef<{
    id: string;
    x0: number;
    y0: number;
    dx: number;
    dy: number;
    mosso: boolean;
  } | null>(null);

  const inMappa = (x: number, y: number): Punto => {
    const m = svg.current?.getScreenCTM();
    if (!m) return { x, y };
    const inversa = m.inverse();
    return {
      x: inversa.a * x + inversa.c * y + inversa.e,
      y: inversa.b * x + inversa.d * y + inversa.f,
    };
  };

  const giu = (id: string) => (e: React.PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return;
    const p = posizioni.current.get(id)!;
    const q = inMappa(e.clientX, e.clientY);
    presa.current = {
      id,
      x0: e.clientX,
      y0: e.clientY,
      dx: p.x - q.x,
      dy: p.y - q.y,
      mosso: false,
    };
    gsapRef.current?.killTweensOf(p);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const muovi = (e: React.PointerEvent<SVGGElement>) => {
    const pr = presa.current;
    if (!pr || !pieno || !gsapRef.current) return;
    if (
      !pr.mosso &&
      Math.hypot(e.clientX - pr.x0, e.clientY - pr.y0) < SOGLIA_TRASCINA
    )
      return;
    pr.mosso = true;
    const q = inMappa(e.clientX, e.clientY);
    const p = posizioni.current.get(pr.id)!;
    p.x = q.x + pr.dx;
    p.y = q.y + pr.dy;
    ridisegna(pr.id);
  };

  // Le molle nascono da un gesto, fuori dal contesto di useSectionAnimation:
  // nessuno le spegnerebbe allo smontaggio.
  const molle = useRef(new Set<gsap.core.Tween>());
  useEffect(() => {
    const vive = molle.current;
    return () => {
      for (const t of vive) t.kill();
      vive.clear();
    };
  }, []);

  const molla = (id: string) => {
    const gsap = gsapRef.current;
    const p = posizioni.current.get(id)!;
    const r = riposo.get(id)!;
    if (!gsap) {
      p.x = r.x;
      p.y = r.y;
      ridisegna(id);
      return;
    }
    const tween = gsap.to(p, {
      x: r.x,
      y: r.y,
      duration: 1.1,
      ease: "elastic.out(1, 0.45)",
      onUpdate: () => ridisegna(id),
      onComplete: () => {
        molle.current.delete(tween);
      },
    });
    molle.current.add(tween);
  };


  const su = (e: React.PointerEvent<SVGGElement>) => {
    const pr = presa.current;
    presa.current = null;
    if (!pr) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (pr.mosso) {
      molla(pr.id);
      return;
    }
    onNodo(pr.id);
    if (!capo) setAcceso(pr.id);
  };

  const annulla = () => {
    const pr = presa.current;
    presa.current = null;
    if (pr?.mosso) molla(pr.id);
  };

  // Rimesso tutto al suo posto quando il movimento si spegne a meta' presa.
  useEffect(() => {
    if (pieno) return;
    for (const [id, r] of riposo) {
      const p = posizioni.current.get(id)!;
      if (p.x === r.x && p.y === r.y) continue;
      p.x = r.x;
      p.y = r.y;
      ridisegna(id);
    }
  }, [pieno]);

  /* La strada fino al cartellino, e i vicini: solo senza un capo scelto,
     perche' con un capo la mappa racconta gia' un'altra cosa. */
  const luce = !capo && acceso ? acceso : null;
  const stradaAccesa = luce ? strada(luce) : [];
  const nodiAccesi = new Set(luce ? [...stradaAccesa, ...vicini(luce)] : []);
  const filoAcceso = (f: Filo) =>
    !!luce &&
    (f.a === luce ||
      f.b === luce ||
      (stradaAccesa.includes(f.a) &&
        stradaAccesa.includes(f.b) &&
        (padre(f.b) === f.a || padre(f.a) === f.b)));

  const tappaDi = new Map(percorso.map((id, i) => [id, i]));
  const zoneUsate = new Set(
    capo ? capo.usa.map((id) => attrezzo(id)!.zona) : [],
  );
  const scelto = passo.tipo === "nodo" ? passo.id : null;

  return (
    <div data-cassetta-mappa>
      <div ref={banco} data-cassetta-banco>
        <svg
          ref={svg}
          viewBox={`0 0 ${LARGO} ${ALTO}`}
          aria-hidden="true"
          focusable="false"
          data-stato={capo ? "scelta" : luce ? "spento" : undefined}
          data-entrata={entrata ?? undefined}
        >
          <defs>
            <pattern
              id={`${idMaschera}-righe`}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <path d="M0 0 V8" data-trama />
            </pattern>
            <pattern
              id={`${idMaschera}-punti`}
              width="9"
              height="9"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="4.5" cy="4.5" r="0.9" data-trama-punto />
            </pattern>
            <pattern
              id={`${idMaschera}-quadretti`}
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 0 H12 M0 0 V12" data-trama />
            </pattern>
            <mask
              id={`${idMaschera}-cucito`}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width={LARGO}
              height={ALTO}
            >
              <path
                ref={mascheraRef}
                d={disegnoCucitura.d}
                fill="none"
                stroke="white"
                strokeWidth="8"
              />
            </mask>
          </defs>

          <g>
            {ZONE.map((z) => {
              const [x, y, w, h] = z.r;
              return (
                <g
                  key={z.id}
                  data-pezza
                  data-zona={z.id}
                  data-usata={zoneUsate.has(z.id) || undefined}
                >
                  <rect x={x} y={y} width={w} height={h} rx="10" data-stoffa />
                  {TRAMA[z.id] && (
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx="10"
                      data-trama-fondo
                      fill={`url(#${idMaschera}-${TRAMA[z.id]})`}
                    />
                  )}
                  <rect
                    x={x + 6}
                    y={y + 6}
                    width={w - 12}
                    height={h - 12}
                    rx="7"
                    data-orlo
                  />
                  <text
                    x={x + w - 14}
                    y={y + h - 13}
                    textAnchor="end"
                    data-conta
                  >
                    {testi.zone[z.id].conta}
                  </text>
                </g>
              );
            })}
          </g>

          <g>
            {FILI.map((f, i) => (
              <path
                key={`${f.a}-${f.b}`}
                ref={(el) => {
                  tracciati.current[i] = el;
                }}
                d={curva(riposo.get(f.a)!, riposo.get(f.b)!)}
                data-filo={f.incrocio ? "incrocio" : "ramo"}
                data-acceso={filoAcceso(f) || undefined}
              />
            ))}
          </g>

          {capo && (
            <path
              ref={cucituraRef}
              d={disegnoCucitura.d}
              data-cucitura
              mask={`url(#${idMaschera}-cucito)`}
            />
          )}

          <g>
            {NODI.map((n) => {
              const testo =
                n.tipo === "radice"
                  ? testi.radice.nome
                  : n.tipo === "snodo"
                    ? testi.zone[n.zona!].snodo
                    : attrezzo(n.id)!.nome;
              const w = larghezza(n.tipo, testo);
              const h = altezza(n.tipo);
              const genitore = riposo.get(padre(n.id) ?? n.id)!;
              const passo = tappaDi.get(n.id);
              return (
                <g
                  key={n.id}
                  ref={(el) => {
                    if (el) gruppi.current.set(n.id, el);
                    else gruppi.current.delete(n.id);
                  }}
                  transform={`translate(${n.x} ${n.y})`}
                  data-nodo={n.tipo}
                  data-zona={n.zona ?? undefined}
                  data-acceso={nodiAccesi.has(n.id) || undefined}
                  data-scelto={(!capo && scelto === n.id) || undefined}
                  data-cucito={
                    (passo !== undefined && passo < cuciti) || undefined
                  }
                  onPointerEnter={() => {
                    if (!presa.current) setAcceso(n.id);
                  }}
                  onPointerLeave={() => {
                    if (!presa.current) setAcceso(null);
                  }}
                  onPointerDown={giu(n.id)}
                  onPointerMove={muovi}
                  onPointerUp={su}
                  onPointerCancel={annulla}
                >
                  <g
                    data-corpo
                    style={
                      {
                        "--dx": `${genitore.x - n.x}px`,
                        "--dy": `${genitore.y - n.y}px`,
                        "--i": ENTRATA.get(n.id) ?? 0,
                      } as React.CSSProperties
                    }
                  >
                    <rect
                      x={-w / 2}
                      y={-h / 2}
                      width={w}
                      height={h}
                      rx={n.tipo === "snodo" ? 13 : 3}
                      data-fondo
                    />
                    <rect
                      x={-w / 2 + 3}
                      y={-h / 2 + 3}
                      width={w - 6}
                      height={h - 6}
                      rx={n.tipo === "snodo" ? 10 : 2}
                      data-punti
                    />
                    <text y={n.tipo === "radice" ? 5 : 4} textAnchor="middle">
                      {testo}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          <g ref={agoRef} data-ago style={{ opacity: 0 }}>
            <path d="M-2 -22 L2 -22 L1.2 14 L0 20 L-1.2 14 Z" />
            <ellipse cx="0" cy="-16" rx="0.9" ry="3" />
          </g>
        </svg>
      </div>

      <div data-cassetta-colonna>
        <aside
          data-cassetta-pannello
          aria-live="polite"
          aria-label={testi.etichetta.nome}
        >
          <Etichetta
            key={`${passo.tipo}-${passo.id}`}
            passo={passo}
            testi={testi}
            onNodo={onNodo}
            onCapo={onCapo}
            azioni={azioni}
          />
        </aside>
      </div>
    </div>
  );
}

/** La trama di ogni pezza: pieni e vuoti, righe, punti, quadretti. Il colore lo decide il CSS. */
const TRAMA: Record<string, string | null> = {
  front: null,
  stili: "punti",
  mezzo: null,
  back: null,
  auth: "righe",
  dati: "righe",
  casa: "quadretti",
  ovunque: null,
  ai: "quadretti",
};
