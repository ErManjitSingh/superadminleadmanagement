import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Trust } from "@/components/sections/Trust";
import { WhyFeatures } from "@/components/sections/WhyFeatures";
import { ModuleShowcase } from "@/components/sections/ModuleShowcase";
import { FeatureGrid } from "@/components/sections/FeatureGrid";
import { Workflow } from "@/components/sections/Workflow";
import { Comparison } from "@/components/sections/Comparison";
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
        <Trust />
        <WhyFeatures />
        <ModuleShowcase />
        <FeatureGrid />
        <Workflow />
        <Comparison />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
