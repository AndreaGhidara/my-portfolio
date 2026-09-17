import { brandAssets } from "@/content/brand-assets";

/**
 * Le virgolette aprono e chiudono davvero il blocco: non sono un adesivo
 * accanto al titolo. Puramente decorative, il significato è nel testo.
 *
 * Il segno è una maschera e non un'immagine, come il cerchio d'inchiostro: il
 * file è inchiostro su trasparente, e da <img> restava inchiostro anche quando
 * la pagina diventa inchiostro, cioè spariva proprio sul tema scuro. Mascherato
 * prende --fg, che è la carta di là e l'inchiostro di qua: un file solo, giusto
 * in tutti e due.
 */
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
          // La proporzione la dava l'immagine. Senza di lei il riquadro
          // resterebbe alto zero: chi chiama gli da' la larghezza, l'altezza
          // esce da qui.
          aspectRatio: `${asset.width} / ${asset.height}`,
          display: "block",
          width: "100%",
        }}
      />
    </span>
  );
}
