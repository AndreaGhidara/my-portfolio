"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MEDIA } from "@/animations/motionPolicy";
import { senzaSpostare } from "@/animations/senzaSpostare";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { lenisAttiva } from "@/components/shell/SmoothScroll";
import { LINGUETTA, PARAMETRI, ciSta, profondita, ridecidere, ritorno, tonoLinguetta } from "./archivio";
import { WorkFolder } from "./WorkFolder";
import { WorkDialog } from "./WorkDialog";
import { preloadShot } from "./preloadShot";
import type { WorkCaseData, WorkCaseLabels } from "./types";

type Active = { data: WorkCaseData; origin: DOMRect };

/**
 * Le misure dell'archivio arrivano al CSS da qui, scritte nel markup del
 * server: il numero vive in archivio.ts e il foglio di stile lo legge, come fa
 * il percorso con binario.ts.
 */
const MISURE = {
  "--passo": `${PARAMETRI.passo}px`,
  "--distanza": `${PARAMETRI.distanza}vh`,
  "--scurisce": PARAMETRI.scurisce,
  "--stringe": PARAMETRI.stringe,
  "--larghezza-linguetta": `${PARAMETRI.larghezzaLinguetta}%`,
  "--buio-minimo": `${LINGUETTA.buioMinimo * 100}%`,
};

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
 * I Lavori come un archivio di cartelle: ognuna a tutta pagina, sticky, e la
 * successiva le sale sopra fermandosi un passo piu' in basso. Quelle sotto si
 * scuriscono e si stringono in proporzione a `--profondita`, che si scrive da
 * qui. A fine corsa resta il cassetto con le quattro linguette e l'ultima
 * cartella intera, e l'archivio se ne va con la pagina: nessuna sosta.
 *
 * L'archivio lo accende questo componente, non il livello: il CSS sta tutto
 * sotto `data-archivio-acceso`, che si scrive dentro la build di
 * useSectionAnimation e si toglie nella pulizia. Finche' non c'e' e' la
 * colonna, che e' anche il markup del server: senza JavaScript si legge tutto.
 * Due condizioni: un livello diverso da "none" e un palco in cui ogni faccia ci
 * sta intera (vedi facceNellaSonda). Sotto, la colonna con l'entrata di sempre.
 *
 * Lo stato del dossier sta qui e non nelle singole cartelle perche' il dialog e'
 * uno solo: uno per cartella significherebbe quattro <dialog> nel DOM, quattro
 * trappole di focus e la certezza che prima o poi se ne aprano due.
 */
export function WorksShelf({
  items,
  labels,
}: {
  items: WorkCaseData[];
  labels: WorkCaseLabels;
}) {
  const [active, setActive] = useState<Active | null>(null);
  const [ciStanno, setCiStanno] = useState(false);
  const schedario = useRef<HTMLOListElement | null>(null);
  /** Ad archivio acceso: riporta davanti la cartella `i`. Null in colonna. */
  const riportaDavanti = useRef<((i: number) => void) | null>(null);

  /* Si decide al montaggio, quando arrivano i caratteri (cambiano la riga), e
     poi al resize secondo ridecidere(): una larghezza nuova subito, una sola
     altezza mai su touch (la barra del browser: e' per quello che le facce
     sono in svh) e col puntatore fine solo quando l'archivio non e' sullo
     schermo. Se lo e', la decisione aspetta che esca. */
  useEffect(() => {
    const lista = schedario.current;
    if (!lista) return;
    let vivo = true;
    let larghezza = window.innerWidth;
    let inVista = false;
    let inSospeso = false;
    const fine = window.matchMedia(MEDIA.finePointer);
    // Solo in sviluppo e solo con ?righelli, come il righello della pratica:
    // un archivio che resta in colonna senza dire perche' non si diagnostica.
    const racconta =
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("righelli");
    const decidi = () => {
      if (!vivo) return;
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
    osservatore.observe(lista.closest("section") ?? lista);
    decidi();
    void document.fonts?.ready.then(decidi);
    window.addEventListener("resize", alResize);
    return () => {
      vivo = false;
      osservatore.disconnect();
      window.removeEventListener("resize", alResize);
    };
  }, []);

  useSectionAnimation(
    ({ level, ScrollTrigger, presets }) => {
      const lista = schedario.current;
      if (!lista) return;
      const cartelle = Array.from(lista.children) as HTMLElement[];
      if (cartelle.length === 0) return;

      if (!ciStanno) {
        /* La colonna: ogni cartella scatta quando tocca a lei. Un innesco
           solo per tutte farebbe partire la quarta quando e' ancora fuori
           dallo schermo, e la sua entrata non la vedrebbe nessuno. */
        const { daDietro } = presets;
        for (const cartella of cartelle) {
          daDietro(cartella, { level, trigger: cartella, clearProps: true });
        }
        return;
      }

      // Le misure: rifatte all'accensione e al resize. Mai per fotogramma: a
      // ogni fotogramma si leggono solo i quattro rettangoli.
      let schermo = 0;
      let fermi: number[] = [];
      let inizio = 0;
      let passo = 0;
      const scritte = cartelle.map(() => -1);
      const toni = cartelle.map(() => -1);
      let fotogramma = 0;

      const misura = () => {
        schermo = window.innerHeight;
        fermi = cartelle.map((c) => Number.parseFloat(getComputedStyle(c).top) || 0);
        // La cima della lista dalla catena di offsetTop e non dal rettangolo:
        // le cartelle sono sticky, la lista no, e i suoi antenati nemmeno.
        let cima = 0;
        for (let el: HTMLElement | null = lista; el; el = el.offsetParent as HTMLElement | null) {
          cima += el.offsetTop;
        }
        inizio = cima + (Number.parseFloat(getComputedStyle(lista).paddingTop) || 0);
        const distanza = cartelle[1] ? Number.parseFloat(getComputedStyle(cartelle[1]).marginTop) || 0 : 0;
        passo = cartelle[0].offsetHeight + distanza;
      };

      const quanto = () =>
        profondita(
          cartelle.map((c) => c.getBoundingClientRect().top),
          fermi,
          schermo,
        );

      const muovi = () => {
        // Tre decimali bastano all'occhio, e risparmiano le scritture (e il
        // ricalcolo degli stili della cartella) quando lo scroll non cambia
        // niente.
        for (const [i, p] of quanto().entries()) {
          const v = Math.round(p * 1000) / 1000;
          if (v === scritte[i]) continue;
          scritte[i] = v;
          cartelle[i].style.setProperty("--profondita", String(v));
          // Il tono del testo della linguetta: un attributo e non un conto in
          // CSS, perche' e' una soglia, e il CSS le soglie non le sa fare.
          const tono = tonoLinguetta(v);
          if (tono === toni[i]) continue;
          toni[i] = tono;
          cartelle[i].setAttribute("data-tono-linguetta", String(tono));
        }
      };
      // `fotogramma` si azzera solo dentro il suo callback, come in
      // SottoIlFoglio: la pulizia deve sapere cosa cancellare.
      const alloScroll = () => {
        if (fotogramma) return;
        fotogramma = requestAnimationFrame(() => {
          fotogramma = 0;
          muovi();
        });
      };
      const alResize = () => {
        misura();
        muovi();
      };

      /* Il ritorno: la pagina risale fin dove la cartella si e' appena fermata.
         Morbido per la linguetta a "full", istantaneo altrove e per il fuoco.
         Con Lenis acceso lo chiede a lui: uno scroll nativo mentre Lenis e'
         in corsa (un click subito dopo un giro di rotellina) lo riscrive il
         fotogramma dopo. Senza, "instant" e non "auto", che obbedisce a
         scroll-behavior. Le misure si rifanno qui: costano poco, e un
         carattere arrivato tardi puo' averle spostate. */
      const vaiA = (i: number, morbido: boolean) => {
        misura();
        const y = Math.max(0, ritorno({ inizio, passo, fermi, i, schermo }));
        const lenis = lenisAttiva();
        if (lenis) {
          lenis.scrollTo(y, { immediate: !morbido });
          return;
        }
        window.scrollTo({ top: y, behavior: morbido && level === "full" ? "smooth" : "instant" });
      };

      /* Il fuoco svela, come in SottoIlFoglio e nel tavolo. Le cartelle
         coperte restano raggiungibili da tastiera, e un fuoco su una cartella
         che un'altra copre e' un fuoco che non si vede: si riporta davanti.
         Solo da tastiera: :focus-visible e' falso per un click, e un click
         sulla linguetta fa gia' la stessa cosa, ma morbida. */
      const alFuoco = (event: FocusEvent) => {
        const preso = event.target as HTMLElement | null;
        if (!preso?.matches(":focus-visible")) return;
        const cartella = preso.closest<HTMLElement>("[data-cartella]");
        const i = cartella ? cartelle.indexOf(cartella) : -1;
        if (i < 0 || quanto()[i] <= 0) return;
        vaiA(i, false);
      };

      const sezione = lista.closest("section") ?? lista;
      senzaSpostare(sezione, () => {
        lista.setAttribute("data-archivio-acceso", "");
        // La sezione e' appena cresciuta di qualche schermo: tutto quello che
        // sta sotto (le entrate, il filo di «Come lavoro», il percorso) va
        // rimisurato.
        ScrollTrigger.refresh();
      });
      // Dopo l'accensione: i `top` sticky e i rettangoli valgono solo da qui.
      misura();
      muovi();
      riportaDavanti.current = (i) => vaiA(i, true);

      window.addEventListener("scroll", alloScroll, { passive: true });
      window.addEventListener("resize", alResize);
      lista.addEventListener("focusin", alFuoco);

      return () => {
        cancelAnimationFrame(fotogramma);
        window.removeEventListener("scroll", alloScroll);
        window.removeEventListener("resize", alResize);
        lista.removeEventListener("focusin", alFuoco);
        riportaDavanti.current = null;
        for (const c of cartelle) {
          c.style.removeProperty("--profondita");
          c.removeAttribute("data-tono-linguetta");
        }
        // La stessa crescita al contrario: chi sta sotto deve saperlo, e chi
        // stava guardando sotto resta li'.
        senzaSpostare(sezione, () => {
          lista.removeAttribute("data-archivio-acceso");
          ScrollTrigger.refresh();
        });
      };
    },
    schedario,
    [ciStanno],
  );

  /** In colonna la linguetta porta la sua cartella in cima, sotto la testata. */
  const riporta = (i: number) => {
    if (riportaDavanti.current) {
      riportaDavanti.current(i);
      return;
    }
    const cartella = schedario.current?.children[i];
    if (!cartella) return;
    const testata = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
    window.scrollTo({
      top: cartella.getBoundingClientRect().top + window.scrollY - testata,
      behavior: window.matchMedia(MEDIA.reduced).matches ? "instant" : "smooth",
    });
  };

  return (
    <>
      {/* L'attributo resta su QUESTO elemento, e le cartelle ne sono figlie
          dirette: tutto l'impaginato dell'archivio e' scritto con
          `[data-work-shelf] > [data-cartella]`. */}
      {/* `--n` entra nell'altezza della faccia: i passi delle cartelle gia'
          archiviate sono n - 1. */}
      <ol
        ref={schedario}
        data-work-shelf
        style={{ ...MISURE, "--n": items.length } as CSSProperties}
      >
        {items.map((item, index) => (
          <WorkFolder
            key={item.id}
            data={item}
            index={index}
            totale={items.length}
            openLabel={labels.open}
            riservatoLabel={labels.riservato}
            riportaLabel={labels.riporta}
            onOpen={(data, origin) => setActive({ data, origin })}
            onPreload={() => preloadShot(item.screenshot)}
            onRiporta={() => riporta(index)}
          />
        ))}
      </ol>

      <WorkDialog
        data={active?.data ?? null}
        origin={active?.origin ?? null}
        labels={labels}
        onClose={() => setActive(null)}
      />
    </>
  );
}
