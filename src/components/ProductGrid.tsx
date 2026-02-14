import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { getProducts, type Product } from "@/lib/api/products";
import { products as localProducts } from "@/lib/products";

// Map local products to API format
const getLocalProductsFormatted = (): Product[] => {
  return localProducts.slice(0, 6).map((p) => ({
    id: String(p.id),
    name: p.name,
    price: p.price,
    image_url: p.image,
    category: p.category,
    description: p.description,
    sizes: p.sizes || [],
    colors: [],
    stock: 10,
    tags: [],
  }));
};

const ProductGrid = () => {
  // Initialize with local products immediately
  const [products, setProducts] = useState<Product[]>(getLocalProductsFormatted());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts({}, { field: "created_at", order: "desc" });
        if (data && data.length > 0) {
          setProducts(data.slice(0, 6));
        }
        // If no data, keep the initial local products
      } catch (error) {
        console.error("Error fetching products:", error);
        // Keep initial local products on error
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 scroll-reveal">
        <h2 className="font-display font-bold text-foreground" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
          Ready to Wear
        </h2>
        <Link to="/shop" className="font-display text-sm font-medium text-foreground flex items-center gap-2 hover:text-accent transition-colors">
          SHOP NOW <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8 scroll-reveal">
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
              <h3 className="font-display font-medium text-foreground text-base">{product.name}</h3>
              <p className="font-display font-semibold text-foreground mt-1">${product.price}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
