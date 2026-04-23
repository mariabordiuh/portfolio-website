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
      <RevealOnScroll className="mb-20">
        <h4 className="text-[10px] uppercase tracking-[0.4em] text-brand-muted mb-4 font-mono">
          Sequence // 02
        </h4>
        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">
          Services<span className="text-brand-accent">.</span>
        </h2>
      </RevealOnScroll>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
        {SERVICE_GROUPS.map((group, groupIndex) => (
          <RevealOnScroll
            key={group.tag}
            delay={groupIndex * 0.06}
            className="bg-brand-bg p-8 md:p-10 flex flex-col"
          >
            <div className="mb-8">
              <span className="text-[10px] font-mono text-brand-accent uppercase tracking-[0.3em] block mb-3">
                {group.tag}
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider leading-tight">
                {group.title}
              </h3>
            </div>

            <ul className="space-y-3 mt-auto">
              {group.services.map((service) => (
                <li
                  key={service}
                  className="text-[11px] text-white/55 uppercase tracking-[0.15em] leading-relaxed font-medium hover:text-white transition-colors duration-300 cursor-default whitespace-nowrap"
                >
                  {service}
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
};
