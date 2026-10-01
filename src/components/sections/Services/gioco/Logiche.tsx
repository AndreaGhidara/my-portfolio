"use client";

import type { LivelloProps } from "./Gioco";
import { Segnaposto } from "./Segnaposto";

/** Livello 2, le logiche. SEGNAPOSTO: la firma e' quella definitiva, il corpo no. */
export function Logiche(props: LivelloProps) {
  return <Segnaposto parte="logiche" numero={2} {...props} />;
}
