import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '../lib/utils';

interface RevealOnScrollProps
  extends Omit<HTMLMotionProps<'div'>, 'initial' | 'whileInView' | 'transition' | 'viewport'> {
  children: React.ReactNode;
  delay?: number;
}

export const RevealOnScroll = ({
  children,
  delay = 0,
  className,
  ...props
}: RevealOnScrollProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 100,
        delay,
      }}
      viewport={{ once: true, amount: 0.2 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};
