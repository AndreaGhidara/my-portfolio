/**
 * Da dove parte chi arriva. Cinque modi, ordinati per una ragione che si legge
 * scendendo: **quanto toccano di quello che uno ha gia'**. Chi legge non deve
 * confrontare cinque cose fra loro — scende finche' non si riconosce, e si
 * ferma.
 *
 * Prima erano quattro frasi con gli stessi id dei servizi, e l'aggancio 1:1
 * con la sezione successiva era il modo in cui la domanda trovava risposta.
 * Adesso la risposta e' qui dentro, e i cinque non ricalcano piu' il listino:
 * parlano della FORMA dell'intervento, non del prodotto.
 *
 * Nessuna delle cinque rimanda piu' a un lavoro. Il rimando c'e' stato, e si
 * e' rivelato un invito ad andarsene proprio nel punto in cui la mail aveva
 * appena finito di convincere: chi legge arriva in fondo e trova due uscite,
 * una verso i contatti e una verso un'altra sezione. Adesso l'uscita e' una
 * sola. I lavori restano dove sono, e chi li vuole ci arriva scorrendo.
 */
export type SeekingRoute = {
  /** E' anche la chiave di traduzione: seeking.list.<id>.* */
  id: string;
};

/**
 * L'ordine e' il gradiente: non tocca niente -> aggiunge a fianco -> entra in
 * quello che c'e' -> lo sostituisce. «Non ancora» chiude, e sta in fondo per
 * una ragione: in mezzo sarebbe una via di fuga, in fondo e' un permesso.
 */
export const seekingRoutes: SeekingRoute[] = [
  { id: "capire" },
  { id: "strumento" },
  { id: "aggiunta" },
  { id: "fulcro" },
  { id: "nonancora" },
];
