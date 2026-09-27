"use client";

import { useRef, type CSSProperties } from "react";
import { WorkShot } from "./WorkShot";
import type { WorkCaseData } from "./types";

const due = (n: number) => String(n).padStart(2, "0");

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
 * dal bottone «Apri il caso» o da un click qualunque sopra.
 */
export function WorkFolder({
  data,
  index,
  totale,
  openLabel,
  riservatoLabel,
  riportaLabel,
  onOpen,
  onPreload,
  onRiporta,
}: {
  data: WorkCaseData;
  index: number;
  totale: number;
  openLabel: string;
  /** La scritta del riquadro quando non c'e' una schermata da mostrare. */
  riservatoLabel: string;
  /** Per chi legge a voce: la linguetta non apre il caso, lo riporta davanti. */
  riportaLabel: string;
  onOpen: (data: WorkCaseData, origin: DOMRect) => void;
  /** Chiesto appena si capisce che questa cartella sta per aprirsi. */
  onPreload: () => void;
  /** La linguetta: questa cartella torna davanti. */
  onRiporta: () => void;
}) {
  const riquadro = useRef<HTMLDivElement | null>(null);

  // Il dossier cresce dalla schermata, non dalla faccia intera: e' la cosa che
  // si sta guardando, e una faccia a tutta pagina darebbe una partenza grande
  // quasi quanto l'arrivo. Il rettangolo si legge al click, cioe' dopo un
  // eventuale ritorno della cartella davanti.
  const apri = () => {
    if (riquadro.current) onOpen(data, riquadro.current.getBoundingClientRect());
  };

  return (
    <li data-cartella style={{ "--i": index } as CSSProperties}>
      <button type="button" data-linguetta onClick={onRiporta}>
        <b>{data.name}</b>
        {/* Sul telefono la linguetta porta solo il nome: quattro in fila non
            ci starebbero con l'anno, e l'anno lo dice la faccia. */}
        <span data-linguetta-anno> · {data.year}</span>
        <span className="sr-only">, {riportaLabel}</span>
      </button>

      {/* Ad archivio acceso il dorso prende il puntatore (vedi tokens.css) e
          non fa niente: e' la fascia fra le linguette e la faccia, e un click
          li' non deve arrivare alla faccia di una cartella coperta. */}
      <div data-dorso aria-hidden="true" />
      <div data-foglio aria-hidden="true" />

      {/* Un click sulla faccia apre il caso come il suo bottone: sono la
          stessa cosa. Il bottone c'e' per la tastiera e per chi legge a voce,
          e la faccia gli delega il puntatore. */}
      <div
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
            {due(index + 1)} / {due(totale)}
          </p>
          <p data-faccia-chi>
            {data.name} · {data.year}
          </p>
        </div>

        <div data-faccia-centro>
          <p data-faccia-riga>{data.riga}</p>
          <div ref={riquadro} data-faccia-schermata>
            {data.screenshot ? (
              <WorkShot shot={data.screenshot} alt={data.screenshotAlt} riempie />
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
          <button type="button" data-apri aria-haspopup="dialog" onClick={apri}>
            {openLabel} <span aria-hidden="true">+</span>
            <span className="sr-only">: {data.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
