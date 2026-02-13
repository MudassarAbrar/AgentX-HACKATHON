import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import hero5 from "@/assets/hero-5.jpg";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 px-6 lg:px-12 max-w-[1440px] mx-auto overflow-hidden">
      {/* Headline */}
      <div className="text-center mb-10 lg:mb-14 scroll-reveal">
        <h1
          className="font-display font-extrabold text-foreground leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2.4rem, 6vw, 5.5rem)" }}
        >
          Elevate Your Style
          <br />
          With <span className="italic font-accent font-normal">Bold</span> Fashion
        </h1>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-4 md:grid-cols-12 auto-rows-[140px] md:auto-rows-[120px] lg:auto-rows-[140px] gap-3 lg:gap-4 scroll-reveal">
        {/* Image 1 — tall left */}
        <div className="col-span-2 md:col-span-3 row-span-3 rounded-2xl lg:rounded-3xl overflow-hidden group">
          <img src={hero1} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Image 2 — tall second */}
        <div className="col-span-2 md:col-span-3 row-span-3 rounded-2xl lg:rounded-3xl overflow-hidden group" style={{ animationDelay: "0.1s" }}>
          <img src={hero2} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Image 3 — top right with CTA */}
        <div className="col-span-2 md:col-span-3 row-span-2 rounded-2xl lg:rounded-3xl overflow-hidden relative group" style={{ animationDelay: "0.2s" }}>
          <img src={hero3} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-foreground/20 flex items-end p-4">
            <button className="bg-foreground text-primary-foreground font-display font-semibold rounded-full px-5 py-2.5 text-sm hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap w-full justify-center">
              Explore Collections <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image 4 — top far right */}
        <div className="col-span-2 md:col-span-3 row-span-2 rounded-2xl lg:rounded-3xl overflow-hidden group" style={{ animationDelay: "0.3s" }}>
          <img src={hero4} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Image 5 — bottom right spanning 2 sections */}
        <div className="col-span-4 md:col-span-6 row-span-1 md:row-span-1 rounded-2xl lg:rounded-3xl overflow-hidden group" style={{ animationDelay: "0.15s" }}>
          <img src={hero5} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
      </div>

      {/* Avatar group */}
      <div className="flex items-center gap-4 mt-8 justify-center scroll-reveal">
        <div className="flex -space-x-3">
          {[hero1, hero2, hero3].map((src, i) => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          <div className="w-10 h-10 rounded-full border-2 border-background bg-foreground text-primary-foreground flex items-center justify-center text-xs font-display font-bold">
            +5K
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-body">Happy customers worldwide</p>
      </div>
    </section>
  );
};

export default HeroSection;
