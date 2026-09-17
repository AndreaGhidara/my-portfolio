"use client";

import { useRef, useState } from "react";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { WorkFolder } from "./WorkFolder";
import { WorkDialog } from "./WorkDialog";
import { preloadShot } from "./preloadShot";
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
  const schedario = useRef<HTMLDivElement | null>(null);

  /**
   * L'entrata delle quattro cartelle.
   *
   * Due impaginati, due modi di entrare, e la scelta la fa il DISEGNO e non il
   * livello di movimento: da 1024px in su le cartelle sono in fila e le loro
   * cime sono alla stessa quota, quindi entrano insieme, sfalsate nel tempo —
   * che e' l'unico modo di dare un ordine a quattro cose affiancate. Sotto,
   * sono impilate: li' ognuna scatta quando tocca a lei.
   *
   * Prima erano sfalsate anche da telefono, con un innesco solo per tutto lo
   * schedario: la quarta partiva mezzo secondo dopo la prima, quando ormai era
   * finita fuori dallo schermo, e la sua entrata non la vedeva nessuno.
   */
  useSectionAnimation(({ level, presets }) => {
    const { daDietro } = presets;
    const radice = schedario.current;
    if (!radice) return;

    const cartelle = Array.from(radice.children) as HTMLElement[];
    if (cartelle.length === 0) return;

    const impilate =
      cartelle[cartelle.length - 1].offsetTop - cartelle[0].offsetTop > 40;

    if (impilate) {
      for (const cartella of cartelle) {
        daDietro(cartella, { level, trigger: cartella, clearProps: true });
      }
      return;
    }

    daDietro(cartelle, { level, trigger: radice, stagger: 0.18, clearProps: true });
  }, schedario);

  return (
    <>
      {/* L'attributo resta su QUESTO elemento: tutto l'impaginato dello
          schedario e' scritto con `[data-work-shelf] > *`, e un involucro in
          mezzo lo scollegherebbe dalle cartelle. */}
      <div ref={schedario} data-work-shelf>
        {items.map((item, index) => (
          <WorkFolder
            key={item.id}
            data={item}
            index={index}
            openLabel={labels.open}
            onOpen={(data, origin) => setActive({ data, origin })}
            onPreload={() => preloadShot(item.screenshot)}
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
