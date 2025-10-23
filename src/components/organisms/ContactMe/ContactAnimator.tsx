"use client";

import { motion } from "framer-motion";
import React from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

type ContactAnimatorProps = {
  staticContent: React.ReactNode;
  formComponent: React.ReactNode;
};

export default function ContactAnimator({ staticContent, formComponent }: ContactAnimatorProps) {
  return (
    <motion.div
      className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-1"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.div
        className="flex flex-col justify-center text-center lg:text-center"
        variants={itemVariants}
      >
        {staticContent}
      </motion.div>
      {formComponent}
    </motion.div>
  );
}