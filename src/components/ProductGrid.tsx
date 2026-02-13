import { ArrowRight } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";

const products = [
  { name: "Linen Blazer", price: "$189", image: product1 },
  { name: "Classic Sneakers", price: "$129", image: product2 },
  { name: "Canvas Tote", price: "$79", image: product3 },
  { name: "Wool Overcoat", price: "$349", image: product4 },
  { name: "Relaxed Trousers", price: "$119", image: product5 },
  { name: "Knit Sweater", price: "$145", image: product6 },
];

const ProductGrid = () => {
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-12 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
          Ready to Wear
        </h2>
        <a href="#" className="font-display text-sm font-medium text-foreground flex items-center gap-2 hover:text-accent transition-colors">
          SHOP NOW <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
        {products.map((product) => (
          <div key={product.name} className="group cursor-pointer">
            <div className="rounded-2xl lg:rounded-3xl overflow-hidden bg-secondary aspect-[3/4] mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
            <h3 className="font-display font-medium text-foreground text-base">{product.name}</h3>
            <p className="font-display font-semibold text-foreground mt-1">{product.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
