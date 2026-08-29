"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { reveal } from "../presets";
import { useSectionAnimation } from "../useSectionAnimation";

type RevealProps = {
  children: ReactNode;
  /** Elemento reso. Default: div. */
  as?: ElementType;
  className?: string;
  /** Ritardo in secondi prima dell'ingresso. */
  delay?: number;
  /** Ritardo fra i figli diretti, se ce n'è più di uno. */
  stagger?: number;
};

/**
 * Ingresso generico per i blocchi senza animazione su misura.
 * Non applica mai stili nascosti nel markup: se JavaScript non parte, il
 * contenuto è già lì e leggibile.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  stagger = 0.07,
}: RevealProps) {
  const scope = useRef<HTMLElement | null>(null);

  useSectionAnimation((level) => {
    const root = scope.current;
    if (!root) return;
    const targets = root.children.length > 1 ? Array.from(root.children) : root;
    reveal(targets, { level, trigger: root, delay, stagger });
  }, scope);

  return (
    <Tag ref={scope} className={className}>
      {children}
    </Tag>
  );
}
