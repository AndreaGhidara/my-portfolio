"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";

type Translations = {
  brandAria: string;
  brandName: string;
  ctaTitle: string;
  ctaSubtitle: string;
  emailTitle: string;
  phoneTitle: string;
  addressTitle: string;
  copyright: string;
  socials: {
    linkedinAria: string;
    githubAria: string;
  };
};

type ContactData = {
  email: string;
  phone:string;
  address: string;
  linkedin: string;
  github: string;
};

type FooterClientProps = {
  translations: Translations;
  contactData: ContactData;
  currentYear: number;
};

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

export default function FooterClient({ translations: t, contactData, currentYear }: FooterClientProps) {

  return (
    <motion.footer
      className="relative w-full bg-white text-slate-700 dark:bg-[#121212] dark:text-gray-300 overflow-hidden"
      variants={footerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
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
            <Link href="/" aria-label={t.brandAria}>
              <span className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">
                {t.brandName}
              </span>
            </Link>
            <h2 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white">
              {t.ctaTitle}
            </h2>
            <p className="mt-4 max-w-md mx-auto lg:mx-0 text-slate-600 dark:text-gray-400">
              {t.ctaSubtitle}
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
                  {t.emailTitle}
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
                  {t.phoneTitle}
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
                  {t.addressTitle}
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
            © {currentYear} {t.copyright}
          </p>
          <div className="flex items-center gap-4">
            <a
              target={`_blank`}
              href={contactData.linkedin}
              aria-label={t.socials.linkedinAria}
              className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <svg>
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <Link
              target={`_blank`}
              href={contactData.github}
              aria-label={t.socials.githubAria}
              className="text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <svg>
                <title>GitHub</title>
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}