/** Oltre questa soglia l'header prende il suo fondo: qualche pixel di
 *  margine evita che un rimbalzo dello scroll faccia sfarfallare la barra.
 *
 *  Sta in un modulo senza "use client" perche' la legge anche TopStateScript,
 *  che e' un Server Component e la scrive dentro lo script in linea: da un
 *  modulo client arriverebbe undefined (vedi finestre.ts). */
export const AT_TOP_THRESHOLD = 8;
