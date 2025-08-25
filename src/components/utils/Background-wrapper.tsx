"use client";

import React from "react";
import { useMotionValue, useMotionTemplate, motion } from "framer-motion";

export function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // MODIFICATO: La dimensione del SVG è ora 16x16 invece di 32x32
  const baseGrid =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='current-color' stroke-width='0.5' opacity='0.2'%3E%3Cpath d='M0 .5H16M.5 0V16'/%3E%3C/svg%3E\")";

  // MODIFICATO: Anche la griglia in hover è ora 16x16
  const hoverGrid =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke='blue' stroke-width='1' opacity='0.4'%3E%3Cpath d='M0 .5H16M.5 0V16'/%3E%3C/svg%3E\")";

  return (
    <div
      className="relative w-full min-h-screen group text-zinc-400 dark:text-zinc-800"
      onMouseMove={handleMouseMove}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: baseGrid,
        }}
      />

      <motion.div
        className="absolute inset-0 pointer-events-none z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: hoverGrid,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              220px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              220px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />

      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}