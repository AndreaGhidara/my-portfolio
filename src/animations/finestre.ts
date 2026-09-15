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
 * la sezione perche' non e' piu' un fatto privato di quell'animazione: il filo
 * dei Lavori deve saperla, e due numeri uguali scritti in due file divergono al
 * primo che ne tocca uno.
 */
export const CORSA_FRECCIA = { inizio: "top 46%", fine: "bottom 46%" } as const;

/**
 * La finestra del filo dei Lavori, e l'unica della pagina che non usa TESSITURA.
 *
 * Il motivo, che la regola di TESSITURA pretende: subito sopra i Lavori finisce
 * la corsa della freccia della pratica, e con l'apertura di default il filo
 * cominciava a disegnarsi mentre la freccia era ancora per strada. Non era un
 * caso limite. La freccia finisce quando il fondo del percorso arriva al 46%
 * dello schermo, il filo partiva quando il bordo alto dei Lavori arrivava
 * all'85%: perche' i due non si accavallassero sarebbe servito che fra i due
 * bordi ci fossero 39vh, e ce ne sono 128px di padding.
 *
 * L'apertura e' la STESSA riga su cui la freccia finisce, e non un numero
 * tarato a occhio. Il bordo alto dei Lavori sta sempre sotto il fondo del
 * percorso, quindi attraversa una data riga sempre dopo: partendo di li' il
 * filo e' in ritardo sulla freccia per costruzione, su ogni schermo e qualunque
 * sia lo spazio fra le due sezioni. La chiusura resta quella di tutti, cosi' la
 * consegna alla sezione successiva non cambia.
 */
const RIGA_FRECCIA = Number.parseFloat(CORSA_FRECCIA.fine.split(" ")[1]);

/**
 * Di quanti punti percentuali il filo apre PIU' IN BASSO della riga su cui la
 * freccia chiude. Sommato, non sottratto, e il segno e' il punto delicato di
 * tutto il file: sembra un errore e non lo e'.
 *
 * I due inneschi sono agganciati a due elementi diversi, e il bordo alto dei
 * Lavori sta 128px SOTTO il fondo del percorso — e' il padding di chiusura
 * della pratica. Quei 128px, su uno schermo da 860, valgono gia' quindici
 * punti percentuali: quando la freccia si posa, il bordo dei Lavori e' al 61%
 * e non al 46%. Mettere la riga del filo SOPRA quella della freccia, come
 * faceva la versione precedente, aggiungeva quei quindici punti al ritardo
 * invece di toglierli: erano 266px di attesa fra l'atterraggio e la partenza.
 *
 * Con la riga POCO SOTTO, il filo apre appena dopo l'atterraggio. Piu' il
 * numero e' alto, prima parte: alzarlo abbassa la riga sullo schermo, e una
 * riga piu' in basso l'elemento la raggiunge prima. Non zero, perche' senza
 * respiro le due cose si leggono come una sola.
 *
 * IL PREZZO, ed e' la ragione per cui questo numero non si alza a cuor leggero:
 * la garanzia che il filo non anticipi la freccia regge finche' i 128px di
 * stacco valgono piu' di RITARDO_LAVORI punti di schermo. A 9 il tetto e' una
 * finestra alta circa 1420px; a 6 era 2100. Piu' e' corto il respiro, meno
 * margine resta sugli schermi alti. Una prova verifica il tetto dichiarato.
 *
 * Il modo di avere tutti e due — respiro corto e nessun tetto — e' agganciare
 * i due inneschi allo STESSO elemento, esprimendo lo stacco in pixel invece che
 * in punti percentuali. Si puo' fare, costa una riscrittura piu' larga, e finche'
 * nessuno guarda il sito su una finestra piu' alta di 1420px non serve.
 */
const RITARDO_LAVORI = 9;

/**
 * La finestra del filo dei Lavori, e l'unica della pagina che non usa TESSITURA.
 *
 * Il motivo, che la regola di TESSITURA pretende: subito sopra i Lavori finisce
 * la corsa della freccia della pratica, e con l'apertura di default — l'85% —
 * il filo cominciava a disegnarsi mentre la freccia era ancora a meta' strada.
 * Non era un caso limite: perche' le due non si accavallassero sarebbe servito
 * che fra i due bordi ci fossero 39vh, e ce ne sono 128px.
 *
 * La chiusura resta quella di tutti, cosi' la consegna alla sezione successiva
 * non cambia: si sposta solo l'apertura.
 */
export const TESSITURA_LAVORI = {
  inizio: `top ${RIGA_FRECCIA + RITARDO_LAVORI}%`,
  fine: TESSITURA.fine,
} as const;

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
 * sezione e' un Server Component: vedi il commento in cima al file.
 */
export const FINESTRE_FILO: Record<string, { inizio: string; fine: string }> = {
  works: TESSITURA_LAVORI,
};
