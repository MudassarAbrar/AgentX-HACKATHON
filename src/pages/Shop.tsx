import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useFilter } from "@/contexts/FilterContext";
import { getProducts, type Product } from "@/lib/api/products";

const categories = ["All", "Clothes", "Shoes", "Bags", "Accessories"];

const Shop = () => {
  const { filters, setCategory, setSort } = useFilter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  // Sync local category state with filter context
  useEffect(() => {
    if (filters.category) {
      setActiveCategory(filters.category);
    } else {
      setActiveCategory("All");
    }
  }, [filters.category]);

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productFilters: any = {};
        if (filters.category && filters.category !== "All") {
          productFilters.category = filters.category;
        }
        if (filters.minPrice !== null) {
          productFilters.minPrice = filters.minPrice;
        }
        if (filters.maxPrice !== null) {
          productFilters.maxPrice = filters.maxPrice;
        }

        const sortField =
          filters.sortBy === "default" ? "created_at" : filters.sortBy;
        const productsData = await getProducts(productFilters, {
          field: sortField as any,
          order: filters.sortOrder,
        });

        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat === "All") {
      setCategory(null);
    } else {
      setCategory(cat);
    }
  };

  const handleSortChange = (value: string) => {
    if (value === "low") {
      setSort("price", "asc");
    } else if (value === "high") {
      setSort("price", "desc");
    } else if (value === "name") {
      setSort("name", "asc");
    } else {
      setSort("created_at", "desc");
    }
  };

  const getSortValue = () => {
    if (filters.sortBy === "price" && filters.sortOrder === "asc") return "low";
    if (filters.sortBy === "price" && filters.sortOrder === "desc") return "high";
    if (filters.sortBy === "name") return "name";
    return "default";
  };

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
              onClick={() => handleCategoryChange(cat)}
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
            value={getSortValue()}
            onChange={(e) => handleSortChange(e.target.value)}
            className="ml-auto font-body text-sm bg-background border border-border rounded-full px-4 py-2 text-foreground focus:outline-none"
          >
            <option value="default">Sort by</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-body text-muted-foreground">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-8">
            {products.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                <div className="rounded-2xl lg:rounded-3xl overflow-hidden bg-secondary aspect-[3/4] mb-4">
                  <img
                    src={product.image_url}
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
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
