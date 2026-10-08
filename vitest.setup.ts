import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Solo reduced-motion risponde true, cosi' il livello e' sempre "none": a
// "reduced" GSAP animerebbe davvero, ScrollTrigger in jsdom non scatta mai, e
// gli elementi resterebbero a opacity 0 rompendo ogni toBeVisible().
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

// jsdom non ha showModal() e close(). Questo minimo NON dimostra trappola del
// focus, Escape, inert e ritorno del focus: quelli si verificano in un browser.
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

// jsdom non ha getTotalLength(): chi disegna un tratto lancerebbe sopra "none".
// Zero e non un numero finto, che inviterebbe ad asserzioni che non provano niente.
if (typeof SVGElement !== "undefined" && !("getTotalLength" in SVGElement.prototype)) {
  (SVGElement.prototype as unknown as { getTotalLength: () => number }).getTotalLength = () => 0;
}
