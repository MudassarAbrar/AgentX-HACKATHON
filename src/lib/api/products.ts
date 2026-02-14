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
 * User search history entry
 */
interface SearchHistoryEntry {
  query: string;
  category?: string;
  keywords?: string[];
  timestamp: number;
}

/**
 * Get dynamic recommendations based on user search history
 * This combines search history with semantic search for better personalization
 */
export async function getRecommendedProductsDynamic(
  sessionId: string,
  limit: number = 4
): Promise<Product[]> {
  // Get search history from localStorage
  let searchHistory: SearchHistoryEntry[] = [];
  try {
    const stored = localStorage.getItem("user_search_history");
    if (stored) {
      searchHistory = JSON.parse(stored);
    }
  } catch (e) {
    console.warn("[Products API] Could not parse search history:", e);
  }

  // If no search history, fall back to regular recommendations or defaults
  if (searchHistory.length === 0) {
    try {
      // Try to get from Supabase activity
      const supabaseRecommendations = await getRecommendedProducts(sessionId, limit);
      if (supabaseRecommendations.length > 0) {
        return supabaseRecommendations;
      }
    } catch (e) {
      console.warn("[Products API] Supabase recommendations failed:", e);
    }
    
    // Return newest products as default
    return getProducts({}, { field: "created_at", order: "desc" }).then(
      (products) => products.slice(0, limit)
    );
  }

  // Build a combined search query from recent history (last 5 searches)
  const recentSearches = searchHistory.slice(-5);
  const keywords: string[] = [];
  const categories: string[] = [];
  
  recentSearches.forEach(entry => {
    if (entry.keywords) {
      keywords.push(...entry.keywords);
    } else if (entry.query) {
      // Extract keywords from query
      const queryWords = entry.query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      keywords.push(...queryWords);
    }
    if (entry.category) {
      categories.push(entry.category);
    }
  });

  // Deduplicate and prioritize most common keywords
  const keywordCounts = keywords.reduce((acc, kw) => {
    acc[kw] = (acc[kw] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort by frequency and take top keywords
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([kw]) => kw);

  // Build semantic search query from top keywords
  const searchQuery = topKeywords.join(" ") || recentSearches[recentSearches.length - 1]?.query || "";

  if (searchQuery) {
    try {
      // Use semantic search with the combined query
      const semanticResults = await searchProductsSemantic(searchQuery, limit * 2);
      
      if (semanticResults.length > 0) {
        // Filter to prioritize matching categories if we have them
        let results = semanticResults;
        if (categories.length > 0) {
          const uniqueCategories = [...new Set(categories)];
          const categoryMatches = semanticResults.filter(p => 
            uniqueCategories.some(cat => 
              p.category.toLowerCase().includes(cat.toLowerCase()) ||
              cat.toLowerCase().includes(p.category.toLowerCase())
            )
          );
          
          if (categoryMatches.length >= limit) {
            results = categoryMatches;
          } else {
            // Mix category matches with other results
            const others = semanticResults.filter(p => !categoryMatches.includes(p));
            results = [...categoryMatches, ...others];
          }
        }
        
        // Shuffle slightly for variety but keep relevance
        const shuffled = results.slice(0, limit + 2).sort(() => Math.random() - 0.5);
        return shuffled.slice(0, limit);
      }
    } catch (e) {
      console.warn("[Products API] Semantic search for recommendations failed:", e);
    }
  }

  // Fallback: get products by category if we have categories in history
  if (categories.length > 0) {
    const uniqueCategories = [...new Set(categories)];
    const categoryProducts = await getProducts({ category: uniqueCategories[0] });
    if (categoryProducts.length >= limit) {
      return categoryProducts.sort(() => Math.random() - 0.5).slice(0, limit);
    }
  }

  // Final fallback: return newest products
  return getProducts({}, { field: "created_at", order: "desc" }).then(
    (products) => products.slice(0, limit)
  );
}

/**
 * Add a search entry to user's search history
 */
export function addToSearchHistory(
  query: string,
  category?: string,
  keywords?: string[]
): void {
  try {
    const stored = localStorage.getItem("user_search_history");
    let history: SearchHistoryEntry[] = stored ? JSON.parse(stored) : [];
    
    // Add new entry
    history.push({
      query,
      category,
      keywords,
      timestamp: Date.now(),
    });
    
    // Keep only last 20 searches
    if (history.length > 20) {
      history = history.slice(-20);
    }
    
    localStorage.setItem("user_search_history", JSON.stringify(history));
    
    // Dispatch custom event for same-window listeners
    window.dispatchEvent(new Event("searchHistoryUpdated"));
  } catch (e) {
    console.warn("[Products API] Could not save search history:", e);
  }
}

/**
 * Clear user's search history
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem("user_search_history");
    window.dispatchEvent(new Event("searchHistoryUpdated"));
  } catch (e) {
    console.warn("[Products API] Could not clear search history:", e);
  }
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

/**
 * Get product counts per category
 */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const products = await getProducts();
  const counts: Record<string, number> = {};
  
  for (const product of products) {
    counts[product.category] = (counts[product.category] || 0) + 1;
  }
  
  return counts;
}

/**
 * Get a single product by ID - works with both local and Supabase
 */
export async function getProductByIdUniversal(id: string): Promise<Product | null> {
  // Try Supabase first if it looks like a UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  if (supabase && isUUID) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return {
          ...data,
          sizes: data.sizes || [],
          colors: data.colors || [],
          tags: data.tags || [],
        };
      }
    } catch (error) {
      console.warn("[Products API] Supabase fetch failed, trying local:", error);
    }
  }

  // Fallback to local products (for numeric IDs like "1", "2", etc.)
  try {
    const { products: localProducts } = await import("@/lib/products");
    const numericId = parseInt(id, 10);
    const product = localProducts.find((p) => p.id === numericId || String(p.id) === id);
    
    if (product) {
      return {
        id: String(product.id),
        name: product.name,
        price: product.price,
        image_url: product.image,
        category: product.category,
        description: product.description,
        sizes: product.sizes || [],
        colors: [],
        stock: 10,
        tags: [],
      };
    }
  } catch (error) {
    console.error("[Products API] Local products fallback failed:", error);
  }

  return null;
}
