'use client'

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SwitchTheme from "@/components/molecules/SwitchTheme";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#projects", label: "Projects" },
  { href: "/#experience", label: "Experience" },
  { href: "/#contact", label: "Contact" },
];

const menuVariants = {
  hidden: {
    opacity: 0,
    y: "-100%",
  },
  visible: {
    opacity: 1,
    y: "0%",
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: "-100%",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
} as const;

const linkVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
    },
  },
} as const;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <nav className="container mx-auto px-6 py-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex-1 text-start space-x-3">
            <p className="text-start w-full text-xl font-bold tracking-tighter text-slate-900 dark:text-white">ANDREW-DEV</p>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.label === "CV" ? "_blank" : undefined}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-8">
              <SwitchTheme />
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-slate-900 dark:text-white z-40"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-50 dark:bg-[#111111] flex flex-col items-center justify-center"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button
              onClick={toggleMenu}
              className="absolute top-7 right-6 text-slate-900 dark:text-white"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <motion.ul
              className="flex flex-col items-center space-y-8"
            >
              {navLinks.map((link) => (
                <motion.li key={link.href} variants={linkVariants}>
                  <Link
                    href={link.href}
                    target={link.label === "CV" ? "_blank" : undefined}
                    onClick={toggleMenu}
                    className="text-3xl font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li variants={linkVariants}>
                <SwitchTheme />
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}