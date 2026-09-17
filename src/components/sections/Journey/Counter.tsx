"use client";

import { useRef } from "react";
import { useSectionAnimation } from "@/animations/useSectionAnimation";

/**
 * Il valore finale è già nel markup: se JavaScript non parte, il numero
 * si legge lo stesso. Il conteggio parte solo se il valore è puramente
 * numerico: "24h" e "5.000+" restano fermi invece di produrre conteggi
 * senza senso.
 */
export function Counter({ value, label }: { value: string; label: string }) {
  const scope = useRef<HTMLDivElement | null>(null);

  useSectionAnimation(({ level, gsap }) => {
    const target = scope.current?.querySelector("[data-counter-value]");
    if (!target) return;

    const numeric = Number(value.replace(/\./g, ""));
    if (!Number.isFinite(numeric) || !/^[\d.]+$/.test(value)) return;

    const state = { current: 0 };
    gsap.to(state, {
      current: numeric,
      duration: level === "full" ? 1.2 : 0.7,
      ease: "power2.out",
      scrollTrigger: { trigger: scope.current, start: "top 85%", once: true },
      onUpdate: () => {
        target.textContent = Math.round(state.current).toLocaleString("it-IT");
      },
      onComplete: () => {
        target.textContent = value;
      },
    });
  }, scope);

  return (
    // Stessa forma della lista metriche nei case study: l'etichetta compare
    // UNA volta sola, in <dt>, e flex-col-reverse mostra il numero sopra
    // mantenendo nel DOM l'ordine dt -> dd che la specifica richiede.
    // I colori non sono quelli del tema: questi due numeri stanno sul fondo
    // arancio della sezione, che di notte resta arancio. --fg e --fg-muted si
    // ribalterebbero e sparirebbero. Il numero e' carta come il titolo, la sua
    // etichetta e' inchiostro come il resto del testo corrente: e' la stessa
    // scala di toni della seconda sezione.
    <div ref={scope} className="flex flex-col-reverse gap-2">
      <dt className="text-xs text-[var(--on-accent)]">{label}</dt>
      <dd
        data-counter-value
        className="text-4xl font-black leading-none text-[var(--paper)] lg:text-5xl"
      >
        {value}
      </dd>
    </div>
  );
}
