"use client";

import { useState } from "react";
import { WorkFolder } from "./WorkFolder";
import { WorkDialog } from "./WorkDialog";
import type { WorkCaseData, WorkCaseLabels } from "./types";

type Active = { data: WorkCaseData; origin: DOMRect };

/**
 * Lo schedario: le cartelle chiuse e il dossier che si apre.
 *
 * Lo stato sta qui e non nelle singole cartelle perche' il dialog e' uno solo:
 * uno per cartella significherebbe quattro <dialog> nel DOM, quattro trappole
 * di focus e la certezza che prima o poi se ne aprano due.
 */
export function WorksShelf({
  items,
  labels,
}: {
  items: WorkCaseData[];
  labels: WorkCaseLabels;
}) {
  const [active, setActive] = useState<Active | null>(null);

  return (
    <>
      <div data-work-shelf>
        {items.map((item, index) => (
          <WorkFolder
            key={item.id}
            data={item}
            index={index}
            openLabel={labels.open}
            onOpen={(data, origin) => setActive({ data, origin })}
          />
        ))}
      </div>

      <WorkDialog
        data={active?.data ?? null}
        origin={active?.origin ?? null}
        labels={labels}
        onClose={() => setActive(null)}
      />
    </>
  );
}
