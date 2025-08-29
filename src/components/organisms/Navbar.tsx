'use client'

import {useEffect, useState} from "react";
import Link from "next/link";
import {motion, AnimatePresence} from "framer-motion";
import {createPortal} from "react-dom";
import SwitchTheme from "@/components/molecules/SwitchTheme";
import LanguageSwitcher from "@/components/molecules/LanguageSwitcher";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#projects", label: "Projects" },
  { href: "/#contact", label: "Contact" },
];

const menuVariants = {
  hidden: { opacity: 0, y: "-100%" },
  visible: {
    opacity: 1, y: "0%",
    transition: { type: "spring", stiffness: 100, damping: 20, when: "beforeChildren", staggerChildren: 0.1 }
  },
  exit: { opacity: 0, y: "-100%", transition: { duration: 0.25, ease: "easeInOut" } }
} as const;

const linkVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
} as const;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleMenu = () => setIsMenuOpen(v => !v);

  useEffect(() => {
    const el = document.documentElement;
    if (isMenuOpen) el.classList.add("overflow-hidden");
    else el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  return (
    <section className="sticky top-0 z-50 bg-white/80 dark:bg-[#111111]/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-start">
            <Link href="/" className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
              ANDREW-DEV
            </Link>
          </div>

          {/* Desktop */}
          <nav className="!hidden md:!flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end flex-1 space-x-2">
            <div className="hidden md:flex items-center space-x-2">
              <LanguageSwitcher />
              <SwitchTheme />
            </div>
            <button
              onClick={toggleMenu}
              className="md:hidden text-slate-900 dark:text-white z-[70] p-2"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              id="mobile-menu"
              className="fixed inset-0 z-[80] md:hidden bg-slate-50/95 dark:bg-[#111111]/95 backdrop-blur-lg
                         flex flex-col items-center justify-center"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMenuOpen(false)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                className="absolute top-7 right-6 text-slate-900 dark:text-white"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>

              <motion.ul
                className="flex flex-col items-center space-y-8"
                onClick={(e) => e.stopPropagation()}
              >
                {navLinks.map((link) => (
                  <motion.li key={link.href} variants={linkVariants}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-3xl font-semibold text-slate-800 dark:text-slate-200"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
                <motion.li variants={linkVariants} className="pt-8 gap-3 flex flex-col-reverse justify-center items-center">
                  <LanguageSwitcher />
                  <SwitchTheme />
                </motion.li>
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
