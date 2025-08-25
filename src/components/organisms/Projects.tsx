// src/components/Projects.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Globe } from "@/components/magicui/globe";

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.8,
    },
  },
} as const;

export default function Projects() {
  const t = useTranslations("projects");

  const projectsData = [
    {
      id: "visualboost",
      tech: ["NextJS", "Typescript", "SEO", "Analytics"],
      techColor: "text-indigo-500 dark:text-indigo-400",
      year: 2025,
      link: "https://visual-boost.com",
      image: "/images/screenshot/visualboost_screenshot.png",
    },
    {
      id: "customertrack",
      tech: ["NextJS", "Typescript", "SEO", "Analytics"],
      techColor: "text-cyan-500 dark:text-cyan-400",
      year: 2025,
      link: "https://customertrack.io",
      image: "/images/screenshot/customertrack_screenshot.png",
    },
    {
      id: "aidify",
      tech: ["NextJS", "Typescript", "GraphQL", "Supabase", "AI Chatbot", "SEO", "Analytics"],
      techColor: "text-cyan-500 dark:text-cyan-400",
      year: 2024,
      link: "https://aidify.cx",
      image: "/images/screenshot/aidify_screenshot.png",
    },
    {
      id: "bdroppy",
      tech: ["NextJS", "Tailwind", "SEO"],
      techColor: "text-purple-500 dark:text-purple-400",
      year: 2024,
      link: "https://www.bdroppy.com",
      image: "/images/screenshot/bdroppy_screenshot.png",
    },
  ];

  const fullProjectsData = projectsData.map(project => ({
    ...project, // Copia tutti i dati di base (id, tech, link, etc.)
    name: t(`list.${project.id}.name`), // Aggiunge il nome tradotto
    description: t(`list.${project.id}.description`), // Aggiunge la descrizione tradotta
  }));


  return (
    <div className="bg-slate-300 dark:bg-[#1a1d20]">
      <div className="relative container mx-auto flex justify-center items-center lg:grid lg:grid-cols-2 ">
        <div className="hidden lg:flex w-full h-full justify-center items-center translate-y-10">
          <Globe className={"w-50 h-50"} />
        </div>
        <div className=" -translate-x-2 translate-y-10 flex items-start gap-8 px-6 lg:px-0">
          <div className="hidden md:flex flex-col items-center gap-4 pt-1">
            <p className="text-sm tracking-[0.2em] uppercase [writing-mode:vertical-rl] text-slate-500 dark:text-slate-400">
              {t('intro.eyebrow')}
            </p>
            <div className="w-[2px] h-24 bg-slate-300 dark:bg-slate-700 mt-2"></div>
          </div>

          <div className="text-center md:text-left max-w-xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-slate-900 dark:text-white">
              {t('intro.headingLine1')}{/* <br /> {content.headingLine2}*/}
            </h2>

            <p className="text-slate-600 dark:text-slate-400 mb-8 text-base leading-relaxed">
              {t('intro.paragraph')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">

            </div>
          </div>
        </div>
      </div>



      {/* --- LISTA DEI PROGETTI --- */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="relative">
          {/* Linea verticale della timeline (visibile solo su schermi grandi) */}
          <div
            className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-700 hidden lg:block"
            aria-hidden="true"
          />

          <ul className="flex flex-col gap-16 lg:gap-24">
            {fullProjectsData.map((project, index) => (
              <li
                key={project.id}
                className={`relative w-full flex flex-col lg:items-center ${
                  // Applica flex-row-reverse per alternare la posizione
                  index % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'
                }`}
              >
                {/* Contenitore Immagine (Metà larghezza su LG) */}
                <motion.div
                  className="w-full lg:w-5/12"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden p-1 border border-transparent dark:border-slate-700/50">
                    <div className="flex p-2 gap-1.5 border-b border-slate-200 dark:border-slate-700">
                      <div className="bg-red-500 w-3 h-3 rounded-full"></div>
                      <div className="bg-yellow-500 w-3 h-3 rounded-full"></div>
                      <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                    </div>
                    <Link href={project.link} target="_blank" rel="noopener noreferrer" className="block overflow-hidden group">
                      <Image
                        src={project.image}
                        alt={t('imageAlt', { name: t(`list.${project.id}.name`) })}
                        width={1216}
                        height={640}
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                  </div>
                </motion.div>

                {/* Spacer centrale per schermi grandi */}
                <div className="lg:w-2/12 hidden lg:block">
                  {/* Dot sulla timeline */}
                  <div className="w-5 h-5 mx-auto bg-white dark:bg-slate-800 rounded-full border-2 border-blue-500 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                  </div>
                </div>

                {/* Contenitore Testo (Metà larghezza su LG) */}
                <motion.div
                  className={`w-full lg:w-5/12 mt-6 lg:mt-0 ${
                    index % 2 !== 0 ? 'lg:text-right' : 'lg:text-left'
                  }`}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <p className={`mb-3 text-sm font-semibold uppercase tracking-wider ${project.techColor}`}>
                    {project.tech.join(" · ")}
                  </p>
                  <h3 className="mb-3 text-2xl lg:text-3xl text-slate-900 dark:text-slate-100 font-bold">
                    {project.name}
                  </h3>
                  <div className="prose prose-slate text-slate-600 dark:text-slate-400 max-w-none">
                    <p>{project.description}</p>
                  </div>
                  <Link
                    className={`group inline-flex items-center h-11 rounded-full text-sm font-semibold whitespace-nowrap px-6 focus:outline-none focus:ring-2 mt-8 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:hover:text-white dark:focus:ring-slate-500 transition-all ${
                      index % 2 !== 0 ? 'lg:mr-auto' : 'lg:ml-auto'
                    }`}
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Project
                    <svg
                      className="overflow-visible ml-3 text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-1 transition-transform"
                      width="3" height="6" viewBox="0 0 3 6" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M0 0L3 3L0 6"></path>
                    </svg>
                  </Link>
                </motion.div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
