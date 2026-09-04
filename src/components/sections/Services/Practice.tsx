"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { practiceScenes } from "@/content/practice";
import { weave } from "@/animations/presets";
import { useMotionLevel, type MotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { gsap, ScrollTrigger } from "@/animations/gsap";
import {
  curva,
  filo,
  strada,
  type Coda,
  type Misura,
  type Mondo,
  type Punto,
} from "./pratica/strada";
import { LARGO, PARAM } from "./pratica/param";
import { PracticeBlock } from "./PracticeBlock";
import type { ServiceItem } from "./ServicesView";

/**
 * La seconda scena della sezione del tavolo. Il tavolo e' lo spettacolo, questa
 * e' la sostanza — e conserva la risposta 1:1 alle quattro frasi di «Cosa stai
 * cercando?», nel loro ordine.
 *
 * `data-motion` porta il livello risolto fino al CSS, che e' l'unico posto in
 * cui il movimento esiste: a "full" le voci non attive sbiadiscono e la scena
 * si accende; a "reduced" e a "none" non si applica una riga e restano quattro
 * voci ferme e leggibili. useMotionLevel dice "none" in SSR e al primo render,
 * quindi ferma e completa e' anche quello che si vede senza JavaScript.
 */
export function Practice({
  practice,
  intro,
  items,
}: {
  practice: string;
  intro: string;
  items: ServiceItem[];
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const level = useMotionLevel();
  const filoRef = useRef<SVGSVGElement | null>(null);
  // Il tracciato della freccia e la freccia stessa. Vivono solo a "full", ma i
  // ref si dichiarano sempre: un ref e' un contenitore vuoto, non un'animazione.
  const stradaRef = useRef<SVGSVGElement | null>(null);
  const frecciaRef = useRef<HTMLDivElement | null>(null);
  // La tessitura viva, se c'e'. Vive fuori dal gsap.context di useSectionAnimation
  // — la costruisce anche disegna(), che gsap.context non vede — quindi il
  // revert automatico non la raccoglie: deve passare da questo ref e da
  // spegni(), come cavo.current in DeskCables.
  const tessitura = useRef<gsap.core.Timeline | null>(null);

  /**
   * Dove stanno DAVVERO i disegni, adesso. Nel prototipo si misuravano una
   * volta sola alla costruzione, e il resto girava su quei numeri: ma i
   * caratteri arrivano dopo, il testo si riflow, i blocchi si spostano di
   * centinaia di pixel, e la scena resta quella di un impaginato che non
   * esiste piu'. E' per questo che alla seconda voce la freccia arrivava
   * altrove: non sbagliava mira, aveva il bersaglio alle coordinate sbagliate.
   */
  const misura = useCallback((): { misure: Misura[]; coda: Coda; mondo: Mondo } | null => {
    const el = scope.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const arti = [...el.querySelectorAll<HTMLElement>("[data-practice-art]")];
    if (arti.length !== practiceScenes.length) return null;
    const misure: Misura[] = arti.map((art, i) => {
      const b = art.getBoundingClientRect();
      return {
        cx: b.left + b.width / 2 - r.left,
        cy: b.top + b.height / 2 - r.top,
        h: b.height,
        lato: practiceScenes[i].lato,
      };
    });
    const codaEl = el.querySelector<HTMLElement>("[data-pratica-coda]");
    return {
      misure,
      coda: { top: codaEl?.offsetTop ?? el.offsetHeight, h: codaEl?.offsetHeight ?? 0 },
      mondo: { w: r.width, h: el.offsetHeight },
    };
  }, []);

  /**
   * Toglie il tratteggio inline e ferma la tessitura viva. Serve, e per la
   * stessa ragione di DeskCables: `weave` scrive dasharray e dashoffset al
   * momento della build, cioe' filo invisibile, ed e' lo scrub che poi lo
   * disegna. Chi arriva a "full" e poi accende la riduzione del movimento va
   * a "none", dove `weave` non riparte piu': il tratto resterebbe invisibile
   * per sempre, e il fotogramma a riposo — quello il cui patto e' che il filo
   * sia continuo — sarebbe un filo tagliato.
   *
   * Il trigger va ucciso PRIMA della timeline, e per la stessa ragione di
   * DeskCables.spegni(): finche' e' vivo il ScrollTrigger riscrive lo
   * stroke-dashoffset a ogni giro di rotellina, quindi ucciderlo dopo la
   * timeline lo lascerebbe libero di riscrivere un valore su una timeline
   * gia' morta.
   */
  const spegni = useCallback(() => {
    tessitura.current?.scrollTrigger?.kill();
    tessitura.current?.kill();
    tessitura.current = null;
    const tratto = filoRef.current?.querySelector("path");
    tratto?.style.removeProperty("stroke-dasharray");
    tratto?.style.removeProperty("stroke-dashoffset");
  }, []);

  /**
   * Ricostruisce la tessitura sul `d` ATTUALE del filo. Serve perche' questo
   * tratto e' diverso dagli altri sei segmenti: quelli vivono in un
   * viewBox 0-100 con preserveAspectRatio="none", quindi le loro coordinate
   * sono percentuali e la lunghezza del tratto in unita' di viewBox non
   * cambia mai. Questo filo scrive un `d` in PIXEL e lo ricalcola a ogni
   * riflow (vedi disegna(), sotto): se dopo un riflow non si richiamasse
   * weave(), il dasharray/dashoffset resterebbero tarati sulla lunghezza
   * vecchia mentre il path e' gia' un altro, e lo scrub finirebbe con uno
   * strappo o un buco invece di disegnare il tratto per intero.
   */
  const tessi = useCallback(
    (livello: MotionLevel) => {
      spegni();
      const tratto = filoRef.current?.querySelector("path");
      if (!tratto) return;
      tessitura.current = weave([tratto], { level: livello, trigger: scope.current, scrub: true });
    },
    [spegni],
  );

  /**
   * Il filo si disegna a OGNI livello di movimento: a "reduced" e a "none" e'
   * intero e fermo, ed e' giusto cosi' — quello che non parte e' lo scrub.
   * useLayoutEffect e non useEffect: passivo, il browser dipingerebbe prima un
   * fotogramma con il path vuoto, cioe' una sezione senza filo.
   *
   * I tre momenti in cui l'impaginato cambia senza che nessuno tocchi la
   * rotellina, e nessuno dei tre e' il primo render: i caratteri che finiscono
   * di caricare, la finestra che cambia misura, e qualunque cosa faccia
   * cambiare altezza alla scena. Ognuno di questi puo' cambiare il `d`, quindi
   * ognuno richiama tessi(): vedi il suo commento per il perche'.
   */
  useLayoutEffect(() => {
    const disegna = () => {
      const m = misura();
      const tratto = filoRef.current?.querySelector("path");
      if (!m || !tratto || !filoRef.current) return;
      filoRef.current.setAttribute("viewBox", `0 0 ${m.mondo.w} ${m.mondo.h}`);
      tratto.setAttribute("d", curva(filo(m.misure, m.coda, m.mondo)));
      tessi(level);
    };
    disegna();
    void document.fonts?.ready?.then(disegna);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(disegna) : null;
    if (ro && scope.current) ro.observe(scope.current);
    window.addEventListener("resize", disegna);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", disegna);
    };
  }, [misura, level, tessi]);

  // A ogni cambio di livello, non solo all'uscita da "full": useGSAP con delle
  // dipendenze rimanda il revert allo smontaggio, non al cambio di livello.
  // spegni() qui e spegni() come cleanup di useSectionAnimation qui sotto
  // finiscono per girare due volte sullo stesso cambio di livello: e'
  // innocuo, removeProperty e uccidere una timeline gia' morta sono entrambi
  // idempotenti, e non va "semplificato" a una sola chiamata.
  useLayoutEffect(() => spegni, [level, spegni]);

  useSectionAnimation((livello) => {
    // Il filo si tesse a OGNI livello sopra "none": e' il tratto della pagina,
    // non il gesto. La freccia invece esiste solo a "full", ed e' per questo
    // che tessi() sta prima dell'uscita anticipata qui sotto e spegni() e' il
    // cleanup anche quando la freccia non nasce.
    tessi(livello);

    const stradaEl = stradaRef.current;
    const gpath = stradaEl?.querySelector("path");
    const fre = frecciaRef.current;
    if (livello !== "full" || !stradaEl || !gpath || !fre) return spegni;

    const largo = window.matchMedia(LARGO).matches;
    let L = 0;
    let Limg: number[] = [];
    let Lcoda = 0;
    let firmaCorrente = "";

    /** La firma dell'impaginato: se cambia, la strada va rifatta. Costa cinque
     *  getBoundingClientRect, cioe' niente, e rende il tracciato autoriparante
     *  invece che dipendente dal momento in cui e' stato costruito. */
    const firma = (m: NonNullable<ReturnType<typeof misura>>) =>
      `${Math.round(m.mondo.w)}x${Math.round(m.mondo.h)}|` +
      m.misure.map((g) => `${Math.round(g.cx)},${Math.round(g.cy)}`).join(";");

    /** La lunghezza d'arco fino a un punto. Si misura su un path vero e usa e
     *  getta: e' l'unico modo di sapere DOVE su questa curva sta un punto. */
    const lungFinoA = (punti: readonly Punto[], fin: number) => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "path");
      t.setAttribute("d", curva(punti.slice(0, fin + 1)));
      stradaEl.appendChild(t);
      const l = t.getTotalLength();
      stradaEl.removeChild(t);
      return l;
    };

    const costruisci = () => {
      const m = misura();
      if (!m) return;
      const s = strada(m.misure, m.coda, m.mondo, PARAM, largo);
      stradaEl.setAttribute("viewBox", `0 0 ${m.mondo.w} ${m.mondo.h}`);
      gpath.setAttribute("d", curva(s.punti));
      L = gpath.getTotalLength();
      Limg = s.indiciDisegno.map((i) => lungFinoA(s.punti, i));
      Lcoda = lungFinoA(s.punti, s.indiceCoda);
      firmaCorrente = firma(m);
    };

    /** Lo smoothstep del prototipo: 0 e 1 con le tangenti piatte, cioe' una
     *  transizione che parte e arriva senza spigolo. */
    const lisci = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
    /** Una differenza di angoli riportata nel giro piu' vicino, in [-180, 180].
     *  E' quello che fa dell'angolo un numero continuo invece che un punto sul
     *  cerchio: senza, fra 179 e -179 ci sarebbe un salto di 358 gradi. */
    const giro = (d: number) => {
      let v = d;
      while (v > 180) v -= 360;
      while (v < -180) v += 360;
      return v;
    };

    const voci = [...(scope.current?.querySelectorAll<HTMLElement>("[data-practice-item]") ?? [])];

    let p = 0;
    let curL: number | null = null;
    let curA: number | null = null;
    let vivo = false;

    // Il corpo e' il porto di `passo()` del prototipo —
    // docs/prototipi/2026-09-05-pratica-filo.html, righe 803-904 — con tre
    // differenze: `p` arriva dal ScrollTrigger invece che da un
    // getBoundingClientRect a mano, `misura()` sostituisce `misuraImgs()`, e i
    // nomi delle costanti sono quelli di `strada.ts`.
    const passo = () => {
      // 1. Si rimisura a ogni fotogramma, e se l'impaginato si e' mosso la
      //    strada si rifa': i caratteri arrivano dopo il primo render, il testo
      //    si riflow, e una strada costruita una volta sola punterebbe a
      //    coordinate che non esistono piu'. E' l'autoriparazione.
      const m = misura();
      if (!m) return;
      if (firma(m) !== firmaCorrente) costruisci();
      const imgs = m.misure;
      const N = imgs.length;
      const W = m.mondo.w;
      if (!L || N === 0) {
        dormi();
        return;
      }

      // 2. La progressione arriva dal ScrollTrigger.
      // 3. e si mappa sulla strada in modo LINEARE in lunghezza d'arco.
      //    Nessuno smoothstep per segmento: c'era, e faceva fermare la freccia
      //    su ogni nodo per poi ripartire — erano quelli gli scatti. La vita
      //    gliela danno l'inerzia e la forma della strada, non
      //    un'accelerazione a ogni punto.
      const u = Math.max(0, (p - PARAM.ritardo) / (1 - PARAM.ritardo));
      const miraL = Math.max(0.5, Math.min(L - 0.5, u * L));
      // 4. La posizione insegue la mira con inerzia.
      const posL = curL === null ? miraL : curL + (miraL - curL) * PARAM.inerziaPos;
      curL = posL;

      const pt = gpath.getPointAtLength(posL);
      const q = gpath.getPointAtLength(Math.min(L, posL + 3));
      const tm = Math.hypot(q.x - pt.x, q.y - pt.y) || 1;
      const tx = (q.x - pt.x) / tm;
      const ty = (q.y - pt.y) / tm;
      const tang = (Math.atan2(ty, tx) * 180) / Math.PI;

      // 5. L'ANGOLO NON VIENE DALLA TANGENTE. Veniva da li', ed e' per questo
      //    che la freccia girava quando girava la strada invece che quando
      //    aveva senso girare. Punta il disegno a cui sta andando, e per un
      //    tratto ancora quello appena passato.
      let i = 0;
      while (i < N - 1 && posL > Limg[i + 1]) i++;
      const j = Math.min(N - 1, i + 1);
      const angoloA = (k: number) => {
        const dx = imgs[k].cx - pt.x;
        const dy = imgs[k].cy - pt.y;
        return Math.hypot(dx, dy) < 70 ? null : (Math.atan2(dy, dx) * 180) / Math.PI;
      };
      // 7. La virata e' CENTRATA sul disegno e larga: comincia molto prima di
      //    arrivarci e finisce molto dopo averlo passato, quindi meta' si vede
      //    da una parte e meta' dall'altra, e nel mezzo la freccia e' nascosta
      //    dietro l'immagine.
      const prima = i > 0 ? Limg[i - 1] : 0;
      const dopo = Limg[j];
      const inizio = Limg[i] - (Limg[i] - prima) * PARAM.virata;
      const fine = Limg[i] + (dopo - Limg[i]) * PARAM.virata;
      const w = fine <= inizio ? 1 : lisci((posL - inizio) / (fine - inizio));
      const aA = angoloA(i);
      const aB = angoloA(j);
      // 6. Fra i due si interpolano ANGOLI con srotolamento, non vettori: due
      //    versori quasi opposti — ed e' sempre il caso dietro un'immagine,
      //    perche' la successiva sta dall'altra parte — fusi passano per lo
      //    zero, e li' la direzione non esiste e la freccia frusta.
      let aim = aA !== null && aB !== null ? aA + giro(aB - aA) * w : (aA ?? aB ?? tang);

      // 8. Vicino a un disegno lo INDICA, in mezzo segue la strada: pesatura
      //    gaussiana sul raggio di mira. E' la stessa distinzione che fa la
      //    mano: si punta quando si e' arrivati, si disegna mentre si va.
      const scala0 = Math.max(120, W * PARAM.raggioMira);
      let best0 = 1e9;
      for (const g of imgs) {
        const d = Math.hypot(g.cx - pt.x, g.cy - pt.y);
        if (d < best0) best0 = d;
      }
      const wPunta = Math.exp(-Math.pow(best0 / scala0, 2));
      aim = tang + giro(aim - tang) * wPunta;

      // 9. Nella coda comanda la strada — il 180 largo lo disegna la curva — e
      //    negli ultimi tratti si forza il basso, perche' deve finire allineata
      //    al filo.
      const inCoda = lisci((posL - Lcoda) / Math.max(1, (L - Lcoda) * 0.3));
      if (inCoda > 0) {
        const giu = 90;
        const quasiFine = lisci(
          (posL - Lcoda - (L - Lcoda) * 0.72) / Math.max(1, (L - Lcoda) * 0.28),
        );
        aim += giro(tang - aim) * inCoda;
        aim += giro(giu - aim) * quasiFine;
      }

      // 10. L'angolo vive come numero CONTINUO: si porta la mira nel giro piu'
      //     vicino a dove siamo e ci si arriva piano, e gradiMax e' il tetto per
      //     fotogramma che impedisce le frustate.
      const prec = curA === null ? aim : curA;
      const dd = giro(aim - prec);
      let delta = dd * PARAM.inerziaDir;
      if (delta > PARAM.gradiMax) delta = PARAM.gradiMax;
      else if (delta < -PARAM.gradiMax) delta = -PARAM.gradiMax;
      const ang = prec + delta;
      curA = ang;

      // 11. L'asta si allunga arrivando, e la voce piu' vicina si accende.
      const scala = Math.max(190, W * 0.24);
      let vicino = -1;
      let best = 1e9;
      imgs.forEach((g, k) => {
        const d = Math.hypot(g.cx - pt.x, g.cy - pt.y);
        if (d < best) {
          best = d;
          vicino = k;
        }
      });
      const pr = Math.exp(-Math.pow(best / scala, 2));

      fre.style.left = `${pt.x.toFixed(1)}px`;
      fre.style.top = `${pt.y.toFixed(1)}px`;
      fre.style.setProperty("--a", `${ang.toFixed(1)}deg`);
      fre.style.setProperty("--s", (PARAM.lungBase + PARAM.lungPunta * pr).toFixed(3));
      voci.forEach((el, k) => el.toggleAttribute("data-attiva", k === vicino && pr > 0.42));

      // 12. Si stacca quando e' arrivata — in posizione E in direzione: fermarsi
      //     sulla sola posizione lascerebbe la virata a meta'. Il ScrollTrigger
      //     lo riattacca al primo aggiornamento.
      if (Math.abs(miraL - posL) < 0.3 && Math.abs(dd) < 0.15) dormi();
    };
    const sveglia = () => {
      if (vivo) return;
      vivo = true;
      gsap.ticker.add(passo);
    };
    const dormi = () => {
      vivo = false;
      gsap.ticker.remove(passo);
    };

    costruisci();
    const st = ScrollTrigger.create({
      trigger: scope.current,
      start: "top 46%",
      end: "bottom 46%",
      onUpdate: (self) => {
        p = self.progress;
        sveglia();
      },
      onRefresh: (self) => {
        costruisci();
        p = self.progress;
        sveglia();
      },
    });
    sveglia();

    return () => {
      dormi();
      st.kill();
      spegni();
      // Le property inline della freccia nessun altro le toglierebbe: restassero
      // appiccicate all'ultimo valore scritto da un ciclo che non c'e' piu', la
      // freccia resterebbe ferma a meta' strada e storta. E' lo stesso
      // ragionamento di DeskStage.spegni() con --p e --s.
      fre.style.removeProperty("left");
      fre.style.removeProperty("top");
      fre.style.removeProperty("--a");
      fre.style.removeProperty("--s");
      for (const li of voci) li.removeAttribute("data-attiva");
    };
  }, scope);

  return (
    <div ref={scope} data-pratica data-motion={level}>
      <h3>{practice}</h3>
      <p data-pratica-intro>{intro}</p>

      {/* Il filo di pagina, che qui serpeggia. Non e' un <ThreadSegment>:
          quello disegna una cubica dall'ancoraggio d'entrata a quello d'uscita,
          e qui serve una serpentina misurata sui disegni. Stesso `weave` e
          stesso non-scaling-stroke di tutti gli altri sei tratti: il giorno in
          cui si aggiusta il tratteggio, si aggiusta in un posto solo.
          Il `d` e il viewBox li scrive l'effetto qui sotto, quando ha misurato. */}
      <svg ref={filoRef} data-pratica-filo aria-hidden="true" preserveAspectRatio="none">
        <path
          d=""
          fill="none"
          stroke="var(--line)"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* La strada che la freccia percorre. Invisibile: e' il tracciato, non il
          disegno. Niente display:none — romperebbe getPointAtLength. */}
      <svg ref={stradaRef} data-pratica-strada aria-hidden="true" preserveAspectRatio="none">
        <path d="" fill="none" stroke="none" />
      </svg>

      {/* La freccia. L'asta si allunga, la punta no: una freccia lunga il
          doppio non ha la testa grande il doppio. */}
      <div ref={frecciaRef} data-pratica-freccia aria-hidden="true">
        <svg viewBox="0 0 40 40" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
          <g data-asta>
            <path d="M0 20 Q18.72 17.96 40 20" />
          </g>
          <g data-punta>
            <path d="M26 10 Q33.07 15.07 40 20" />
            <path d="M26 30 Q33.76 25.29 40 20" />
          </g>
        </svg>
      </div>

      <ol data-practice>
        {items.map((item, index) => (
          <PracticeBlock
            key={item.id}
            item={item}
            index={index}
            // L'ordine e' garantito da una prova sul contenuto: i quattro
            // blocchi corrispondono, in ordine, ai quattro servizi.
            scene={practiceScenes[index]}
          />
        ))}
      </ol>

      {/* Lo spazio in cui la freccia fara' il suo 180 prima di consegnare il
          filo ai Lavori. E' vuoto apposta: e' respiro, non un blocco mancante.
          Serve gia' adesso perche' la strada lo misura (Task 5 e 6). */}
      <div data-pratica-coda aria-hidden="true" />
    </div>
  );
}
