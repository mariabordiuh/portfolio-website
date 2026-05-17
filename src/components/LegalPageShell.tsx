import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
import { PrefetchLink } from './PrefetchLink';
import { PageTransition } from './PageTransition';

const LEGAL_SHELL_CLASS = 'mx-auto max-w-4xl px-6 md:px-8 xl:px-12';

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export const LegalPageShell = ({
  eyebrow,
  title,
  intro,
  children,
}: LegalPageShellProps) => (
  <PageTransition>
    <section className="min-h-[100svh] bg-brand-bg pb-24 pt-32 text-white md:pb-32 md:pt-40">
      <div className={LEGAL_SHELL_CLASS}>
        <div className="max-w-[42rem]">
          <PrefetchLink
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-white/52 transition-colors hover:text-brand-accent"
          >
            <ArrowLeft size={13} />
            Back home
          </PrefetchLink>

          <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.34em] text-brand-accent">
            {eyebrow}
          </p>

          <h1 className="mt-5 max-w-[14ch] font-display text-[clamp(2.5rem,5vw,4.6rem)] font-bold uppercase leading-[0.9] tracking-[-0.045em] text-white">
            {title}
            <span className="text-brand-accent">.</span>
          </h1>

          <p className="mt-6 max-w-[40rem] text-[clamp(1rem,0.9rem+0.3vw,1.14rem)] leading-relaxed text-white/68">
            {intro}
          </p>
        </div>

        <div className="mt-14 border-t border-white/10 pt-10">
          {children}
        </div>
      </div>
    </section>
  </PageTransition>
);
