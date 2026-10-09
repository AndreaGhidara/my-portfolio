// Tetto di 800ms se il browser non trova mai un momento libero. Safari non ha
// requestIdleCallback: ripiega su un timer corto.
export function whenIdle(fn: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => fn(), { timeout: 800 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
}
