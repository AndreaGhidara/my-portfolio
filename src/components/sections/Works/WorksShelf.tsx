"use client";

import { useRef, type CSSProperties } from "react";
import { LINGUETTA, PARAMETRI } from "./archive";
import { WorkFolder } from "./WorkFolder";
import { WorkDialog } from "./WorkDialog";
import { preloadShot } from "./preloadShot";
import type { WorkCaseData, WorkCaseLabels } from "./types";
import { useArchivioAcceso } from "./useArchiveLight";
import { usePratica } from "./useDossier";
import { useProfondita } from "./useDepth";

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
 * I Lavori come un archivio di cartelle: ognuna a tutta pagina, sticky, e la
 * successiva le sale sopra fermandosi un passo piu' in basso. Quelle sotto si
 * scuriscono e si stringono in proporzione a `--profondita`. A fine corsa
 * resta il cassetto con le quattro linguette e l'ultima cartella intera, e
 * l'archivio se ne va con la pagina: nessuna sosta.
 *
 * Finche' l'archivio non e' acceso e' la colonna, che e' anche il markup del
 * server: senza JavaScript si legge tutto. Tre pezzi, uno per file:
 * - useArchivioAcceso decide se ogni faccia ci sta intera (sotto, la colonna
 *   con l'entrata di sempre);
 * - useProfondita accende l'archivio e scrive `--profondita` allo scroll;
 * - usePratica apre e chiude il dossier, uno solo per tutte le cartelle.
 */
export function WorksShelf({
  lavori,
  labels,
}: {
  lavori: WorkCaseData[];
  labels: WorkCaseLabels;
}) {
  const schedario = useRef<HTMLOListElement | null>(null);
  const ciStanno = useArchivioAcceso(schedario);
  const { riporta, prepara } = useProfondita(schedario, ciStanno);
  const { attiva, dialogo, apri, chiudi, alClose } = usePratica(schedario, prepara);

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
