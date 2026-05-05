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
    title: 'Now',
    body: 'Since August 2024 I’ve been freelancing as an AI Specialist and Art Director, leading AI-driven video generation, visual direction, moodboards, character design, and custom workflows built around real production needs.',
  },
  {
    title: 'Motion foundation',
    body: 'Before that, I spent several years in motion design and 2D animation, from cut-out TV animation in Toon Boom to social assets, explainers, and digital campaign work.',
  },
  {
    title: 'Agency chapter',
    body: 'At weigertpirouzwolf in Hamburg I was the agency’s only motion designer, turning campaign ideas into motion, social assets, and promotional materials under small-team, fast-turnaround conditions.',
  },
  {
    title: 'Selected work',
    body: 'Recent work includes Novo Nordisk explainer videos and launch visuals, Morshynska’s dinosaur label world, motion spots for Silpo, and smaller web experiments like Mirror Atelier and pink33.party.',
  },
  {
    title: 'Education',
    body: 'I completed a Diploma in VFX & 3D Animation at SAE Institute Hamburg, after a B.A. in Japanese Language and Literature from Taras Shevchenko National University of Kyiv. Both left me with a mix of craft, structure, and curiosity.',
  },
  {
    title: 'Tools + tech',
    body: 'I work across After Effects, Photoshop, Houdini, Midjourney, various stuff on fal.ai, Codex, Claude Code, Firebase, and small custom UIs when a project needs them.',
  },
  {
    title: 'Languages',
    body: 'Ukrainian is my native language, English is fluent, German is strong enough for work, and my Japanese background still follows me around in useful ways. It makes international teams and weird cross-cultural briefs feel pretty natural to me.',
  },
  {
    title: 'NDA reality',
    body: 'Some recent work is still under wraps, still in development, or simply better explained in conversation than on a public page. The portfolio is selective by design, not because the rest does not exist.',
  },
  {
    title: 'Outside work',
    body: 'I moved to Hamburg in 2022 after living in Ukraine, the US, Poland, China, and Vietnam, so different people and cultures feel very natural to me. Outside work it is Loki, plants, coffee, and making things from scratch, from vibecoding a web app to rescuing street furniture.',
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
                I’m a Ukrainian Art Director based in Hamburg, with roots in design, animation,
                and visual storytelling. My work now sits between art direction, motion, AI image
                systems, and creative technology, especially when a project needs both a strong
                visual taste level and a nerdier workflow brain behind it.
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
                      Art direction, AI visuals, motion, concept development, lightweight creative
                      tech
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
                      storytelling, and experiments that still need real design judgment
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/44">
                      Current chapter
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-white/74">
                      Freelance AI Specialist / Art Director since 2024, building visuals and
                      workflows across campaigns, launch films, and branded experiments
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

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:auto-rows-fr">
              {CV_NOTES.map((note) => (
                <article
                  key={note.title}
                  className="relative h-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-6 backdrop-blur-sm"
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
