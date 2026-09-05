import { gsap, ScrollTrigger } from "@/animations/gsap";
import { curva, strada, type Coda, type Misura, type Mondo, type Punto } from "./strada";
import { LARGO, PARAM } from "./param";

/** Dove sta l'impaginato adesso: e' quello che `misura()` restituisce. */
export type Impaginato = { misure: Misura[]; coda: Coda; mondo: Mondo };

/** Gli elementi su cui il gesto scrive. Nessuno di questi e' React: questo
 *  modulo e' DOM e numeri, ed e' per quello che sta fuori dal componente. */
export type Elementi = {
  /** L'SVG invisibile che ospita il tracciato, e i path usa e getta. */
  stradaEl: SVGSVGElement;
  /** Il tracciato: e' su di lui che si chiama getPointAtLength. */
  gpath: SVGPathElement;
  /** La freccia. Il ciclo le scrive left, top, --a e --s. */
  fre: HTMLElement;
  /** Le quattro voci: la piu' vicina prende data-attiva. */
  voci: HTMLElement[];
  /** La scena, cioe' il trigger dello scorrimento. */
  trigger: Element | null;
};

/** La strada come sta adesso. Non e' un pezzo del gesto — al ciclo non serve
 *  leggerla, la tiene lui — ma senza di questa chi la disegna dovrebbe
 *  ricostruirla per conto suo, e disegnerebbe una strada diversa da quella che
 *  la freccia percorre. */
export type Lettura = {
  punti: readonly Punto[];
  nomi: readonly string[];
  indiciDisegno: readonly number[];
  mondo: Mondo;
};

/**
 * Il manico del gesto. Prima di qui `guidaFreccia` restituiva la sola `molla`,
 * ed e' ancora l'unica cosa che la pagina usa: le altre due servono a chi la
 * strada la vuole vedere e rifare mentre gira, cioe' al calibratore. Il
 * calibratore lo conosce questo modulo; questo modulo non conosce lui — e non
 * deve, o in produzione resterebbe il suo buco.
 */
export type Guida = {
  /** Spegne il gesto e ripulisce quello che ha scritto. */
  molla: () => void;
  /** Rifa' la strada da `PARAM`, adesso. Il ciclo la rifa' da solo quando si
   *  muove l'impaginato, ma non sa che qualcuno gli ha cambiato le manopole
   *  sotto: l'impaginato e' identico e la firma non cambia. */
  ricostruisci: () => void;
  /** La strada dell'ultima costruzione, o `null` se non ce n'e' ancora una. */
  leggi: () => Lettura | null;
};

/**
 * Il gesto della freccia: costruisce la strada, la segue, e restituisce il modo
 * di spegnerla. Vive qui e non dentro `Practice.tsx` per tre ragioni: non c'e'
 * dentro una riga di React, nessuna prova puo' raggiungerlo — `getPointAtLength`
 * non esiste in jsdom — e la sola difesa che ha e' che qualcuno lo rilegga
 * contro il prototipo. Sepolto in fondo a un componente, quella rilettura non
 * la fa nessuno.
 */
export function guidaFreccia(elementi: Elementi, misura: () => Impaginato | null): Guida {
  const { stradaEl, gpath, fre, voci, trigger } = elementi;

  const largo = window.matchMedia(LARGO).matches;
  let L = 0;
  let Limg: number[] = [];
  let Lcoda = 0;
  let firmaCorrente = "";
  let ultima: Lettura | null = null;

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
    ultima = { punti: s.punti, nomi: s.nomi, indiciDisegno: s.indiciDisegno, mondo: m.mondo };
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
    // Ci si stacca, non si torna soltanto: `vivo` resterebbe vero e il ciclo
    // continuerebbe a fare un getBoundingClientRect per fotogramma senza
    // scrivere niente. Il ScrollTrigger lo riattacca al primo aggiornamento,
    // quindi non si perde nulla — ed e' quello che fa gia' il ramo `!L` qui
    // sotto.
    if (!m) {
      dormi();
      return;
    }
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
  // Un primo passo SINCRONO. Fino al primo rAF del ticker la freccia e' gia'
  // display:block a left:0; top:0 con translate(-50%,-50%): mezza fuori
  // dall'angolo in alto a sinistra della scena e a rotazione zero. Se quel
  // fotogramma si veda o no dipende da dove cade il commit di React rispetto
  // al rAF di gsap; questa chiamata lo decide.
  passo();
  const st = ScrollTrigger.create({
    trigger,
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

  const molla = () => {
    dormi();
    st.kill();
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

  return {
    molla,
    // `sveglia()` e non il solo `costruisci()`: girata una manopola la freccia
    // e' quasi sempre gia' addormentata — si stacca appena arrivata — e la
    // strada nuova resterebbe sotto una freccia ferma su quella vecchia.
    ricostruisci: () => {
      costruisci();
      sveglia();
    },
    leggi: () => ultima,
  };
}
