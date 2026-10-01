"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { MEDIA, useMotionLevel } from "@/animations/motionPolicy";
import { senzaSpostare } from "@/animations/senzaSpostare";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { lenisAttiva } from "@/components/shell/SmoothScroll";
import { LINGUETTA, PARAMETRI, ciSta, profondita, ridecidere, ritorno, tonoLinguetta } from "./archivio";
import { WorkFolder } from "./WorkFolder";
import { WorkDialog } from "./WorkDialog";
import { preloadShot } from "./preloadShot";
import { scivola, type Cartella, type Moto, type Scivolata } from "./scivola";
import type { WorkCaseData, WorkCaseLabels } from "./types";

/**
 * Una pratica in corso, dal clic a quando la cartella e' di nuovo ferma.
 * `apre`: la cartella cade e la pratica si allarga; `aperta`; `chiude`: la
 * pratica si stringe; `risale`: il dialog e' chiuso e la cartella torna su.
 */
type Corso = {
  fase: "apre" | "aperta" | "chiude" | "risale";
  cartella: Cartella;
  moto: Moto;
  /** Null finche' la cartella non e' davanti e in vista: poi cade. */
  scivolata: Scivolata | null;
  /** Il contenuto e' nel DOM (l'effetto dopo il commit e' passato). */
  montata: boolean;
  /** I tempi 3 e 4 sono partiti. */
  avviata: boolean;
  /** Esc o × durante l'apertura: si chiude appena aperta. */
  chiudiDopo: boolean;
  /** Un clic durante la risalita: QUALE cartella, da aprire appena ferma. */
  apriDopo: { i: number; cartella: Cartella } | null;
};

/** Una pratica aperta ferma tutto quello che misura la pagina sotto. */
const praticaAperta = () => document.documentElement.hasAttribute("data-dialog-open");

/** Ms: quanto dura lo scroll che porta davanti la cartella prima che cada. */
const SVELTO = 350;

/**
 * Porta la pagina a `y`. "subito" salta; "svelto" scorre in SVELTO ms, prima
 * che la cartella cada; "morbido" e' il ritorno della linguetta. Con Lenis
 * acceso lo chiede a lui (vedi vaiA). La promessa si risolve a scroll finito:
 * con Lenis da onComplete, senza da scrollend, e comunque entro una scadenza,
 * perche' scrollend non arriva se la pagina e' gia' li' e onComplete non
 * arriva se lo scroll viene interrotto.
 */
function scorri(y: number, modo: "subito" | "svelto" | "morbido"): Promise<void> {
  const lenis = lenisAttiva();
  if (modo === "subito") {
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y, behavior: "instant" });
    return Promise.resolve();
  }
  return new Promise((risolvi) => {
    let fatto = false;
    const fine = () => {
      if (fatto) return;
      fatto = true;
      window.clearTimeout(scadenza);
      window.removeEventListener("scrollend", fine);
      risolvi();
    };
    const scadenza = window.setTimeout(fine, (modo === "svelto" ? SVELTO : 1100) + 400);
    if (lenis) {
      // lock: la rotellina non si mette in mezzo mentre la cartella arriva.
      lenis.scrollTo(y, modo === "svelto" ? { duration: SVELTO / 1000, lock: true, onComplete: fine } : { onComplete: fine });
      return;
    }
    if (Math.abs(window.scrollY - y) < 1) {
      fine();
      return;
    }
    window.addEventListener("scrollend", fine);
    window.scrollTo({ top: y, behavior: "smooth" });
  });
}

/**
 * In colonna: la cartella puo' essere cliccata dal fondo della faccia, col
 * foglio sopra lo schermo. Il foglio e' da dove parte la pratica, e deve
 * vedersi sotto la testata del sito: si scorre quel tanto, svelti. Null se
 * c'e' gia' (o se non c'e' layout da misurare).
 */
function portaInVista(cartella: Cartella): Promise<void> | null {
  const foglio = cartella.foglio.getBoundingClientRect();
  if (foglio.height === 0) return null;
  const testata = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
  // 40px: i 22 di cui il foglio sale sfilando, e un respiro.
  const margine = testata + 40;
  if (foglio.top >= margine) return null;
  return scorri(Math.max(0, window.scrollY + foglio.top - margine), "svelto");
}

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
 * trappole di focus e la certezza che prima o poi se ne aprano due. Qui sta
 * anche la coda: aprire e chiudere durano un secondo e mezzo ciascuno, e un
 * clic o un Esc nel mezzo non si perde ne' si accavalla.
 */
export function WorksShelf({
  lavori,
  labels,
}: {
  lavori: WorkCaseData[];
  labels: WorkCaseLabels;
}) {
  const [attiva, setAttiva] = useState<number | null>(null);
  const [ciStanno, setCiStanno] = useState(false);
  const movimento = useMotionLevel();
  const livello = useRef(movimento);
  const schedario = useRef<HTMLOListElement | null>(null);
  const dialogo = useRef<HTMLDialogElement | null>(null);
  const corso = useRef<Corso | null>(null);
  /** Ad archivio acceso: riporta davanti la cartella `i`. Null in colonna. */
  const riportaDavanti = useRef<((i: number) => void) | null>(null);
  /** Ad archivio acceso: la cartella `i` davanti del tutto, prima che cada.
   *  Una promessa se deve scorrere, null se e' gia' pronta. */
  const preparaCaduta = useRef<((i: number) => Promise<void> | null) | null>(null);

  useEffect(() => {
    livello.current = movimento;
  }, [movimento]);

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
        // A pratica aperta la cartella e' caduta, e Lenis e' fermo: niente da
        // riscrivere. Si rifa' alla chiusura (vedi `dossier` sotto).
        if (praticaAperta()) return;
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
        if (praticaAperta()) return;
        misura();
        muovi();
      };
      // Come in SottoIlFoglio: chiusa la pratica, si rimisura quello che un
      // resize nel frattempo ha cambiato.
      const dossier = new MutationObserver(() => {
        if (!praticaAperta()) alResize();
      });

      /* Il ritorno: la pagina risale fin dove la cartella si e' appena fermata.
         Morbido per la linguetta a "full", istantaneo altrove e per il fuoco.
         Con Lenis acceso lo chiede a lui: uno scroll nativo mentre Lenis e'
         in corsa (un click subito dopo un giro di rotellina) lo riscrive il
         fotogramma dopo. Senza, "instant" e non "auto", che obbedisce a
         scroll-behavior. Le misure si rifanno qui: costano poco, e un
         carattere arrivato tardi puo' averle spostate. */
      const vaiA = (i: number, modo: "subito" | "svelto" | "morbido") => {
        misura();
        const y = Math.max(0, ritorno({ inizio, passo, fermi, i, schermo }));
        return scorri(y, modo === "morbido" && !lenisAttiva() && level !== "full" ? "subito" : modo);
      };
      /** Il ritorno morbido della linguetta in corsa, se ce n'e' uno. */
      let ritornoInCorsa: object | null = null;

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
        void vaiA(i, "subito");
      };

      const sezione = lista.closest("section") ?? lista;
      senzaSpostare(sezione, () => {
        lista.setAttribute("data-archivio-acceso", "");
        // La sezione e' appena cresciuta di qualche schermo: tutto quello che
        // sta sotto (le entrate, il percorso) va rimisurato.
        ScrollTrigger.refresh();
      });
      // Dopo l'accensione: i `top` sticky e i rettangoli valgono solo da qui.
      misura();
      muovi();
      riportaDavanti.current = (i) => {
        const questo = {};
        ritornoInCorsa = questo;
        void vaiA(i, "morbido").then(() => {
          if (ritornoInCorsa === questo) ritornoInCorsa = null;
        });
      };
      /* La cartella che si apre e' sempre davanti, o la pratica ferma Lenis a
         meta' e la cartella cade mezza coperta. Riportata con la linguetta e
         cliccata a ritorno in corsa: il ritorno si completa subito, e' gia'
         quasi finito. Solo in parte coperta: si torna indietro svelti e
         morbidi, e cade quando e' ferma. La profondita' si riscrive prima che
         data-dialog-open fermi muovi(). */
      preparaCaduta.current = (i) => {
        if (ritornoInCorsa) {
          ritornoInCorsa = null;
          void vaiA(i, "subito");
        } else if (quanto()[i] > 0.001) {
          return vaiA(i, "svelto").then(muovi);
        }
        muovi();
        return null;
      };

      window.addEventListener("scroll", alloScroll, { passive: true });
      window.addEventListener("resize", alResize);
      lista.addEventListener("focusin", alFuoco);
      dossier.observe(document.documentElement, { attributeFilter: ["data-dialog-open"] });

      return () => {
        cancelAnimationFrame(fotogramma);
        window.removeEventListener("scroll", alloScroll);
        window.removeEventListener("resize", alResize);
        lista.removeEventListener("focusin", alFuoco);
        dossier.disconnect();
        riportaDavanti.current = null;
        preparaCaduta.current = null;
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

  const chiudi = useCallback(() => {
    const c = corso.current;
    const dialog = dialogo.current;
    if (!c || !dialog) return;
    if (c.fase === "apre") {
      c.chiudiDopo = true;
      return;
    }
    if (c.fase !== "aperta" || !c.scivolata) return;
    c.fase = "chiude";
    void c.scivolata.chiudi(dialog);
  }, []);
  /* Tempi 3 e 4: partono quando ci sono tutti e due, la cartella che cade
     e il contenuto nel DOM (l'effetto dopo il commit). */
  const avanti = useCallback(
    (c: Corso) => {
      const dialog = dialogo.current;
      if (corso.current !== c || !c.scivolata || !c.montata || c.avviata || !dialog) return;
      c.avviata = true;
      void c.scivolata.apri(dialog).then(() => {
        if (corso.current !== c || c.fase !== "apre") return;
        c.fase = "aperta";
        if (c.chiudiDopo) chiudi();
      });
    },
    [chiudi],
  );

  /* Tempo 1, con la cartella davanti e in vista. data-dialog-open da qui:
     Lenis si ferma prima che la cartella cada, e lo scroll non riscrive
     `--profondita` mentre cade. */
  const cade = useCallback(
    (c: Corso) => {
      if (corso.current !== c) return;
      document.documentElement.setAttribute("data-dialog-open", "");
      c.scivolata = scivola(c.cartella, c.moto);
      avanti(c);
    },
    [avanti],
  );

  /* Il clic. L'archivio inerte da subito, perche' sotto la cartella caduta
     c'e' la faccia della precedente, e il contenuto nel DOM da subito. Se la
     cartella non e' davanti o non e' in vista la pagina scorre prima, svelta,
     e la cartella cade quando e' ferma. */
  const apri = useCallback(
    (i: number, cartella: Cartella) => {
      const c = corso.current;
      if (c) {
        if (c.fase === "risale") c.apriDopo = { i, cartella };
        return;
      }
      const moto: Moto = livello.current === "none" ? "dissolvenza" : "quattro-tempi";
      const nuovo: Corso = {
        fase: "apre",
        cartella,
        moto,
        scivolata: null,
        montata: false,
        avviata: false,
        chiudiDopo: false,
        apriDopo: null,
      };
      corso.current = nuovo;
      schedario.current?.setAttribute("inert", "");
      // La barra in basso resta finche' non arriva il velo (vedi sezioni/barra.css).
      document.documentElement.setAttribute("data-pratica-in-corso", "");
      setAttiva(i);
      const attesa =
        moto === "quattro-tempi" ? (preparaCaduta.current ? preparaCaduta.current(i) : portaInVista(cartella)) : null;
      if (attesa) void attesa.then(() => cade(nuovo));
      else cade(nuovo);
    },
    [cade],
  );


  /* Esc fra il clic e showModal(): la cartella cade e il dialog non c'e'
     ancora, quindi niente cancel. Non si perde: si chiude appena aperta. */
  useEffect(() => {
    const alTasto = (event: KeyboardEvent) => {
      const c = corso.current;
      if (event.key !== "Escape" || !c || c.fase !== "apre" || dialogo.current?.open) return;
      c.chiudiDopo = true;
    };
    document.addEventListener("keydown", alTasto);
    return () => document.removeEventListener("keydown", alTasto);
  }, []);

  /* La cartella e' di nuovo ferma: la pagina torna libera. Il fuoco torna
     esplicito su «Apri il caso»: la faccia cliccata non lo prende, e il
     ritorno nativo del dialog finirebbe su body. */
  const ferma = useCallback(
    (c: Corso) => {
      if (corso.current !== c) return;
      c.scivolata?.ferma();
      corso.current = null;
      schedario.current?.removeAttribute("inert");
      document.documentElement.removeAttribute("data-dialog-open");
      document.documentElement.removeAttribute("data-pratica-in-corso");
      c.cartella.apri.focus({ preventScroll: true });
      if (c.apriDopo) apri(c.apriDopo.i, c.apriDopo.cartella);
    },
    [apri],
  );

  /* Il close del dialog, da qualunque parte arrivi. Il close watcher (al
     secondo Esc, o col gesto indietro di Android) chiude il dialog da solo,
     anche a chiusura orchestrata gia' partita: quello che resta del foglio si
     salta sempre, e si passa alla risalita. Chiusa da chiudi(), il foglio e'
     gia' lasciato e rifarlo non cambia niente. */
  const alClose = useCallback(() => {
    setAttiva(null);
    const c = corso.current;
    const dialog = dialogo.current;
    if (!c || c.fase === "risale") return;
    if (dialog) c.scivolata?.lasciaIlFoglio(dialog);
    c.fase = "risale";
    void (c.scivolata?.risali() ?? Promise.resolve()).then(() => ferma(c));
  }, [ferma]);

  useEffect(() => {
    const c = corso.current;
    if (attiva === null || !c || c.fase !== "apre") return;
    c.montata = true;
    avanti(c);
  }, [attiva, avanti]);

  /* Smontato a meta': niente pagina bloccata ne' archivio inerte. */
  useEffect(() => {
    const lista = schedario.current;
    const dialog = dialogo.current;
    return () => {
      const c = corso.current;
      if (!c) return;
      corso.current = null;
      c.scivolata?.ferma();
      if (dialog?.open) dialog.close();
      lista?.removeAttribute("inert");
      document.documentElement.removeAttribute("data-dialog-open");
      document.documentElement.removeAttribute("data-pratica-in-corso");
    };
  }, []);

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
        style={{ ...MISURE, "--n": lavori.length } as CSSProperties}
      >
        {lavori.map((item, index) => (
          <WorkFolder
            key={item.id}
            data={item}
            index={index}
            totale={lavori.length}
            openLabel={labels.apri}
            riservatoLabel={labels.riservato}
            riportaLabel={labels.riporta}
            onOpen={(cartella) => apri(index, cartella)}
            onPreload={() => preloadShot(item.screenshot)}
            onRiporta={() => riporta(index)}
          />
        ))}
      </ol>

      <WorkDialog
        dialogo={dialogo}
        data={attiva === null ? null : (lavori[attiva] ?? null)}
        numero={(attiva ?? 0) + 1}
        totale={lavori.length}
        labels={labels}
        onChiudi={chiudi}
        onClose={alClose}
      />
    </>
  );
}
