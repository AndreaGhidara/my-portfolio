import type { ReactNode } from "react";
import { brandAssets } from "@/content/brand-assets";

// Una maschera e non un'immagine colorata: un file solo per i due temi, e
// `paint()` lo fa avanzare animando --paint.
export function InkCircle({ children, className }: { children?: ReactNode; className?: string }) {
  const mask = `url(${brandAssets.inkCircle.src}) center / contain no-repeat`;

  return (
    <span className={className} data-ink-circle>
      <span
        aria-hidden="true"
        data-ink-circle-fill
        style={{
          WebkitMask: mask,
          mask,
          backgroundColor: "var(--accent)",
        }}
      />
      {children}
    </span>
  );
}
