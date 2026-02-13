import { useState } from "react";
import { ArrowRight } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const categories = [
  { name: "Clothes", count: "240+ items", image: product1 },
  { name: "Shoes", count: "180+ items", image: product2 },
  { name: "Bags", count: "95+ items", image: product3 },
  { name: "Accessories", count: "310+ items", image: product4 },
];

const CategoriesSection = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
      {/* Section heading */}
      <div className="mb-8 scroll-reveal">
        <p className="font-body text-sm text-muted-foreground uppercase tracking-widest mb-2">Browse by</p>
        <h2
          className="font-display font-bold text-foreground"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          Categories
        </h2>
      </div>

      {/* Category list — full width with floating overlay image */}
      <div className="relative overflow-hidden">
        {/* Floating tilted preview — only on hover, contained within parent */}
        <div className="hidden lg:block absolute inset-0 z-10 pointer-events-none">
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              className="absolute w-[200px] h-[260px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-out"
              style={{
                opacity: hoveredIdx === i ? 1 : 0,
                transform: hoveredIdx === i
                  ? `rotate(-6deg) scale(1)`
                  : `rotate(-6deg) scale(0.9)`,
                right: "40px",
                top: "50%",
                marginTop: "-130px",
              }}
            >
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Category rows */}
        {categories.map((cat, i) => (
          <div
            key={cat.name}
            className="group flex items-center justify-between py-5 lg:py-7 border-b border-border cursor-pointer scroll-reveal"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="font-display text-muted-foreground text-sm w-8">0{i + 1}</span>
              <h3
                className="font-display font-semibold text-foreground transition-colors group-hover:text-accent"
                style={{ fontSize: "clamp(1.3rem, 3vw, 2.5rem)" }}
              >
                {cat.name}
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-body text-sm text-muted-foreground hidden sm:block">{cat.count}</span>
              <ArrowRight className="w-5 h-5 text-foreground transition-transform duration-300 group-hover:translate-x-2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
