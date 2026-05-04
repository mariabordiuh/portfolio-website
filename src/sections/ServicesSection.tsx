import { RevealOnScroll } from '../components/RevealOnScroll';

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
    <section className="px-6 md:px-12 py-40">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll className="mb-20">
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-brand-muted mb-4 font-mono">
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
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,87,112,0.14),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(52,72,104,0.18),transparent_34%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="mb-8">
                <span className="relative block mb-3 text-[10px] font-mono uppercase tracking-[0.3em] text-brand-accent">
                  {group.tag}
                </span>
                <h3 className="relative text-sm font-black uppercase leading-tight tracking-wider">
                  {group.title}
                </h3>
              </div>

              <ul className="relative mt-auto space-y-3">
                {group.services.map((service) => (
                  <li
                    key={service}
                    className="whitespace-nowrap text-[11px] font-medium uppercase leading-relaxed tracking-[0.15em] text-white/55 transition-colors duration-300 group-hover:text-white/72"
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
