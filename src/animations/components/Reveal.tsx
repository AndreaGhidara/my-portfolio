"use client";

import { useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { useSectionAnimation } from "../useSectionAnimation";

// `lati`: ogni figlio entra dal lato scritto nel suo `data-side`, cioe' da dove
// l'impaginato lo ha gia' messo.
export type RevealMotion = "sale" | "dietro" | "alto" | "lati";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  motion?: RevealMotion;
  // Dove il CSS usa `transform` anche per altro (un hover che solleva).
  clearProps?: boolean;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

// Nessuno stile nascosto nel markup: se JavaScript non parte, il contenuto e' gia' leggibile.
export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  stagger = 0.07,
  motion = "sale",
  clearProps = false,
  ...rest
}: RevealProps) {
  const scope = useRef<HTMLElement | null>(null);

  useSectionAnimation(
    ({ level, presets }) => {
      const { fromBehind, fromSide, fromAbove, reveal } = presets;
      const root = scope.current;
      if (!root) return;
      const items = Array.from(root.children);

      if (motion === "lati") {
        // Un trigger per figlio: le voci si compongono una alla volta mentre si
        // scende. Con uno solo entrerebbero insieme appena il blocco si affaccia.
        for (const item of items) {
          const direction = item.getAttribute("data-side") === "left" ? "left" : "right";
          fromSide(item, { level, trigger: item, direction, delay, clearProps });
        }
        return;
      }

      const targets = items.length > 1 ? items : root;
      const common = { level, trigger: root, delay, stagger, clearProps };
      if (motion === "dietro") fromBehind(targets, common);
      else if (motion === "alto") fromAbove(targets, common);
      else reveal(targets, common);
    },
    scope,
    [motion],
  );

  // Gli attributi sconosciuti passano all'elemento reso, cosi' chi lo usa non deve
  // avvolgerlo in un <div> solo per scriverli.
  return (
    <Tag ref={scope} className={className} {...rest}>
      {children}
    </Tag>
  );
}
