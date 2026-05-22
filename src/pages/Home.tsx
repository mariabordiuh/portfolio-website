import { lazy, Suspense } from 'react';
import { PageTransition } from '../components/PageTransition';
import { CatHero } from '../components/CatHero';
import { UpdateMarquee } from '../components/UpdateMarquee';
import { ServicesSection } from '../sections/ServicesSection';
import { ContactCTA } from '../sections/ContactCTA';

const WorkSection = lazy(() =>
  import('../sections/WorkSection').then((module) => ({ default: module.WorkSection })),
);

const WorkSectionFallback = () => (
  <section className="px-6 pb-24 pt-24 md:px-12 md:pt-28">
    <div className="mx-auto max-w-7xl">
      <div className="mb-14 h-36 max-w-4xl rounded-[2rem] border border-white/5 bg-white/[0.02] md:mb-16" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] rounded-[1.8rem] border border-white/5 bg-white/[0.02]"
          />
        ))}
      </div>
    </div>
  </section>
);

export const Home = () => {
  return (
    <PageTransition>
      <div className="bg-brand-bg min-h-screen">
        <CatHero />
        <UpdateMarquee />
        <Suspense fallback={<WorkSectionFallback />}>
          <WorkSection />
        </Suspense>
        <ServicesSection />
        <ContactCTA />
      </div>
    </PageTransition>
  );
};
