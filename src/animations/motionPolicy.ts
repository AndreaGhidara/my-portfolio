"use client";

import { useEffect, useState } from "react";

export type MotionLevel = "full" | "reduced" | "none";

export const MEDIA = {
  reduced: "(prefers-reduced-motion: reduce)",
  finePointer: "(pointer: fine)",
  wideScreen: "(min-width: 1024px)",
} as const;

// Senza informazioni il default e' "reduced": il pieno va guadagnato, non presunto.
export function resolveMotionLevel(match: (query: string) => boolean): MotionLevel {
  if (match(MEDIA.reduced)) return "none";
  if (match(MEDIA.finePointer) && match(MEDIA.wideScreen)) return "full";
  return "reduced";
}

// "none" in SSR e al primo render: niente parte prima che il browser abbia risposto.
export function useMotionLevel(): MotionLevel {
  const [level, setLevel] = useState<MotionLevel>("none");

  useEffect(() => {
    const match = (query: string) => window.matchMedia(query).matches;
    const update = () => setLevel(resolveMotionLevel(match));
    update();

    const lists = Object.values(MEDIA).map((query) => window.matchMedia(query));
    lists.forEach((list) => list.addEventListener("change", update));
    return () => lists.forEach((list) => list.removeEventListener("change", update));
  }, []);

  return level;
}
