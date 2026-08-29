"use client";

import { useEffect, useState } from "react";

/**
 * La lampadina del prototipo. Un'icona da sola non è un comando
 * accessibile: serve un <button> con nome, e aria-pressed per dire in che
 * stato si trova.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={isDark}
      data-theme-toggle
      className="grid size-9 place-items-center rounded-full border border-[var(--line)] text-[var(--fg)] transition-colors hover:bg-[var(--line)]/30"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M9 18h6M10 21h4" strokeLinecap="round" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.3.2.5.6.5 1V16h6v-1.1c0-.4.2-.8.5-1A6 6 0 0 0 12 3Z" />
      </svg>
    </button>
  );
}
