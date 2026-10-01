"use client";

import type { LivelloProps } from "./Gioco";
import { Segnaposto } from "./Segnaposto";

/** Livello 3, il pannello. SEGNAPOSTO: la firma e' quella definitiva, il corpo no. */
export function Pannello(props: LivelloProps) {
  return <Segnaposto parte="pannello" numero={3} {...props} />;
}
