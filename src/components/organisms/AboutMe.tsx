// src/components/AboutMe.tsx

import Image from "next/image";
import Link from "next/link";

// Contenuto testuale estratto in un oggetto per una facile gestione
const content = {
  eyebrow: "MORE ABOUT",
  headingLine1: "A Passionate",
  headingLine2: "Software Developer",
  paragraph:
    "I'm a passionate Software Developer with expertise in React, Next.js, & modern web technologies. I specialize in building user-friendly applications that solve real-world problems. With a deep understanding of frontend development, state management, and API integration, I can bring your ideas to life.",
  primaryCta: "See Projects",
  secondaryCta: "More Details",
  imageSrc: "/images/photos/profile_pic.png",
  imageAlt: "A portrait photo of the developer",
};

export default function AboutMe() {
  return (
    <section
      id="about"
      className="min-h-screen bg-slate-200 dark:bg-[#111111] text-slate-800 dark:text-slate-300 py-20 px-6 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24"
    >
      {/* Sezione Immagine */}
      <div className="w-full md:w-1/2 lg:w-1/3 flex justify-center md:justify-end">
        <div className="relative w-72 h-96 md:w-80 lg:w-[22rem] lg:h-[28rem] flex-shrink-0">
          <Image
            src={content.imageSrc}
            alt={content.imageAlt}
            fill
            className="object-contain rounded-2xl shadow-2xl"
            sizes="(max-width: 768px) 18rem, (max-width: 1024px) 20rem, 22rem"
          />
        </div>
      </div>

      {/* Sezione Testo con layout corretto */}
      <div className="w-full lg:w-1/2 flex items-start justify-center md:justify-start gap-8">
        {/* Elemento Decorativo Verticale (visibile solo su schermi md e superiori) */}
        <div className="hidden md:flex flex-col items-center gap-4 pt-1">
          <p className="text-sm tracking-[0.2em] uppercase [writing-mode:vertical-rl] text-slate-500 dark:text-slate-400">
            {content.eyebrow}
          </p>
          <div className="w-[2px] h-24 bg-slate-300 dark:bg-slate-700 mt-2"></div>
        </div>

        {/* Blocco di Contenuto Principale */}
        <div className="text-center md:text-left max-w-xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-slate-900 dark:text-white">
            {content.headingLine1} <br /> {content.headingLine2}
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-8 text-base leading-relaxed">
            {content.paragraph}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              href="/#projects"
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 text-center"
            >
              {content.primaryCta}
            </Link>
            <a
              href="/cv.pdf" // Esempio: link per scaricare un file
              target="_blank"
              rel="noopener noreferrer"
              className="border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 text-center"
            >
              {content.secondaryCta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}