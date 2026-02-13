import { ArrowUpRight } from "lucide-react";

const TestimonialLifestyle = () => {
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* Left - Testimonial */}
        <div className="flex flex-col justify-center">
          <span className="text-6xl lg:text-8xl font-accent text-muted-foreground/30 leading-none mb-4">"</span>
          <p className="font-body text-lg lg:text-xl text-foreground/80 leading-relaxed max-w-md">
            TrendZone completely transformed my wardrobe. The quality is outstanding and the designs 
            are always ahead of the curve. I've never felt more confident in what I wear.
          </p>
          <p className="font-accent italic text-xl mt-8 text-foreground">Sarah Mitchell</p>
          <p className="font-body text-sm text-muted-foreground mt-1">Fashion Enthusiast</p>
        </div>

        {/* Right - Lifestyle Section */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <span className="font-display text-sm font-medium text-muted-foreground tracking-widest uppercase">01 — Lifestyle</span>
            <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-foreground leading-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
            Set Up Your Fashion With The Latest Trends
          </h2>
          <p className="font-body text-muted-foreground mt-6 max-w-md leading-relaxed">
            Discover curated collections that blend comfort with contemporary style. 
            Our pieces are designed to make you stand out effortlessly.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialLifestyle;
