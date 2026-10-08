"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ScrollTrigger as TipoScrollTrigger } from "gsap/ScrollTrigger";
import { INIZIO_ENTRATA } from "@/animations/timing";
import { senzaSpostare } from "@/animations/withoutShift";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import {
  ALTEZZA_MINIMA,
  PARAMETRI,
  arrivata,
  fasi,
  lineaPiena,
  strada,
  tracciaOnda,
  viaggio,
  type Punto,
} from "./track";

/**
 * Le misure del binario arrivano al CSS da qui, scritte nel markup del server:
 * il numero vive in binario.ts e il foglio di stile lo legge, invece di tenerne
 * una seconda copia che il giorno della ritaratura nessuno aggiorna. Sono
 * stringhe costanti, quindi server e client le serializzano uguali.
 */
const MISURE = {
  "--largo": `min(${PARAMETRI.foglio.rem}rem, ${PARAMETRI.foglio.vw}vw)`,
  "--aria": `${PARAMETRI.aria}rem`,
  "--arrivo": `min(${PARAMETRI.arrivo.rem}rem, ${PARAMETRI.arrivo.vw}vw)`,
  "--coda": PARAMETRI.coda,
  "--velocita-fine": PARAMETRI.velocita.fine,
  "--velocita-grossolana": PARAMETRI.velocita.grossolana,
};

/** L'altezza del palco, 100svh, letta da una sonda: il palco stesso in colonna
 *  e' alto quanto il suo contenuto, e una media query `min-height` sul
 *  telefono misura il viewport grande. */
const palcoBastante = (sonda: HTMLElement | null) =>
  (sonda?.offsetHeight ?? 0) >= ALTEZZA_MINIMA;

/**
 * Il percorso in orizzontale. Stesso schema del tavolo (DeskStage): un track
 * alto quanto la corsa, un palco sticky dentro, UN solo ScrollTrigger che
 * scrive lo stato. Niente `pin`: il pin-spacer litiga con Lenis.
 *
 * La scena orizzontale la accende questo componente, non il livello: il CSS
 * orizzontale scatta su `data-scena="orizzontale"`, che si scrive DOPO aver
 * creato il trigger e si toglie nella pulizia. Finche' non c'e' la sezione e'
 * la colonna, che e' anche il markup del server: se GSAP non arriva, si legge
 * tutto lo stesso.
 *
 * Due condizioni per accenderla: un livello di movimento diverso da "none" e un
 * palco abbastanza alto da contenere un foglio intero (ALTEZZA_MINIMA). Sotto,
 * la colonna con l'entrata di sempre.
 */
export function JourneyBinario({
  n,
  annoIniziale,
  testata,
  suggerimento,
  children,
}: {
  /** Quante tappe, arrivo escluso: entra nella formula dell'altezza del track. */
  n: number;
  /** L'anno della prima tappa, quello che l'anno grande dice all'aggancio. */
  annoIniziale: number;
  testata: ReactNode;
  suggerimento: string;
  /** Le tappe e, ultimo, il foglio dei numeri. */
  children: ReactNode;
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const lista = useRef<HTMLOListElement | null>(null);
  const sonda = useRef<HTMLDivElement | null>(null);
  const attivo = useRef<TipoScrollTrigger | null>(null);
  const [altoAbbastanza, setAltoAbbastanza] = useState(false);

  /* Si decide al montaggio e poi solo quando cambia la larghezza, o quando la
     scena non e' in corsa. Mai a meta' corsa per un cambio di sola altezza: la
     barra di Safari che compare e sparisce non deve far saltare la sezione da
     una forma all'altra sotto il pollice. */
  useEffect(() => {
    let larghezza = window.innerWidth;
    const decidi = () => setAltoAbbastanza(palcoBastante(sonda.current));
    const alResize = () => {
      const cambiata = window.innerWidth !== larghezza;
      larghezza = window.innerWidth;
      if (cambiata || !attivo.current?.isActive) decidi();
    };
    decidi();
    window.addEventListener("resize", alResize);
    return () => window.removeEventListener("resize", alResize);
  }, []);

  useSectionAnimation(
    ({ level: resolved, gsap, ScrollTrigger, presets }) => {
      const root = scope.current;
      const trackEl = track.current;
      const stageEl = stage.current;
      const listaEl = lista.current;
      if (!root || !trackEl || !stageEl || !listaEl) return;

      const tappe = [...listaEl.querySelectorAll<HTMLElement>("[data-journey-item]")];

      if (!altoAbbastanza) {
        /* La colonna: l'entrata che la lista ha sempre avuto. Prima si posa il
           foglio, poi ci si appunta sopra il tesserino, sovrapposti in coda
           perche' si leggano come un gesto solo. Un trigger per tappa: una
           entrata di gruppo le farebbe partire tutte quando si affaccia la
           prima. */
        const { daDietro, dallAlto } = presets;
        for (const tappa of tappe) {
          const foglio = tappa.querySelector("[data-journey-sheet]");
          const tesserino = tappa.querySelector("[data-journey-badge]");
          if (!foglio || !tesserino) continue;
          const linea = gsap.timeline({
            scrollTrigger: {
              trigger: tappa,
              start: resolved === "full" ? INIZIO_ENTRATA.pieno : INIZIO_ENTRATA.ridotto,
              once: true,
            },
          });
          // clearProps: l'inclinazione della tappa la porta il CSS, e un
          // translate lasciato in linea ci combatterebbe contro.
          linea.add(daDietro(foglio, { level: resolved, clearProps: true }) ?? gsap.timeline());
          linea.add(
            dallAlto(tesserino, { level: resolved, clearProps: true }) ?? gsap.timeline(),
            "-=0.28",
          );
        }
        return;
      }

      const arrivo = listaEl.querySelector<HTMLElement>("[data-journey-arrivo]");
      const svg = listaEl.querySelector<SVGSVGElement>("[data-journey-onda] svg");
      const fioca = svg?.querySelector<SVGPathElement>("[data-journey-onda-fioca]");
      const piena = svg?.querySelector<SVGPathElement>("[data-journey-onda-piena]");
      const fatto = svg?.querySelector<SVGRectElement>("[data-journey-fatto]");
      const anno = root.querySelector<HTMLElement>("[data-journey-anno]");
      const suggerito = root.querySelector<HTMLElement>("[data-journey-suggerimento]");
      if (!arrivo || !svg || !fioca || !piena || !fatto || !anno) return;

      // Le misure: rifatte solo su onRefresh, che ScrollTrigger chiama anche a
      // ogni cambio di larghezza. Mai per fotogramma: leggere offsetLeft a ogni
      // update sarebbe un layout per fotogramma.
      let larghezza = 0;
      let stradaPx = 0;
      let viaggioPx = 0;
      let altezza = 0;
      let bordoArrivo = 0;
      let fineArrivo = 0;
      let centri: number[] = [];
      let annoScritto = "";

      const misura = () => {
        // ScrollTrigger.create chiama onRefresh subito, prima che la scena sia
        // accesa: i fogli sono ancora in colonna, tutti allo stesso x, e l'onda
        // misurata li' non vuol dire niente. La disegna il refresh che segue.
        if (!root.hasAttribute("data-scena")) return;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        altezza = stageEl.offsetHeight;
        larghezza = stageEl.clientWidth;
        viaggioPx = viaggio({ track: trackEl.offsetHeight, palco: altezza, coda: PARAMETRI.coda });
        const aria = parseFloat(getComputedStyle(listaEl).columnGap) || 0;
        stradaPx = strada({
          n: tappe.length,
          foglio: tappe[0]?.offsetWidth ?? 0,
          aria,
          arrivo: arrivo.offsetWidth,
        });
        bordoArrivo = arrivo.offsetLeft;
        fineArrivo = arrivo.offsetLeft + arrivo.offsetWidth;
        centri = tappe.map((t) => t.offsetLeft + t.offsetWidth / 2);

        // L'onda: dal bordo sinistro a meta' altezza, poi il centro di ogni
        // foglio spostato come il foglio (lo scostamento e' un translate, che
        // offsetTop non vede), e fine al centro del foglio dei numeri.
        const W = listaEl.offsetWidth;
        const H = listaEl.offsetHeight;
        const y0 = H / 2;
        const punti: Punto[] = [[0, y0]];
        for (const [i, t] of tappe.entries()) {
          punti.push([centri[i], y0 + parseFloat(t.dataset.scostamento ?? "0") * rem]);
        }
        punti.push([arrivo.offsetLeft + arrivo.offsetWidth / 2, y0]);
        svg.setAttribute("width", String(W));
        svg.setAttribute("height", String(H));
        const d = tracciaOnda(punti, PARAMETRI.ampiezza * rem, PARAMETRI.onde);
        fioca.setAttribute("d", d);
        piena.setAttribute("d", d);
      };

      const scrivi = (self: TipoScrollTrigger) => {
        const fatta = Math.max(0, self.scroll() - self.start);
        const f = fasi({ fatta, viaggio: viaggioPx, coda: PARAMETRI.coda, altezza });
        const x = f.p * stradaPx;

        listaEl.style.setProperty("--x", x.toFixed(2));
        fatto.setAttribute(
          "width",
          lineaPiena({ x, larghezza, bordoArrivo, fineArrivo, q: f.q }).toFixed(1),
        );
        arrivo.style.setProperty("--luce", f.luce.toFixed(4));
        arrivo.style.setProperty("--sussulto", f.sussulto.toFixed(4));
        arrivo.style.setProperty("--caduta", f.caduta.toFixed(4));
        root.style.setProperty("--avanzamento", self.progress.toFixed(4));
        suggerito?.toggleAttribute("data-mosso", fatta > 20);

        let visto = tappe[0]?.dataset.anno ?? "";
        for (const [i, t] of tappe.entries()) {
          const si = arrivata({ centroTappa: centri[i], x, larghezza });
          if (si !== t.hasAttribute("data-arrivata")) t.toggleAttribute("data-arrivata", si);
          if (si) visto = t.dataset.anno ?? visto;
        }
        if (visto !== annoScritto) {
          anno.textContent = visto;
          annoScritto = visto;
        }
      };

      // Sui touch e' gia' il default di GSAP; scritto perche' la corsa sta in
      // piedi solo se la barra del browser che compare e sparisce non la
      // rimisura: e' per quello che le altezze sono in svh.
      ScrollTrigger.config({ ignoreMobileResize: true });

      const trigger = ScrollTrigger.create({
        trigger: trackEl,
        start: "top top",
        // Track meno palco, misurati come li misura viaggio(): una sola
        // altezza, quella del palco, e mai window.innerHeight.
        end: () => `+=${Math.max(0, trackEl.offsetHeight - stageEl.offsetHeight)}`,
        onRefresh: (self) => {
          misura();
          scrivi(self);
        },
        onUpdate: scrivi,
      });

      attivo.current = trigger;
      const sezione = root.closest("section") ?? root;
      senzaSpostare(sezione, () => {
        root.setAttribute("data-scena", "orizzontale");
        // La sezione e' appena cresciuta di migliaia di pixel: tutto quello che
        // sta sotto (il tuo turno, le entrate) va rimisurato, questo trigger
        // compreso, che e' nato misurando la colonna.
        ScrollTrigger.refresh();
      });

      // Un carattere che arriva dopo cambia l'altezza dei fogli e quindi i
      // centri dell'onda. Solo questo trigger: il resto della pagina se ne
      // occupa per conto suo.
      let vivo = true;
      void document.fonts?.ready.then(() => {
        if (vivo) trigger.refresh();
      });

      return () => {
        vivo = false;
        attivo.current = null;
        trigger.kill();
        root.style.removeProperty("--avanzamento");
        listaEl.style.removeProperty("--x");
        for (const p of ["--luce", "--sussulto", "--caduta"]) arrivo.style.removeProperty(p);
        for (const t of tappe) t.removeAttribute("data-arrivata");
        anno.textContent = String(annoIniziale);
        suggerito?.removeAttribute("data-mosso");
        // E' la stessa crescita al contrario: la sezione torna colonna, chi
        // sta sotto deve saperlo, e chi stava guardando sotto resta li'.
        senzaSpostare(sezione, () => {
          root.removeAttribute("data-scena");
          ScrollTrigger.refresh();
        });
      };
    },
    scope,
    [altoAbbastanza],
  );

  return (
    <div
      ref={scope}
      data-journey
      style={{ ...MISURE, "--n": n } as CSSProperties}
    >
      {/* Alta 100svh, larga zero: dice quanto e' alto il palco anche quando
          il palco, in colonna, e' alto quanto il suo contenuto. */}
      <div ref={sonda} data-journey-sonda aria-hidden="true" />
      <div ref={track} data-journey-track>
        <div ref={stage} data-journey-stage>
          <div data-journey-testata>
            {testata}
            <p data-journey-anno aria-hidden="true">
              {annoIniziale}
            </p>
          </div>

          <ol ref={lista} data-journey-list>
            {/* L'onda sta dentro la lista perche' scorre con lei: e' il primo
                <li> e non conta per chi legge. */}
            <li data-journey-onda aria-hidden="true">
              <svg>
                <defs>
                  <clipPath id="journey-fatto">
                    <rect data-journey-fatto x="0" y="-9999" width="0" height="99999" />
                  </clipPath>
                </defs>
                <path data-journey-onda-fioca />
                <path data-journey-onda-piena clipPath="url(#journey-fatto)" />
              </svg>
            </li>
            {children}
          </ol>

          <p data-journey-suggerimento>
            <span aria-hidden="true">&rarr;</span> {suggerimento}
          </p>
          <div data-journey-avanzamento aria-hidden="true">
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}
