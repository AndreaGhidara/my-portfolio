"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

let registered = false;

/** Idempotente: chiamabile da qualsiasi componente senza effetti doppi. */
export function registerGsap(): void {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.7 });
  registered = true;
}

export { gsap, ScrollTrigger, useGSAP };
