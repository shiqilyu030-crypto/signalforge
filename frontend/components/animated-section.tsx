"use client";

import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

type AnimatedSectionProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  id?: string;
}>;

export function AnimatedSection({
  children,
  className,
  delay = 0,
  id
}: AnimatedSectionProps) {
  return (
    <motion.section
      id={id}
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}
