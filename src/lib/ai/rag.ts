import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/api/products";

/**
 * Common misspellings and corrections
 */
const spellCorrections: Record<string, string> = {
  // Shoes
  "sneeker": "sneaker", "sneekers": "sneakers", "sneker": "sneaker", "snekers": "sneakers",
  "shoos": "shoes", "shoez": "shoes", "shos": "shoes",
  "boot": "boots", "bootz": "boots", "bots": "boots",
  "loafer": "loafers", "lofer": "loafers", "loafers": "loafers", "lofers": "loafers",
  "sandle": "sandal", "sandles": "sandals", "sandels": "sandals",
  "heel": "heels", "heals": "heels", "hels": "heels",
  
  // Clothes
  "blaser": "blazer", "blazr": "blazer", "blzer": "blazer",
  "sweeter": "sweater", "sweter": "sweater", "sweatter": "sweater",
  "jackt": "jacket", "jaket": "jacket", "jcket": "jacket",
  "trouser": "trousers", "trousrs": "trousers", "trowsers": "trousers",
  "overcoat": "overcoat", "overcot": "overcoat", "ovrecoat": "overcoat",
  "cardgen": "cardigan", "cardigan": "cardigan", "cardigon": "cardigan",
  "turtlenck": "turtleneck", "turtleneck": "turtleneck",
  "dres": "dress", "drss": "dress",
  "chino": "chinos", "chenos": "chinos",
  "denim": "denim", "denm": "denim",
  
  // Bags
  "tote": "tote", "tot": "tote",
  "backpak": "backpack", "backpck": "backpack", "bakpack": "backpack",
  "crossbdy": "crossbody", "crosbody": "crossbody",
  "duffel": "duffle", "dufel": "duffle",
  
  // Accessories
  "belt": "belt", "blt": "belt",
  "scraf": "scarf", "scrf": "scarf",
  "sunglass": "sunglasses", "sungalsses": "sunglasses", "sunglases": "sunglasses",
  "wach": "watch", "wtch": "watch", "wtach": "watch",
  
  // Colors
  "wite": "white", "whte": "white",
  "blak": "black", "blck": "black",
  "blu": "blue", "bleu": "blue",
  "gry": "gray", "grey": "gray",
  "brwn": "brown", "bown": "brown",
  "rd": "red", "redd": "red",
  "grn": "green", "gren": "green",
  "pnk": "pink", "pnik": "pink",
  "beig": "beige", "bege": "beige",
  "nvy": "navy", "navey": "navy",
};

/**
 * Color keywords for filtering
 */
const colorKeywords = [
  "white", "black", "blue", "navy", "red", "green", "brown", "beige", "gray", "grey",
  "pink", "purple", "orange", "yellow", "cream", "tan", "burgundy", "maroon", "teal",
  "gold", "silver", "bronze", "camel", "olive", "coral", "mint", "ivory", "charcoal"
];

/**
 * Correct misspelled words in query
 */
function correctSpelling(query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const correctedWords = words.map(word => {
    // Check direct corrections
    if (spellCorrections[word]) {
      return spellCorrections[word];
    }
    
    // Check for close matches (simple edit distance)
    for (const [misspelled, correct] of Object.entries(spellCorrections)) {
      if (word.length > 3 && misspelled.length > 3) {
        // Check if word starts similarly
        if (word.substring(0, 3) === misspelled.substring(0, 3)) {
          const distance = levenshteinDistance(word, misspelled);
          if (distance <= 2) {
            return correct;
          }
        }
      }
    }
    
    return word;
  });
  
  return correctedWords.join(" ");
}

/**
 * Simple Levenshtein distance for spell checking
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Extract color from query
 */
function extractColor(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  for (const color of colorKeywords) {
    if (lowerQuery.includes(color)) {
      return color;
    }
  }
  return null;
}

/**
 * Extract main search keywords (product type)
 */
function extractProductKeywords(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const productTypes = [
    "sneakers", "sneaker", "shoes", "shoe", "boots", "boot", "loafers", "loafer",
    "sandals", "sandal", "heels", "heel", "flats", "flat", "oxford", "oxfords",
    "blazer", "jacket", "sweater", "cardigan", "turtleneck", "overcoat", "coat",
    "trousers", "pants", "chinos", "jeans", "shorts", "dress", "shirt",
    "tote", "bag", "backpack", "crossbody", "duffle", "purse", "clutch",
    "belt", "scarf", "watch", "sunglasses", "hat", "cap", "wallet"
  ];
  
  const found: string[] = [];
  for (const type of productTypes) {
    if (lowerQuery.includes(type)) {
      found.push(type);
    }
  }
  
  return found;
}

/**
 * Search result with metadata about the search
 */
export interface SearchResult {
  products: Product[];
  correctedQuery?: string;
  extractedColor?: string | null;
  noMatch: boolean;
  searchKeyword: string;
}

/**
 * Advanced semantic search with spell correction and attribute filtering
 */
export async function semanticSearch(
  query: string,
  limit: number = 10
): Promise<Product[]> {
  const result = await advancedSearch(query, limit);
  return result.products;
}

/**
 * Advanced search that returns metadata about the search
 */
export async function advancedSearch(
  query: string,
  limit: number = 10
): Promise<SearchResult> {
  // Correct spelling first
  const correctedQuery = correctSpelling(query);
  const wasQueryCorrected = correctedQuery !== query.toLowerCase();
  
  // Extract color preference
  const extractedColor = extractColor(correctedQuery);
  
  // Extract product keywords for the search
  const productKeywords = extractProductKeywords(correctedQuery);
  const searchKeyword = productKeywords[0] || correctedQuery.split(/\s+/).filter(w => w.length > 2)[0] || correctedQuery;
  
  // Try Supabase first - this is the primary source
  if (supabase) {
    try {
      const results = await searchSupabaseProducts(correctedQuery, extractedColor, limit);
      
      if (results.length > 0) {
        return {
          products: results,
          correctedQuery: wasQueryCorrected ? correctedQuery : undefined,
          extractedColor,
          noMatch: false,
          searchKeyword,
        };
      }
      
      // If no results with color, try without color filter
      if (extractedColor) {
        const resultsNoColor = await searchSupabaseProducts(
          correctedQuery.replace(extractedColor, "").trim(),
          null,
          limit
        );
        
        if (resultsNoColor.length > 0) {
          return {
            products: resultsNoColor,
            correctedQuery: wasQueryCorrected ? correctedQuery : undefined,
            extractedColor,
            noMatch: false,
            searchKeyword,
          };
        }
      }
    } catch (error) {
      console.warn("[RAG] Supabase search failed:", error);
    }
  }
  
  // No results found
  return {
    products: [],
    correctedQuery: wasQueryCorrected ? correctedQuery : undefined,
    extractedColor,
    noMatch: true,
    searchKeyword,
  };
}

/**
 * Search Supabase products with intelligent matching
 */
async function searchSupabaseProducts(
  query: string,
  colorFilter: string | null,
  limit: number
): Promise<Product[]> {
  if (!supabase) return [];
  
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(/\s+/).filter(w => w.length > 2 && !colorKeywords.includes(w));
  
  try {
    // Build search conditions
    const searchTerms = keywords.join(" | ");
    
    // First try: exact name/tag matching
    let queryBuilder = supabase
      .from("products")
      .select("*");
    
    // Build OR conditions for each keyword
    const orConditions: string[] = [];
    for (const keyword of keywords) {
      orConditions.push(`name.ilike.%${keyword}%`);
      orConditions.push(`description.ilike.%${keyword}%`);
      orConditions.push(`tags.cs.["${keyword}"]`);
    }
    
    if (orConditions.length > 0) {
      queryBuilder = queryBuilder.or(orConditions.join(","));
    }
    
    const { data, error } = await queryBuilder.limit(limit * 2);
    
    if (error) {
      console.warn("[RAG] Supabase query error:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      // Try category-based search
      const categoryMap: Record<string, string> = {
        "shoe": "Shoes", "shoes": "Shoes", "sneaker": "Shoes", "sneakers": "Shoes",
        "boot": "Shoes", "boots": "Shoes", "loafer": "Shoes", "loafers": "Shoes",
        "sandal": "Shoes", "sandals": "Shoes", "heel": "Shoes", "heels": "Shoes",
        "clothes": "Clothes", "clothing": "Clothes", "blazer": "Clothes", "jacket": "Clothes",
        "sweater": "Clothes", "cardigan": "Clothes", "turtleneck": "Clothes",
        "overcoat": "Clothes", "coat": "Clothes", "trousers": "Clothes", "pants": "Clothes",
        "chinos": "Clothes", "dress": "Clothes", "shirt": "Clothes",
        "bag": "Bags", "bags": "Bags", "tote": "Bags", "backpack": "Bags",
        "crossbody": "Bags", "duffle": "Bags",
        "accessory": "Accessories", "accessories": "Accessories", "belt": "Accessories",
        "scarf": "Accessories", "watch": "Accessories", "sunglasses": "Accessories",
      };
      
      let categoryToSearch: string | null = null;
      for (const keyword of keywords) {
        if (categoryMap[keyword]) {
          categoryToSearch = categoryMap[keyword];
          break;
        }
      }
      
      if (categoryToSearch) {
        const { data: catData } = await supabase
          .from("products")
          .select("*")
          .eq("category", categoryToSearch)
          .limit(limit);
        
        if (catData && catData.length > 0) {
          return filterAndFormatProducts(catData, colorFilter, limit);
        }
      }
      
      return [];
    }
    
    return filterAndFormatProducts(data, colorFilter, limit);
  } catch (error) {
    console.warn("[RAG] Search error:", error);
    return [];
  }
}

/**
 * Filter products by color and format them
 */
function filterAndFormatProducts(
  data: any[],
  colorFilter: string | null,
  limit: number
): Product[] {
  let products = data;
  
  // Filter by color if specified
  if (colorFilter) {
    const colorFiltered = products.filter(p => {
      // Check colors array
      const colors = p.colors || [];
      if (colors.some((c: string) => c.toLowerCase().includes(colorFilter))) {
        return true;
      }
      
      // Check description for color mentions
      const desc = (p.description || "").toLowerCase();
      if (desc.includes(colorFilter)) {
        return true;
      }
      
      // Check name
      const name = (p.name || "").toLowerCase();
      if (name.includes(colorFilter)) {
        return true;
      }
      
      // Check tags
      const tags = p.tags || [];
      if (tags.some((t: string) => t.toLowerCase().includes(colorFilter))) {
        return true;
      }
      
      return false;
    });
    
    // If we found color-matching products, use those
    if (colorFiltered.length > 0) {
      products = colorFiltered;
    }
    // Otherwise, we'll return all products but the caller knows color was requested
  }
  
  return products.slice(0, limit).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
    category: p.category,
    description: p.description,
    sizes: p.sizes || [],
    colors: p.colors || [],
    stock: p.stock || 10,
    tags: p.tags || [],
    metadata: p.metadata || {},
  }));
}

/**
 * Get all products from Supabase (for recommendations fallback)
 */
export async function getAllProducts(limit: number = 10): Promise<Product[]> {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url,
      category: p.category,
      description: p.description,
      sizes: p.sizes || [],
      colors: p.colors || [],
      stock: p.stock || 10,
      tags: p.tags || [],
      metadata: p.metadata || {},
    }));
  } catch (error) {
    console.warn("[RAG] Error getting all products:", error);
    return [];
  }
}

/**
 * Get products by category from Supabase
 */
export async function getProductsByCategory(category: string, limit: number = 10): Promise<Product[]> {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .limit(limit);
    
    if (error || !data) return [];
    
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url,
      category: p.category,
      description: p.description,
      sizes: p.sizes || [],
      colors: p.colors || [],
      stock: p.stock || 10,
      tags: p.tags || [],
      metadata: p.metadata || {},
    }));
  } catch (error) {
    console.warn("[RAG] Error getting products by category:", error);
    return [];
  }
}
