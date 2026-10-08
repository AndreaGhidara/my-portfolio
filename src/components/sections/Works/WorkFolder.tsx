"use client";

import { useRef, type CSSProperties } from "react";
import { pad2 } from "@/lib/format";
import { WorkShot } from "./WorkShot";
import type { Folder } from "./slide";
import type { WorkCaseData } from "./types";

/**
 * Una cartella dell'archivio: la linguetta col nome, il dorso con un foglio
 * che spunta, e davanti la faccia.
 *
 * La faccia porta il lavoro in una frase: chi arriva da cliente si riconosce
 * nella situazione prima di sapere di che azienda si tratta, ed e' il motivo per
 * cui il nome sta sulla linguetta e non nel titolo. Accanto, la schermata
 * infilata come un foglio; il riservato non ne ha, e lo dice.
 *
 * La linguetta e' un bottone suo, fratello della faccia e non annidato: quando
 * la cartella e' archiviata e' l'unica parte che si vede, e deve prendere il
 * click per intero. Riporta davanti la sua cartella. La faccia apre il dossier,
 * dal bottone «Apri il caso» o da un click qualunque sopra: la cartella scivola
 * via e ne esce la pratica (vedi scivola.ts), quindi al dossier passano i
 * pezzi della cartella e non un rettangolo.
 */
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
  /** La scritta del riquadro quando non c'e' una schermata da mostrare. */
  confidentialLabel: string;
  /** Per chi legge a voce: la linguetta non apre il caso, lo riporta davanti. */
  putBackLabel: string;
  onOpen: (folder: Folder) => void;
  /** Chiesto appena si capisce che questa cartella sta per aprirsi. */
  onPreload: () => void;
  /** La linguetta: questa cartella torna davanti. */
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
        {/* Sul telefono la linguetta porta solo il nome: quattro in fila non
            ci starebbero con l'anno, e l'anno lo dice la faccia. */}
        <span data-tab-year> · {data.year}</span>
        <span className="sr-only">, {putBackLabel}</span>
      </button>

      {/* Ad archivio acceso il dorso prende il puntatore (vedi sezioni/lavori.css) e
          non fa niente: e' la fascia fra le linguette e la faccia, e un click
          li' non deve arrivare alla faccia di una cartella coperta. */}
      <div ref={spine} data-spine aria-hidden="true" />
      {/* Il foglio che spunta: e' lui che sfila quando la cartella si apre. */}
      <div ref={sheet} data-sheet aria-hidden="true" />

      {/* Un click sulla faccia apre il caso come il suo bottone: sono la
          stessa cosa. Il bottone c'e' per la tastiera e per chi legge a voce,
          e la faccia gli delega il puntatore. */}
      <div
        ref={face}
        data-face
        onClick={(event) => {
          if ((event.target as Element).closest("button")) return;
          open();
        }}
        // Tre segnali per la stessa cosa: sta per aprirsi. Il mouse che si posa
        // (desktop), il focus da tastiera, e il dito che scende (telefono, dove
        // hover non esiste). La schermata parte di la', non dal click.
        onPointerEnter={onPreload}
        onFocus={onPreload}
        onPointerDown={onPreload}
      >
        <div>
          <p data-face-number>
            {pad2(index + 1)} / {pad2(total)}
          </p>
          {/* Il titolo della cartella e' chi, non la frase: e' quello che
              distingue una cartella dall'altra nell'elenco dei titoli, ed e'
              lo stesso titolo del dossier che la faccia apre. */}
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
