// src/components/Experiences.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const experiencesData = [
  {
    company: "IDT spa",
    role: "React Developer",
    duration: "2025",
    description: [
      "Sviluppo e manutenzione di feature complesse per l'applicazione web principale, utilizzando React, TypeScript e Redux per una gestione dello stato scalabile.",
      "Progettazione e implementazione di una libreria di componenti riutilizzabili che ha standardizzato l'interfaccia utente e accelerato i tempi di sviluppo del 30%.",
      "Collaborazione stretta con il team UI/UX per tradurre mockup da Figma in interfacce responsive e pixel-perfect, garantendo un'alta fedeltà al design.",
      "Ottimizzazione delle performance dell'applicazione attraverso tecniche di code-splitting e lazy loading, migliorando il First Contentful Paint (FCP) di 200ms.",
    ],
  },
  {
    company: "E.Roi srl",
    role: "Full Stack Developer",
    duration: "2024",
    description: [
      "Gestione dello sviluppo end-to-end di una piattaforma di e-commerce B2B con Next.js e TypeScript, curando sia il frontend che il backend.",
      "Progettazione e sviluppo di API RESTful per l'integrazione con sistemi di gestione esterni e gateway di pagamento.",
      "Implementazione di un'architettura serverless su Vercel e gestione del database su Supabase, garantendo alta disponibilità e scalabilità.",
      "Creazione di una dashboard amministrativa interattiva per la gestione di prodotti, ordini e clienti, migliorando l'efficienza operativa interna.",
    ],
  },
  {
    company: "Freelancer",
    role: "Full Stack Developer",
    duration: "2023",
    description: [
      "Fornito soluzioni web complete a piccole e medie imprese, gestendo l'intero ciclo di vita del progetto: dalla raccolta dei requisiti al rilascio finale.",
      "Sviluppo di siti web custom e applicazioni web utilizzando lo stack MERN (MongoDB, Express, React, Node.js) e Next.js in base alle esigenze del cliente.",
      "Gestione della comunicazione con i clienti, definizione delle scadenze e fornitura di supporto tecnico e manutenzione post-lancio.",
      "Configurazione di strategie SEO on-page e integrazione con strumenti di analytics per monitorare e migliorare la visibilità online dei clienti.",
    ],
  },
];

// Contenuto testuale statico della sezione
const content = {
  eyebrow: "Career Path",
  heading: "Work Experience",
};

export default function Experiences() {
  const [activeExperience, setActiveExperience] = useState(0);
  const currentExperience = experiencesData[activeExperience];

  return (
    <section id="experience" className="bg-slate-50 dark:bg-[#111111] py-24 sm:py-32 flex justify-center items-center h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center lg:text-left lg:mx-0">
          <p className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            {content.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {content.heading}
          </h2>
        </div>

        <div className="mt-16 flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* --- Colonna Sinistra: Tabs di Navigazione --- */}
          {/* MODIFICA: Aggiunte classi per nascondere la scrollbar su mobile */}
          <div className="flex flex-row lg:flex-col lg:w-1/4 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {experiencesData.map((exp, index) => (
              <button
                key={exp.company}
                onClick={() => setActiveExperience(index)}
                // MODIFICA: 'w-full' diventa 'lg:w-full' per funzionare correttamente su mobile
                className={`relative shrink-0 text-left p-4 whitespace-nowrap lg:w-full text-sm font-medium transition-colors duration-300 border-b-2 lg:border-b-0 lg:border-l-2 ${
                  activeExperience === index
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                {exp.company}
              </button>
            ))}
          </div>

          {/* --- Colonna Destra: Dettagli dell'Esperienza --- */}
          <div className="lg:w-3/4">
            <AnimatePresence mode="popLayout">
              <motion.div
                layout
                key={activeExperience}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              >
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  <span className="text-blue-600 dark:text-blue-400">@</span> {currentExperience.role}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {currentExperience.company} · {currentExperience.duration}
                </p>
                <ul className="mt-6 space-y-4 text-slate-600 dark:text-slate-300">
                  {currentExperience.description.map((item, index) => (
                    <li key={index} className="flex gap-3">
                      <svg
                        className="h-6 w-5 flex-none text-blue-600 dark:text-blue-500 mt-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}