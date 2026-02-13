import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";
import hero5 from "@/assets/hero-5.jpg";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-28 pb-16 px-6 lg:px-12 max-w-[1440px] mx-auto overflow-hidden">
      {/* Headline */}
      <div className="text-center mb-12 lg:mb-16">
        <h1 className="font-display font-extrabold text-foreground leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)" }}>
          Elevate Your Style
          <br />
          With <span className="italic font-accent font-normal">Bold</span> Fashion
        </h1>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4 lg:gap-5 auto-rows-[180px] md:auto-rows-[200px] lg:auto-rows-[220px]">
        {/* Card 1 - Orange */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 rounded-3xl lg:rounded-4xl overflow-hidden bg-tz-orange group">
          <img src={hero1} alt="Fashion editorial in orange" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Card 2 - Green */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 rounded-3xl lg:rounded-4xl overflow-hidden bg-tz-emerald group">
          <img src={hero2} alt="Fashion editorial in green" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* CTA + Circular Badge */}
        <div className="col-span-2 md:col-span-2 lg:col-span-3 row-span-1 flex items-center justify-between gap-4 px-2">
          <button className="bg-foreground text-primary-foreground font-display font-semibold rounded-full px-8 py-4 text-base hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap">
            Explore Collections <ArrowRight className="w-4 h-4" />
          </button>
          {/* Rotating badge */}
          <div className="relative w-20 h-20 lg:w-24 lg:h-24 shrink-0">
            <div className="animate-spin-slow w-full h-full">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <path id="circle" d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
                </defs>
                <text className="fill-foreground text-[11px] font-display uppercase tracking-[0.3em]">
                  <textPath href="#circle">Learn about us • Learn about us •</textPath>
                </text>
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-5 h-5 fill-foreground text-foreground" />
            </div>
          </div>
        </div>

        {/* Card 3 - Yellow (square) */}
        <div className="col-span-1 lg:col-span-3 row-span-1 rounded-3xl lg:rounded-4xl overflow-hidden bg-tz-yellow group">
          <img src={hero3} alt="Fashion editorial in yellow" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Card 4 - Sky Blue */}
        <div className="col-span-1 lg:col-span-3 row-span-2 rounded-3xl lg:rounded-4xl overflow-hidden bg-tz-sky group hidden md:block">
          <img src={hero4} alt="Fashion editorial in sky blue" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Card 5 - Mint */}
        <div className="col-span-2 md:col-span-2 lg:col-span-3 row-span-1 rounded-3xl lg:rounded-4xl overflow-hidden bg-tz-mint group">
          <img src={hero5} alt="Fashion editorial in mint" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

        {/* Avatar group */}
        <div className="col-span-2 md:col-span-2 lg:col-span-3 row-span-1 flex items-center gap-4 px-2">
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
      </div>
    </section>
  );
};

export default HeroSection;
