import { RevealOnScroll } from '../components/RevealOnScroll';
import { PUBLIC_SHELL_CLASS } from '../lib/layout';

const SERVICE_GROUPS = [
  {
    title: 'Creative Direction',
    tag: '01',
    services: [
      'Art Direction',
      'Creative Direction',
      'Creative Strategy',
      'Campaign Concepting',
      'Creative Partner',
    ],
  },
  {
    title: 'Brand & Identity',
    tag: '02',
    services: [
      'Brand Systems',
      'Verbal Identity',
      'Character Design',
      'Packaging Design',
      'Product Visualization',
    ],
  },
  {
    title: 'AI & Emerging',
    tag: '03',
    services: [
      'AI Art Direction',
      'AI Video Production',
      'AI Models & Photoshoots',
      'Prompt Engineering',
      'Vibecoding',
    ],
  },
  {
    title: 'Motion & Film',
    tag: '04',
    services: [
      '2D Animation',
      'Motion Design',
      'Music Video Direction',
      'Social Content',
      'Storyboarding',
    ],
  },
  {
    title: 'Visual Production',
    tag: '05',
    services: [
      'Editorial & Print',
      'Presentation Design',
      'Photography Direction',
      'Visual Research',
      'Workshops & Teaching',
    ],
  },
];

export const ServicesSection = () => {
  return (
    <section className="py-40">
      <div className={PUBLIC_SHELL_CLASS}>
        <RevealOnScroll className="mb-20">
          <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.4em] text-brand-muted">
            Sequence // 02
          </h4>
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">
            Services<span className="text-brand-accent">.</span>
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-white/5 bg-white/5 md:grid-cols-2 xl:grid-cols-5">
          {SERVICE_GROUPS.map((group, groupIndex) => (
            <RevealOnScroll
              key={group.tag}
              delay={groupIndex * 0.06}
              className="group relative overflow-hidden bg-brand-bg/94 p-8 backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 md:p-10 flex flex-col"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,158,187,0.14),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(255,214,224,0.12),transparent_34%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="mb-8">
                <span className="relative mb-3 block font-mono text-[10px] uppercase tracking-[0.3em] text-brand-accent">
                  {group.tag}
                </span>
                <h3 className="relative text-[0.98rem] font-black uppercase leading-[1.35] tracking-[0.14em]">
                  {group.title}
                </h3>
              </div>

              <ul className="relative mt-auto space-y-3">
                {group.services.map((service) => (
                  <li
                    key={service}
                    className="text-[0.92rem] font-medium uppercase leading-[1.65] tracking-[0.08em] text-white/66 transition-colors duration-300 group-hover:text-white/82"
                  >
                    {service}
                  </li>
                ))}
              </ul>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
};
