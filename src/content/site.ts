export type Social = { id: string; url: string };

export const site = {
  name: "Andrea Ghidara",
  email: "andrea.ghidara.dev@gmail.com",
  url: "https://a-ghidara-dev.vercel.app",
  cvPath: "/cv/Andrea_Ghidara_cv_2026.pdf",
  socials: [
    { id: "linkedin", url: "https://www.linkedin.com/in/andrea-ghidara" },
    { id: "github", url: "https://github.com/AndreaGhidara" },
  ] satisfies Social[],
} as const;
