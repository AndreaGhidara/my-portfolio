"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { NO_DOSSIER, dossierReducer, type DossierEvent, type Dossier } from "./dossier";
import { slide, type Folder, type Slide } from "./slide";

/** Una pratica aperta ferma tutto quello che misura la pagina sotto. */
export const isDossierOpen = () => document.documentElement.hasAttribute("data-dialog-open");

/**
 * Aprire e chiudere la pratica. Gli stati e le loro regole sono in pratica.ts,
 * puri; qui c'e' quello che ogni passaggio fa alla pagina: l'archivio inerte,
 * gli attributi su <html>, la cartella che cade e risale, il fuoco.
 *
 * Lo stato del dossier sta qui e non nelle singole cartelle perche' il dialog e'
 * uno solo: uno per cartella significherebbe quattro <dialog> nel DOM, quattro
 * trappole di focus e la certezza che prima o poi se ne aprano due. Qui sta
 * anche la coda: aprire e chiudere durano un secondo e mezzo ciascuno, e un
 * clic o un Esc nel mezzo non si perde ne' si accavalla.
 *
 * Lo stato sta in un ref e non in useReducer: ogni passaggio fa i suoi effetti
 * subito, nello stesso giro del clic o della promessa che l'ha mosso, come
 * prima. Con useReducer aspetterebbero un render.
 *
 * `prepara` porta la cartella in vista prima che cada (vedi useProfondita).
 */
export function useDossier(
  schedario: RefObject<HTMLOListElement | null>,
  prepara: (i: number, cartella: Folder) => Promise<void> | null,
) {
  const [attiva, setAttiva] = useState<number | null>(null);
  const movimento = useMotionLevel();
  const dialogo = useRef<HTMLDialogElement | null>(null);
  const stato = useRef<Dossier<Folder>>(NO_DOSSIER);
  /** La cartella che cade: un'animazione, che nello stato puro non entra. */
  const scivolata = useRef<Slide | null>(null);

  const manda = useCallback(
    function manda(evento: DossierEvent<Folder>) {
      const prima = stato.current;
      const dopo = dossierReducer(prima, evento);
      if (dopo === prima) return;
      stato.current = dopo;
      const p = prima.run;
      const c = dopo.run;
      const { gen } = dopo;

      /* Il clic. L'archivio inerte da subito, perche' sotto la cartella caduta
         c'e' la faccia della precedente, e il contenuto nel DOM da subito. Se
         la cartella non e' davanti o non e' in vista la pagina scorre prima,
         svelta, e la cartella cade quando e' ferma. */
      if (!p) {
        if (!c) return;
        schedario.current?.setAttribute("inert", "");
        // La barra in basso resta finche' non arriva il velo (vedi sezioni/barra.css).
        document.documentElement.setAttribute("data-dossier-in-progress", "");
        setAttiva(c.i);
        const attesa = c.motion === "quattro-tempi" ? prepara(c.i, c.folder) : null;
        if (attesa) void attesa.then(() => manda({ type: "cade", gen }));
        else manda({ type: "cade", gen });
        return;
      }

      /* La cartella e' di nuovo ferma: la pagina torna libera. Il fuoco torna
         esplicito su «Apri il caso»: la faccia cliccata non lo prende, e il
         ritorno nativo del dialog finirebbe su body. */
      if (!c) {
        scivolata.current?.stop();
        scivolata.current = null;
        schedario.current?.removeAttribute("inert");
        document.documentElement.removeAttribute("data-dialog-open");
        document.documentElement.removeAttribute("data-dossier-in-progress");
        p.folder.openButton.focus({ preventScroll: true });
        if (p.openAfter) manda({ type: "apri", ...p.openAfter });
        return;
      }

      const dialog = dialogo.current;
      /* Tempo 1, con la cartella davanti e in vista. data-dialog-open da qui:
         Lenis si ferma prima che la cartella cada, e lo scroll non riscrive
         `--profondita` mentre cade. */
      if (c.fall && !p.fall) {
        document.documentElement.setAttribute("data-dialog-open", "");
        scivolata.current = slide(c.folder, c.motion);
      }
      // Tempi 3 e 4: il reducer li avvia quando ci sono la caduta e il contenuto.
      if (c.started && !p.started && dialog) {
        void scivolata.current?.open(dialog).then(() => manda({ type: "aperta", gen }));
      }
      if (c.phase === "chiude" && p.phase !== "chiude" && dialog) {
        void scivolata.current?.close(dialog);
      }
      /* Il close del dialog, da qualunque parte arrivi. Il close watcher (al
         secondo Esc, o col gesto indietro di Android) chiude il dialog da solo,
         anche a chiusura orchestrata gia' partita: quello che resta del foglio
         si salta sempre, e si passa alla risalita. Chiusa da chiudi(), il
         foglio e' gia' lasciato e rifarlo non cambia niente. */
      if (c.phase === "risale" && p.phase !== "risale") {
        if (dialog) scivolata.current?.releaseSheet(dialog);
        void (scivolata.current?.rise() ?? Promise.resolve()).then(() => manda({ type: "ferma", gen }));
      }
    },
    [schedario, prepara],
  );

  const apri = useCallback(
    (i: number, cartella: Folder) =>
      manda({ type: "apri", i, folder: cartella, motion: movimento === "none" ? "dissolvenza" : "quattro-tempi" }),
    [manda, movimento],
  );

  const chiudi = useCallback(() => manda({ type: "chiudi" }), [manda]);

  const alClose = useCallback(() => {
    setAttiva(null);
    manda({ type: "chiusa" });
  }, [manda]);

  useEffect(() => {
    if (attiva !== null) manda({ type: "montata" });
  }, [attiva, manda]);

  /* Esc fra il clic e showModal(): la cartella cade e il dialog non c'e'
     ancora, quindi niente cancel. Non si perde: si chiude appena aperta. */
  useEffect(() => {
    const alTasto = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || dialogo.current?.open) return;
      manda({ type: "esc" });
    };
    document.addEventListener("keydown", alTasto);
    return () => document.removeEventListener("keydown", alTasto);
  }, [manda]);

  /* Smontato a meta': niente pagina bloccata ne' archivio inerte. */
  useEffect(() => {
    const lista = schedario.current;
    const dialog = dialogo.current;
    return () => {
      if (!stato.current.run) return;
      stato.current = dossierReducer(stato.current, { type: "smonta" });
      scivolata.current?.stop();
      scivolata.current = null;
      if (dialog?.open) dialog.close();
      lista?.removeAttribute("inert");
      document.documentElement.removeAttribute("data-dialog-open");
      document.documentElement.removeAttribute("data-dossier-in-progress");
    };
  }, [schedario]);

  return { attiva, dialogo, apri, chiudi, alClose };
}
