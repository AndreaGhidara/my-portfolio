/**
 * Unica fonte di verità dei colori del sito.
 * `tokens.css` deriva da qui: se cambi un valore, aggiorna anche quel file
 * (il test in `tokens.test.ts` fallisce se i due divergono).
 */
export const palette = {
  paper: "#F5F1E8",
  ink: "#14120F",
  orange: "#E4572E",
  graph: "#D9D3C4",
  muted: "#6E6759",
  mutedDark: "#A79E8C",
  /* Unico colore fuori dalla famiglia carta/inchiostro/arancio, e con un
     unico impiego: il vetro della lampadina accesa nel bottone del tema.
     Viene dal vecchio sito ed e' una scelta esplicita di Andrea: una
     lampadina gialla si legge come luce, non come incoerenza. Non usarlo
     per nient'altro. */
  bulb: "#FDEA7B",
  /* Il verde dell'esito riuscito, e l'unico posto in cui si usa: il riquadro
     che compare quando il messaggio del modulo contatti e' partito.
     Prima quel riquadro era arancione, cioe' il colore del sito, ed e' stato
     Andrea a dire che a colpo d'occhio sembrava un errore. Contro una
     convenzione che tutti hanno imparato — verde vuol dire e' andata bene —
     la coerenza di tavolozza vale meno della persona che si e' appena chiesta
     se il suo messaggio sia partito. Smorzato verso l'oliva per stare sulla
     carta senza fare semaforo: 5,32:1 sul chiaro. */
  green: "#2F6F4E",
  /* La versione per il tema scuro, come mutedDark: sul fondo del riquadro in
     tema scuro il verde di carta fa 2,39:1, sotto la soglia 3:1 di WCAG per
     gli elementi non testuali. Questo fa 6,68:1. Misurati nel browser sul
     riquadro vero, non sui token: quel fondo e' una color-mix. */
  greenDark: "#7FBF95",
} as const;

export type PaletteToken = keyof typeof palette;
