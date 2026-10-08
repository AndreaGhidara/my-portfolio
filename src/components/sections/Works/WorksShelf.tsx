"use client";

import { useRef, type CSSProperties } from "react";
import { ARCHIVE_PARAMS, TAB } from "./archive";
import { WorkFolder } from "./WorkFolder";
import { WorkDialog } from "./WorkDialog";
import { preloadShot } from "./preloadShot";
import type { WorkCaseData, WorkCaseLabels } from "./types";
import { useArchiveLight } from "./useArchiveLight";
import { useDepth } from "./useDepth";
import { useDossier } from "./useDossier";

// Le misure arrivano al CSS dal markup del server: il numero vive solo in
// archive.ts, il foglio di stile lo legge.
const ARCHIVE_VARS = {
  "--step": `${ARCHIVE_PARAMS.step}px`,
  "--distance": `${ARCHIVE_PARAMS.distance}vh`,
  "--darkens": ARCHIVE_PARAMS.darkens,
  "--narrows": ARCHIVE_PARAMS.narrows,
  "--tab-width": `${ARCHIVE_PARAMS.tabWidth}%`,
  "--min-dark": `${TAB.minDark * 100}%`,
};

/** Finche' l'archivio non e' acceso e' la colonna, che e' anche il markup del
 *  server: senza JavaScript si legge tutto. */
export function WorksShelf({
  works,
  labels,
}: {
  works: WorkCaseData[];
  labels: WorkCaseLabels;
}) {
  const shelf = useRef<HTMLOListElement | null>(null);
  const allFit = useArchiveLight(shelf);
  const { putBack, prepare } = useDepth(shelf, allFit);
  const { active, dialogRef, open, close, onClose } = useDossier(shelf, prepare);

  return (
    <>
      {/* Le cartelle restano figlie dirette: l'impaginato e' scritto con
          `[data-work-shelf] > [data-folder]`. `--n` entra nell'altezza della
          faccia: i passi delle cartelle archiviate sono n - 1. */}
      <ol
        ref={shelf}
        data-work-shelf
        style={{ ...ARCHIVE_VARS, "--n": works.length } as CSSProperties}
      >
        {works.map((item, index) => (
          <WorkFolder
            key={item.id}
            data={item}
            index={index}
            total={works.length}
            openLabel={labels.open}
            confidentialLabel={labels.confidential}
            putBackLabel={labels.putBack}
            onOpen={(folder) => open(index, folder)}
            onPreload={() => preloadShot(item.screenshot)}
            onPutBack={() => putBack(index)}
          />
        ))}
      </ol>

      <WorkDialog
        dialog={dialogRef}
        data={active === null ? null : (works[active] ?? null)}
        number={(active ?? 0) + 1}
        total={works.length}
        labels={labels}
        onRequestClose={close}
        onClose={onClose}
      />
    </>
  );
}
