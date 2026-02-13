import { ArrowRight } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const categories = [
  { name: "Clothes", count: "240+ items", image: product1 },
  { name: "Shoes", count: "180+ items", image: product2 },
  { name: "Bags", count: "95+ items", image: product3 },
  { name: "Accessories", count: "310+ items", image: product1 },
];

const CategoriesSection = () => {
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div>
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              className="group flex items-center justify-between py-6 lg:py-8 border-b border-border cursor-pointer"
            >
              <div className="flex items-center gap-6">
                <span className="font-display text-muted-foreground text-sm w-8">0{i + 1}</span>
                <h3 className="font-display font-semibold text-foreground transition-colors group-hover:text-accent"
                  style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}>
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
        {/* Preview image */}
        <div className="hidden lg:block rounded-3xl overflow-hidden bg-secondary">
          <img src={product1} alt="Category preview" className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
