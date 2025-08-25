export type Project = {
  id: string;
  tech: string[];
  techColor: string;
  year: number;
  link: string;
  image: string;
};

export const projectsData = [
  {
    id: "visualboost",
    tech: ["NextJS", "Typescript", "SEO", "Analytics"],
    techColor: "text-indigo-500 dark:text-indigo-400",
    year: 2025,
    link: "https://visual-boost.com",
    image: "/Screenshot 2025-07-21 at 16.46.37.png",
  },
  {
    id: "customertrack",
    tech: ["NextJS", "Typescript", "SEO", "Analytics"],
    techColor: "text-cyan-500 dark:text-cyan-400",
    year: 2025,
    link: "https://customertrack.io",
    image: "/Screenshot 2025-07-21 at 16.46.37.png",
  },
  {
    id: "aidify",
    tech: ["NextJS", "Typescript", "GraphQL", "Supabase", "AI Chatbot", "SEO", "Analytics"],
    techColor: "text-cyan-500 dark:text-cyan-400",
    year: 2024,
    link: "https://aidify.cx",
    image: "/Screenshot 2025-07-21 at 16.46.37.png",
  },
  {
    id: "bdroppy",
    tech: ["NextJS", "Tailwind", "SEO"],
    techColor: "text-purple-500 dark:text-purple-400",
    year: 2024,
    link: "https://www.bdroppy.com",
    image: "/Screenshot 2025-07-21 at 16.46.37.png",
  },
];