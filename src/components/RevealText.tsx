import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
}

export const RevealText = ({ children, className }: RevealTextProps) => {
  return (
    <div className={cn("overflow-hidden py-2 -my-2", className)}>
      <motion.span
        variants={{
          hidden: { y: '110%' },
          visible: { 
            y: 0,
            transition: { duration: 1.2, ease: [0.19, 1, 0.22, 1] }
          }
        }}
        className="block"
      >
        {children}
      </motion.span>
    </div>
  );
};
