"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { NO_DOSSIER, dossierReducer, type Dossier, type DossierEvent } from "./dossier";
import { slide, type Folder, type Slide } from "./slide";

/** Una pratica aperta ferma tutto quello che misura la pagina sotto. */
export const isDossierOpen = () => document.documentElement.hasAttribute("data-dialog-open");

/** Un dialog solo per tutte le cartelle: uno per cartella vorrebbe dire quattro
 *  trappole di focus e prima o poi due aperte insieme. Lo stato sta in un ref e
 *  non in useReducer perche' gli effetti partano nello stesso giro del clic o
 *  della promessa, non al render dopo. */
export function useDossier(
  shelf: RefObject<HTMLOListElement | null>,
  prepare: (i: number, folder: Folder) => Promise<void> | null,
) {
  const [active, setActive] = useState<number | null>(null);
  const motionLevel = useMotionLevel();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const state = useRef<Dossier<Folder>>(NO_DOSSIER);
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

      // Archivio inerte da subito: sotto la cartella caduta c'e' la faccia
      // della precedente, e non deve prendere clic.
      if (!p) {
        if (!c) return;
        shelf.current?.setAttribute("inert", "");
        // La barra in basso resta finche' non arriva il velo (vedi sections/bottom-nav.css).
        document.documentElement.setAttribute("data-dossier-in-progress", "");
        setActive(c.i);
        // Se la cartella non e' davanti o in vista la pagina scorre prima, svelta,
        // e la cartella cade a scorrimento fermo: per questo prepare() e' asincrono.
        const pending = c.motion === "four-beats" ? prepare(c.i, c.folder) : null;
        if (pending) void pending.then(() => send({ type: "fall", gen }));
        else send({ type: "fall", gen });
        return;
      }

      // Il fuoco torna esplicito su «Apri il caso»: la faccia cliccata non lo
      // prende, e il ritorno nativo del dialog finirebbe su body.
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
      // data-dialog-open da qui: Lenis si ferma prima che la cartella cada, e
      // lo scroll non riscrive `--depth` mentre cade.
      if (c.fall && !p.fall) {
        document.documentElement.setAttribute("data-dialog-open", "");
        slideRef.current = slide(c.folder, c.motion);
      }
      if (c.started && !p.started && dialog) {
        void slideRef.current?.open(dialog).then(() => send({ type: "opened", gen }));
      }
      if (c.phase === "closing" && p.phase !== "closing" && dialog) {
        void slideRef.current?.close(dialog);
      }
      // Il close watcher (secondo Esc, gesto indietro di Android) chiude il
      // dialog da solo anche a chiusura orchestrata gia' partita: quello che
      // resta del foglio si salta sempre e si passa alla risalita.
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

  // Esc fra il clic e showModal(): il dialog non c'e' ancora e non arriva un
  // cancel. Non si perde: si chiude appena aperta.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || dialogRef.current?.open) return;
      send({ type: "esc" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [send]);

  // Smontato a meta': niente pagina bloccata ne' archivio inerte.
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
