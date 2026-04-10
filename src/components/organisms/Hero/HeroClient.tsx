"use client";

import { WordRotate } from "@/components/magicui/word-rotate";
import { FileJson, Download } from "lucide-react";
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
        <a
          href="/cv/Andrea_Ghidara_cv_2026.pdf"
          download
          className="cursor-pointer px-6 py-3 bg-zinc-900 text-white rounded-lg font-bold hover:bg-zinc-700 dark:bg-gray-50 dark:text-black dark:hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
          aria-label="Download CV"
        >
          <Download size={18} />
          {content.buttons.cv}
        </a>
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
      <TypingAnimation delay={6100} className="text-muted-foreground">
        Success! @dev-andre is configured and ready to work.
      </TypingAnimation>
    </Terminal>
  );
}
