/**
 * Da dove parte chi arriva. Cinque modi, ordinati per una ragione che si legge
 * scendendo: **quanto toccano di quello che uno ha gia'**. Chi legge non deve
 * confrontare cinque cose fra loro — scende finche' non si riconosce, e si
 * ferma.
 *
 * Prima erano quattro frasi con gli stessi id dei servizi, e l'aggancio 1:1
 * con la sezione successiva era il modo in cui la domanda trovava risposta.
 * Adesso la risposta e' qui dentro, e i cinque non ricalcano piu' il listino:
 * parlano della FORMA dell'intervento, non del prodotto. L'aggancio alla prova
 * resta, ma passa da `prova` — che punta al lavoro in cui quella forma si
 * vede — invece che da una corrispondenza di posizione che non sarebbe piu'
 * vera. Il vecchio commento avvertiva: «se un giorno le due liste divergono,
 * il sito fa una domanda a cui non risponde». Divergono, e la risposta e' che
 * risponde da se'.
 */
export type SeekingRoute = {
  /** E' anche la chiave di traduzione: seeking.list.<id>.* */
  id: string;
  /** Dove si va a vedere che non e' una promessa. `null` per «non ancora»:
   *  a chi ha appena ammesso di non sapere non si chiede di andare da nessuna
   *  parte. */
  prova: { ancora: string; lavoro: string | null } | null;
};

/**
 * L'ordine e' il gradiente: non tocca niente -> aggiunge a fianco -> entra in
 * quello che c'e' -> lo sostituisce. «Non ancora» chiude, e sta in fondo per
 * una ragione: in mezzo sarebbe una via di fuga, in fondo e' un permesso.
 */
export const seekingRoutes: SeekingRoute[] = [
  { id: "capire", prova: { ancora: "#services", lavoro: null } },
  { id: "strumento", prova: { ancora: "#works", lavoro: "aidify" } },
  { id: "aggiunta", prova: { ancora: "#works", lavoro: "bdroppy" } },
  { id: "fulcro", prova: { ancora: "#works", lavoro: "customertrack" } },
  { id: "nonancora", prova: null },
];
