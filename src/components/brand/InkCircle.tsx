import type { ReactNode } from "react";
import { brandAssets } from "@/content/brand-assets";

/**
 * Il cerchio è una maschera, non un'immagine colorata: un solo file serve
 * sia in tema chiaro sia in tema scuro, e `paint()` può farlo avanzare
 * animando la custom property --paint.
 */
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
