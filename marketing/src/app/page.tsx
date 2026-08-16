import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Destinations } from "@/components/sections/Destinations";
import { Packages } from "@/components/sections/Packages";
import { TrustBar } from "@/components/sections/TrustBar";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Destinations />
        <TrustBar />
        <Packages />
        <FAQ />
        <div id="honeymoon">
          <FinalCTA />
        </div>
      </main>
      <Footer />
    </>
  );
}
