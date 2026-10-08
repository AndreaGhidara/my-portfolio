"use client";

import { useRef, type CSSProperties } from "react";
import { TAB, ARCHIVE_PARAMS } from "./archive";
import { WorkFolder } from "./WorkFolder";
import { WorkDialog } from "./WorkDialog";
import { preloadShot } from "./preloadShot";
import type { WorkCaseData, WorkCaseLabels } from "./types";
import { useArchiveLight } from "./useArchiveLight";
import { useDossier } from "./useDossier";
import { useDepth } from "./useDepth";

/**
 * Le misure dell'archivio arrivano al CSS da qui, scritte nel markup del
 * server: il numero vive in archivio.ts e il foglio di stile lo legge, come fa
 * il percorso con binario.ts.
 */
const MISURE = {
  "--step": `${ARCHIVE_PARAMS.step}px`,
  "--distance": `${ARCHIVE_PARAMS.distance}vh`,
  "--darkens": ARCHIVE_PARAMS.darkens,
  "--narrows": ARCHIVE_PARAMS.narrows,
  "--tab-width": `${ARCHIVE_PARAMS.tabWidth}%`,
  "--min-dark": `${TAB.minDark * 100}%`,
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
  works: lavori,
  labels,
}: {
  works: WorkCaseData[];
  labels: WorkCaseLabels;
}) {
  const schedario = useRef<HTMLOListElement | null>(null);
  const ciStanno = useArchiveLight(schedario);
  const { riporta, prepara } = useDepth(schedario, ciStanno);
  const { attiva, dialogo, apri, chiudi, alClose } = useDossier(schedario, prepara);

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
            total={lavori.length}
            openLabel={labels.open}
            confidentialLabel={labels.confidential}
            putBackLabel={labels.putBack}
            onOpen={(cartella) => apri(index, cartella)}
            onPreload={() => preloadShot(item.screenshot)}
            onPutBack={() => riporta(index)}
          />
        ))}
      </ol>

      <WorkDialog
        dialog={dialogo}
        data={attiva === null ? null : (lavori[attiva] ?? null)}
        number={(attiva ?? 0) + 1}
        total={lavori.length}
        labels={labels}
        onRequestClose={chiudi}
        onClose={alClose}
      />
    </>
  );
}
