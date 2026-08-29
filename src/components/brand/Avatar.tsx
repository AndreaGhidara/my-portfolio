import Image from "next/image";
import { brandAssets } from "@/content/brand-assets";

export function Avatar({ className, priority = false }: { className?: string; priority?: boolean }) {
  const asset = brandAssets.avatar;
  return (
    <Image
      src={asset.src}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={className}
    />
  );
}
