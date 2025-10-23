import { getTranslations } from "next-intl/server";
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
    <section className="bg-white dark:bg-zinc-900">
      <div className="text-zinc-800 dark:text-gray-200 overflow-x-hidden">
        <section className="container mx-auto px-6 py-14 md:py-32">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-16 lg:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
                <span className="text-zinc-900 dark:text-gray-100">
                  Andrea Ghidara
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                  {heroContent.title.line1} {" "}
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                  {heroContent.title.line2}
                </span>
                <span className="text-purple-500 dark:text-purple-400">
                  {" "}
                  {heroContent.title.highlight}
                </span>
              </h1>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-lg">
                {heroContent.description}
              </p>

              <HeroClient content={heroContent} />
            </div>
            <div className="lg:w-1/2 lg:pl-16 relative">
              <TerminalAnimation />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}