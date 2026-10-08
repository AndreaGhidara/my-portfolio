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

export type Folder = {
  li: HTMLElement;
  tab: HTMLElement;
  spine: HTMLElement;
  face: HTMLElement;
  sheet: HTMLElement;
  /** «Apri il caso»: dove torna il fuoco a pratica chiusa. */
  openButton: HTMLElement;
};

/** I quattro tempi, oppure (movimento a "none") una dissolvenza e basta. */
export type FolderMotion = "four-beats" | "fade";

/** Quel tanto di Animation che serve qui, e che si sa finto senza WAAPI. */
export type Move = { finished: Promise<unknown>; cancel(): void };

export type Slide = {
  /** Tempi 3 e 4. Si chiama dopo il commit: il contenuto dev'essere nel DOM. */
  open(dialog: HTMLDialogElement): Promise<void>;
  /** La chiusura orchestrata: le parti svaniscono, il foglio si stringe, close(). */
  close(dialog: HTMLDialogElement): Promise<void>;
  /** Il dialog si e' chiuso senza chiedere: del foglio non si anima piu' niente. */
  releaseSheet(dialog: HTMLDialogElement): void;
  /** La cartella risale da sotto, e il foglio rientra nella tasca. */
  rise(): Promise<void>;
  /** Tutto fermo: fine corsa, o componente smontato a meta'. */
  stop(): void;
};

const EASE_SOFT = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Parte piano e accelera: e' una caduta. */
const EASE_FALL = "cubic-bezier(0.55, 0, 0.8, 0.35)";
const EASE_WIDEN = "cubic-bezier(0.65, 0, 0.2, 1)";
const EASE_NARROW = "cubic-bezier(0.5, 0, 0.2, 1)";
const EASE_RISE = "cubic-bezier(0.2, 0.8, 0.3, 1)";
const EASE_RETURN = "cubic-bezier(0.4, 0, 0.2, 1)";

/** Di quanto sale il foglio sfilando: di piu' finiva sotto la barra del sito. */
const LIFT = 22;
const TILT = -1.4;

/**
 * Element.animate, o un'animazione gia' finita dove non esiste (jsdom): il
 * resto del codice non deve sapere se il browser anima davvero.
 */
export function animate(
  el: Element,
  frames: Keyframe[],
  { duration, delay = 0, easing = EASE_SOFT }: { duration: number; delay?: number; easing?: string },
): Move {
  if (typeof el.animate !== "function") return { finished: Promise.resolve(), cancel() {} };
  return el.animate(frames, { duration, delay, easing, fill: "both" });
}

/** cancel() rigetta `finished`: chi aspettava una mossa fermata smette e basta. */
const allSettled = (moves: Move[]) =>
  Promise.all(moves.map((m) => m.finished.catch(() => undefined))).then(() => undefined);

export function slide(c: Folder, motion: FolderMotion): Slide {
  /* Due mucchi: quello del dialog se ne va col foglio della pratica, quello
     della cartella solo quando la cartella e' di nuovo al suo posto. */
  const onDialog = new Set<Move>();
  const onFolder = new Set<Move>();
  const move = (pile: Set<Move>, el: Element, frames: Keyframe[], options: Parameters<typeof animate>[2]) => {
    const m = animate(el, frames, options);
    pile.add(m);
    return m;
  };
  const cancelAll = (pile: Set<Move>) => {
    for (const m of pile) m.cancel();
    pile.clear();
  };

  let stopped = false;
  let sheetReleased = false;
  let openDialog: HTMLDialogElement | null = null;
  const falling = [c.tab, c.spine, c.face];

  // Misurato al clic, dopo che useProfondita ha riportato davanti la cartella.
  const liftedHeight = c.face.offsetHeight - 16;
  const drop = window.innerHeight - c.li.getBoundingClientRect().top + 40;
  const shadow = getComputedStyle(c.li).getPropertyValue("--folder-shadow").trim();
  const pulledOut: Keyframe = {
    height: `${liftedHeight}px`,
    translate: `0 ${-LIFT}px`,
    rotate: `${TILT}deg`,
    boxShadow: `0 18px 40px -18px ${shadow}`,
  };
  const fallen = (i: number): Keyframe => ({ translate: `0 ${drop}px`, rotate: `${i === 2 ? 1.6 : 1}deg` });

  let pullOut: Move | null = null;
  let descents: Move[] = [];
  let fallDone: Promise<void> = Promise.resolve();

  if (motion === "four-beats") {
    // 1. SFILA. Un fotogramma solo: si parte dal foglio com'e' nel CSS.
    pullOut = move(onFolder, c.sheet, [pulledOut], { duration: 420 });
    // 2. SCENDE. La faccia un attimo dopo la linguetta: la cartella si piega
    // appena cadendo, invece di scendere come un blocco.
    descents = falling.map((el, i) =>
      move(onFolder, el, [{ translate: "0 0", rotate: "0deg" }, fallen(i)], {
        duration: 620,
        delay: 240 + i * 25,
        easing: EASE_FALL,
      }),
    );
    fallDone = allSettled([pullOut, ...descents]);
  }

  /**
   * Da dove parte il foglio della pratica: il foglio della cartella com'e'
   * dopo «sfila», ma misurato dritto, dalla sua scatola e non dal rettangolo
   * (che di un elemento ruotato e' quello che lo contiene). L'inclinazione
   * torna nel FLIP come rotate, e i due centri di rotazione coincidono.
   * Della pratica conta solo la parte nello schermo: sul telefono il resto e'
   * sotto, si scorre, e si taglia finche' il foglio si allarga.
   */
  const startShape = (dossier: HTMLElement) => {
    const li = c.li.getBoundingClientRect();
    const r = {
      left: li.left + c.sheet.offsetLeft,
      top: li.top + c.sheet.offsetTop - LIFT,
      width: c.sheet.offsetWidth,
      height: c.sheet.offsetHeight,
    };
    const d = dossier.getBoundingClientRect();
    const visible = Math.max(1, Math.min(d.height, window.innerHeight - d.top));
    const below = d.height - visible;
    return {
      transformOrigin: `50% ${visible / 2}px`,
      transform: `translate(${r.left + r.width / 2 - (d.left + d.width / 2)}px, ${
        r.top + r.height / 2 - (d.top + visible / 2)
      }px) rotate(${TILT}deg) scale(${r.width / d.width}, ${r.height / visible})`,
      // -3rem: la linguetta della pratica sta sopra il foglio, e resta.
      clipPath: `inset(-3rem -3rem ${below > 0 ? `${below}px` : "-3rem"} -3rem)`,
      // Sullo scuro il foglio della cartella e' un tono sotto la carta.
      tone: getComputedStyle(c.sheet).backgroundColor,
      paper: getComputedStyle(dossier).backgroundColor,
    };
  };

  const releaseSheet = (dialog: HTMLDialogElement) => {
    sheetReleased = true;
    cancelAll(onDialog);
    dialog.removeAttribute("data-veil");
  };

  /* Via tutto quello che sta sul foglio PRIMA di close(), nello stesso task:
     nessun fotogramma mostra la pratica grande un attimo prima di sparire. */
  const closeDialog = (dialog: HTMLDialogElement) => {
    releaseSheet(dialog);
    dialog.close();
  };

  const stop = () => {
    stopped = true;
    cancelAll(onDialog);
    cancelAll(onFolder);
    openDialog?.removeAttribute("data-veil");
  };

  return {
    async open(dialog) {
      openDialog = dialog;
      if (motion === "fade") {
        // Sincrono fino al primo await: a "none" il dialog e' aperto appena
        // dopo il commit, senza aspettare niente.
        if (!dialog.open) dialog.showModal();
        dialog.setAttribute("data-veil", "");
        const fadeIn = move(onDialog, dialog, [{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
        await allSettled([fadeIn]);
        if (stopped || sheetReleased) return;
        cancelAll(onDialog);
        return;
      }

      await fallDone;
      const dossier = dialog.querySelector<HTMLElement>("[data-dossier]");
      if (stopped || sheetReleased || !dossier) return;
      const parts = Array.from(dialog.querySelectorAll<HTMLElement>("[data-enter]"));

      // 3. APRE.
      if (!dialog.open) dialog.showModal();
      dialog.scrollTop = 0;
      const { tone, paper, ...shape } = startShape(dossier);
      // Il foglio della cartella lo copre la pratica, che parte identica.
      move(onDialog, c.sheet, [{ visibility: "hidden" }, { visibility: "hidden" }], { duration: 1 });
      // Il velo arriva in transizione: serve un fotogramma col ::backdrop gia'
      // disegnato trasparente.
      requestAnimationFrame(() => {
        if (!stopped && !sheetReleased) dialog.setAttribute("data-veil", "");
      });
      const widen = move(
        onDialog,
        dossier,
        [
          { ...shape, backgroundColor: tone },
          { ...shape, transform: "none", backgroundColor: paper },
        ],
        { duration: 660, easing: EASE_WIDEN },
      );
      // 4. ENTRA. Le parti partono prima che il foglio abbia finito: la
      // pratica sembra riempirsi mentre si apre, non dopo.
      const entering = parts.map((p, i) =>
        move(onDialog, p, [{ opacity: 0, translate: "0 12px" }, { opacity: 1, translate: "0 0" }], {
          duration: 380,
          delay: 470 + Math.min(i, 6) * 60,
        }),
      );
      await allSettled([widen, ...entering]);
      if (stopped || sheetReleased) return;
      // Aperta, la pratica e' il suo CSS: il taglio del telefono se ne va, e
      // si scorre fino in fondo. Il foglio della cartella resta nascosto.
      widen.cancel();
      onDialog.delete(widen);
      for (const m of entering) {
        m.cancel();
        onDialog.delete(m);
      }
    },

    async close(dialog) {
      if (motion === "fade") {
        dialog.removeAttribute("data-veil");
        const out = move(onDialog, dialog, [{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-in" });
        await allSettled([out]);
        if (stopped || sheetReleased) return;
        closeDialog(dialog);
        return;
      }

      const dossier = dialog.querySelector<HTMLElement>("[data-dossier]");
      const parts = Array.from(dialog.querySelectorAll<HTMLElement>("[data-enter]"));
      const out = parts.map((p) =>
        move(onDialog, p, [{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: "ease-out" }),
      );
      await allSettled(out);
      if (stopped || sheetReleased) return;
      if (!dossier) {
        closeDialog(dialog);
        return;
      }
      // Si torna in cima prima di stringere: il foglio rientra dalla sua testa.
      dialog.scrollTop = 0;
      const sheet = dossier.querySelector<HTMLElement>("[data-dossier-sheet]");
      if (sheet) sheet.scrollTop = 0;
      dialog.removeAttribute("data-veil");
      // Rimisurata qui e non riusata dall'apertura: nel frattempo lo schermo
      // puo' aver cambiato misura.
      const { tone, paper, ...shape } = startShape(dossier);
      const shrink = move(
        onDialog,
        dossier,
        [
          { ...shape, transform: "none", backgroundColor: paper },
          { ...shape, backgroundColor: tone },
        ],
        { duration: 480, easing: EASE_NARROW },
      );
      await allSettled([shrink]);
      if (stopped || sheetReleased) return;
      closeDialog(dialog);
    },

    releaseSheet,

    async rise() {
      if (motion === "fade" || stopped) return;
      // La cartella risale da sotto e si assesta; parte prima la faccia.
      for (const m of descents) {
        m.cancel();
        onFolder.delete(m);
      }
      const rising = falling.map((el, i) =>
        move(
          onFolder,
          el,
          [fallen(i), { translate: "0 -6px", rotate: "0deg", offset: 0.82 }, { translate: "0 0", rotate: "0deg" }],
          { duration: 640, delay: (2 - i) * 25, easing: EASE_RISE },
        ),
      );
      await allSettled(rising);
      if (stopped) return;
      // Il foglio rientra quando la faccia e' di nuovo al suo posto. Un
      // fotogramma solo, di partenza: si arriva al foglio del CSS.
      if (pullOut) {
        pullOut.cancel();
        onFolder.delete(pullOut);
      }
      const settle = move(onFolder, c.sheet, [{ ...pulledOut, offset: 0 }], { duration: 380, easing: EASE_RETURN });
      await allSettled([settle]);
      if (stopped) return;
      stop();
    },

    stop,
  };
}
