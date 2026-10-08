/**
 * La cartella scivola via e si apre la pratica.
 *
 * Quattro tempi, tarati nel prototipo
 * (docs/prototipi/2026-09-28-cartella-scivola.html):
 * 1. SFILA   il foglio esce dalla tasca: si allunga dietro la faccia, sale di
 *            poco e si storta appena, come preso per il bordo;
 * 2. SCENDE  linguetta, dorso e faccia cadono fuori dallo schermo, accelerando;
 *            il foglio resta in aria;
 * 3. APRE    il <dialog> si apre e il foglio della pratica parte con forma e
 *            posizione del foglio della cartella, poi si allarga al suo posto;
 * 4. ENTRA   le parti della pratica arrivano una dopo l'altra, sul finire
 *            dell'allargamento.
 * La chiusura fa gli stessi passi al contrario, e la cartella risale con un
 * assestamento di 6px.
 *
 * Della cartella si animano solo `translate` e `rotate` (piu' altezza e ombra
 * del foglio): le cartelle archiviate hanno gia' `scale` e `filter` dalla loro
 * profondita', e useProfondita misura la cartella. Niente stili in linea: a fine
 * corsa si cancellano le animazioni e resta il CSS di prima.
 */

export type Cartella = {
  li: HTMLElement;
  linguetta: HTMLElement;
  dorso: HTMLElement;
  faccia: HTMLElement;
  foglio: HTMLElement;
  /** «Apri il caso»: dove torna il fuoco a pratica chiusa. */
  apri: HTMLElement;
};

/** I quattro tempi, oppure (movimento a "none") una dissolvenza e basta. */
export type Moto = "quattro-tempi" | "dissolvenza";

/** Quel tanto di Animation che serve qui, e che si sa finto senza WAAPI. */
export type Mossa = { finished: Promise<unknown>; cancel(): void };

export type Scivolata = {
  /** Tempi 3 e 4. Si chiama dopo il commit: il contenuto dev'essere nel DOM. */
  apri(dialog: HTMLDialogElement): Promise<void>;
  /** La chiusura orchestrata: le parti svaniscono, il foglio si stringe, close(). */
  chiudi(dialog: HTMLDialogElement): Promise<void>;
  /** Il dialog si e' chiuso senza chiedere: del foglio non si anima piu' niente. */
  lasciaIlFoglio(dialog: HTMLDialogElement): void;
  /** La cartella risale da sotto, e il foglio rientra nella tasca. */
  risali(): Promise<void>;
  /** Tutto fermo: fine corsa, o componente smontato a meta'. */
  ferma(): void;
};

const MORBIDO = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Parte piano e accelera: e' una caduta. */
const CADE = "cubic-bezier(0.55, 0, 0.8, 0.35)";
const ALLARGA = "cubic-bezier(0.65, 0, 0.2, 1)";
const STRINGE = "cubic-bezier(0.5, 0, 0.2, 1)";
const SALE = "cubic-bezier(0.2, 0.8, 0.3, 1)";
const RIENTRA = "cubic-bezier(0.4, 0, 0.2, 1)";

/** Di quanto sale il foglio sfilando: di piu' finiva sotto la barra del sito. */
const SU = 22;
const INCLINA = -1.4;

/**
 * Element.animate, o un'animazione gia' finita dove non esiste (jsdom): il
 * resto del codice non deve sapere se il browser anima davvero.
 */
export function anima(
  el: Element,
  frames: Keyframe[],
  { durata, ritardo = 0, curva = MORBIDO }: { durata: number; ritardo?: number; curva?: string },
): Mossa {
  if (typeof el.animate !== "function") return { finished: Promise.resolve(), cancel() {} };
  return el.animate(frames, { duration: durata, delay: ritardo, easing: curva, fill: "both" });
}

/** cancel() rigetta `finished`: chi aspettava una mossa fermata smette e basta. */
const finite = (mosse: Mossa[]) =>
  Promise.all(mosse.map((m) => m.finished.catch(() => undefined))).then(() => undefined);

export function scivola(c: Cartella, moto: Moto): Scivolata {
  /* Due mucchi: quello del dialog se ne va col foglio della pratica, quello
     della cartella solo quando la cartella e' di nuovo al suo posto. */
  const suDialog = new Set<Mossa>();
  const suCartella = new Set<Mossa>();
  const muovi = (mucchio: Set<Mossa>, el: Element, frames: Keyframe[], opzioni: Parameters<typeof anima>[2]) => {
    const m = anima(el, frames, opzioni);
    mucchio.add(m);
    return m;
  };
  const cancella = (mucchio: Set<Mossa>) => {
    for (const m of mucchio) m.cancel();
    mucchio.clear();
  };

  let fermo = false;
  let senzaFoglio = false;
  let dialogAperto: HTMLDialogElement | null = null;
  const cade = [c.linguetta, c.dorso, c.faccia];

  // Misurato al clic, dopo che useProfondita ha riportato davanti la cartella.
  const alto = c.faccia.offsetHeight - 16;
  const giu = window.innerHeight - c.li.getBoundingClientRect().top + 40;
  const ombra = getComputedStyle(c.li).getPropertyValue("--cartella-ombra").trim();
  const sfilato: Keyframe = {
    height: `${alto}px`,
    translate: `0 ${-SU}px`,
    rotate: `${INCLINA}deg`,
    boxShadow: `0 18px 40px -18px ${ombra}`,
  };
  const caduto = (i: number): Keyframe => ({ translate: `0 ${giu}px`, rotate: `${i === 2 ? 1.6 : 1}deg` });

  let sfila: Mossa | null = null;
  let scende: Mossa[] = [];
  let caduta: Promise<void> = Promise.resolve();

  if (moto === "quattro-tempi") {
    // 1. SFILA. Un fotogramma solo: si parte dal foglio com'e' nel CSS.
    sfila = muovi(suCartella, c.foglio, [sfilato], { durata: 420 });
    // 2. SCENDE. La faccia un attimo dopo la linguetta: la cartella si piega
    // appena cadendo, invece di scendere come un blocco.
    scende = cade.map((el, i) =>
      muovi(suCartella, el, [{ translate: "0 0", rotate: "0deg" }, caduto(i)], {
        durata: 620,
        ritardo: 240 + i * 25,
        curva: CADE,
      }),
    );
    caduta = finite([sfila, ...scende]);
  }

  /**
   * Da dove parte il foglio della pratica: il foglio della cartella com'e'
   * dopo «sfila», ma misurato dritto, dalla sua scatola e non dal rettangolo
   * (che di un elemento ruotato e' quello che lo contiene). L'inclinazione
   * torna nel FLIP come rotate, e i due centri di rotazione coincidono.
   * Della pratica conta solo la parte nello schermo: sul telefono il resto e'
   * sotto, si scorre, e si taglia finche' il foglio si allarga.
   */
  const partenza = (pratica: HTMLElement) => {
    const li = c.li.getBoundingClientRect();
    const r = {
      left: li.left + c.foglio.offsetLeft,
      top: li.top + c.foglio.offsetTop - SU,
      width: c.foglio.offsetWidth,
      height: c.foglio.offsetHeight,
    };
    const d = pratica.getBoundingClientRect();
    const alta = Math.max(1, Math.min(d.height, window.innerHeight - d.top));
    const sotto = d.height - alta;
    return {
      transformOrigin: `50% ${alta / 2}px`,
      transform: `translate(${r.left + r.width / 2 - (d.left + d.width / 2)}px, ${
        r.top + r.height / 2 - (d.top + alta / 2)
      }px) rotate(${INCLINA}deg) scale(${r.width / d.width}, ${r.height / alta})`,
      // -3rem: la linguetta della pratica sta sopra il foglio, e resta.
      clipPath: `inset(-3rem -3rem ${sotto > 0 ? `${sotto}px` : "-3rem"} -3rem)`,
      // Sullo scuro il foglio della cartella e' un tono sotto la carta.
      tono: getComputedStyle(c.foglio).backgroundColor,
      carta: getComputedStyle(pratica).backgroundColor,
    };
  };

  const lasciaIlFoglio = (dialog: HTMLDialogElement) => {
    senzaFoglio = true;
    cancella(suDialog);
    dialog.removeAttribute("data-velo");
  };

  /* Via tutto quello che sta sul foglio PRIMA di close(), nello stesso task:
     nessun fotogramma mostra la pratica grande un attimo prima di sparire. */
  const chiudiDialog = (dialog: HTMLDialogElement) => {
    lasciaIlFoglio(dialog);
    dialog.close();
  };

  const ferma = () => {
    fermo = true;
    cancella(suDialog);
    cancella(suCartella);
    dialogAperto?.removeAttribute("data-velo");
  };

  return {
    async apri(dialog) {
      dialogAperto = dialog;
      if (moto === "dissolvenza") {
        // Sincrono fino al primo await: a "none" il dialog e' aperto appena
        // dopo il commit, senza aspettare niente.
        if (!dialog.open) dialog.showModal();
        dialog.setAttribute("data-velo", "");
        const entra = muovi(suDialog, dialog, [{ opacity: 0 }, { opacity: 1 }], { durata: 180, curva: "ease-out" });
        await finite([entra]);
        if (fermo || senzaFoglio) return;
        cancella(suDialog);
        return;
      }

      await caduta;
      const pratica = dialog.querySelector<HTMLElement>("[data-pratica]");
      if (fermo || senzaFoglio || !pratica) return;
      const parti = Array.from(dialog.querySelectorAll<HTMLElement>("[data-entra]"));

      // 3. APRE.
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      const { tono, carta, ...forma } = partenza(pratica);
      // Il foglio della cartella lo copre la pratica, che parte identica.
      muovi(suDialog, c.foglio, [{ visibility: "hidden" }, { visibility: "hidden" }], { durata: 1 });
      // Il velo arriva in transizione: serve un fotogramma col ::backdrop gia'
      // disegnato trasparente.
      requestAnimationFrame(() => {
        if (!fermo && !senzaFoglio) dialog.setAttribute("data-velo", "");
      });
      const apre = muovi(
        suDialog,
        pratica,
        [
          { ...forma, backgroundColor: tono },
          { ...forma, transform: "none", backgroundColor: carta },
        ],
        { durata: 660, curva: ALLARGA },
      );
      // 4. ENTRA. Le parti partono prima che il foglio abbia finito: la
      // pratica sembra riempirsi mentre si apre, non dopo.
      const entrano = parti.map((p, i) =>
        muovi(suDialog, p, [{ opacity: 0, translate: "0 12px" }, { opacity: 1, translate: "0 0" }], {
          durata: 380,
          ritardo: 470 + Math.min(i, 6) * 60,
        }),
      );
      await finite([apre, ...entrano]);
      if (fermo || senzaFoglio) return;
      // Aperta, la pratica e' il suo CSS: il taglio del telefono se ne va, e
      // si scorre fino in fondo. Il foglio della cartella resta nascosto.
      apre.cancel();
      suDialog.delete(apre);
      for (const m of entrano) {
        m.cancel();
        suDialog.delete(m);
      }
    },

    async chiudi(dialog) {
      if (moto === "dissolvenza") {
        dialog.removeAttribute("data-velo");
        const esce = muovi(suDialog, dialog, [{ opacity: 1 }, { opacity: 0 }], { durata: 140, curva: "ease-in" });
        await finite([esce]);
        if (fermo || senzaFoglio) return;
        chiudiDialog(dialog);
        return;
      }

      const pratica = dialog.querySelector<HTMLElement>("[data-pratica]");
      const parti = Array.from(dialog.querySelectorAll<HTMLElement>("[data-entra]"));
      const esce = parti.map((p) =>
        muovi(suDialog, p, [{ opacity: 1 }, { opacity: 0 }], { durata: 140, curva: "ease-out" }),
      );
      await finite(esce);
      if (fermo || senzaFoglio) return;
      if (!pratica) {
        chiudiDialog(dialog);
        return;
      }
      // Si torna in cima prima di stringere: il foglio rientra dalla sua testa.
      dialog.scrollTop = 0;
      const foglio = pratica.querySelector<HTMLElement>("[data-pratica-foglio]");
      if (foglio) foglio.scrollTop = 0;
      dialog.removeAttribute("data-velo");
      // Rimisurata qui e non riusata dall'apertura: nel frattempo lo schermo
      // puo' aver cambiato misura.
      const { tono, carta, ...forma } = partenza(pratica);
      const rientra = muovi(
        suDialog,
        pratica,
        [
          { ...forma, transform: "none", backgroundColor: carta },
          { ...forma, backgroundColor: tono },
        ],
        { durata: 480, curva: STRINGE },
      );
      await finite([rientra]);
      if (fermo || senzaFoglio) return;
      chiudiDialog(dialog);
    },

    lasciaIlFoglio,

    async risali() {
      if (moto === "dissolvenza" || fermo) return;
      // La cartella risale da sotto e si assesta; parte prima la faccia.
      for (const m of scende) {
        m.cancel();
        suCartella.delete(m);
      }
      const sale = cade.map((el, i) =>
        muovi(
          suCartella,
          el,
          [caduto(i), { translate: "0 -6px", rotate: "0deg", offset: 0.82 }, { translate: "0 0", rotate: "0deg" }],
          { durata: 640, ritardo: (2 - i) * 25, curva: SALE },
        ),
      );
      await finite(sale);
      if (fermo) return;
      // Il foglio rientra quando la faccia e' di nuovo al suo posto. Un
      // fotogramma solo, di partenza: si arriva al foglio del CSS.
      if (sfila) {
        sfila.cancel();
        suCartella.delete(sfila);
      }
      const riposa = muovi(suCartella, c.foglio, [{ ...sfilato, offset: 0 }], { durata: 380, curva: RIENTRA });
      await finite([riposa]);
      if (fermo) return;
      ferma();
    },

    ferma,
  };
}
