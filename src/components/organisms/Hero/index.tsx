import { getTranslations } from "next-intl/server";
import Image from "next/image";
import HeroClient, { TerminalAnimation } from "@/components/organisms/Hero/HeroClient";

export default async function Index() {
  const t = await getTranslations("hero");

  const heroContent = {
    badgeStatus: t.raw("badge.status"),
    title: {
      line1: t("title.line1"),
      line2: t("title.line2"),
      highlight: t("title.highlight"),
    },
    description: t("description"),
    buttons: {
      cv: t("buttons.cv"),
      projects: t("buttons.projects"),
    },
  };

  return (
    <section className="bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-gray-200 overflow-x-hidden">
      <div className="container mx-auto px-6 py-20 md:py-28 lg:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          <div className="lg:w-1/2 flex flex-col items-center lg:items-start">
            <div className="mb-6">
              <div className="relative w-[112px] h-[112px] sm:w-[128px] sm:h-[128px] rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src="/images/photos/profile_pic.png"
                  alt="Andrea Ghidara"
                  fill
                  sizes="128px"
                  className="object-cover object-top"
                  priority
                />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-center lg:text-left">
              <span className="text-zinc-900 dark:text-gray-100">
                Andrea Ghidara
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                {heroContent.title.line1}{" "}
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                {heroContent.title.line2}
              </span>
              <span className="text-purple-500 dark:text-purple-400">
                {" "}{heroContent.title.highlight}
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg text-center lg:text-left">
              {heroContent.description}
            </p>

            <HeroClient content={heroContent} />
          </div>

          <div className="lg:w-1/2 w-full flex flex-col">
            <div className="w-full lg:w-[512px] lg:ml-auto flex flex-col items-center lg:items-stretch">
            <TerminalAnimation />
            <div className="flex flex-wrap gap-2 mt-5 justify-center lg:justify-start">
              {[
                { name: "TypeScript", cls: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
                { name: "React",      cls: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20" },
                { name: "Next.js",    cls: "text-zinc-700 dark:text-zinc-300 bg-zinc-500/10 border-zinc-500/20" },
                { name: "Tailwind",   cls: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                { name: "PostgreSQL", cls: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                { name: "Express",    cls: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
              ].map(({ name, cls }) => (
                <span
                  key={name}
                  className={`font-mono text-xs px-3 py-1 rounded-full border ${cls}`}
                >
                  {name}
                </span>
              ))}
            </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
