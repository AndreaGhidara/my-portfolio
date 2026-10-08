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
  total: totale,
  openLabel,
  confidentialLabel: riservatoLabel,
  putBackLabel: riportaLabel,
  onOpen,
  onPreload,
  onPutBack: onRiporta,
}: {
  data: WorkCaseData;
  index: number;
  total: number;
  openLabel: string;
  /** La scritta del riquadro quando non c'e' una schermata da mostrare. */
  confidentialLabel: string;
  /** Per chi legge a voce: la linguetta non apre il caso, lo riporta davanti. */
  putBackLabel: string;
  onOpen: (cartella: Folder) => void;
  /** Chiesto appena si capisce che questa cartella sta per aprirsi. */
  onPreload: () => void;
  /** La linguetta: questa cartella torna davanti. */
  onPutBack: () => void;
}) {
  const li = useRef<HTMLLIElement | null>(null);
  const linguetta = useRef<HTMLButtonElement | null>(null);
  const dorso = useRef<HTMLDivElement | null>(null);
  const foglio = useRef<HTMLDivElement | null>(null);
  const faccia = useRef<HTMLDivElement | null>(null);
  const bottone = useRef<HTMLButtonElement | null>(null);

  const apri = () => {
    if (!li.current || !linguetta.current || !dorso.current || !foglio.current || !faccia.current || !bottone.current) {
      return;
    }
    onOpen({
      li: li.current,
      tab: linguetta.current,
      spine: dorso.current,
      face: faccia.current,
      sheet: foglio.current,
      openButton: bottone.current,
    });
  };

  return (
    <li ref={li} data-cartella style={{ "--i": index } as CSSProperties}>
      <button ref={linguetta} type="button" data-linguetta onClick={onRiporta}>
        <b>{data.name}</b>
        {/* Sul telefono la linguetta porta solo il nome: quattro in fila non
            ci starebbero con l'anno, e l'anno lo dice la faccia. */}
        <span data-linguetta-anno> · {data.year}</span>
        <span className="sr-only">, {riportaLabel}</span>
      </button>

      {/* Ad archivio acceso il dorso prende il puntatore (vedi sezioni/lavori.css) e
          non fa niente: e' la fascia fra le linguette e la faccia, e un click
          li' non deve arrivare alla faccia di una cartella coperta. */}
      <div ref={dorso} data-dorso aria-hidden="true" />
      {/* Il foglio che spunta: e' lui che sfila quando la cartella si apre. */}
      <div ref={foglio} data-foglio aria-hidden="true" />

      {/* Un click sulla faccia apre il caso come il suo bottone: sono la
          stessa cosa. Il bottone c'e' per la tastiera e per chi legge a voce,
          e la faccia gli delega il puntatore. */}
      <div
        ref={faccia}
        data-faccia
        onClick={(event) => {
          if ((event.target as Element).closest("button")) return;
          apri();
        }}
        // Tre segnali per la stessa cosa: sta per aprirsi. Il mouse che si posa
        // (desktop), il focus da tastiera, e il dito che scende (telefono, dove
        // hover non esiste). La schermata parte di la', non dal click.
        onPointerEnter={onPreload}
        onFocus={onPreload}
        onPointerDown={onPreload}
      >
        <div>
          <p data-faccia-numero>
            {pad2(index + 1)} / {pad2(totale)}
          </p>
          {/* Il titolo della cartella e' chi, non la frase: e' quello che
              distingue una cartella dall'altra nell'elenco dei titoli, ed e'
              lo stesso titolo del dossier che la faccia apre. */}
          <h3 data-faccia-chi>
            {data.name} · {data.year}
          </h3>
        </div>

        <div data-faccia-centro>
          <p data-faccia-riga>{data.tagline}</p>
          <div data-faccia-schermata>
            {data.screenshot ? (
              <WorkShot shot={data.screenshot} alt={data.screenshotAlt} />
            ) : (
              <p data-faccia-riservato>{riservatoLabel}</p>
            )}
          </div>
        </div>

        <div data-faccia-piede>
          <ul data-faccia-tech>
            {data.tech.map((voce) => (
              <li key={voce}>{voce}</li>
            ))}
          </ul>
          <button ref={bottone} type="button" data-apri aria-haspopup="dialog" onClick={apri}>
            {openLabel} <span aria-hidden="true">+</span>
            <span className="sr-only">: {data.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
