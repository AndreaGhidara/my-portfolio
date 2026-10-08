"use client";

import { useEffect, useState, type RefObject } from "react";
import { MEDIA } from "@/animations/motionPolicy";
import { fits, shouldRedecide } from "./archive";
import { isDossierOpen } from "./useDossier";

/**
 * Quanto chiede e quanto ha ogni faccia, ad archivio acceso. Si misura su una
 * copia della lista con l'attributo gia' scritto, fissa e invisibile, tolta
 * subito dopo: la lista vera non cambia forma, quindi la pagina non si sposta
 * e lo scroll anchoring non ha niente da correggere.
 *
 * Una misura e non un numero scritto una volta, come ALTEZZA_MINIMA del
 * percorso: li' il foglio ha una larghezza massima e la sua altezza non cresce
 * con lo schermo, qui la riga grande cresce con la larghezza (fino a 3,1rem) e
 * la faccia con l'altezza. Un numero solo che bastasse a 1440 terrebbe in
 * colonna tutti i telefoni. Le schermate si tolgono dalla copia: nel riquadro
 * non contano (si stringono) e non devono partire a scaricarsi.
 */
function measureFaces(list: HTMLElement) {
  const probe = list.cloneNode(true) as HTMLElement;
  for (const node of probe.querySelectorAll("img, [data-shot-blur]")) node.remove();
  probe.setAttribute("data-archive-lit", "");
  probe.setAttribute("data-archive-probe", "");
  probe.setAttribute("aria-hidden", "true");
  probe.style.width = `${list.clientWidth}px`;
  (list.parentElement ?? document.body).append(probe);
  // Quanto chiede si legge lasciandola alta quanto vuole, e non da
  // scrollHeight: quello non conta il contenuto che scende dentro il padding
  // basso, e a 390x664 la faccia del riservato debordava di 18px dentro i suoi
  // 21 di padding con scrollHeight uguale all'altezza. «Apri il caso» finiva
  // schiacciato sul bordo e la soglia diceva che ci stava.
  const faces = [...probe.querySelectorAll<HTMLElement>("[data-face]")].map((face) => {
    const room = face.offsetHeight;
    face.style.height = "auto";
    return { content: face.offsetHeight, room };
  });
  probe.remove();
  return faces;
}

/**
 * Se l'archivio si accende: ogni faccia ci sta intera nel palco (vedi
 * facceNellaSonda). Falso al primo render, che e' la colonna del server.
 *
 * Si decide al montaggio, quando arrivano i caratteri (cambiano la riga), e
 * poi al resize secondo ridecidere(): una larghezza nuova subito, una sola
 * altezza mai su touch (la barra del browser: e' per quello che le facce sono
 * in svh) e col puntatore fine solo quando l'archivio non e' sullo schermo. Se
 * lo e', la decisione aspetta che esca.
 */
export function useArchiveLight(shelf: RefObject<HTMLOListElement | null>): boolean {
  const [allFit, setAllFit] = useState(false);

  useEffect(() => {
    const list = shelf.current;
    if (!list) return;
    let alive = true;
    let width = window.innerWidth;
    let inView = false;
    let pending = false;
    /** Un resize arrivato a pratica aperta: si pesa alla chiusura. */
    let pendingResize = false;
    const finePointer = window.matchMedia(MEDIA.finePointer);
    // Solo in sviluppo e solo con ?righelli: un archivio che resta in colonna
    // senza dire perche' non si diagnostica.
    const logDecisions =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("rulers");
    const decide = () => {
      if (!alive) return;
      // A pratica aperta l'archivio sotto non si spegne: una rotazione del
      // telefono misurerebbe una lista con la cartella caduta. Si decide alla
      // chiusura.
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
      // A pratica aperta si segna e basta, senza toccare `larghezza`: alla
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
    /* Chiusa la pratica, quello che e' rimasto sospeso passa dalle stesse
       regole di sempre: un resize da ridecidere(), cosi' una sola altezza non
       rimodella l'archivio sotto gli occhi; il resto solo se l'archivio non e'
       sullo schermo, come fa l'IntersectionObserver. */
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
