const UPDATE_NOTE =
  'Site update in progress // some case-study details, previews, and archive pieces are still being tuned live // thanks for your patience //';

export const UpdateMarquee = () => {
  const items = Array.from({ length: 6 }, (_, index) => `${UPDATE_NOTE}${index}`);

  return (
    <section
      className="update-marquee"
      aria-label="Website update notice"
    >
      <div className="update-marquee-track py-3">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex shrink-0 items-center gap-4 pr-4 font-mono text-[10px] uppercase tracking-[0.24em] text-white/72"
            aria-hidden={index > 0}
          >
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span>{UPDATE_NOTE}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
