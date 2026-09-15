"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CORSA_FRECCIA, TESSITURA_LAVORI } from "@/animations/finestre";

/**
 * Il righello della consegna fra la freccia e il filo. `?righelli`, solo in
 * sviluppo, come il calibratore.
 *
 * DUE VERSIONI PRIMA DI QUESTA ERANO COSTRUITE MALE, e vale la pena scriverlo
 * perche' l'errore e' istruttivo. Misuravano MOMENTI nello scorrimento — a che
 * scrollY si apre una finestra, a che scrollY se ne chiude un'altra — mentre la
 * domanda vera era su un PUNTO DELLA PAGINA: dove si appoggia la freccia. Sono
 * due grandezze diverse, e rispondere nell'unita' sbagliata fa sembrare che non
 * ci si capisca quando invece si stanno guardando due cose diverse.
 *
 * Qui ci sono tutte e due, dichiarate per quello che sono:
 *
 *  - PUNTI DI PAGINA (i pallini): dove il tracciato finisce e dove il filo
 *    comincia. Sono posti fissi nel documento, scorrono con il contenuto, e si
 *    possono indicare a dito.
 *  - MOMENTI (il pannello): a che scrollY le due finestre si aprono e si
 *    chiudono. Sono quelli che decidono l'ordine in cui le cose succedono.
 *
 * E un terzo pallino lo metti tu: CLICCA dove vedi la freccia appoggiarsi. Se
 * il tuo pallino e quello arancione non coincidono, l'errore e' nel punto che
 * il codice crede sia la fine della corsa, e non nelle finestre. Se coincidono,
 * l'errore e' nelle finestre. Un clic separa i due casi, che due versioni di
 * strumento non erano riuscite a separare.
 *
 * NON tocca niente: legge il DOM. Uno strumento che perturba quello che misura
 * e' peggio di nessuno strumento.
 */

const frazione = (s: string) => Number.parseFloat(s.split(" ")[1]) / 100;

const F_FRECCIA = frazione(CORSA_FRECCIA.fine);
const F_FILO = frazione(TESSITURA_LAVORI.inizio);
const F_CHIUDE_FILO = frazione(TESSITURA_LAVORI.fine);

type Stato = {
  scroll: number;
  /** Punto di pagina in cui finisce la strada: dove la freccia si appoggia. */
  fineStrada: number | null;
  /** Punto di pagina in cui comincia il tratto del filo dei Lavori. */
  inizioFilo: number | null;
  /** Dove sta la punta della freccia adesso, in pagina. */
  punta: number | null;
  /** scrollY a cui si chiude la finestra della freccia. */
  chiudeFreccia: number | null;
  /** scrollY a cui si apre la finestra del filo. */
  apreFilo: number | null;
  /** scrollY a cui si CHIUDE la finestra del filo. */
  chiudeFilo: number | null;
  /** Quanto il tratto del filo e' disegnato davvero, da 0 a 100. */
  filoReale: number | null;
  /** Una schermata sopra la pratica: la partenza ripetibile. */
  partenza: number | null;
};

const VUOTO: Stato = {
  scroll: 0,
  fineStrada: null,
  inizioFilo: null,
  punta: null,
  chiudeFreccia: null,
  apreFilo: null,
  chiudeFilo: null,
  filoReale: null,
  partenza: null,
};

const px = (v: number | null) => (v === null ? "——" : `${Math.round(v)}`);

export function Righelli() {
  const [s, setS] = useState<Stato>(VUOTO);
  /** Il punto di pagina che hai indicato tu con un clic. */
  const [tuo, setTuo] = useState<number | null>(null);
  const vivo = useRef<Stato>(VUOTO);

  useEffect(() => {
    let rafId = 0;

    const leggi = () => {
      const H = window.innerHeight;
      const y = window.scrollY;
      const perc = document.querySelector("[data-pratica-percorso]");
      const lavori = document.querySelector("#works");
      const pratica = document.querySelector("[data-pratica]");
      const fre = document.querySelector("[data-pratica-freccia]");

      const rp = perc?.getBoundingClientRect();
      const rl = lavori?.getBoundingClientRect();
      const ra = pratica?.getBoundingClientRect();
      const rf = fre?.getBoundingClientRect();
      const path = document.querySelector<SVGPathElement>('[data-thread="works"] path');

      // Quanto e' disegnato DAVVERO. E' la misura che distingue una finestra
      // tarata male da un secondo motore che scrive sullo stesso tratto: se
      // questo numero e' maggiore di zero prima che la finestra si apra,
      // spostare la finestra non servira' mai a niente.
      let filoReale: number | null = null;
      if (path) {
        const st = getComputedStyle(path);
        const arr = Number.parseFloat(st.strokeDasharray) || 0;
        const off = Number.parseFloat(st.strokeDashoffset) || 0;
        filoReale = arr > 0 ? Math.max(0, Math.min(1, 1 - off / arr)) * 100 : 0;
      }

      const next: Stato = {
        scroll: y,
        fineStrada: rp ? y + rp.bottom : null,
        inizioFilo: rl ? y + rl.top : null,
        punta: rf ? y + rf.top + rf.height / 2 : null,
        // Le stesse formule di ScrollTrigger per "bottom 46%" e "top 30%".
        chiudeFreccia: rp ? y + rp.bottom - F_FRECCIA * H : null,
        apreFilo: rl ? y + rl.top - F_FILO * H : null,
        chiudeFilo: rl ? y + rl.bottom - F_CHIUDE_FILO * H : null,
        filoReale,
        partenza: ra ? Math.max(0, y + ra.top - H) : null,
      };

      vivo.current = next;
      setS(next);
      rafId = window.requestAnimationFrame(leggi);
    };
    rafId = window.requestAnimationFrame(leggi);

    const clic = (e: MouseEvent) => setTuo(e.pageY);
    const tasto = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "r") setTuo(null);
      if (k === "s" && vivo.current.partenza !== null) {
        window.scrollTo({ top: vivo.current.partenza, behavior: "auto" });
      }
    };
    window.addEventListener("click", clic);
    window.addEventListener("keydown", tasto);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("click", clic);
      window.removeEventListener("keydown", tasto);
    };
  }, []);

  /** Un pallino ancorato a un punto della PAGINA: sta fermo sul contenuto
   *  mentre scorri, perche' e' quello il modo di indicare un posto. */
  const punto = (pagina: number | null, colore: string, etichetta: string, lato: "sx" | "dx") => {
    if (pagina === null) return null;
    const schermo = pagina - s.scroll;
    if (schermo < -80 || schermo > window.innerHeight + 80) return null;
    const stile: CSSProperties = {
      position: "fixed",
      left: 0,
      right: 0,
      top: `${schermo}px`,
      height: 0,
      borderTop: `2px solid ${colore}`,
      zIndex: 9998,
      pointerEvents: "none",
    };
    const eti: CSSProperties = {
      position: "fixed",
      [lato === "sx" ? "left" : "right"]: "0.5rem",
      top: `${schermo + 3}px`,
      zIndex: 9999,
      pointerEvents: "none",
      font: "700 10px/1.4 ui-monospace, monospace",
      letterSpacing: "0.08em",
      color: "#fff",
      background: colore,
      padding: "2px 5px",
      borderRadius: 3,
    };
    return (
      <>
        <div style={stile} />
        <div style={eti}>
          {etichetta} · {Math.round(pagina)}
        </div>
      </>
    );
  };

  const distanza =
    s.fineStrada !== null && s.inizioFilo !== null ? s.inizioFilo - s.fineStrada : null;

  /** Quanto il filo DOVREBBE essere disegnato, secondo la sua sola finestra. */
  const atteso =
    s.apreFilo !== null && s.chiudeFilo !== null && s.chiudeFilo > s.apreFilo
      ? Math.max(0, Math.min(1, (s.scroll - s.apreFilo) / (s.chiudeFilo - s.apreFilo))) * 100
      : null;
  // Lo scrub ha 0,6s di ritardo, quindi il reale insegue l'atteso: una
  // differenza in PIU' del reale non e' ritardo, e' un altro che scrive.
  const fuoriFinestra =
    atteso !== null && s.filoReale !== null && s.filoReale > atteso + 1.5;
  const scostamentoTuo = tuo !== null && s.fineStrada !== null ? tuo - s.fineStrada : null;

  return (
    <>
      {punto(s.fineStrada, "#E4572E", "FINE STRADA (freccia si appoggia qui)", "sx")}
      {punto(s.inizioFilo, "#1B6B5A", "INIZIO FILO LAVORI", "dx")}
      {tuo !== null ? punto(tuo, "#14120F", "IL TUO PUNTO", "sx") : null}

      <div
        style={{
          position: "fixed",
          left: "0.75rem",
          bottom: "0.75rem",
          zIndex: 9999,
          font: "500 11px/1.65 ui-monospace, monospace",
          color: "#14120F",
          background: "rgba(245,241,232,0.96)",
          border: "1px solid rgba(20,18,15,0.3)",
          borderRadius: 6,
          padding: "0.6rem 0.75rem",
          minWidth: 356,
          whiteSpace: "pre",
          pointerEvents: "none",
        }}
      >
        {[
          `RIGHELLI   CLICCA dove si appoggia la freccia`,
          `S = partenza   R = azzera il tuo punto`,
          ``,
          `— PUNTI DELLA PAGINA —`,
          `fine strada          ${px(s.fineStrada)}`,
          `inizio filo lavori   ${px(s.inizioFilo)}`,
          `distanza             ${px(distanza)}px`,
          `punta della freccia  ${px(s.punta)}`,
          ``,
          `il tuo punto         ${px(tuo)}`,
          `scostamento          ${
            scostamentoTuo === null
              ? "——"
              : `${Math.round(scostamentoTuo)}px ${scostamentoTuo >= 0 ? "sotto" : "sopra"} la fine strada`
          }`,
          ``,
          `— MOMENTI (scrollY) —`,
          `sei a                ${px(s.scroll)}`,
          `chiude freccia       ${px(s.chiudeFreccia)}`,
          `apre filo            ${px(s.apreFilo)}`,
          ``,
          `— IL FILO —`,
          `disegnato DAVVERO    ${s.filoReale === null ? "——" : `${s.filoReale.toFixed(1)}%`}`,
          `dovrebbe essere      ${atteso === null ? "——" : `${atteso.toFixed(1)}%`}`,
          fuoriFinestra
            ? `>>> DISEGNATO FUORI DALLA SUA FINESTRA <<<`
            : `coerente con la finestra`,
          ``,
          scostamentoTuo === null
            ? `clicca dove vedi la freccia posarsi`
            : Math.abs(scostamentoTuo) < 40
              ? `d'accordo sul punto: l'errore sta nelle finestre`
              : `NON d'accordo: la fine strada non e' dove la vedi tu`,
        ].join("\n")}
      </div>
    </>
  );
}
