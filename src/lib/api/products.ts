import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
  sizes: string[];
  colors?: string[];
  stock: number;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
}

export interface ProductSort {
  field: "price" | "name" | "created_at";
  order: "asc" | "desc";
}

/**
 * Get all products with optional filters and sorting
 */
export async function getProducts(
  filters?: ProductFilters,
  sort?: ProductSort
): Promise<Product[]> {
  // Try Supabase first
  if (supabase) {
    try {
      let query = supabase.from("products").select("*");

      // Apply filters
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }
      if (filters?.inStock) {
        query = query.gt("stock", 0);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains("tags", filters.tags);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.order === "asc" });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data.map((p) => ({
          ...p,
          sizes: p.sizes || [],
          colors: p.colors || [],
          tags: p.tags || [],
        }));
      }
    } catch (error) {
      console.warn("[Products API] Supabase query failed, using local fallback:", error);
    }
  }

  // Fallback to local products
  try {
    const { products: localProducts } = await import("@/lib/products");
    let filtered = [...localProducts];

    // Apply filters
    if (filters?.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }
    if (filters?.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    // Apply sorting
    if (sort) {
      filtered.sort((a, b) => {
        const aVal = sort.field === "price" ? a.price : sort.field === "name" ? a.name : 0;
        const bVal = sort.field === "price" ? b.price : sort.field === "name" ? b.name : 0;
        if (sort.order === "asc") {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return filtered.map((p) => ({
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
  } catch (error) {
    console.error("[Products API] Local products fallback failed:", error);
    return [];
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!supabase) {
    console.warn("[Products API] Supabase client not initialized");
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[Products API] Error fetching product:", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    sizes: data.sizes || [],
    colors: data.colors || [],
    tags: data.tags || [],
  };
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  category: string
): Promise<Product[]> {
  return getProducts({ category });
}

/**
 * Semantic search using RAG (Retrieval-Augmented Generation)
 * This uses vector similarity search on product embeddings
 */
export async function searchProductsSemantic(
  query: string,
  limit: number = 10
): Promise<Product[]> {
  // Use the RAG module for semantic search (it handles fallbacks)
  try {
    const { semanticSearch } = await import("../ai/rag");
    return semanticSearch(query, limit);
  } catch (error) {
    console.error("[Products API] Error in semantic search:", error);
    // Fallback to local products
    try {
      const { products: localProducts } = await import("@/lib/products");
      return localProducts
        .filter((p) => {
          const searchText = `${p.name} ${p.description} ${p.category}`.toLowerCase();
          const queryLower = query.toLowerCase();
          return searchText.includes(queryLower) || 
                 queryLower.split(/\s+/).some(word => searchText.includes(word));
        })
        .slice(0, limit)
        .map((p) => ({
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
    } catch (importError) {
      console.error("[Products API] Local products fallback failed:", importError);
      return [];
    }
  }
}

/**
 * Get recommended products based on user activity
 */
export async function getRecommendedProducts(
  sessionId: string,
  limit: number = 4
): Promise<Product[]> {
  if (!supabase) {
    console.warn("[Products API] Supabase client not initialized");
    return [];
  }

  // Get user's recent activity
  const { data: activities } = await supabase
    .from("user_activity")
    .select("product_id")
    .eq("session_id", sessionId)
    .in("activity_type", ["view", "add_to_cart", "purchase"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (!activities || activities.length === 0) {
    // No activity, return popular products
    return getProducts({}, { field: "created_at", order: "desc" }).then(
      (products) => products.slice(0, limit)
    );
  }

  // Get categories from viewed products
  const productIds = activities.map((a) => a.product_id);
  const { data: viewedProducts } = await supabase
    .from("products")
    .select("category")
    .in("id", productIds);

  const categories = [
    ...new Set(viewedProducts?.map((p) => p.category) || []),
  ];

  // Get products from same categories, excluding already viewed
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("category", categories)
    .not("id", "in", `(${productIds.join(",")})`)
    .limit(limit);

  if (error) {
    console.error("[Products API] Error fetching recommendations:", error);
    return [];
  }

  return (data || []).map((p) => ({
    ...p,
    sizes: p.sizes || [],
    colors: p.colors || [],
    tags: p.tags || [],
  }));
}

/**
 * Check inventory for a specific product variant
 */
export async function checkInventory(
  productId: string,
  size?: string,
  color?: string
): Promise<{ available: boolean; stock: number; product: Product | null }> {
  const product = await getProductById(productId);

  if (!product) {
    return { available: false, stock: 0, product: null };
  }

  // For now, we'll check overall stock
  // In a real system, you'd track stock per variant (size/color combination)
  return {
    available: product.stock > 0,
    stock: product.stock,
    product,
  };
}
