import Image from "next/image";
import { brandAssets } from "@/content/brand-assets";

/**
 * Le virgolette aprono e chiudono davvero il blocco: non sono un adesivo
 * accanto al titolo. Puramente decorative — il significato è nel testo.
 */
export function QuoteFrame({
  variant,
  className,
}: {
  variant: "open" | "close";
  className?: string;
}) {
  const asset = variant === "open" ? brandAssets.quoteOpen : brandAssets.quoteClose;
  return (
    <span aria-hidden="true" className={className} data-quote={variant}>
      <Image src={asset.src} alt="" width={asset.width} height={asset.height} />
    </span>
  );
}
