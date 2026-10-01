"use client";

import type { LivelloProps } from "./Gioco";
import { Segnaposto } from "./Segnaposto";

/** Livello 4, la notte. SEGNAPOSTO: la firma e' quella definitiva, il corpo no. */
export function Notte(props: LivelloProps) {
  return <Segnaposto parte="notte" numero={4} {...props} />;
}
