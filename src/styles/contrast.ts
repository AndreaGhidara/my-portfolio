/** Formula di luminanza relativa WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) {
    throw new Error(`Colore esadecimale non valido: ${hex}`);
  }
  const channels = [0, 2, 4].map((i) => {
    const value = parseInt(clean.slice(i, i + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapporto di contrasto WCAG, da 1:1 a 21:1. Simmetrico. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
