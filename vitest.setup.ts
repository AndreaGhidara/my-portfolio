import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// matchMedia mock: risponde "true" solo a "(prefers-reduced-motion: reduce)",
// così resolveMotionLevel(...) risolve sempre a "none" nei test. Se invece
// tutte le query dessero false, il livello risolto sarebbe "reduced" e GSAP
// animerebbe davvero i componenti (es. gsap.from({ opacity: 0 }) dentro un
// preset) mentre ScrollTrigger, in jsdom, non scatta mai — lasciando gli
// elementi bloccati a opacity 0 e rompendo ogni asserzione toBeVisible() in
// questo task e nei task delle sezioni successive. "none" è il livello
// giusto anche concettualmente: i test di base devono verificare che il
// contenuto sia presente e visibile senza alcun movimento, non che GSAP
// funzioni contro un DOM finto. Il comportamento al livello "reduced" va
// verificato a mano su un dispositivo reale, non con test unitari.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

/**
 * jsdom non implementa <dialog>: showModal() e close() non esistono proprio.
 * Questo minimo li aggiunge — attributo `open` e evento `close` — quel tanto
 * che serve a verificare COSA mostriamo nel dossier e come lo annunciamo.
 *
 * Quello che questo finto <dialog> NON dimostra: trappola del focus, chiusura
 * con Escape, inertizzazione della pagina sotto, ritorno del focus sulla
 * cartella. Sono comportamenti del browser e vanno verificati in un browser
 * vero, non qui: un test che li desse per buoni certificherebbe il nulla.
 */
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

/**
 * jsdom non ha nemmeno SVGPathElement: un <path> gli esce come SVGElement, e
 * getTotalLength() non esiste. Chi disegna un tratto — il filo, i cavi del
 * tavolo — lo misura per darsi lo strokeDasharray, e senza questo lancia appena
 * il livello di movimento sale sopra "none". Zero, e non un numero finto: la
 * lunghezza vera dipende dalla geometria, che qui nessuno calcola, e un numero
 * inventato inviterebbe a scriverci sopra un'asserzione che non prova niente.
 *
 * Quello che questo NON dimostra: che il tratto si disegni davvero. Come si
 * tesse un filo si guarda in un browser, non qui.
 */
if (typeof SVGElement !== "undefined" && !("getTotalLength" in SVGElement.prototype)) {
  (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 0;
}
