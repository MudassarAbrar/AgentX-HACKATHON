import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import hero5 from "@/assets/hero-5.jpg";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-8 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto overflow-hidden">
      {/* Headline */}
      <div className="text-center mb-8 lg:mb-12 scroll-reveal">
        <h1
          className="font-display font-extrabold text-foreground leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(1.8rem, 5vw, 5.5rem)" }}
        >
          Elevate Your Style
          <br />
          With <span className="italic font-accent font-normal">Bold</span> Fashion
        </h1>
      </div>

      {/* Bento Grid - simple 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 scroll-reveal">
        {/* Image 1 — tall left */}
        <div className="row-span-2 rounded-2xl lg:rounded-3xl overflow-hidden group aspect-[3/4] md:aspect-auto">
          <img src={hero1} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Image 2 — tall second */}
        <div className="row-span-2 rounded-2xl lg:rounded-3xl overflow-hidden group aspect-[3/4] md:aspect-auto">
          <img src={hero2} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Image 3 — top right with CTA */}
        <div className="rounded-2xl lg:rounded-3xl overflow-hidden relative group aspect-[4/5] md:aspect-auto">
          <img src={hero3} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-foreground/20 flex items-end p-3 lg:p-4">
            <button className="bg-foreground text-primary-foreground font-display font-semibold rounded-full px-4 py-2 text-xs lg:text-sm hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap w-full justify-center">
              Explore Collections <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image 4 — top far right */}
        <div className="rounded-2xl lg:rounded-3xl overflow-hidden group aspect-[4/5] md:aspect-auto">
          <img src={hero4} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Image 5 — bottom right spanning 2 cols */}
        <div className="col-span-2 rounded-2xl lg:rounded-3xl overflow-hidden group aspect-[2/1]">
          <img src={hero5} alt="Fashion editorial" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
