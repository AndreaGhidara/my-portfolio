"use client";
import { WordRotate } from "@/components/magicui/word-rotate";
import { BackgroundWrapper } from "@/components/utils/Background-wrapper";
import { FileJson, Download } from "lucide-react";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/magicui/terminal";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Hero() {
  const t = useTranslations("hero");
  const statusWords = t.raw("badge.status");

  const heroContent = {
    badge: {
      text: "Andrea Ghidara",
      status: statusWords,
    },
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
    <section className="bg-slate-200 dark:bg-zinc-900">
      <BackgroundWrapper>
        <div className="text-zinc-800 dark:text-gray-200 overflow-x-hidden">
          <section className="container mx-auto px-6 py-14 md:py-32">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 mb-16 lg:mb-0">
                <div className=" mb-8 flex flex-wrap sm:inline-flex sm:w-85 items-center gap-2 bg-slate-100 dark:bg-zinc-800/50 px-4 py-2 rounded-md border border-slate-300 dark:border-zinc-700">
                  <span className="text-zinc-900 dark:text-gray-300 font-mono">
                    {heroContent.badge.text}{" "}
                  </span>
                  <div className="flex items-center">
                    <span className="text-slate-500 dark:text-gray-500 font-mono ml-3">
                      ⁄⁄
                    </span>
                    <WordRotate
                      className="text-slate-500 dark:text-gray-500 font-mono ml-3"
                      words={heroContent.badge.status}
                    />
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
                  <span className="text-zinc-900 dark:text-gray-100">
                    {heroContent.title.line1}
                  </span>
                  <br />
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

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                  <button className="cursor-pointer px-6 py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-700 dark:bg-gray-50 dark:text-black dark:hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2">
                    <Download size={18} />
                    {heroContent.buttons.cv}
                  </button>
                  <Link
                    href={"#projects"}
                    className="cursor-pointer px-6 py-3 border border-zinc-400 text-zinc-800 hover:bg-zinc-100/50 dark:text-white dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-500 rounded-lg font-medium transition-all duration-300 gap-2 flex items-center justify-center"
                  >
                    <FileJson size={18} />
                    {heroContent.buttons.projects}
                  </Link>
                </div>
              </div>

              <div className="lg:w-1/2 lg:pl-16 relative">
                <Terminal className="w-[300px] sm:w-[500px] md:w-full">
                  <TypingAnimation>npm install @dev-andre</TypingAnimation>

                  <AnimatedSpan delay={1500} className="text-yellow-400">
                    <span>ℹ Installing Core dependencies...</span>
                  </AnimatedSpan>
                  <AnimatedSpan delay={1900} className="text-green-400">
                    <span>✔ Installed React</span>
                  </AnimatedSpan>
                  <AnimatedSpan delay={2200} className="text-green-400">
                    <span>✔ Installed Next.js</span>
                  </AnimatedSpan>
                  <AnimatedSpan delay={2500} className="text-green-400">
                    <span>✔ Installed TypeScript</span>
                  </AnimatedSpan>

                  <AnimatedSpan delay={2900} className="text-yellow-400">
                    <span>ℹ Installing Styling packages...</span>
                  </AnimatedSpan>
                  <AnimatedSpan delay={3300} className="text-green-400">
                    <span>✔ Installed Tailwind CSS</span>
                  </AnimatedSpan>
                  <AnimatedSpan delay={3600} className="text-green-400">
                    <span>✔ Installed Shadcn/UI</span>
                  </AnimatedSpan>

                  <AnimatedSpan delay={4000} className="text-yellow-400">
                    <span>ℹ Installing Data handling packages...</span>
                  </AnimatedSpan>
                  <AnimatedSpan delay={4400} className="text-green-400">
                    <span>✔ Installed GraphQL</span>
                  </AnimatedSpan>
                  <AnimatedSpan delay={4700} className="text-green-400">
                    <span>✔ Installed REST APIs</span>
                  </AnimatedSpan>

                  <AnimatedSpan delay={5100} className="text-yellow-400">
                    <span>ℹ Installing Mobile packages...</span>
                  </AnimatedSpan>
                  <AnimatedSpan delay={5500} className="text-green-400">
                    <span>✔ Installed React Native</span>
                  </AnimatedSpan>

                  <TypingAnimation
                    delay={6100}
                    className="text-muted-foreground"
                  >
                    Success! @dev-andre is configured and ready to work.
                  </TypingAnimation>
                </Terminal>
              </div>
            </div>
          </section>
        </div>
      </BackgroundWrapper>
    </section>
  );
}
