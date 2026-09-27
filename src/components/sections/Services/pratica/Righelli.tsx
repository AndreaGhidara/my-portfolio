"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CORSA_FRECCIA } from "@/animations/finestre";

/**
 * Il righello della freccia: dove si appoggia. `?righelli`, solo in sviluppo,
 * come il calibratore.
 *
 * Era il righello della consegna fra la freccia e il filo dei Lavori, che
 * apriva appena dopo. I Lavori sono diventati un archivio e il filo li' non
 * passa piu' (vedi anchors.ts): la meta' che misurava il filo se n'e' andata
 * con lui, resta quella della freccia.
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
 *  - PUNTI DI PAGINA (i pallini): dove il tracciato finisce. E' un posto fisso
 *    nel documento, scorre con il contenuto, e si puo' indicare a dito.
 *  - MOMENTI (il pannello): a che scrollY la finestra della freccia si chiude.
 *
 * E un secondo pallino lo metti tu: CLICCA dove vedi la freccia appoggiarsi.
 * Se il tuo pallino e quello arancione non coincidono, l'errore e' nel punto
 * che il codice crede sia la fine della corsa, e non nella finestra.
 *
 * NON tocca niente: legge il DOM. Uno strumento che perturba quello che misura
 * e' peggio di nessuno strumento.
 */

const frazione = (s: string) => Number.parseFloat(s.split(" ")[1]) / 100;

const F_FRECCIA = frazione(CORSA_FRECCIA.fine);

type Stato = {
  scroll: number;
  /** Punto di pagina in cui finisce la strada: dove la freccia si appoggia. */
  fineStrada: number | null;
  /** Dove sta la punta della freccia adesso, in pagina. */
  punta: number | null;
  /** scrollY a cui si chiude la finestra della freccia. */
  chiudeFreccia: number | null;
  /** Una schermata sopra la pratica: la partenza ripetibile. */
  partenza: number | null;
};

const VUOTO: Stato = {
  scroll: 0,
  fineStrada: null,
  punta: null,
  chiudeFreccia: null,
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
      const pratica = document.querySelector("[data-pratica]");
      const fre = document.querySelector("[data-pratica-freccia]");

      const rp = perc?.getBoundingClientRect();
      const ra = pratica?.getBoundingClientRect();
      const rf = fre?.getBoundingClientRect();

      const next: Stato = {
        scroll: y,
        fineStrada: rp ? y + rp.bottom : null,
        punta: rf ? y + rf.top + rf.height / 2 : null,
        // La stessa formula di ScrollTrigger per "bottom 46%".
        chiudeFreccia: rp ? y + rp.bottom - F_FRECCIA * H : null,
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

  const scostamentoTuo = tuo !== null && s.fineStrada !== null ? tuo - s.fineStrada : null;

  return (
    <>
      {punto(s.fineStrada, "#E4572E", "FINE STRADA (freccia si appoggia qui)", "sx")}
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
          ``,
          scostamentoTuo === null
            ? `clicca dove vedi la freccia posarsi`
            : Math.abs(scostamentoTuo) < 40
              ? `d'accordo sul punto: l'errore sta nella finestra`
              : `NON d'accordo: la fine strada non e' dove la vedi tu`,
        ].join("\n")}
      </div>
    </>
  );
}
