import React from 'react';
import { motion } from 'motion/react';

export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.985, y: 22, filter: 'blur(14px)' }}
    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 1.015, y: -16, filter: 'blur(10px)' }}
    transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);
