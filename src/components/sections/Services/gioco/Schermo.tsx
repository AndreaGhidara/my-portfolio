"use client";

import type { LivelloProps } from "./Gioco";
import { Segnaposto } from "./Segnaposto";

/** Livello 1, lo schermo. SEGNAPOSTO: la firma e' quella definitiva, il corpo no. */
export function Schermo(props: LivelloProps) {
  return <Segnaposto parte="schermo" numero={1} {...props} />;
}
