// Niente "use client" ne' import da gsap: un Server Component che importa un
// valore da un modulo client riceve `undefined`, e i test non se ne accorgono
// perche' importano il modulo direttamente. I dati qui, il comportamento in presets.ts.

// Sul telefono la barra in basso copre gli ultimi 52px: con "top 85%"
// l'entrata finiva dietro la barra. Al 72% su 844px parte 200px sopra la barra.
// Il desktop non ha la barra, e all'82% e' gia' dove si guarda.
export const ENTRANCE_START = {
  full: "top 82%",
  reduced: "top 72%",
} as const;
