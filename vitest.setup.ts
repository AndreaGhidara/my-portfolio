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
