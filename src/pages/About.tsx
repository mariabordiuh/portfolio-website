import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
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

const CV_NOTES = [
  {
    title: 'Background',
    body: 'Design, animation, and art direction first. The visual storytelling part came before the tools.',
  },
  {
    title: 'Now',
    body: 'I build brand worlds, motion systems, AI visuals, and concept directions that still feel human and crafted.',
  },
  {
    title: 'Working style',
    body: 'Mood boards, references, prompts, prototypes, edits, and too many tabs open at once until the system clicks.',
  },
  {
    title: 'Tech side',
    body: 'Nerdy enough to use AI tools, generative workflows, and vibecoding when they help the idea move faster.',
  },
  {
    title: 'Availability',
    body: 'Based in Hamburg. Open to selected freelance and collaborative projects, remote or hybrid.',
  },
  {
    title: 'NDA energy',
    body: 'Some recent work is still under wraps, in development, or simply better shown in person than listed in public.',
  },
] as const;

export const About = () => {
  return (
    <PageTransition>
      <section className="min-h-[100svh] bg-brand-bg pb-24 pt-32 md:pb-32 md:pt-40">
        <div className={SITE_SHELL_CLASS}>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="max-w-[54rem]">
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/52">
                Why work with me
              </p>

              <h1 className="mt-5 max-w-[12ch] font-display text-[clamp(3rem,6vw,5.7rem)] font-bold uppercase leading-[0.88] tracking-[-0.045em] text-white">
                Maria
                <br />
                Bordiuh<span className="text-brand-accent">.</span>
              </h1>

              <p className="mt-6 max-w-[46rem] text-[clamp(1rem,0.88rem+0.4vw,1.22rem)] leading-relaxed text-white/72">
                I’m an Art Director with roots in design and animation, working across visual
                storytelling, motion, AI image systems, and creative technology. I like projects
                that need both taste and structure: the emotional part and the systems part.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                {CONTACT_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="btn-glass-shift px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
                  >
                    {link.label}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
            </div>

            <aside className="lg:pt-8">
              <div className="border-t border-white/10 pt-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-accent">
                  Quick facts
                </p>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                      Role
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/74">
                      Art direction, AI visuals, motion, concept development
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                      Based in
                    </p>
                    <p className="mt-1 inline-flex items-center gap-2 text-sm leading-relaxed text-white/74">
                      <MapPin size={14} className="text-brand-accent" />
                      Hamburg
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                      Best fit
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/74">
                      Brand worlds, campaign visuals, generative image systems, motion-led
                      storytelling
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                      Contact
                    </p>
                    <a
                      href="mailto:mariabordiuh@gmail.com"
                      className="mt-1 inline-flex items-center gap-2 text-sm leading-relaxed text-white/74 transition-colors hover:text-white"
                    >
                      <Mail size={14} className="text-brand-accent" />
                      mariabordiuh@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-20 border-t border-white/10 pt-12">
            <div className="max-w-[48rem]">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-accent">
                CV notes
              </p>
              <h2 className="mt-4 max-w-[18ch] text-[clamp(1.8rem,2.8vw,3rem)] font-semibold leading-[1.02] text-white normal-case">
                A shorter, slightly more human version of the CV.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {CV_NOTES.map((note) => (
                <article
                  key={note.title}
                  className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 backdrop-blur-sm"
                >
                  <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/45 to-transparent" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/46">
                    {note.title}
                  </p>
                  <p className="mt-4 text-[0.98rem] leading-relaxed text-white/72">{note.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};
