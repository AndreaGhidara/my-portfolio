"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Github } from "lucide-react";

const contactData = {
  email: "andrea.ghidara.99@gmail.com",
  phone: "351 335 0725",
  address: "Torino",
  linkedin: "https://it.linkedin.com/in/andrea-ghidara",
  github: "https://github.com/AndreaGhidara",
} as const;

const footerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
} as const;

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <motion.footer
      className="relative w-full bg-white text-slate-700 dark:bg-[#121212] dark:text-gray-300 overflow-hidden"
      variants={footerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Pattern sfondo */}
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

      <div className="relative z-10 container mx-auto px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Brand + CTA */}
          <motion.div
            className="lg:col-span-5 text-center lg:text-left"
            variants={itemVariants}
          >
            <Link href="/" aria-label={t("brandAria")}>
              <span className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">
                {t("brandName")}
              </span>
            </Link>
            <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white">
              {t("ctaTitle")}
            </h2>
            <p className="mt-4 max-w-md mx-auto lg:mx-0 text-slate-600 dark:text-gray-400">
              {t("ctaSubtitle")}
            </p>
          </motion.div>

          {/* Contatti */}
          <motion.div
            className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8"
            variants={itemVariants}
          >
            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-full bg-black/5 dark:bg-white/10">
                <Mail className="h-6 w-6 text-slate-900 dark:text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {t("emailTitle")}
                </h3>
                <a
                  href={`mailto:${contactData.email}`}
                  className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  {contactData.email}
                </a>
              </div>
            </div>

            {/* Telefono */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-full bg-black/5 dark:bg-white/10">
                <Phone className="h-6 w-6 text-slate-900 dark:text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {t("phoneTitle")}
                </h3>
                <a
                  href={`tel:${contactData.phone.replace(/\s/g, "")}`}
                  className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  {contactData.phone}
                </a>
              </div>
            </div>

            {/* Indirizzo */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-full bg-black/5 dark:bg-white/10">
                <MapPin className="h-6 w-6 text-slate-900 dark:text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {t("addressTitle")}
                </h3>
                <p className="text-slate-600 dark:text-gray-400">
                  {contactData.address}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Copyright + Social */}
        <motion.div
          className="mt-16 pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6"
          variants={itemVariants}
        >
          <p className="text-sm text-slate-500 dark:text-gray-500 text-center sm:text-left">
            © {new Date().getFullYear()} {t("copyright")}
          </p>
          <div className="flex items-center gap-4">
            <a
              href={contactData.linkedin}
              aria-label={t("socials.linkedinAria")}
              className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <Linkedin className="h-6 w-6" />
            </a>
            <a
              href={contactData.github}
              aria-label={t("socials.githubAria")}
              className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
