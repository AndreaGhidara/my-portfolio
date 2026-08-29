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
} as const;

export type PaletteToken = keyof typeof palette;
