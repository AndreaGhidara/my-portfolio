"use client";

import { useRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { useSectionAnimation } from "../useSectionAnimation";

/**
 * Da dove arriva quello che entra.
 * - `sale`: da sotto, corto. E' il default e vale per il testo.
 * - `dietro`: cresce dal fondo. Per i blocchi interi e le testate.
 * - `alto`: cade e si attacca, con un rimbalzo corto. Per le cose che
 *   qualcuno appunta: i tesserini, il cartellino, il francobollo.
 * - `lati`: ogni figlio entra dal lato che si e' gia' scelto da solo, cioe'
 *   dal suo `data-lato`. Alterna destra e sinistra perche' ALTERNA
 *   l'impaginato, non perche' l'animazione conti i figli.
 */
export type RevealMotion = "sale" | "dietro" | "alto" | "lati";

type RevealProps = {
  children: ReactNode;
  /** Elemento reso. Default: div. */
  as?: ElementType;
  className?: string;
  /** Ritardo in secondi prima dell'ingresso. */
  delay?: number;
  /** Ritardo fra i figli diretti, se ce n'è più di uno. */
  stagger?: number;
  /** Da dove arriva. Default: `sale`. */
  motion?: RevealMotion;
  /** Da attivare dove il CSS usa `transform` anche per altro (un hover che
   *  solleva, per esempio): l'entrata ripulisce quello che ha scritto. */
  clearProps?: boolean;
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
        // Un trigger per figlio, e non uno per il gruppo: le quattro voci si
        // compongono UNA ALLA VOLTA mentre scendi, che e' tutto il punto.
        // Con un trigger solo entrerebbero insieme appena il blocco si
        // affaccia, e chi scorre piano le troverebbe gia' tutte a posto.
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

  // Tutto quello che Reveal non conosce arriva all'elemento reso. Un involucro
  // di presentazione che mangia gli attributi costringe chi lo usa ad avvolgerlo
  // in un <div> solo per poterli scrivere, e l'elemento che conta (qui una
  // <ol>) smette di essere quello che finisce nel DOM.
  return (
    <Tag ref={scope} className={className} {...rest}>
      {children}
    </Tag>
  );
}
