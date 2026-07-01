import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { LogoCloud } from "@/components/sections/LogoCloud";
import { FeaturesLight } from "@/components/sections/FeaturesLight";
import { ModuleTabs } from "@/components/sections/ModuleTabs";
import { ComparisonSection } from "@/components/sections/ComparisonSection";
import { StatsBar } from "@/components/sections/StatsBar";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LogoCloud />
        <FeaturesLight />
        <ModuleTabs />
        <ComparisonSection />
        <StatsBar />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
