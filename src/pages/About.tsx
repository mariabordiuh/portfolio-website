import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Cat, Linkedin, Mail } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { RevealOnScroll } from '../components/RevealOnScroll';
import { RevealText } from '../components/RevealText';

const fadeInUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

const PRACTICE_AREAS = [
  {
    number: '01',
    title: 'Art Direction',
    body: 'Campaign worlds, image systems, and visual narratives that stay coherent from first reference to final rollout.',
  },
  {
    number: '02',
    title: 'Motion & Design',
    body: 'Motion language, rollout assets, and design implementation when the idea needs to move beyond decks and into experience.',
  },
  {
    number: '03',
    title: 'AI-Led Production',
    body: 'Generative exploration, automation, and model-led workflows used as production tools rather than novelty effects.',
  },
] as const;

const SIGNAL_GROUPS = [
  {
    label: 'Selected Contexts',
    items: ['Novo Nordisk', 'Nestle', 'Morshynska', 'fashion tech', 'independent projects'],
  },
  {
    label: 'Toolchain',
    items: ['Houdini', 'Midjourney', 'Adobe Firefly', 'Runway', 'Make', 'React / Vite'],
  },
  {
    label: 'Languages',
    items: ['Ukrainian', 'English', 'German'],
  },
] as const;

const METHOD_STEPS = [
  {
    number: '01',
    title: 'Frame the tension',
    body: 'Every project starts with the story logic: what needs to be felt, what needs to be believed, and what visual tension keeps the work alive.',
  },
  {
    number: '02',
    title: 'Build the visual system',
    body: 'Moodboards, references, prompts, motion tests, and structure come together early so the project can scale without losing its point of view.',
  },
  {
    number: '03',
    title: 'Edit hard',
    body: 'AI is treated like a collaborator, not an oracle. Outputs get cut, refined, redirected, and art-directed until they carry intention.',
  },
  {
    number: '04',
    title: 'Deliver clearly',
    body: 'The end result is not just a pretty frame. It is a usable system for campaigns, presentations, product stories, and rollout teams.',
  },
] as const;

export const About = () => {
  return (
    <PageTransition>
      <div className="relative overflow-hidden bg-brand-bg">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-24 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-brand-accent/10 blur-[120px] opacity-15" />
          <div className="absolute -left-24 top-[32rem] h-[26rem] w-[26rem] rounded-full border border-white/6 blur-[110px] opacity-10" />
          <div className="absolute -right-24 bottom-16 h-[28rem] w-[28rem] rounded-full border border-brand-accent/8 blur-[130px] opacity-10" />
        </div>

        <section className="px-6 pb-24 pt-32 md:pb-28 md:pt-40">
          <div className="mx-auto grid max-w-7xl gap-14 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] xl:items-end">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.14,
                  },
                },
              }}
              className="max-w-3xl"
            >
              <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.42em] text-brand-muted">
                Maria Bordiuh // About // Hamburg
              </p>

              <h1
                className="mb-8 leading-[0.9] tracking-tight text-white"
                style={{ fontSize: 'clamp(3.2rem, 7.5vw, 6.8rem)' }}
              >
                <RevealText>Direction for images,</RevealText>
                <RevealText>
                  motion, and AI systems<span className="text-brand-accent">.</span>
                </RevealText>
              </h1>

              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="max-w-2xl text-fluid-base leading-relaxed text-white/72"
              >
                I am an Art Director and AI Creative Director based in Hamburg, building visual worlds that
                stay sharp from concept through delivery. The work moves between campaigns, motion,
                generative image systems, and the practical design work that makes an idea usable.
              </motion.p>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <a
                  href="mailto:mariabordiuh@gmail.com"
                  className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-black transition-all hover:bg-brand-accent"
                >
                  Say hi
                  <ArrowUpRight size={14} />
                </a>
                <Link
                  to="/work"
                  className="inline-flex items-center gap-3 rounded-full border border-white/12 px-7 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-white transition-all hover:border-white hover:bg-white hover:text-black"
                >
                  View work
                </Link>
                <a
                  href="https://www.linkedin.com/in/mariia-bordiuh/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-full border border-white/12 px-7 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-muted transition-all hover:border-brand-accent hover:text-brand-accent"
                >
                  LinkedIn
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              {...fadeInUp}
              className="relative min-h-[34rem] overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.03] px-8 py-8 md:px-10 md:py-10"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,158,187,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_42%)]" />
              <div className="absolute right-[-6%] top-[8%] font-display text-[clamp(6rem,18vw,12rem)] italic leading-none text-white/[0.06]">
                Maria.
              </div>

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <p className="mb-10 font-mono text-[10px] uppercase tracking-[0.34em] text-brand-accent">
                    Art direction // motion // generative systems
                  </p>
                  <p className="max-w-md font-display text-3xl italic leading-tight text-white md:text-[2.4rem]">
                    AI is a production layer. Editing is the job.
                  </p>
                </div>

                <div className="grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2">
                  <div>
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted">
                      Base
                    </p>
                    <p className="text-lg text-white">Hamburg, working globally.</p>
                  </div>
                  <div>
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted">
                      Focus
                    </p>
                    <p className="text-lg text-white">
                      Brand worlds, campaign imagery, motion, and systems thinking.
                    </p>
                  </div>
                  <div>
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted">
                      Languages
                    </p>
                    <p className="text-lg text-white">Ukrainian, English, German.</p>
                  </div>
                  <div>
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted">
                      Working style
                    </p>
                    <p className="text-lg text-white">Taste first. Systems second. Noise removed.</p>
                  </div>
                </div>
              </div>

              <Cat
                size={18}
                className="pointer-events-none absolute bottom-5 left-5 text-white/22"
                aria-hidden="true"
              />
            </motion.div>
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <motion.div {...fadeInUp} className="mb-14 max-w-2xl">
              <RevealOnScroll>
                <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-brand-accent">
                  Practice // 01
                </p>
                <h2 className="text-4xl leading-[0.96] tracking-tight text-white md:text-6xl">
                  What I actually bring to a project.
                </h2>
              </RevealOnScroll>
            </motion.div>

            <div className="grid gap-10 md:grid-cols-3">
              {PRACTICE_AREAS.map((area, index) => (
                <motion.article
                  key={area.title}
                  {...fadeInUp}
                  transition={{ ...fadeInUp.transition, delay: index * 0.08 }}
                  className="border-t border-white/10 pt-6"
                >
                  <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-accent">
                    {area.number}
                  </p>
                  <h3 className="mb-4 text-2xl tracking-tight text-white">{area.title}</h3>
                  <p className="max-w-sm leading-relaxed text-brand-muted">{area.body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-7xl gap-8 border-y border-white/5 py-12 md:grid-cols-3">
            {SIGNAL_GROUPS.map((group, index) => (
              <motion.div
                key={group.label}
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: index * 0.07 }}
                className="border-t border-white/10 pt-5 md:border-t-0 md:pt-0"
              >
                <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-3">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/74"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/5 px-6 py-24">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
            <motion.div {...fadeInUp} className="lg:sticky lg:top-32 lg:self-start">
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-brand-accent">
                Method // 02
              </p>
              <h2 className="max-w-md text-4xl leading-[0.96] tracking-tight text-white md:text-6xl">
                Direction with a system behind it.
              </h2>
              <p className="mt-8 max-w-md leading-relaxed text-brand-muted">
                My role is usually vision and direction: the story, the visual logic, and the decisions that
                keep a project coherent. Specialists join where needed, and AI is treated exactly the same way:
                as a capable collaborator whose work still needs taste, judgment, and editing.
              </p>
            </motion.div>

            <div className="space-y-10">
              {METHOD_STEPS.map((step, index) => (
                <motion.div
                  key={step.title}
                  {...fadeInUp}
                  transition={{ ...fadeInUp.transition, delay: index * 0.08 }}
                  className="grid gap-5 border-t border-white/10 pt-6 md:grid-cols-[84px_minmax(0,1fr)]"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-accent">
                    {step.number}
                  </p>
                  <div>
                    <h3 className="mb-3 text-2xl tracking-tight text-white">{step.title}</h3>
                    <p className="max-w-2xl leading-relaxed text-brand-muted">{step.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-32">
          <RevealOnScroll className="mx-auto max-w-5xl rounded-[2.75rem] border border-white/10 bg-white/[0.03] px-8 py-12 md:px-12 md:py-16">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-brand-accent">
              Contact // 03
            </p>
            <h2 className="max-w-3xl text-4xl leading-[0.96] tracking-tight text-white md:text-6xl">
              If the brief needs taste, structure, and a workflow that can scale, let&apos;s talk.
            </h2>
            <p className="mt-6 max-w-2xl leading-relaxed text-brand-muted">
              Available for freelance projects, campaign systems, motion direction, and AI-supported visual
              development.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="mailto:mariabordiuh@gmail.com"
                className="inline-flex items-center gap-3 rounded-full bg-brand-accent px-7 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-bg transition-all hover:brightness-105"
              >
                <Mail size={14} />
                mariabordiuh@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/mariia-bordiuh/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full border border-white/12 px-7 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white hover:text-black"
              >
                <Linkedin size={14} />
                LinkedIn
              </a>
              <Link
                to="/work"
                className="inline-flex items-center gap-3 rounded-full border border-white/12 px-7 py-4 text-[10px] font-black uppercase tracking-[0.24em] text-brand-muted transition-all hover:border-brand-accent hover:text-brand-accent"
              >
                View selected work
              </Link>
            </div>
          </RevealOnScroll>
        </section>
      </div>
    </PageTransition>
  );
};
