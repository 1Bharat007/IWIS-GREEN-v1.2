"use client";

import { motion } from "framer-motion";

export default function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {value}
    </motion.span>
  );
}
