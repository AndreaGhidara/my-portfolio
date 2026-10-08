"use client";

import { useRef, type CSSProperties } from "react";
import { pad2 } from "@/lib/format";
import { WorkShot } from "./WorkShot";
import type { Folder } from "./slide";
import type { WorkCaseData } from "./types";

/** La linguetta e' un bottone fratello della faccia, non annidato: a cartella
 *  archiviata e' l'unica parte a vista e deve prendere il click per intero. Al
 *  dossier passano i pezzi della cartella e non un rettangolo, perche' slide.ts
 *  li anima uno per uno. */
export function WorkFolder({
  data,
  index,
  total,
  openLabel,
  confidentialLabel,
  putBackLabel,
  onOpen,
  onPreload,
  onPutBack,
}: {
  data: WorkCaseData;
  index: number;
  total: number;
  openLabel: string;
  confidentialLabel: string;
  putBackLabel: string;
  onOpen: (folder: Folder) => void;
  onPreload: () => void;
  onPutBack: () => void;
}) {
  const li = useRef<HTMLLIElement | null>(null);
  const tab = useRef<HTMLButtonElement | null>(null);
  const spine = useRef<HTMLDivElement | null>(null);
  const sheet = useRef<HTMLDivElement | null>(null);
  const face = useRef<HTMLDivElement | null>(null);
  const openButton = useRef<HTMLButtonElement | null>(null);

  const open = () => {
    if (!li.current || !tab.current || !spine.current || !sheet.current || !face.current || !openButton.current) {
      return;
    }
    onOpen({
      li: li.current,
      tab: tab.current,
      spine: spine.current,
      face: face.current,
      sheet: sheet.current,
      openButton: openButton.current,
    });
  };

  return (
    <li ref={li} data-folder style={{ "--i": index } as CSSProperties}>
      <button ref={tab} type="button" data-tab onClick={onPutBack}>
        <b>{data.name}</b>
        {/* A parte perche' sul telefono si toglie: quattro linguette in fila
            non ci starebbero con l'anno. */}
        <span data-tab-year> · {data.year}</span>
        <span className="sr-only">, {putBackLabel}</span>
      </button>

      {/* Ad archivio acceso il dorso prende il puntatore (vedi sections/works.css)
          e non fa niente: un click li' non deve arrivare alla faccia di una
          cartella coperta. */}
      <div ref={spine} data-spine aria-hidden="true" />
      <div ref={sheet} data-sheet aria-hidden="true" />

      {/* Il bottone c'e' per la tastiera e per chi legge a voce; la faccia gli
          delega il puntatore. */}
      <div
        ref={face}
        data-face
        onClick={(event) => {
          if ((event.target as Element).closest("button")) return;
          open();
        }}
        // Il precarico parte da tre segnali: il mouse che si posa, il focus da
        // tastiera e il dito che scende, perche' sul telefono hover non esiste.
        onPointerEnter={onPreload}
        onFocus={onPreload}
        onPointerDown={onPreload}
      >
        <div>
          <p data-face-number>
            {pad2(index + 1)} / {pad2(total)}
          </p>
          {/* Il titolo e' chi e non la frase: distingue le cartelle nell'elenco
              dei titoli, ed e' lo stesso del dossier che la faccia apre. */}
          <h3 data-face-who>
            {data.name} · {data.year}
          </h3>
        </div>

        <div data-face-centre>
          <p data-face-line>{data.tagline}</p>
          <div data-face-screenshot>
            {data.screenshot ? (
              <WorkShot shot={data.screenshot} alt={data.screenshotAlt} />
            ) : (
              <p data-face-confidential>{confidentialLabel}</p>
            )}
          </div>
        </div>

        <div data-face-foot>
          <ul data-face-tech>
            {data.tech.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button ref={openButton} type="button" data-open-button aria-haspopup="dialog" onClick={open}>
            {openLabel} <span aria-hidden="true">+</span>
            <span className="sr-only">: {data.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
