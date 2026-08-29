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
  const wiping = useRef(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    // Un click alla volta: due dischi sovrapposti si annullerebbero a vicenda
    // e il tema finirebbe fuori sincrono con il bottone.
    if (wiping.current) return;

    const next = !isDark;

    // La scelta si registra subito, il colore si dipinge dopo. Separarle
    // serve a due cose: aria-pressed cambia all'istante invece che fra sette
    // decimi di secondo, e se ricarichi mentre il disco cresce la preferenza
    // e' gia' salvata, quindi la pagina torna su con il tema che hai scelto.
    const commitChoice = () => {
      setIsDark(next);
      localStorage.setItem("theme", next ? "dark" : "light");
    };

    const paintTheme = () => {
      if (next) document.documentElement.setAttribute("data-theme", "dark");
      else document.documentElement.removeAttribute("data-theme");
    };

    commitChoice();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paintTheme();
      return;
    }

    wiping.current = true;
    const disc = makeDisc(buttonRef.current, next);
    document.body.appendChild(disc);

    disc
      .animate({ transform: ["scale(0)", "scale(1)"] }, {
        // Lento in partenza: il bottone sta a un pelo dal bordo alto, quindi
        // del disco se ne vede solo un quarto. Con una partenza rapida non
        // resta il tempo di vedere da dove nasce.
        duration: 720,
        easing: "cubic-bezier(0.85, 0, 0.15, 1)",
        fill: "forwards",
      })
      .finished.then(() => {
        // Il disco ha gia' il colore di fondo del tema nuovo: si dipinge
        // mentre copre tutto, quindi il passaggio non si vede.
        paintTheme();
        return disc.animate({ opacity: [1, 0] }, {
          duration: 280,
          easing: "ease-out",
          fill: "forwards",
        }).finished;
      })
      .catch(paintTheme)
      .finally(() => {
        disc.remove();
        wiping.current = false;
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
 * Il disco che copre lo schermo durante il cambio tema.
 *
 * E' un elemento vero in posizione fissa, non un ritaglio sui fotogrammi
 * delle view transition: quelle disegnano dentro uno spazio di coordinate
 * proprio, che non si comporta uguale ovunque, e il cerchio finiva altrove.
 * Un elemento fisso lo posizionano tutti allo stesso modo.
 *
 * Il raggio e' la distanza dall'angolo piu' lontano, non mezza diagonale:
 * altrimenti in un angolo resterebbe scoperta una fetta del tema vecchio.
 */
function makeDisc(button: HTMLElement | null, toDark: boolean) {
  const rect = button?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth;
  const y = rect ? rect.top + rect.height / 2 : 0;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const disc = document.createElement("div");
  disc.setAttribute("data-theme-wipe", "");
  disc.setAttribute("data-to", toDark ? "dark" : "light");
  disc.style.setProperty("--wipe-x", `${x}px`);
  disc.style.setProperty("--wipe-y", `${y}px`);
  disc.style.setProperty("--wipe-r", `${radius}px`);
  return disc;
}
