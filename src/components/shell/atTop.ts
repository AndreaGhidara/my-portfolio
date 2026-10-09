// Qualche pixel di margine: un rimbalzo dello scroll non fa sfarfallare la barra.
// Modulo senza "use client" perche' la legge TopStateScript, Server Component:
// da un modulo client arriverebbe undefined (vedi timing.ts).
export const AT_TOP_THRESHOLD = 8;
