import React from 'react';
import { cn } from '../lib/utils';

interface TagProps {
  name: string;
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
  active?: boolean;
}

export const Tag = ({ name, onClick, className, active }: TagProps) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
      active 
        ? "bg-brand-accent text-brand-bg shadow-lg shadow-brand-accent/20" 
        : "bg-white/5 text-brand-muted hover:bg-white/10 hover:text-white border border-white/5",
      className
    )}
  >
    {name}
  </button>
);
