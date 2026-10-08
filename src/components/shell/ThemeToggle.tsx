"use client";

import { useEffect, useRef, useState } from "react";

// Accesa = tema scuro. Il colore lo decide il CSS su html[data-theme="dark"] e
// non lo stato React, che lo saprebbe solo dopo il mount: caricando in tema
// scuro si vedrebbe la lampadina spenta per un istante.
export function ThemeToggle({ label }: { label: string }) {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;

    // Sincrona: startViewTransition fotografa il prima, la esegue e fotografa il
    // dopo. Un aggiornamento differito resterebbe fuori dalla transizione.
    const applyTheme = () => {
      setIsDark(next);
      if (next) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
      }
    };

    if (!canAnimateThemeChange()) {
      applyTheme();
      return;
    }

    const transition = document.startViewTransition!(applyTheme);

    transition.ready
      .then(() => {
        const c = revealCircle(buttonRef.current);
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0% at ${c.x}% ${c.y}%)`,
              `circle(${c.radius}% at ${c.x}% ${c.y}%)`,
            ],
          },
          {
            // Lento in partenza: del cerchio si vede solo un quarto, e con una
            // partenza rapida il buio sembra scendere dal bordo e non dalla lampadina.
            duration: 950,
            easing: "cubic-bezier(0.85, 0, 0.15, 1)",
            // Solo il fotogramma nuovo, sopra il vecchio fermo: nel cerchio si
            // legge la pagina nel tema nuovo, non una macchia di colore.
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        // Transizione interrotta (doppio click, cambio pagina): il tema e' gia' applicato.
      });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={isDark}
      data-theme-toggle
      className="grid size-9 place-items-center rounded-full border border-[var(--line)] text-[var(--fg)] transition-colors hover:bg-[var(--line)]/30"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        {/* Un cerchio sfumato e non un drop-shadow: la regione del filtro SVG
            tagliava la sfocatura in un quadrato visibile sul fondo scuro. */}
        <defs>
          <radialGradient id="bulb-halo">
            <stop offset="0%" stopColor="var(--bulb)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--bulb)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle data-bulb-halo cx="12" cy="9" r="9" fill="url(#bulb-halo)" />

        <g data-bulb-glass>
          <circle cx="12" cy="9" r="5.6" />
          <path d="M8.9 13 h6.2 v2.4 h-6.2 z" />
        </g>
        {/* La zigrinatura sono tagli nel colore del fondo: vale nei due temi. */}
        <g data-bulb-cap>
          <rect x="8.6" y="15.2" width="6.8" height="4.6" rx="0.7" />
          <rect x="10.3" y="19.6" width="3.4" height="1.7" rx="0.85" />
        </g>
        <path
          d="M8.6 16.75 h6.8 M8.6 18.35 h6.8"
          stroke="var(--bg)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

function canAnimateThemeChange() {
  return (
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// In percentuale e mai in pixel: il ritaglio si risolve sul fotogramma, che a
// densita' doppia e' largo il doppio, e in pixel finiva al centro dello schermo.
// Raggio fino all'angolo piu' lontano; il % di circle() si risolve su sqrt(w^2+h^2)/sqrt(2).
function revealCircle(button: HTMLElement | null) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = button?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : vw;
  const y = rect ? rect.top + rect.height / 2 : 0;

  const radiusPx = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));
  const referenceLength = Math.hypot(vw, vh) / Math.SQRT2;

  return {
    x: (x / vw) * 100,
    y: (y / vh) * 100,
    radius: (radiusPx / referenceLength) * 100,
  };
}
