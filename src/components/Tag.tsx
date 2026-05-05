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
      "tool-pill",
      active 
        ? "tool-pill-active" 
        : "",
      className
    )}
  >
    {name}
  </button>
);
