/**
 * La riga dello schermo su cui scattano le entrate.
 *
 * NIENTE "use client" IN CIMA, ed e' l'unica ragione per cui questo file
 * esiste separato da presets.ts. Le costanti stavano li', insieme alle
 * funzioni che usano gsap, e presets.ts e' per forza un modulo client. Un
 * Server Component che importa un valore da un modulo client non riceve il
 * valore: riceve un riferimento, e leggerne una proprieta' da' `undefined`.
 *
 * E' successo davvero, ed e' costato tre tentativi di correzione andati a
 * vuoto: un Server Component passava una di queste costanti a un componente
 * client, il valore arrivava `undefined`, il preset ripiegava sul suo default,
 * e la pagina continuava a comportarsi come prima mentre il codice e le prove
 * dicevano il contrario. Le prove non lo vedevano perche' importano il modulo
 * direttamente, senza attraversare quel confine.
 *
 * Regola che ne esce: i DATI stanno in moduli senza direttiva, il
 * COMPORTAMENTO nei moduli client. Se un dato serve da tutte e due le parti,
 * non puo' vivere accanto a gsap.
 */

/**
 * La riga dello schermo su cui scatta un'entrata.
 *
 * Era "top 85%" per tutti, cioe' l'elemento parte quando la sua cima e' a un
 * settimo dal fondo dello schermo. Sul telefono quel settimo e' occupato dalla
 * barra delle sezioni, che sta fissa in fondo e copre gli ultimi 52px: il
 * movimento succedeva DIETRO la barra e si concludeva prima che l'elemento
 * arrivasse dove lo stai guardando. Il risultato e' che le entrate non le
 * vedevi mai, e trovavi la roba gia' a posto.
 *
 * Al 72% la cima dell'elemento e' a un quarto dal fondo: su uno schermo da
 * 844px sono 590px, cioe' duecento pixel sopra la barra. Il movimento parte
 * dove l'occhio sta gia' guardando.
 *
 * Il desktop non ha la barra in fondo e ha piu' schermo: li' 82% e' gia'
 * dentro la zona che si guarda, e anticipare un po' evita che il contenuto si
 * faccia aspettare su un monitor alto.
 */
export const ENTRANCE_START = {
  full: "top 82%",
  reduced: "top 72%",
} as const;
