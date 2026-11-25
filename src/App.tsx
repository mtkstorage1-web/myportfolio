import { MotionConfig } from 'motion/react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProjectSlidesSection } from './components/ProjectSlidesSection';
import { ChronicleSection } from './components/ChronicleSection';
import { ArsenalSection } from './components/ArsenalSection';
import { ContactSection } from './components/ContactSection';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A]">
        <Navbar />
        <main>
          <HeroSection />
          <ProjectSlidesSection />
          <ChronicleSection />
          <ArsenalSection />
          <ContactSection />
        </main>
      </div>
    </MotionConfig>
  );
}
