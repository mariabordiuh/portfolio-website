import { PageTransition } from '../components/PageTransition';
import { CatHero } from '../components/CatHero';
import { UpdateMarquee } from '../components/UpdateMarquee';
import { WorkSection } from '../sections/WorkSection';
import { ServicesSection } from '../sections/ServicesSection';
import { ContactCTA } from '../sections/ContactCTA';

export const Home = () => {
  return (
    <PageTransition>
      <div className="bg-brand-bg min-h-screen">
        <CatHero />
        <UpdateMarquee />
        <WorkSection />
        <ServicesSection />
        <ContactCTA />
      </div>
    </PageTransition>
  );
};
