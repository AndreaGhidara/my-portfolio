// tokens.css deriva da qui: tokens.test.ts fallisce se i due divergono.
export const palette = {
  paper: "#F5F1E8",
  ink: "#14120F",
  orange: "#E4572E",
  graph: "#D9D3C4",
  muted: "#6E6759",
  mutedDark: "#A79E8C",
  /* Solo per la lampadina del tema e la categoria Design delle notizie. Sulla
     carta non si vede (1,1:1): li' porta sempre contorno e testo d'inchiostro. */
  bulb: "#FDEA7B",
  /* L'esito riuscito del modulo contatti (in arancio sembrava un errore) e la
     categoria Codice delle notizie, fissa nei due temi. 5,32:1 sulla carta. */
  green: "#2F6F4E",
  /* Sul fondo scuro del riquadro il verde fa 2,39:1, sotto il 3:1 di WCAG;
     questo fa 6,68:1. Misurati nel browser: quel fondo e' una color-mix. */
  greenDark: "#7FBF95",
} as const;

export type PaletteToken = keyof typeof palette;
