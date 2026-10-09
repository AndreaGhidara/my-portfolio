export type Social = { id: string; url: string };

export const site = {
  name: "Andrea Ghidara",
  email: "andrea.ghidara.dev@gmail.com",
  // Con il www, l'host che il sito serve. Un posto solo: cablato in sei, il
  // canonical era rimasto sul dominio di Vercel.
  url: "https://www.andreaghidara.dev",
  cvPath: "/cv/Andrea_Ghidara_CV_2026.pdf",
  socials: [
    { id: "linkedin", url: "https://www.linkedin.com/in/andrea-ghidara" },
    { id: "github", url: "https://github.com/AndreaGhidara" },
  ] satisfies Social[],
} as const;
