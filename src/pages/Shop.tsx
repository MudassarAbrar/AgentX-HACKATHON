import { useState } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { products } from "@/lib/products";

const categories = ["All", "Clothes", "Shoes", "Bags", "Accessories"];

const Shop = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  let filtered = activeCategory === "All" ? products : products.filter((p) => p.category === activeCategory);

  if (sortBy === "low") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "high") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === "name") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            Shop All
          </h1>
          <p className="font-body text-muted-foreground mt-2">Discover our full collection of curated fashion pieces.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`font-display text-sm px-5 py-2 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-foreground text-primary-foreground border-foreground"
                  : "border-border text-foreground hover:border-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ml-auto font-body text-sm bg-background border border-border rounded-full px-4 py-2 text-foreground focus:outline-none"
          >
            <option value="default">Sort by</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-8">
          {filtered.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
              <div className="rounded-2xl lg:rounded-3xl overflow-hidden bg-secondary aspect-[3/4] mb-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <h3 className="font-display font-medium text-foreground text-sm sm:text-base">{product.name}</h3>
              <p className="font-display font-semibold text-foreground mt-1">${product.price}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
