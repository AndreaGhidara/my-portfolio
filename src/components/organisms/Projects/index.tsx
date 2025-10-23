import { getTranslations } from "next-intl/server";
import { Globe } from "@/components/magicui/globe";
import React from "react";
import ProjectCard from "@/components/organisms/Projects/ProjectCard";

export default async function Projects() {
  const t = await getTranslations("projects");

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
    ...project,
    name: t(`list.${project.id}.name`),
    description: t(`list.${project.id}.description`),
  }));

  return (
    <section id={"projects"} className="relative dark:bg-[#1a1d20]">
      <div
        className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          color: "currentColor",
        }}
        aria-hidden="true"
      />
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
              {t('intro.headingLine1')}
            </h2>

            <p className="text-slate-600 dark:text-slate-400 mb-8 text-base leading-relaxed">
              {t('intro.paragraph')}
            </p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="relative">
          <div
            className="absolute left-1/2 top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-700 hidden lg:block"
            aria-hidden="true"
          />
          <ul className="flex flex-col gap-16 lg:gap-24">
            {fullProjectsData.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}