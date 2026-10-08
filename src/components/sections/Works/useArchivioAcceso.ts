"use client";

import { useEffect, useState, type RefObject } from "react";
import { MEDIA } from "@/animations/motionPolicy";
import { ciSta, ridecidere } from "./archivio";
import { praticaAperta } from "./usePratica";

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
function facceNellaSonda(lista: HTMLElement) {
  const sonda = lista.cloneNode(true) as HTMLElement;
  for (const nodo of sonda.querySelectorAll("img, [data-shot-blur]")) nodo.remove();
  sonda.setAttribute("data-archivio-acceso", "");
  sonda.setAttribute("data-archivio-sonda", "");
  sonda.setAttribute("aria-hidden", "true");
  sonda.style.width = `${lista.clientWidth}px`;
  (lista.parentElement ?? document.body).append(sonda);
  // Quanto chiede si legge lasciandola alta quanto vuole, e non da
  // scrollHeight: quello non conta il contenuto che scende dentro il padding
  // basso, e a 390x664 la faccia del riservato debordava di 18px dentro i suoi
  // 21 di padding con scrollHeight uguale all'altezza. «Apri il caso» finiva
  // schiacciato sul bordo e la soglia diceva che ci stava.
  const facce = [...sonda.querySelectorAll<HTMLElement>("[data-faccia]")].map((faccia) => {
    const posto = faccia.offsetHeight;
    faccia.style.height = "auto";
    return { contenuto: faccia.offsetHeight, posto };
  });
  sonda.remove();
  return facce;
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
export function useArchivioAcceso(schedario: RefObject<HTMLOListElement | null>): boolean {
  const [ciStanno, setCiStanno] = useState(false);

  useEffect(() => {
    const lista = schedario.current;
    if (!lista) return;
    let vivo = true;
    let larghezza = window.innerWidth;
    let inVista = false;
    let inSospeso = false;
    /** Un resize arrivato a pratica aperta: si pesa alla chiusura. */
    let resizeSospeso = false;
    const fine = window.matchMedia(MEDIA.finePointer);
    // Solo in sviluppo e solo con ?righelli: un archivio che resta in colonna
    // senza dire perche' non si diagnostica.
    const racconta =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("righelli");
    const decidi = () => {
      if (!vivo) return;
      // A pratica aperta l'archivio sotto non si spegne: una rotazione del
      // telefono misurerebbe una lista con la cartella caduta. Si decide alla
      // chiusura.
      if (praticaAperta()) {
        inSospeso = true;
        return;
      }
      inSospeso = false;
      const facce = facceNellaSonda(lista);
      const esito = ciSta(facce);
      if (racconta) {
        console.debug(
          `[archivio] ${esito ? "acceso" : "colonna"} a ${window.innerWidth}x${window.innerHeight}`,
          facce,
        );
      }
      setCiStanno(esito);
    };
    const alResize = () => {
      // A pratica aperta si segna e basta, senza toccare `larghezza`: alla
      // chiusura si confronta con quella di prima dell'apertura.
      if (praticaAperta()) {
        resizeSospeso = true;
        return;
      }
      const cambiata = window.innerWidth !== larghezza;
      larghezza = window.innerWidth;
      const quando = ridecidere({ larghezzaCambiata: cambiata, puntatoreFine: fine.matches, inVista });
      if (quando === "ora") decidi();
      else if (quando === "dopo") inSospeso = true;
    };
    const osservatore = new IntersectionObserver(([voce]) => {
      inVista = voce.isIntersecting;
      if (!inVista && inSospeso) decidi();
    });
    /* Chiusa la pratica, quello che e' rimasto sospeso passa dalle stesse
       regole di sempre: un resize da ridecidere(), cosi' una sola altezza non
       rimodella l'archivio sotto gli occhi; il resto solo se l'archivio non e'
       sullo schermo, come fa l'IntersectionObserver. */
    const dossier = new MutationObserver(() => {
      if (praticaAperta()) return;
      if (resizeSospeso) {
        resizeSospeso = false;
        alResize();
      }
      if (inSospeso && !inVista) decidi();
    });
    osservatore.observe(lista.closest("section") ?? lista);
    dossier.observe(document.documentElement, { attributeFilter: ["data-dialog-open"] });
    decidi();
    void document.fonts?.ready.then(decidi);
    window.addEventListener("resize", alResize);
    return () => {
      vivo = false;
      osservatore.disconnect();
      dossier.disconnect();
      window.removeEventListener("resize", alResize);
    };
  }, [schedario]);

  return ciStanno;
}
