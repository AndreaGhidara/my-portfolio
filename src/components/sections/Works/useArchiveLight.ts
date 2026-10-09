"use client";

import { useEffect, useState, type RefObject } from "react";
import { MEDIA } from "@/animations/motionPolicy";
import { fits, shouldRedecide } from "./archive";
import { isDossierOpen } from "./useDossier";

/** Si misura su una copia invisibile della lista, cosi' quella vera non cambia
 *  forma e lo scroll anchoring non ha niente da correggere. Una misura e non un
 *  numero fisso come MIN_HEIGHT del percorso: qui la riga cresce con la
 *  larghezza e la faccia con l'altezza. */
function measureFaces(list: HTMLElement) {
  const probe = list.cloneNode(true) as HTMLElement;
  for (const node of probe.querySelectorAll("img, [data-shot-blur]")) node.remove();
  probe.setAttribute("data-archive-lit", "");
  probe.setAttribute("data-archive-probe", "");
  probe.setAttribute("aria-hidden", "true");
  probe.style.width = `${list.clientWidth}px`;
  (list.parentElement ?? document.body).append(probe);
  // Non da scrollHeight: non conta il contenuto che scende dentro il padding
  // basso, e a 390x664 la faccia del riservato debordava di 18px con
  // scrollHeight uguale all'altezza.
  const faces = [...probe.querySelectorAll<HTMLElement>("[data-face]")].map((face) => {
    const room = face.offsetHeight;
    face.style.height = "auto";
    return { content: face.offsetHeight, room };
  });
  probe.remove();
  return faces;
}

/** Falso al primo render, che e' la colonna del server. Si ridecide quando
 *  arrivano i caratteri, che cambiano la riga, e al resize secondo
 *  shouldRedecide(). */
export function useArchiveLight(shelf: RefObject<HTMLOListElement | null>): boolean {
  const [allFit, setAllFit] = useState(false);

  useEffect(() => {
    const list = shelf.current;
    if (!list) return;
    let alive = true;
    let width = window.innerWidth;
    let inView = false;
    let pending = false;
    let pendingResize = false;
    const finePointer = window.matchMedia(MEDIA.finePointer);
    // Solo in sviluppo e solo con ?rulers: un archivio che resta in colonna
    // senza dire perche' non si diagnostica.
    const logDecisions =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("rulers");
    const decide = () => {
      if (!alive) return;
      // A pratica aperta si decide alla chiusura: una rotazione del telefono
      // misurerebbe una lista con la cartella caduta.
      if (isDossierOpen()) {
        pending = true;
        return;
      }
      pending = false;
      const faces = measureFaces(list);
      const result = fits(faces);
      if (logDecisions) {
        console.debug(
          `[archive] ${result ? "lit" : "column"} at ${window.innerWidth}x${window.innerHeight}`,
          faces,
        );
      }
      setAllFit(result);
    };
    const onResize = () => {
      // A pratica aperta si segna e basta, senza toccare `width`: alla
      // chiusura si confronta con quella di prima dell'apertura.
      if (isDossierOpen()) {
        pendingResize = true;
        return;
      }
      const widthChanged = window.innerWidth !== width;
      width = window.innerWidth;
      const when = shouldRedecide({ widthChanged, finePointer: finePointer.matches, inView });
      if (when === "now") decide();
      else if (when === "later") pending = true;
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView && pending) decide();
    });
    // Chiusa la pratica, quello che e' rimasto sospeso passa dalle regole di
    // sempre, cosi' una sola altezza non rimodella l'archivio sotto gli occhi.
    const dialogWatcher = new MutationObserver(() => {
      if (isDossierOpen()) return;
      if (pendingResize) {
        pendingResize = false;
        onResize();
      }
      if (pending && !inView) decide();
    });
    observer.observe(list.closest("section") ?? list);
    dialogWatcher.observe(document.documentElement, { attributeFilter: ["data-dialog-open"] });
    decide();
    void document.fonts?.ready.then(decide);
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      observer.disconnect();
      dialogWatcher.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [shelf]);

  return allFit;
}
