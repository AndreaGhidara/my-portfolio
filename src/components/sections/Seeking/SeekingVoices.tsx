"use client";

import { useRef } from "react";
import { gsap } from "@/animations/gsap";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import type { SeekingItem } from "./SeekingView";

/**
 * SI TESSE, applicato a delle frasi: prima si tira la riga, poi la frase sale
 * da sotto la riga come se venisse scritta li' sopra. Le quattro entrano una
 * dopo l'altra e non insieme, perche' sono quattro voci diverse: sovrapposte
 * diventerebbero un elenco, in sequenza restano persone che parlano.
 *
 * Il testo non nasce nascosto nel markup: se il JavaScript non parte, le frasi
 * sono gia' li' e leggibili.
 */
export function SeekingVoices({ items }: { items: SeekingItem[] }) {
  const scope = useRef<HTMLOListElement | null>(null);

  useSectionAnimation((level) => {
    const root = scope.current;
    if (!root || level === "none") return;

    const rows = Array.from(root.querySelectorAll("[data-voice-row]"));
    if (rows.length === 0) return;

    const full = level === "full";
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top 78%", once: true },
    });

    rows.forEach((row, index) => {
      const rule = row.querySelector("[data-voice-rule]");
      const text = row.querySelector("[data-voice-text]");
      // La posizione e' assoluta e non relativa: con "<+=0.18" un ritardo di
      // rete su una riga sposterebbe tutte le successive.
      const at = index * (full ? 0.22 : 0.08);

      if (rule) {
        timeline.fromTo(
          rule,
          { scaleX: 0 },
          { scaleX: 1, duration: full ? 0.5 : 0.3, ease: "power2.out", transformOrigin: "left center" },
          at,
        );
      }
      if (text) {
        timeline.from(
          text,
          { yPercent: full ? 60 : 30, opacity: 0, duration: full ? 0.65 : 0.4, ease: "power3.out" },
          at + (full ? 0.12 : 0.05),
        );
      }
    });
  }, scope);

  return (
    <ol ref={scope} className="mt-2 lg:mt-4">
      {items.map((item, index) => (
        <li key={item.id} data-voice-row className="pt-5 lg:pt-7">
          <span
            data-voice-rule
            aria-hidden="true"
            className="block h-px w-full origin-left bg-[var(--on-accent)] opacity-30"
          />
          <div className="mt-4 flex items-baseline gap-4 lg:gap-6">
            <span className="eyebrow shrink-0 !text-[var(--on-accent)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            {/* overflow-hidden e' il taglio da cui la frase sale: senza, il
                movimento verso l'alto si vede partire da fuori posto. */}
            <span className="block overflow-hidden">
              <span
                data-voice-text
                className="block text-2xl font-bold leading-tight text-[var(--paper)] lg:text-4xl"
              >
                {item.voice}
              </span>
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
