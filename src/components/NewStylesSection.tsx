import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const recommended = [
  { id: 1, name: "Linen Blazer", price: "$189", image: product1 },
  { id: 2, name: "Classic Sneakers", price: "$129", image: product2 },
  { id: 3, name: "Canvas Tote", price: "$79", image: product3 },
  { id: 4, name: "Wool Overcoat", price: "$349", image: product4 },
];

const NewStylesSection = () => {
  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-12 scroll-reveal">
        <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
          Recommended For You
        </h2>
        <Link to="/shop" className="font-display text-sm font-medium text-foreground flex items-center gap-2 hover:text-accent transition-colors">
          VIEW ALL <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 scroll-reveal">
        {recommended.map((item) => (
          <Link to={`/product/${item.id}`} key={item.id} className="group cursor-pointer">
            <div className="rounded-2xl lg:rounded-3xl overflow-hidden bg-secondary aspect-[3/4] mb-4">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            </div>
            <h3 className="font-display font-medium text-foreground text-base">{item.name}</h3>
            <p className="font-display font-semibold text-foreground mt-1">{item.price}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default NewStylesSection;
