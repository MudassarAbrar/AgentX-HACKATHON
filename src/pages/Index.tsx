import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TestimonialLifestyle from "@/components/TestimonialLifestyle";
import CategoriesSection from "@/components/CategoriesSection";
import ProductGrid from "@/components/ProductGrid";

import NewStylesSection from "@/components/NewStylesSection";
import HappyVoices from "@/components/HappyVoices";
import InstagramFeed from "@/components/InstagramFeed";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const Index = () => {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <LoadingScreen />
      <Navbar />
      <main>
        <HeroSection />
        <TestimonialLifestyle />
        <CategoriesSection />
        <ProductGrid />
        
        <NewStylesSection />
        <HappyVoices />
        <InstagramFeed />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
