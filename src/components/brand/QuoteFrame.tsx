import { brandAssets } from "@/content/brand-assets";

// Una maschera e non un <img>: il file e' inchiostro su trasparente, e come
// immagine spariva sul tema scuro. Mascherato prende --fg, giusto nei due temi.
export function QuoteFrame({
  variant,
  className,
}: {
  variant: "open" | "close";
  className?: string;
}) {
  const asset = variant === "open" ? brandAssets.quoteOpen : brandAssets.quoteClose;
  const mask = `url(${asset.src}) center / contain no-repeat`;

  return (
    <span aria-hidden="true" className={className} data-quote={variant}>
      <span
        data-quote-fill
        style={{
          WebkitMask: mask,
          mask,
          backgroundColor: "var(--fg)",
          // Senza immagine il riquadro sarebbe alto zero: la larghezza la da' chi chiama.
          aspectRatio: `${asset.width} / ${asset.height}`,
          display: "block",
          width: "100%",
        }}
      />
    </span>
  );
}
