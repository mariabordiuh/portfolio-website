import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-brand-bg px-6 text-center">

    {/* 404 numeral */}
    <motion.p
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="font-black tracking-tighter text-brand-accent leading-none select-none"
      style={{ fontSize: 'clamp(120px, 20vw, 200px)' }}
      aria-label="404"
    >
      404
    </motion.p>

    {/* Message */}
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
      className="mt-4 text-xl font-semibold text-brand-muted tracking-tight"
    >
      This page wandered off.
    </motion.p>

    {/* CTA */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-10"
    >
      <Link
        to="/"
        className="px-8 py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-brand-accent transition-all"
      >
        Back home
      </Link>
    </motion.div>

    {/* Silent cat — bottom-right, 16px, 20% opacity */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute bottom-6 right-6 text-white"
      style={{ opacity: 0.2 }}
      aria-hidden="true"
    >
      {/* Cat face */}
      <path d="M12 5C8.5 5 6 7.5 6 11v5c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-5c0-3.5-2.5-6-6-6z"/>
      {/* Left ear */}
      <path d="M8 5 L6 1 L10 4"/>
      {/* Right ear */}
      <path d="M16 5 L18 1 L14 4"/>
      {/* Eyes */}
      <circle cx="10" cy="11" r="0.8" fill="currentColor"/>
      <circle cx="14" cy="11" r="0.8" fill="currentColor"/>
      {/* Nose */}
      <path d="M11.5 13 L12 13.5 L12.5 13"/>
    </svg>
  </div>
);
