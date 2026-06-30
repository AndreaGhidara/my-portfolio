"use client";

import { WordRotate } from "@/components/magicui/word-rotate";
import { FileJson, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/magicui/terminal";

type HeroClientProps = {
  content: {
    badgeStatus: string[];
    buttons: {
      cv: string;
      projects: string;
    };
  };
};

export default function HeroClient({ content }: HeroClientProps) {
  return (
    <>
      <div className=" mb-8 flex flex-wrap sm:inline-flex sm:w-85 items-center gap-2 bg-slate-100 dark:bg-zinc-800/50 px-4 py-2 rounded-md border border-slate-300 dark:border-zinc-700">
        <div className="flex items-center">
          <span className="text-slate-500 dark:text-gray-500 font-mono">
            Status:
          </span>
          <WordRotate
            className="text-slate-500 dark:text-gray-500 font-mono ml-3"
            words={content.badgeStatus}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
        <Link
          href="#contact"
          className="cursor-pointer px-6 py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-700 dark:bg-gray-50 dark:text-black dark:hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <ArrowRight size={18} />
          {content.buttons.cv}
        </Link>
        <Link
          href={"#projects"}
          className="cursor-pointer px-6 py-3 border border-zinc-400 text-zinc-800 hover:bg-zinc-100/50 dark:text-white dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-zinc-500 rounded-lg font-medium transition-all duration-300 gap-2 flex items-center justify-center"
        >
          <FileJson size={18} />
          {content.buttons.projects}
        </Link>
      </div>
    </>
  );
}

export function TerminalAnimation() {
  return (
    <Terminal className="w-full">
      <TypingAnimation>create-project your-website</TypingAnimation>
      <AnimatedSpan delay={2200} className="text-green-400">
        <span>✔ Setting up project structure</span>
      </AnimatedSpan>
      <AnimatedSpan delay={2900} className="text-green-400">
        <span>✔ Configuring SEO, GEO &amp; performance</span>
      </AnimatedSpan>
      <AnimatedSpan delay={3600} className="text-green-400">
        <span>✔ Building responsive design</span>
      </AnimatedSpan>
      <AnimatedSpan delay={4300} className="text-green-400">
        <span>✔ Optimizing load speed</span>
      </AnimatedSpan>
      <AnimatedSpan delay={5000} className="text-green-400">
        <span>✔ Deploying to production</span>
      </AnimatedSpan>
      <AnimatedSpan delay={5700} className="text-green-400">
        <span>✔ Lighthouse: 98 / 100</span>
      </AnimatedSpan>
      <TypingAnimation delay={6500} className="text-muted-foreground">
        Ready to launch. 🚀
      </TypingAnimation>
    </Terminal>
  );
}
