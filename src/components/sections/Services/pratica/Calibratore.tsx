"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { LARGO, PARAM, type Param } from "./param";
import type { Guida } from "./freccia";

/**
 * Il calibratore: uno slider per manopola, la strada che si vede, i suoi punti
 * che si trascinano, e in fondo l'oggetto da incollare in `param.ts`.
 *
 * NON ESISTE IN PRODUZIONE. Chi lo monta e' `Practice.tsx`, dietro un
 * `import()` chiuso in un ramo su `NODE_ENV` — in produzione e' il ramo di un
 * `if (false)`, che il bundler non attraversa e di cui non emette il pezzo — e
 * solo se l'indirizzo porta `?calibra`. Per questo tutto quello che riguarda
 * il pannello sta QUI dentro, il suo foglio di stile compreso: messo in
 * `tokens.css` viaggerebbe fino agli utenti, che non hanno niente da tarare.
 *
 * La direzione della dipendenza e' una sola: il pannello conosce `freccia.ts`,
 * `freccia.ts` non conosce lui. Il pannello gira le manopole mutando `PARAM` —
 * lo stesso oggetto che il ciclo legge a ogni fotogramma, quindi la modifica e'
 * gia' viva — e poi chiede `ricostruisci()` alla guida, perche' la strada la
 * rifa' lei e non deve rifarla nessun altro: una strada disegnata due volte da
 * due posti sarebbe due strade diverse.
 *
 * Porto di `docs/prototipi/2026-09-05-pratica-filo.html`, righe 960-1080.
 */
export type CalibratoreProps = {
  /** Il manico del gesto. E' un ref e non un valore: la guida nasce e muore
   *  col livello di movimento, e il pannello deve leggerla come sta adesso. */
  guida: RefObject<Guida | null>;
  /** L'SVG del tracciato: e' li' che si accendono i pallini. */
  strada: RefObject<SVGSVGElement | null>;
};

/** I valori di partenza, presi prima che qualcuno tocchi qualcosa: e' contro
 *  questi che si segna quali manopole sono state girate. Il modulo si carica
 *  una volta sola e nessun altro scrive in `PARAM`, quindi la copia e' buona. */
const DEFAULT: Param = structuredClone(PARAM);

/** Una riga del pannello. Sono dati e non JSX apposta: aggiungere una manopola
 *  costa una riga qui, e non un pezzo di markup da tenere allineato. Il
 *  parametro non si indirizza per stringa ma con due funzioni, cosi' il
 *  compilatore vede il campo — e la stessa `leggi` serve sia su `PARAM` che su
 *  `DEFAULT` per sapere se e' stato cambiato. */
type Riga =
  | { t: "gruppo"; e: string }
  | {
      t: "n";
      e: string;
      min: number;
      max: number;
      passo: number;
      dec: number;
      leggi: (p: Param) => number;
      scrivi: (p: Param, v: number) => void;
    };

/**
 * Il pannello, riga per riga. Ogni riga qui e' una manopola che QUALCUNO LEGGE:
 * il gruppo «Il cappio» — interruttore, tre tratti, «dove nel tratto», raggio —
 * stava in cima e non faceva niente, perche' il giro di penna e' stato scartato
 * in brainstorming (spec §7.4) e la geometria che lo disegnava non e' mai stata
 * portata. Quattro manopole morte in cima al pannello sono peggio di nessun
 * pannello: chi tara le gira, non vede cambiare niente, e smette di fidarsi
 * anche di quelle che funzionano. Il calibratore e' la mitigazione dichiarata
 * del rischio §6.1 — deve dire la verita' su cosa comanda.
 */
const SPEC: Riga[] = [
  { t: "gruppo", e: "Il movimento" },
  {
    t: "n",
    e: "inerzia della posizione",
    min: 0.02,
    max: 0.35,
    passo: 0.005,
    dec: 3,
    leggi: (p) => p.inerziaPos,
    scrivi: (p, v) => {
      p.inerziaPos = v;
    },
  },
  {
    t: "n",
    e: "inerzia della direzione",
    min: 0.01,
    max: 0.25,
    passo: 0.005,
    dec: 3,
    leggi: (p) => p.inerziaDir,
    scrivi: (p, v) => {
      p.inerziaDir = v;
    },
  },
  {
    t: "n",
    e: "gradi per fotogramma",
    min: 1,
    max: 20,
    passo: 0.5,
    dec: 1,
    leggi: (p) => p.gradiMax,
    scrivi: (p, v) => {
      p.gradiMax = v;
    },
  },
  { t: "gruppo", e: "La mira" },
  {
    t: "n",
    e: "entro quanto indica",
    min: 0.08,
    max: 0.6,
    passo: 0.01,
    dec: 2,
    leggi: (p) => p.raggioMira,
    scrivi: (p, v) => {
      p.raggioMira = v;
    },
  },
  {
    t: "n",
    e: "ampiezza della virata",
    min: 0.1,
    max: 0.9,
    passo: 0.02,
    dec: 2,
    leggi: (p) => p.virata,
    scrivi: (p, v) => {
      p.virata = v;
    },
  },
  { t: "gruppo", e: "La freccia" },
  {
    t: "n",
    e: "lunghezza a riposo",
    min: 0.4,
    max: 1.6,
    passo: 0.05,
    dec: 2,
    leggi: (p) => p.lungBase,
    scrivi: (p, v) => {
      p.lungBase = v;
    },
  },
  {
    t: "n",
    e: "allungamento sul disegno",
    min: 0,
    max: 2.5,
    passo: 0.05,
    dec: 2,
    leggi: (p) => p.lungPunta,
    scrivi: (p, v) => {
      p.lungPunta = v;
    },
  },
  { t: "gruppo", e: "La partenza" },
  {
    t: "n",
    e: "attesa prima di partire",
    min: 0,
    max: 0.25,
    passo: 0.01,
    dec: 2,
    leggi: (p) => p.ritardo,
    scrivi: (p, v) => {
      p.ritardo = v;
    },
  },
];

const NS = "http://www.w3.org/2000/svg";

/** L'oggetto pronto da incollare al posto di `PARAM` in `param.ts`. Le chiavi
 *  perdono le virgolette dove sono identificatori validi — «coda.giu» le tiene,
 *  perche' senza non compilerebbe — e il resto lo rimette a posto Prettier. */
function daIncollare(p: Param): string {
  const riga = (v: unknown) =>
    JSON.stringify(v)
      .replace(/"([A-Za-z_$][\w$]*)":/g, "$1: ")
      .replace(/":/g, '": ')
      .replace(/,/g, ", ");
  const campi = Object.entries(p).map(([k, v]) => `  ${k}: ${riga(v)},`);
  return `export const PARAM: Param = {\n${campi.join("\n")}\n};`;
}

export function Calibratore({ guida, strada }: CalibratoreProps) {
  const [mostra, setMostra] = useState(false);
  const [chiuso, setChiuso] = useState(false);
  // `PARAM` si muta sul posto — e' l'oggetto che il ciclo legge — quindi React
  // non ha niente da confrontare: questo contatore e' il solo modo che ha di
  // sapere che deve ridisegnare i valori e il riquadro in fondo.
  const [, setGiro] = useState(0);
  const [copiato, setCopiato] = useState(false);
  const chiesto = useRef(0);
  const riquadro = useRef<HTMLTextAreaElement | null>(null);

  /** Rifa' la strada e ridisegna il pannello, al massimo una volta per
   *  fotogramma: un `pointermove` puo' arrivare piu' volte fra due disegni, e
   *  `ricostruisci()` misura sei path veri — non e' gratis. */
  const rifaiPresto = useCallback(() => {
    if (chiesto.current) return;
    chiesto.current = requestAnimationFrame(() => {
      chiesto.current = 0;
      guida.current?.ricostruisci();
      setGiro((g) => g + 1);
    });
  }, [guida]);

  useEffect(() => () => cancelAnimationFrame(chiesto.current), []);

  /**
   * I pallini e il trascinamento. Vivono qui e non in JSX perche' l'SVG della
   * strada non e' roba di React: lo scrive `freccia.ts`, e due padroni sullo
   * stesso nodo finiscono sempre male.
   *
   * I pallini NON si ricreano a ogni ricostruzione della strada: si aggiornano.
   * Ricrearli staccherebbe il pointer capture a meta' trascinamento, e il punto
   * scapperebbe di mano al primo pixel.
   *
   * Il ciclo di rAF c'e' perche' la strada si rifa' anche senza che il pannello
   * lo chieda — arrivano i caratteri, l'impaginato si muove, il ciclo se ne
   * accorge e ricostruisce — e i pallini fermi sulla strada di prima
   * indicherebbero punti che non ci sono piu'. La firma evita di riscrivere
   * quattordici attributi per niente.
   */
  useEffect(() => {
    const svg = strada.current;
    if (!svg) return;
    const pulisci = () => {
      svg.removeAttribute("data-vedi");
      for (const c of svg.querySelectorAll("circle")) c.remove();
    };
    if (!mostra) {
      pulisci();
      return;
    }
    svg.setAttribute("data-vedi", "");

    let firma = "";
    const aggiorna = () => {
      const l = guida.current?.leggi();
      if (!l) return;
      const f =
        l.punti.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(";") +
        `|${Object.keys(PARAM.scostamenti).join(",")}`;
      if (f === firma) return;
      firma = f;
      const vecchi = svg.querySelectorAll("circle");
      for (let k = l.punti.length; k < vecchi.length; k++) vecchi[k].remove();
      l.punti.forEach((p, k) => {
        let c = svg.querySelectorAll("circle")[k];
        if (!c) {
          c = svg.appendChild(document.createElementNS(NS, "circle"));
          c.appendChild(document.createElementNS(NS, "title"));
        }
        const disegno = l.indiciDisegno.includes(k);
        c.setAttribute("cx", p[0].toFixed(1));
        c.setAttribute("cy", p[1].toFixed(1));
        c.setAttribute("r", disegno ? "9" : "6");
        c.setAttribute("data-nome", l.nomi[k]);
        c.toggleAttribute("data-disegno", disegno);
        c.toggleAttribute("data-mosso", !!PARAM.scostamenti[l.nomi[k]]);
        if (c.firstChild) c.firstChild.textContent = l.nomi[k];
      });
    };
    let raf = requestAnimationFrame(function ancora() {
      raf = requestAnimationFrame(ancora);
      aggiorna();
    });

    /**
     * Il punto preso, e la sua BASE: dove la geometria lo metterebbe senza la
     * correzione a mano. Si calcola una volta sola, quando lo si afferra, e non
     * a ogni movimento: fra due fotogrammi possono arrivare due `pointermove`,
     * e il secondo rileggerebbe una strada che la correzione del primo non ce
     * l'ha ancora dentro — la ricostruzione e' rimandata al fotogramma. Ogni
     * movimento riscriverebbe lo scostamento sommandolo a se' stesso, e il
     * punto correrebbe via al doppio della velocita' del dito.
     */
    let preso: { nome: string; W: number; bx: number; by: number; dx: number; dy: number } | null =
      null;
    const giu = (e: PointerEvent) => {
      const c = (e.target as Element | null)?.closest("circle");
      const nome = c?.getAttribute("data-nome");
      const l = guida.current?.leggi();
      if (!c || !nome || !l) return;
      const k = l.nomi.indexOf(nome);
      if (k < 0) return;
      // Sotto i 900px `strada()` gli scostamenti non li applica: li' il punto
      // disegnato E' gia' la base, e quello che si scrive si vedra' solo
      // tornando largo.
      const s = (window.matchMedia(LARGO).matches && PARAM.scostamenti[nome]) || [0, 0];
      const r = svg.getBoundingClientRect();
      preso = {
        nome,
        W: l.mondo.w,
        bx: l.punti[k][0] - s[0] * l.mondo.w,
        by: l.punti[k][1] - s[1] * l.mondo.w,
        dx: e.clientX - r.left - l.punti[k][0],
        dy: e.clientY - r.top - l.punti[k][1],
      };
      c.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const muovi = (e: PointerEvent) => {
      if (!preso) return;
      const r = svg.getBoundingClientRect();
      // Si salva lo SCOSTAMENTO dalla posizione calcolata, non la posizione, e
      // in frazione della larghezza, non in pixel: la strada resta ricavata
      // dall'impaginato — che si muove quando arrivano i caratteri — e un pixel
      // tarato su uno schermo largo 1400 non vuol dire niente su uno da 1100.
      // Il conto e' assoluto — dove sta il dito, non di quanto si e' mosso —
      // quindi due movimenti sullo stesso punto danno lo stesso numero.
      const x = e.clientX - r.left - preso.dx;
      const y = e.clientY - r.top - preso.dy;
      PARAM.scostamenti[preso.nome] = [
        Number(((x - preso.bx) / preso.W).toFixed(4)),
        Number(((y - preso.by) / preso.W).toFixed(4)),
      ];
      rifaiPresto();
    };
    const molla = () => {
      if (!preso) return;
      preso = null;
      rifaiPresto();
    };
    svg.addEventListener("pointerdown", giu);
    svg.addEventListener("pointermove", muovi);
    svg.addEventListener("pointerup", molla);
    svg.addEventListener("pointercancel", molla);
    return () => {
      cancelAnimationFrame(raf);
      svg.removeEventListener("pointerdown", giu);
      svg.removeEventListener("pointermove", muovi);
      svg.removeEventListener("pointerup", molla);
      svg.removeEventListener("pointercancel", molla);
      pulisci();
    };
    // `rifaiPresto` sta in un useCallback su un solo ref, cioe' non cambia mai:
    // se cambiasse, questo effetto si rifarebbe a ogni pixel di trascinamento —
    // e ricreare i pallini a meta' trascinamento e' esattamente il baco che
    // l'aggiornamento qui sopra esiste per non avere.
  }, [mostra, guida, strada, rifaiPresto]);

  const spostati = Object.keys(PARAM.scostamenti).length;
  const testo = daIncollare(PARAM);

  return (
    <div data-calibro data-chiuso={chiuso ? "" : undefined}>
      <style>{STILE}</style>
      <header>
        <b>calibratore</b>
        <button type="button" onClick={() => setChiuso((c) => !c)}>
          {chiuso ? "+" : "–"}
        </button>
      </header>
      <div data-corpo>
        <p data-gruppo>Vedere</p>
        <label>
          <input type="checkbox" checked={mostra} onChange={(e) => setMostra(e.target.checked)} />{" "}
          mostra la strada — i punti si trascinano
        </label>
        <div data-azioni>
          <button
            type="button"
            onClick={() => {
              PARAM.scostamenti = {};
              rifaiPresto();
            }}
          >
            azzera i punti spostati
          </button>
        </div>
        <p data-conta>
          {spostati
            ? `${spostati} punt${spostati === 1 ? "o spostato" : "i spostati"}`
            : "nessun punto spostato"}
        </p>

        {SPEC.map((r, i) => {
          if (r.t === "gruppo")
            return (
              <p data-gruppo key={i}>
                {r.e}
              </p>
            );
          return (
            <label key={i} data-cambiato={r.leggi(PARAM) !== r.leggi(DEFAULT) ? "" : undefined}>
              <span data-et>
                {r.e}
                <span data-val>{r.leggi(PARAM).toFixed(r.dec)}</span>
              </span>
              <input
                type="range"
                min={r.min}
                max={r.max}
                step={r.passo}
                value={r.leggi(PARAM)}
                onChange={(e) => {
                  r.scrivi(PARAM, Number(e.target.value));
                  rifaiPresto();
                }}
              />
            </label>
          );
        })}

        <p data-gruppo>Da incollare nel codice</p>
        <textarea ref={riquadro} readOnly rows={7} value={testo} />
        <div data-azioni>
          <button
            type="button"
            onClick={() => {
              // Si seleziona comunque: fuori da un contesto sicuro
              // `navigator.clipboard` non c'e', e li' resta il cmd+C.
              riquadro.current?.select();
              void navigator.clipboard?.writeText(testo);
              setCopiato(true);
              window.setTimeout(() => setCopiato(false), 1200);
            }}
          >
            {copiato ? "copiato" : "copia"}
          </button>
          <button
            type="button"
            onClick={() => {
              // Si rimettono i campi uno per uno nello STESSO oggetto: il ciclo
              // della freccia tiene il riferimento a `PARAM` da quando e' nato,
              // e sostituirlo con un altro oggetto lo lascerebbe sulle
              // manopole vecchie.
              Object.assign(PARAM, structuredClone(DEFAULT));
              rifaiPresto();
            }}
          >
            ripristina
          </button>
        </div>
      </div>
    </div>
  );
}

/** Lo stile del pannello, e quello della strada quando si chiede di vederla.
 *  Sta qui e non in `tokens.css` perche' questo componente in produzione non
 *  c'e': il suo foglio di stile, li', ci sarebbe. */
const STILE = `
[data-calibro]{position:fixed;right:1rem;bottom:1rem;z-index:60;width:17rem;
 max-height:calc(100vh - 2rem);display:flex;flex-direction:column;
 background:var(--bg);color:var(--fg);border:1px solid color-mix(in oklab,var(--fg) 25%,transparent);
 border-radius:.35rem;font-size:.7rem;line-height:1.35;box-shadow:0 .4rem 1.8rem rgb(0 0 0 / .3)}
[data-calibro] header{display:flex;align-items:center;justify-content:space-between;
 padding:.45rem .5rem .45rem .7rem;border-bottom:1px solid color-mix(in oklab,var(--fg) 15%,transparent)}
[data-calibro] header b{letter-spacing:.12em;text-transform:uppercase;color:var(--accent);font-weight:400}
[data-calibro] header button{background:none;border:0;color:var(--fg-muted);font:inherit;
 font-size:1rem;line-height:1;cursor:pointer;padding:0 .2rem}
[data-calibro] [data-corpo]{overflow-y:auto;padding:.6rem .7rem .7rem}
[data-calibro][data-chiuso] [data-corpo]{display:none}
[data-calibro] [data-gruppo]{margin:.7rem 0 .35rem;letter-spacing:.1em;text-transform:uppercase;
 font-size:.6rem;color:var(--fg-muted)}
[data-calibro] [data-gruppo]:first-child{margin-top:0}
[data-calibro] label{display:block;margin-bottom:.45rem;padding-left:.4rem;
 border-left:2px solid transparent}
[data-calibro] label[data-cambiato]{border-left-color:var(--accent)}
[data-calibro] [data-et]{display:flex;justify-content:space-between;gap:.5rem;color:var(--fg-muted)}
[data-calibro] [data-val]{color:var(--fg);font-variant-numeric:tabular-nums}
[data-calibro] input[type=range]{width:100%;accent-color:var(--accent);margin-top:.1rem}
[data-calibro] input[type=checkbox]{accent-color:var(--accent);vertical-align:-.1em}
[data-calibro] [data-azioni]{display:flex;gap:.25rem;margin-top:.25rem}
[data-calibro] [data-azioni] button{flex:1;font:inherit;
 font-size:.62rem;padding:.22rem 0;cursor:pointer;background:transparent;color:var(--fg-muted);
 border:1px solid color-mix(in oklab,var(--fg) 22%,transparent);border-radius:.2rem}
[data-calibro] [data-tratti] button[data-on]{background:var(--accent);color:var(--bg);border-color:var(--accent)}
[data-calibro] [data-azioni] button:hover,[data-calibro] [data-tratti] button:hover{color:var(--fg)}
[data-calibro] [data-conta]{margin:.35rem 0 0;color:var(--fg-muted);font-size:.62rem}
[data-calibro] textarea{width:100%;font:inherit;font-size:.6rem;resize:vertical;
 background:color-mix(in oklab,var(--fg) 8%,transparent);color:var(--fg);
 border:1px solid color-mix(in oklab,var(--fg) 18%,transparent);border-radius:.2rem;padding:.35rem}

/* La strada, quando si chiede di vederla. E' l'unica cosa che rende la taratura
   non cieca — e i suoi punti si prendono e si spostano. Quando e' visibile sale
   SOPRA i blocchi: un punto che sta sotto al testo non si puo' afferrare. */
[data-pratica-strada][data-vedi]{opacity:1;z-index:40}
[data-pratica-strada][data-vedi] path{stroke:var(--accent);stroke-width:1;stroke-dasharray:5 5;opacity:.5}
[data-pratica-strada] circle{fill:color-mix(in oklab,var(--accent) 55%,transparent);
 stroke:var(--bg);stroke-width:1.5;pointer-events:auto;cursor:grab;touch-action:none}
[data-pratica-strada] circle:hover{fill:var(--accent)}
[data-pratica-strada] circle:active{cursor:grabbing}
/* il pallino grosso e' un disegno; quello col bordo acceso l'hai gia' mosso */
[data-pratica-strada] circle[data-disegno]{fill:color-mix(in oklab,var(--accent) 80%,transparent)}
[data-pratica-strada] circle[data-mosso]{stroke:var(--accent);stroke-width:2.5}
`;
