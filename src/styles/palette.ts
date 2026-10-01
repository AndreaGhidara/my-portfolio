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
  /* Fuori dalla famiglia carta/inchiostro/arancio, e con due impieghi soli.
     Il primo e' il vetro della lampadina accesa nel bottone del tema: viene
     dal vecchio sito ed e' una scelta esplicita di Andrea, una lampadina
     gialla si legge come luce, non come incoerenza. Il secondo e' la
     categoria Design delle notizie: tre pulsanti da sala giochi dovevano
     essere tre colori, e Andrea ha scelto questo invece di un giallo nuovo.
     Sulla carta non si vede (1,1:1): li' porta sempre un contorno
     d'inchiostro e l'inchiostro come testo. Non usarlo per nient'altro. */
  bulb: "#FDEA7B",
  /* Il verde dell'esito riuscito: il riquadro che compare quando il
     messaggio del modulo contatti e' partito.
     Prima quel riquadro era arancione, cioe' il colore del sito, ed e' stato
     Andrea a dire che a colpo d'occhio sembrava un errore. Contro una
     convenzione che tutti hanno imparato (verde vuol dire e' andata bene),
     la coerenza di tavolozza vale meno della persona che si e' appena chiesta
     se il suo messaggio sia partito. Smorzato verso l'oliva per stare sulla
     carta senza fare semaforo: 5,32:1 sul chiaro.
     Il secondo impiego e' la categoria Codice delle notizie, fisso nei due
     temi e con la carta sopra (5,32:1 anche lei): la terza categoria voleva un
     colore suo, e fra quelli della tavolozza era l'unico rimasto che regge un
     testo. Qui non si usa greenDark: il corpo della macchina e' un oggetto,
     non cambia col tema. */
  green: "#2F6F4E",
  /* La versione per il tema scuro, come mutedDark: sul fondo del riquadro in
     tema scuro il verde di carta fa 2,39:1, sotto la soglia 3:1 di WCAG per
     gli elementi non testuali. Questo fa 6,68:1. Misurati nel browser sul
     riquadro vero, non sui token: quel fondo e' una color-mix. */
  greenDark: "#7FBF95",
} as const;

export type PaletteToken = keyof typeof palette;
