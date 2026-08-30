"use client";

import { useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
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
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

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
  ...rest
}: RevealProps) {
  const scope = useRef<HTMLElement | null>(null);

  useSectionAnimation((level) => {
    const root = scope.current;
    if (!root) return;
    const targets = root.children.length > 1 ? Array.from(root.children) : root;
    reveal(targets, { level, trigger: root, delay, stagger });
  }, scope);

  // Tutto quello che Reveal non conosce arriva all'elemento reso. Un involucro
  // di presentazione che mangia gli attributi costringe chi lo usa ad avvolgerlo
  // in un <div> solo per poterli scrivere, e l'elemento che conta — qui una
  // <ol> — smette di essere quello che finisce nel DOM.
  return (
    <Tag ref={scope} className={className} {...rest}>
      {children}
    </Tag>
  );
}
