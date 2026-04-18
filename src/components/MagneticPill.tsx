import React from 'react';
import { useMagnetic } from '../hooks/useMagnetic';
import { cn } from '../lib/utils';

interface MagneticPillProps {
  children: React.ReactNode;
  className: string;
}

export const MagneticPill = ({ children, className }: MagneticPillProps) => {
  const ref = useMagnetic<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("magnetic-btn", className)}>
      {children}
    </div>
  );
};
