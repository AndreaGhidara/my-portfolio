"use client";

import { useEffect, useRef, useState } from "react";

/**
 * La lampadina del vecchio sito, staccata dall'interruttore a levetta e
 * rimessa dentro il bottone tondo: sfera di vetro piena e attacco a vite
 * zigrinato, non un contorno.
 *
 * Nell'originale era coricata perche' doveva scorrere lungo una guida.
 * Qui non scorre, quindi sta dritta — come una lampadina vera.
 *
 * Acceso = tema scuro, la stessa metafora di prima: e' buio, accendo la
 * luce. Il colore acceso lo decide il CSS su html[data-theme="dark"] e non
 * lo stato React: React lo saprebbe solo dopo il mount, e al primo
 * caricamento in tema scuro vedresti la lampadina spenta per un istante.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;

    // Deve restare sincrono: startViewTransition fotografa il prima, esegue
    // questa funzione e fotografa il dopo. Un aggiornamento differito qui
    // finirebbe fuori dalla transizione e il cerchio si aprirebbe sul nulla.
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
        const origin = circleOrigin(buttonRef.current);
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${origin.x}px ${origin.y}px)`,
              `circle(${origin.radius}px at ${origin.x}px ${origin.y}px)`,
            ],
          },
          {
            // Lento in partenza apposta. Il bottone sta a trenta pixel dal
            // bordo alto, quindi del cerchio se ne vede solo un quarto: con
            // una partenza rapida a nessuno resta il tempo di vedere il
            // punto d'origine, e il buio sembra scendere dal bordo invece
            // che uscire dalla lampadina.
            duration: 950,
            easing: "cubic-bezier(0.85, 0, 0.15, 1)",
            // Si anima solo il fotogramma NUOVO: cresce sopra quello vecchio
            // che resta fermo sotto. Animando entrambi si vedrebbe il vecchio
            // tema scivolare via e il cerchio perderebbe il senso.
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        /* Transizione interrotta (doppio click, cambio pagina): il tema e'
           gia' stato applicato, non c'e' niente da recuperare. */
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
        {/* L'alone e' un cerchio sfumato e non un drop-shadow: il filtro SVG
            ha una regione che si ferma poco oltre la sagoma, e la sfocatura
            veniva tagliata in un quadrato visibile sul fondo scuro. */}
        <defs>
          <radialGradient id="bulb-halo">
            <stop offset="0%" stopColor="var(--bulb)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--bulb)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle data-bulb-halo cx="12" cy="9" r="9" fill="url(#bulb-halo)" />

        {/* Vetro: sfera piu' collo, due forme che si fondono nello stesso
            riempimento — e' la sagoma del vecchio interruttore. */}
        <g data-bulb-glass>
          <circle cx="12" cy="9" r="5.6" />
          <path d="M8.9 13 h6.2 v2.4 h-6.2 z" />
        </g>
        {/* Attacco a vite: la zigrinatura sono tagli nel colore del fondo,
            cosi' funziona identica su tema chiaro e scuro. */}
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

/**
 * Il cerchio si apre solo dove il browser sa fare le transizioni di vista e
 * dove l'utente non ha chiesto meno movimento. Altrove il tema cambia di
 * colpo, che e' il comportamento di sempre: l'effetto e' un di piu', mai la
 * condizione perche' il bottone funzioni.
 */
function canAnimateThemeChange() {
  return (
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Centro del bottone e raggio necessario a coprire lo schermo: e' la
 * distanza dall'angolo piu' lontano, non mezza diagonale, altrimenti in un
 * angolo resterebbe una fetta del tema vecchio.
 */
function circleOrigin(button: HTMLElement | null) {
  const rect = button?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth;
  const y = rect ? rect.top + rect.height / 2 : 0;

  return {
    x,
    y,
    radius: Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ),
  };
}
