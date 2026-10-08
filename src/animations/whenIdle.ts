/**
 * Fa partire `fn` nel primo momento libero dopo la pittura, con un tetto di
 * 800ms se il browser non ne trova mai uno. Dove `requestIdleCallback` non
 * c'e' (Safari) ripiega su un timer corto. Restituisce l'annullo, da chiamare
 * nella pulizia dell'effetto che l'ha prenotato.
 *
 * Serve a GSAP e Lenis, che si caricano al volo apposta per non pesare sulla
 * prima schermata: vedi useSectionAnimation e SmoothScroll.
 */
export function whenIdle(fn: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => fn(), { timeout: 800 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
}
