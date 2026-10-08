"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { NO_DOSSIER, dossierReducer, type Dossier, type DossierEvent } from "./dossier";
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
  shelf: RefObject<HTMLOListElement | null>,
  prepare: (i: number, folder: Folder) => Promise<void> | null,
) {
  const [active, setActive] = useState<number | null>(null);
  const motionLevel = useMotionLevel();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const state = useRef<Dossier<Folder>>(NO_DOSSIER);
  /** La cartella che cade: un'animazione, che nello stato puro non entra. */
  const slideRef = useRef<Slide | null>(null);

  const send = useCallback(
    function send(event: DossierEvent<Folder>) {
      const before = state.current;
      const after = dossierReducer(before, event);
      if (after === before) return;
      state.current = after;
      const p = before.run;
      const c = after.run;
      const { gen } = after;

      /* Il clic. L'archivio inerte da subito, perche' sotto la cartella caduta
         c'e' la faccia della precedente, e il contenuto nel DOM da subito. Se
         la cartella non e' davanti o non e' in vista la pagina scorre prima,
         svelta, e la cartella cade quando e' ferma. */
      if (!p) {
        if (!c) return;
        shelf.current?.setAttribute("inert", "");
        // La barra in basso resta finche' non arriva il velo (vedi sezioni/barra.css).
        document.documentElement.setAttribute("data-dossier-in-progress", "");
        setActive(c.i);
        const pending = c.motion === "four-beats" ? prepare(c.i, c.folder) : null;
        if (pending) void pending.then(() => send({ type: "fall", gen }));
        else send({ type: "fall", gen });
        return;
      }

      /* La cartella e' di nuovo ferma: la pagina torna libera. Il fuoco torna
         esplicito su «Apri il caso»: la faccia cliccata non lo prende, e il
         ritorno nativo del dialog finirebbe su body. */
      if (!c) {
        slideRef.current?.stop();
        slideRef.current = null;
        shelf.current?.removeAttribute("inert");
        document.documentElement.removeAttribute("data-dialog-open");
        document.documentElement.removeAttribute("data-dossier-in-progress");
        p.folder.openButton.focus({ preventScroll: true });
        if (p.openAfter) send({ type: "open", ...p.openAfter });
        return;
      }

      const dialog = dialogRef.current;
      /* Tempo 1, con la cartella davanti e in vista. data-dialog-open da qui:
         Lenis si ferma prima che la cartella cada, e lo scroll non riscrive
         `--profondita` mentre cade. */
      if (c.fall && !p.fall) {
        document.documentElement.setAttribute("data-dialog-open", "");
        slideRef.current = slide(c.folder, c.motion);
      }
      // Tempi 3 e 4: il reducer li avvia quando ci sono la caduta e il contenuto.
      if (c.started && !p.started && dialog) {
        void slideRef.current?.open(dialog).then(() => send({ type: "opened", gen }));
      }
      if (c.phase === "closing" && p.phase !== "closing" && dialog) {
        void slideRef.current?.close(dialog);
      }
      /* Il close del dialog, da qualunque parte arrivi. Il close watcher (al
         secondo Esc, o col gesto indietro di Android) chiude il dialog da solo,
         anche a chiusura orchestrata gia' partita: quello che resta del foglio
         si salta sempre, e si passa alla risalita. Chiusa da chiudi(), il
         foglio e' gia' lasciato e rifarlo non cambia niente. */
      if (c.phase === "rising" && p.phase !== "rising") {
        if (dialog) slideRef.current?.releaseSheet(dialog);
        void (slideRef.current?.rise() ?? Promise.resolve()).then(() => send({ type: "settled", gen }));
      }
    },
    [shelf, prepare],
  );

  const open = useCallback(
    (i: number, folder: Folder) =>
      send({ type: "open", i, folder, motion: motionLevel === "none" ? "fade" : "four-beats" }),
    [send, motionLevel],
  );

  const close = useCallback(() => send({ type: "close" }), [send]);

  const onClose = useCallback(() => {
    setActive(null);
    send({ type: "closed" });
  }, [send]);

  useEffect(() => {
    if (active !== null) send({ type: "mounted" });
  }, [active, send]);

  /* Esc fra il clic e showModal(): la cartella cade e il dialog non c'e'
     ancora, quindi niente cancel. Non si perde: si chiude appena aperta. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || dialogRef.current?.open) return;
      send({ type: "esc" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [send]);

  /* Smontato a meta': niente pagina bloccata ne' archivio inerte. */
  useEffect(() => {
    const list = shelf.current;
    const dialog = dialogRef.current;
    return () => {
      if (!state.current.run) return;
      state.current = dossierReducer(state.current, { type: "unmount" });
      slideRef.current?.stop();
      slideRef.current = null;
      if (dialog?.open) dialog.close();
      list?.removeAttribute("inert");
      document.documentElement.removeAttribute("data-dialog-open");
      document.documentElement.removeAttribute("data-dossier-in-progress");
    };
  }, [shelf]);

  return { active, dialogRef, open, close, onClose };
}
