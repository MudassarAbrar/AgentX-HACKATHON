import product1 from "@/assets/product-1.jpg";
import product3 from "@/assets/product-3.jpg";
import product6 from "@/assets/product-6.jpg";

const items = [
  { name: "Jacket", image: product1 },
  { name: "Back Pleat", image: product6 },
  { name: "Tote Bag", image: product3 },
];

const NewStylesSection = () => {
  return (
    <section className="py-20 lg:py-28 px-6 lg:px-12 max-w-[1440px] mx-auto">
      <div className="grid lg:grid-cols-2 gap-8 scroll-reveal">
        {/* Left - Bold card */}
        <div className="rounded-3xl lg:rounded-4xl bg-foreground text-primary-foreground p-10 lg:p-16 flex flex-col justify-end min-h-[400px]">
          <p className="font-body text-sm text-primary-foreground/50 mb-4 uppercase tracking-widest">New Collection</p>
          <h2 className="font-display font-bold leading-tight" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            New Styles For A Modern Look
          </h2>
          <button className="mt-8 self-start bg-primary-foreground text-foreground font-display font-semibold rounded-full px-8 py-3.5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            Shop Now
          </button>
        </div>

        {/* Right - Small cards */}
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.name} className="group cursor-pointer">
              <div className="rounded-2xl overflow-hidden bg-secondary aspect-[3/4] mb-3">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <p className="font-display text-sm font-medium text-foreground text-center">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewStylesSection;
