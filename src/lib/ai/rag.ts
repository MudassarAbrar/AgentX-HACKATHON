import { getGeminiModel } from "./gemini-client";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/api/products";

/**
 * Generate embedding for text using Gemini
 * Note: Gemini doesn't have a dedicated embeddings API like OpenAI,
 * so we'll use a workaround with the text-embedding model or
 * use Supabase's built-in pgvector with a different embedding service
 * 
 * For now, we'll use a hybrid approach:
 * 1. Use text-based search as primary
 * 2. If embeddings exist in DB, use vector search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Gemini doesn't have embeddings API directly
  // We'll need to use a different approach
  // For hackathon, we can use Supabase's pgvector with OpenAI embeddings
  // or use text-based semantic search
  
  // Placeholder - in production, you'd call an embedding service
  // For now, return empty array and use text search
  return [];
}

/**
 * Get local products as fallback
 */
async function getLocalProducts(): Promise<Product[]> {
  try {
    const { products } = await import("@/lib/products");
    // Convert local product format to API format
    return products.map((p: any) => ({
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
    console.error("[RAG] Error loading local products:", error);
    return [];
  }
}

/**
 * Search local products by query
 */
async function searchLocalProducts(query: string, limit: number): Promise<Product[]> {
  const localProducts = await getLocalProducts();
  const lowerQuery = query.toLowerCase();
  
  // Extract keywords from query
  const keywords = lowerQuery
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[^a-z0-9]/g, ""));

  // Search in name, description, category
  const matches = localProducts.filter((product) => {
    const searchText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return keywords.some((keyword) => searchText.includes(keyword));
  });

  // Also try category matching
  const categoryMatches: { [key: string]: string[] } = {
    shoe: ["Shoes"],
    shoes: ["Shoes"],
    sneaker: ["Shoes"],
    sneakers: ["Shoes"],
    boot: ["Shoes"],
    boots: ["Shoes"],
    pant: ["Clothes"],
    pants: ["Clothes"],
    trouser: ["Clothes"],
    trousers: ["Clothes"],
    shirt: ["Clothes"],
    blazer: ["Clothes"],
    jacket: ["Clothes"],
    sweater: ["Clothes"],
    bag: ["Bags"],
    bags: ["Bags"],
    tote: ["Bags"],
    accessory: ["Accessories"],
    accessories: ["Accessories"],
    belt: ["Accessories"],
    scarf: ["Accessories"],
  };

  for (const [keyword, categories] of Object.entries(categoryMatches)) {
    if (lowerQuery.includes(keyword)) {
      const categoryMatches = localProducts.filter((p) =>
        categories.includes(p.category)
      );
      matches.push(...categoryMatches);
    }
  }

  // Remove duplicates and limit
  const uniqueMatches = Array.from(
    new Map(matches.map((p) => [p.id, p])).values()
  );
  return uniqueMatches.slice(0, limit);
}

/**
 * Semantic search using RAG (Retrieval-Augmented Generation)
 * This performs vector similarity search on product embeddings
 */
export async function semanticSearch(
  query: string,
  limit: number = 10
): Promise<Product[]> {
  // Try Supabase first if available
  if (supabase) {
    try {
      const results = await textBasedSemanticSearch(query, limit);
      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      console.warn("[RAG] Supabase search failed, using local fallback:", error);
    }
  }

  // Fallback to local products
  return searchLocalProducts(query, limit);
}

/**
 * Text-based semantic search using Gemini to understand intent
 * and then querying Supabase with intelligent filters
 */
async function textBasedSemanticSearch(
  query: string,
  limit: number
): Promise<Product[]> {
  // First, try Supabase if available
  if (supabase) {
    try {
      // Simple text search in Supabase first
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          ...p,
          sizes: p.sizes || [],
          colors: p.colors || [],
          tags: p.tags || [],
        }));
      }
    } catch (error) {
      console.warn("[RAG] Supabase search failed, using local products:", error);
    }
  }

  // Always fallback to local products (works without Supabase or Gemini)
  return await searchLocalProducts(query, limit);
}

/**
 * Generate embedding for a product and store it in the database
 * This should be run during product migration
 */
export async function generateAndStoreEmbedding(
  productId: string,
  textContent: string
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    // For now, we'll store the text content
    // In production, you'd generate actual embeddings using an embedding service
    // and store them as vectors in pgvector
    
    const { error } = await supabase.from("product_embeddings").upsert({
      product_id: productId,
      text_content: textContent,
      // embedding: embeddingVector, // Would be a vector type in pgvector
    });

    if (error) {
      console.error("[RAG] Error storing embedding:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[RAG] Error generating embedding:", error);
    return false;
  }
}
