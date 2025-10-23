"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

type Project = {
  id: string;
  tech: string[];
  techColor: string;
  year: number;
  link: string;
  image: string;
  name: string;
  description: string;
};

type ProjectCardProps = {
  project: Project;
  index: number;
};

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const t = useTranslations("projects");

  return (
    <li
      className={`relative w-full flex flex-col lg:items-center ${
        index % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'
      }`}
    >
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
              alt={t('imageAlt', { name: project.name })}
              width={1216}
              height={640}
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        </div>
      </motion.div>

      <div className="lg:w-2/12 hidden lg:block">
        <div className="w-5 h-5 mx-auto bg-white dark:bg-slate-800 rounded-full border-2 border-blue-500 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
        </div>
      </div>

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
          <svg className="overflow-visible ml-3 text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-1 transition-transform" width="3" height="6" viewBox="0 0 3 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M0 0L3 3L0 6"></path>
          </svg>
        </Link>
      </motion.div>
    </li>
  );
}