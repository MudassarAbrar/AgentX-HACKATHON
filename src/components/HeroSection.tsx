import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import hero5 from "@/assets/hero-5.jpg";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-28 pb-16 px-6 lg:px-12 max-w-[1440px] mx-auto overflow-hidden">
      {/* Headline */}
      <div className="text-center mb-12 lg:mb-16 scroll-reveal">
        <h1 className="font-display font-extrabold text-foreground leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)" }}>
          Elevate Your Style
          <br />
          With <span className="italic font-accent font-normal">Bold</span> Fashion
        </h1>
      </div>

      {/* Bento Grid — clean 4-column layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        {/* Card 1 - Tall left */}
        <div className="col-span-1 row-span-2 rounded-3xl lg:rounded-4xl overflow-hidden aspect-[3/5] group scroll-reveal">
          <img src={hero1} alt="Fashion editorial in orange" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Card 2 - Tall */}
        <div className="col-span-1 row-span-2 rounded-3xl lg:rounded-4xl overflow-hidden aspect-[3/5] group scroll-reveal" style={{ animationDelay: "0.1s" }}>
          <img src={hero2} alt="Fashion editorial in green" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Card 3 - Top right with CTA overlay */}
        <div className="col-span-1 rounded-3xl lg:rounded-4xl overflow-hidden relative group scroll-reveal" style={{ animationDelay: "0.2s" }}>
          <img src={hero3} alt="Fashion editorial in yellow" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-foreground/20 flex items-end p-4">
            <button className="bg-foreground text-primary-foreground font-display font-semibold rounded-full px-5 py-2.5 text-sm hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap w-full justify-center">
              Explore Collections <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 4 - Top far right */}
        <div className="col-span-1 rounded-3xl lg:rounded-4xl overflow-hidden group scroll-reveal" style={{ animationDelay: "0.3s" }}>
          <img src={hero4} alt="Fashion editorial in sky blue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Card 5 - Bottom right spanning 2 cols */}
        <div className="col-span-2 rounded-3xl lg:rounded-4xl overflow-hidden aspect-[2/1] group scroll-reveal" style={{ animationDelay: "0.15s" }}>
          <img src={hero5} alt="Fashion editorial in mint" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
