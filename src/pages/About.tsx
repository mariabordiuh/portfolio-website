import { ArrowUpRight } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';

const SITE_SHELL_CLASS = 'mx-auto max-w-7xl px-6 md:px-8 xl:px-12';

const CONTACT_LINKS = [
  {
    label: 'Email',
    href: 'mailto:mariabordiuh@gmail.com',
    external: false,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/mariia-bordiuh/',
    external: true,
  },
] as const;

export const About = () => {
  return (
    <PageTransition>
      <section className="min-h-[100svh] bg-brand-bg pb-24 pt-32 md:pb-32 md:pt-40">
        <div className={SITE_SHELL_CLASS}>
          <div className="w-full max-w-md">
          <h1 className="font-display text-[11px] font-bold uppercase tracking-[0.32em] text-white">
            Maria Bordiuh
          </h1>

          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-brand-muted">
            Art Director
            <br />
            &amp; AI Creative Director
          </p>

          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-brand-muted">
            Based in Hamburg
          </p>

          <div className="mt-10 h-px w-full bg-white/10" />

          <ul className="mt-8 flex flex-col gap-4">
            {CONTACT_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white transition-colors hover:text-brand-accent"
                >
                  {link.label}
                  <ArrowUpRight
                    size={12}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </a>
              </li>
            ))}
          </ul>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};
