"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** Idempotente: chiamabile da qualsiasi componente senza effetti doppi. */
export function registerGsap(): void {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.7 });
  registered = true;
}

export { gsap, ScrollTrigger };
