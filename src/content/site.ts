export type Social = { id: string; url: string };

export const site = {
  name: "Andrea Ghidara",
  email: "andrea.ghidara.dev@gmail.com",
  /**
   * Il dominio vero, con il www: e' l'host che il sito serve, ed e' quello che
   * deve comparire nel canonical, nella sitemap, in robots.txt e nei dati
   * strutturati. Cablato in sei posti diversi ha gia' fatto danno una volta:
   * il sito era passato a questo dominio e il canonical continuava a indicare
   * quello di Vercel, cioe' diceva a Google che l'originale era un altro.
   * Da qui in poi lo legge chi ne ha bisogno, e il posto e' uno solo.
   */
  url: "https://www.andreaghidara.dev",
  cvPath: "/cv/Andrea_Ghidara_CV_2026.pdf",
  socials: [
    { id: "linkedin", url: "https://www.linkedin.com/in/andrea-ghidara" },
    { id: "github", url: "https://github.com/AndreaGhidara" },
  ] satisfies Social[],
} as const;
