/**
 * Le finestre di scorrimento del filo e della freccia.
 *
 * NIENTE "use client" IN CIMA, ed e' l'unica ragione per cui questo file
 * esiste separato da presets.ts. Le costanti stavano li', insieme alle
 * funzioni che usano gsap, e presets.ts e' per forza un modulo client. Un
 * Server Component che importa un valore da un modulo client non riceve il
 * valore: riceve un riferimento, e leggerne una proprieta' da' `undefined`.
 *
 * E' successo davvero, ed e' costato tre tentativi di correzione andati a
 * vuoto: WorksView — che e' un Server Component — passava la finestra dei
 * Lavori a ThreadSegment, la finestra arrivava `undefined`, weave ripiegava
 * sul suo default, e la pagina continuava a comportarsi come prima mentre il
 * codice e le prove dicevano il contrario. Le prove non lo vedevano perche'
 * importano il modulo direttamente, senza attraversare quel confine.
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
export const INIZIO_ENTRATA = {
  pieno: "top 82%",
  ridotto: "top 72%",
} as const;

/**
 * La finestra in cui il filo si tesse, ed e' la ragione per cui la pagina ha
 * UN filo e non sette.
 *
 * Il fondo di una sezione e' la cima della successiva. Se la corsa di sopra
 * chiude a una quota dello schermo e quella di sotto apre a un'altra, le due
 * si sovrappongono (o lasciano un buco) per tutta la distanza fra le due
 * quote. Aprendo e chiudendo sulla STESSA riga la consegna e' esatta: la corsa
 * di sotto comincia nell'istante in cui quella di sopra ha finito, e quello
 * che si vede e' una testa sola che scende.
 *
 * Il default di prima era `top bottom` -> `bottom top`, cioe' apertura quando
 * la sezione entra dal basso e chiusura quando esce dall'alto: una
 * sovrapposizione di una schermata intera. Misurato nel DOM al caricamento, il
 * filo dell'apertura era disegnato al 59% e quello della sezione dopo gia' al
 * 17%.
 *
 * L'85% e' la riga su cui il filo si tesse: sta in basso, poco sotto quello
 * che si sta leggendo, e tutto quello che e' gia' passato di li' e' cucito.
 */
export const TESSITURA = { inizio: "top 85%", fine: "bottom 85%" } as const;

/**
 * La riga su cui la freccia della pratica parte e finisce. Sta qui e non dentro
 * la sezione perche' la legge anche il righello di sviluppo (Righelli.tsx), e
 * due numeri uguali scritti in due file divergono al primo che ne tocca uno.
 * Prima la sapeva anche il filo dei Lavori, che apriva appena dopo: i Lavori
 * sono diventati un archivio e il filo li' non passa piu' (vedi anchors.ts).
 */
export const CORSA_FRECCIA = { inizio: "top 46%", fine: "bottom 46%" } as const;

/**
 * L'entrata del filo al caricamento, tarata sulla timeline di HeroMotion e non
 * scelta a caso: i timbri delle lettere finiscono verso 1,0s e la copy entra
 * fra 1,15s e 2,1s. Il filo parte con la copy e chiude verso 2,4s, cioe'
 * insieme alle frecce che invitano a scorrere. Ha senso: il filo E' l'invito a
 * scendere, e arriva quando c'e' gia' qualcosa da guardare.
 */
/**
 * Dove sta la riga di tessitura, come frazione dell'altezza della finestra.
 * Derivata da TESSITURA e non riscritta a mano: se le due divergono l'entrata
 * consegna allo scorrimento in un punto diverso da dove lo scorrimento si
 * aspetta di trovarla, e si vede un salto.
 */
export const FINESTRA = Number.parseFloat(TESSITURA.inizio.split(" ")[1]) / 100;
/**
 * La finestra di ogni sezione del filo, quando non e' quella di tutti.
 *
 * La consulta ThreadSegment, che e' un componente client: cosi' la scelta
 * avviene DENTRO il lato client e nessun valore attraversa il confine. Prima
 * la finestra gliela passava la sezione come proprieta', e per i Lavori quella
 * sezione era un Server Component: vedi il commento in cima al file.
 *
 * Oggi e' vuota: l'unica eccezione erano i Lavori, che il filo non attraversa
 * piu'. La mappa resta perche' il posto giusto per la prossima eccezione e'
 * questo, e non una proprieta' che attraversa il confine.
 */
export const FINESTRE_FILO: Record<string, { inizio: string; fine: string }> = {};
