import { getGeminiModel } from "./gemini-client";
import {
  searchProductsSemantic,
  getProducts,
  getProductById,
  checkInventory,
  getRecommendedProducts,
} from "@/lib/api/products";
import { addToCart } from "@/lib/api/cart";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/api/products";

export interface ClerkMessage {
  role: "user" | "assistant" | "system";
  content: string;
  products?: Product[];
  action?: ClerkAction;
}

export interface ClerkAction {
  type: "filter" | "sort" | "add_to_cart" | "navigate";
  payload?: any;
}

export interface ClerkResponse {
  message: string;
  products?: Product[];
  action?: ClerkAction;
}

const SYSTEM_PROMPT = `You are The Clerk, a friendly AI personal shopper for TrendZone.

CRITICAL RULES:
1. NEVER make up products, URLs, prices, or product names
2. ONLY discuss products that exist in the inventory provided to you
3. If you don't know about a product, say "Let me search our inventory for you"
4. Keep responses SHORT and focused - no long descriptions
5. When users want to buy, ask for size/color preferences before adding to cart
6. NEVER generate fake URLs or links

Your capabilities:
- Search real products from inventory
- Check availability and sizes
- Add items to cart (ask for size first)
- Apply discounts for special occasions
- Sort/filter products on the shop page

Keep responses concise and helpful.`;

// Conversation context to maintain memory
interface ConversationContext {
  lastSearchQuery: string | null;
  lastCategory: string | null;
  lastMentionedProducts: string[]; // Product names
  userPreferences: {
    categories?: string[];
    priceRange?: { min?: number; max?: number };
    styles?: string[];
  };
  topicHistory: string[]; // Last few topics discussed
}

export class ClerkAgent {
  private model: any;
  private conversationHistory: ClerkMessage[] = [];
  private pendingAddToCart: Product | null = null; // Track product waiting for size selection
  private lastShownProducts: Product[] = []; // Track last shown products for context
  private context: ConversationContext = {
    lastSearchQuery: null,
    lastCategory: null,
    lastMentionedProducts: [],
    userPreferences: {},
    topicHistory: [],
  };

  constructor() {
    this.model = getGeminiModel("gemini-2.5-flash");
    this.conversationHistory.push({
      role: "system",
      content: SYSTEM_PROMPT,
    });
  }

  /**
   * Process user message and return response with potential actions
   */
  async chat(userMessage: string, sessionId: string): Promise<ClerkResponse> {
    if (!this.model) {
      return {
        message:
          "I'm sorry, but I'm not available right now. Please configure your Gemini API key in the .env file to enable AI features. For now, you can still browse and shop manually!",
      };
    }

    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    try {
      // Analyze the message to determine intent
      const intent = await this.analyzeIntent(userMessage);
      console.log("[Clerk Agent] Intent detected:", intent.type, intent);

      // Handle different intents
      let response: ClerkResponse;

      switch (intent.type) {
        case "size_response":
          // User responded with a size after we asked
          response = await this.handleSizeResponse(intent.size, sessionId);
          break;
        case "search":
          response = await this.handleSearch(intent.query, sessionId, intent.hasBirthday || intent.hasWedding);
          break;
        case "birthday_recommendations":
          const recResponse = await this.handleRecommendations(sessionId);
          const haggleResponse = await this.handleHaggle(userMessage, sessionId);
          response = {
            message: `${recResponse.message}\n\n${haggleResponse.message}`,
            products: recResponse.products,
            action: haggleResponse.action,
          };
          break;
        case "inventory_check":
          response = await this.handleInventoryCheck(
            intent.productName,
            intent.size,
            intent.color
          );
          break;
        case "recommendations":
          response = await this.handleRecommendations(sessionId);
          break;
        case "filter":
          response = await this.handleFilter(intent.filterType, intent.value);
          break;
        case "add_to_cart":
          response = await this.handleAddToCartFromMessage(userMessage, sessionId);
          break;
        case "haggle":
          response = await this.handleHaggle(userMessage, sessionId);
          break;
        default:
          response = await this.handleGeneralChat(userMessage);
      }

      // Track last shown products for context
      if (response.products && response.products.length > 0) {
        this.lastShownProducts = response.products;
      }

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: response.message,
        products: response.products,
        action: response.action,
      });

      return response;
    } catch (error) {
      console.error("[Clerk Agent] Error processing message:", error);
      return {
        message:
          "I apologize, but I encountered an error. Could you please rephrase your question?",
      };
    }
  }

  /**
   * Analyze user intent from message - uses conversation context
   */
  private async analyzeIntent(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase().trim();

    // PRIORITY 0: Check if user is responding to a size question
    // This must be checked FIRST - when we asked for size and user responds
    if (this.pendingAddToCart) {
      // Check if the message looks like a size response
      const sizePatterns = [
        /^size\s*:?\s*(\w+)$/i,           // "size M", "size: M"
        /^(\d{2})$/,                        // "42" (shoe size)
        /^(xs|s|m|l|xl|xxl|small|medium|large)$/i, // Just the size
        /^(3[6-9]|4[0-9])$/,               // Shoe sizes 36-49
      ];
      
      for (const pattern of sizePatterns) {
        if (pattern.test(lowerMessage)) {
          return { type: "size_response", size: lowerMessage };
        }
      }
      
      // Also check for "size X" pattern anywhere in message
      const sizeMatch = lowerMessage.match(/size\s*:?\s*(\w+)/i);
      if (sizeMatch) {
        return { type: "size_response", size: sizeMatch[1] };
      }
    }

    // PRIORITY 1: "add it to cart" or "add it" - user wants to add last shown product
    // Use context to understand what "it" refers to
    if (
      lowerMessage === "add it" ||
      lowerMessage === "add it to cart" ||
      lowerMessage === "add to cart" ||
      lowerMessage === "buy it" ||
      lowerMessage === "get it" ||
      lowerMessage === "i'll take it" ||
      lowerMessage === "yes add it" ||
      lowerMessage === "yes" ||
      lowerMessage === "ok" ||
      lowerMessage === "sure"
    ) {
      // If we have last shown products, add the first one
      if (this.lastShownProducts.length > 0 || this.pendingAddToCart) {
        return { type: "add_to_cart", query: message };
      }
    }
    
    // PRIORITY 1.5: Check for referential language using context
    // "the first one", "that one", "the blazer" (if we just showed blazer)
    if (this.context.lastMentionedProducts.length > 0) {
      const ordinalPatterns = [
        { pattern: /(?:the\s+)?first\s*(?:one)?/i, index: 0 },
        { pattern: /(?:the\s+)?second\s*(?:one)?/i, index: 1 },
        { pattern: /(?:the\s+)?third\s*(?:one)?/i, index: 2 },
        { pattern: /(?:the\s+)?last\s*(?:one)?/i, index: -1 },
      ];
      
      for (const { pattern, index } of ordinalPatterns) {
        if (pattern.test(lowerMessage) && (lowerMessage.includes("add") || lowerMessage.includes("buy") || lowerMessage.includes("get"))) {
          const productIndex = index === -1 ? this.lastShownProducts.length - 1 : index;
          if (productIndex < this.lastShownProducts.length) {
            return { type: "add_to_cart", query: message, productIndex };
          }
        }
      }
      
      // Check if user mentions a product name from context
      for (const productName of this.context.lastMentionedProducts) {
        const nameWords = productName.toLowerCase().split(/\s+/);
        for (const word of nameWords) {
          if (word.length > 3 && lowerMessage.includes(word)) {
            if (lowerMessage.includes("add") || lowerMessage.includes("buy") || lowerMessage.includes("get") || lowerMessage.includes("cart")) {
              return { type: "add_to_cart", query: message };
            }
            // If just mentioning a product, might want more info
            if (lowerMessage.includes("more") || lowerMessage.includes("tell") || lowerMessage.includes("about")) {
              return { type: "search", query: productName };
            }
          }
        }
      }
    }

    // Check for birthday/haggle
    const hasBirthday = lowerMessage.includes("birthday") || lowerMessage.includes("birth day");
    const hasWedding = lowerMessage.includes("wedding") || lowerMessage.includes("marry");
    const hasHaggleKeywords = lowerMessage.includes("discount") || 
                              lowerMessage.includes("deal") || 
                              lowerMessage.includes("provide discount") ||
                              lowerMessage.includes("give discount") ||
                              lowerMessage.includes("give me discount") ||
                              lowerMessage.includes("can i get") ||
                              lowerMessage.includes("can you give");
    
    // PRIORITY 2: Add to cart with product name
    const strongAddKeywords = 
      lowerMessage.includes("book it") ||
      lowerMessage.includes("book this") ||
      lowerMessage.includes("buy it") ||
      lowerMessage.includes("buy this") ||
      lowerMessage.includes("add to cart") ||
      lowerMessage.includes("add it to cart") ||
      lowerMessage.includes("add to my cart") ||
      lowerMessage.includes("i'll take") ||
      lowerMessage.includes("i will take") ||
      lowerMessage.includes("get me") ||
      lowerMessage.includes("purchase") ||
      lowerMessage.includes("order") ||
      lowerMessage.includes("add the") ||
      lowerMessage.includes("add this") ||
      lowerMessage.includes("can you add");
    
    // Check for product names in message
    const productNamesLower = ["blazer", "sneaker", "boot", "shoe", "pant", "shirt", "jacket", "bag", "belt", "scarf", "sweater", "trouser", "tote", "overcoat", "linen", "wool", "denim", "knit", "canvas", "leather", "classic sneakers", "chelsea boots", "running sneakers", "relaxed trousers", "linen blazer", "canvas tote", "wool overcoat", "leather belt", "knit sweater", "denim jacket", "silk scarf", "crossbody"];
    const hasProductName = productNamesLower.some(word => lowerMessage.includes(word));
    
    if (strongAddKeywords) {
      return { type: "add_to_cart", query: message };
    }
    
    // "buy" or "add" with product name
    if ((lowerMessage.includes("add") || lowerMessage.includes("buy") || lowerMessage.includes("get")) && hasProductName) {
      return { type: "add_to_cart", query: message };
    }

    // PRIORITY 3: Haggle/Discount
    if ((hasBirthday || hasWedding) && hasHaggleKeywords) {
      return { type: "haggle", query: message };
    }
    
    if (hasBirthday || hasWedding) {
      const hasSearchContext = lowerMessage.includes("looking for") || 
                               lowerMessage.includes("show me") ||
                               lowerMessage.includes("find");
      if (!hasSearchContext) {
        return { type: "haggle", query: message };
      }
    }
    
    if (hasHaggleKeywords) {
      return { type: "haggle", query: message };
    }

    // PRIORITY 4: Filter/Sort
    if (
      lowerMessage.includes("sort") ||
      lowerMessage.includes("filter") ||
      lowerMessage.includes("cheaper") ||
      lowerMessage.includes("cheap") ||
      lowerMessage.includes("affordable") ||
      lowerMessage.includes("low price") ||
      lowerMessage.includes("lowest") ||
      lowerMessage.includes("expensive") ||
      lowerMessage.includes("high price") ||
      lowerMessage.includes("highest")
    ) {
      if (lowerMessage.includes("expensive") || lowerMessage.includes("high price") || lowerMessage.includes("highest")) {
        return { type: "filter", filterType: "sort_by_price", value: "desc" };
      }
      return { type: "filter", filterType: "sort_by_price", value: "asc" };
    }

    // PRIORITY 5: Search intent
    const hasSearchKeywords = (
      lowerMessage.includes("find") ||
      lowerMessage.includes("search") ||
      lowerMessage.includes("looking for") ||
      lowerMessage.includes("show me") ||
      lowerMessage.includes("show") ||
      lowerMessage.includes("want to see") ||
      lowerMessage.includes("want") ||
      lowerMessage.includes("need") ||
      lowerMessage.includes("can you show") ||
      lowerMessage.includes("do you have") ||
      lowerMessage.includes("what") ||
      lowerMessage.includes("any")
    );
    
    // Search keywords for seasons, occasions, styles
    const searchContextWords = ["winter", "summer", "spring", "fall", "autumn", "casual", "formal", "party", "office", "work", "date", "wedding", "outfit", "items", "clothes", "clothing", "wear", "fashion"];
    const hasSearchContext = searchContextWords.some(word => lowerMessage.includes(word));

    if (hasSearchKeywords || hasSearchContext || hasProductName) {
      return { type: "search", query: message, hasBirthday, hasWedding };
    }

    // Inventory check
    if (lowerMessage.includes("available") || lowerMessage.includes("in stock")) {
      return { type: "inventory_check", productName: message };
    }

    // Recommendations
    if (lowerMessage.includes("recommend") || lowerMessage.includes("suggest")) {
      return { type: "recommendations" };
    }

    return { type: "general" };
  }

  /**
   * Handle product search - also updates the UI
   */
  private async handleSearch(
    query: string,
    sessionId: string,
    hasBirthday?: boolean
  ): Promise<ClerkResponse> {
    const lowerQuery = query.toLowerCase();
    
    // Update context
    this.context.lastSearchQuery = query;
    this.context.topicHistory.push(`searched for: ${query}`);
    if (this.context.topicHistory.length > 5) {
      this.context.topicHistory.shift();
    }
    
    // Detect if user is searching for a specific category
    const categoryMap: Record<string, string> = {
      "shoes": "Shoes",
      "shoe": "Shoes",
      "footwear": "Shoes",
      "sneakers": "Shoes",
      "sneaker": "Shoes",
      "boots": "Shoes",
      "boot": "Shoes",
      "clothes": "Clothes",
      "clothing": "Clothes",
      "blazer": "Clothes",
      "jacket": "Clothes",
      "sweater": "Clothes",
      "trousers": "Clothes",
      "pants": "Clothes",
      "overcoat": "Clothes",
      "coat": "Clothes",
      "bags": "Bags",
      "bag": "Bags",
      "tote": "Bags",
      "accessories": "Accessories",
      "accessory": "Accessories",
      "belt": "Accessories",
      "scarf": "Accessories",
    };
    
    let detectedCategory: string | null = null;
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (lowerQuery.includes(keyword)) {
        detectedCategory = category;
        this.context.lastCategory = category;
        break;
      }
    }
    
    const products = await searchProductsSemantic(query, 6);

    if (products.length === 0) {
      // Try a more flexible search
      const flexibleQuery = query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .join(" ");

      const retryProducts = await searchProductsSemantic(flexibleQuery, 6);

      if (retryProducts.length === 0) {
        return {
          message: `I couldn't find products matching "${query}". Let me show you some recommendations instead!`,
          products: await this.handleRecommendations(sessionId).then(r => r.products || []),
        };
      }

      return this.formatSearchResponse(retryProducts, query, sessionId, hasBirthday, detectedCategory);
    }

    return this.formatSearchResponse(products, query, sessionId, hasBirthday, detectedCategory);
  }

  /**
   * Format search response with products
   */
  private async formatSearchResponse(
    products: Product[],
    query: string,
    sessionId: string,
    hasSpecialOccasion?: boolean,
    detectedCategory?: string | null
  ): Promise<ClerkResponse> {
    // Update context with mentioned products
    this.context.lastMentionedProducts = products.map(p => p.name);
    
    // Log search activity (silently fail if table doesn't exist or schema mismatch)
    if (supabase) {
      for (const product of products) {
        try {
          // Only log if product_id is a valid UUID format
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);
          
          if (isValidUUID) {
            const { error } = await supabase.from("user_activity").insert({
              session_id: sessionId,
              activity_type: "view",
              product_id: product.id,
              metadata: { search_query: query },
            });
            if (error) {
              // Silently ignore - activity logging is not critical
              console.debug("[Clerk Agent] Activity logging skipped:", error.message);
            }
          }
        } catch (error) {
          // Silently ignore errors - activity logging is not critical
          console.debug("[Clerk Agent] Activity logging skipped");
        }
      }
    }

    const productList = products
      .map(
        (p) =>
          `• **${p.name}** - $${p.price} - ${p.description.substring(0, 80)}...`
      )
      .join("\n");

    let message = `I found ${products.length} great option${products.length > 1 ? "s" : ""} for you:\n\n${productList}\n\nWould you like to see more details or add any to your cart?`;

    if (hasSpecialOccasion) {
      message += "\n\n🎉 Special occasion! I can help you with a discount - just ask!";
    }
    
    // Add note about UI update if category was detected
    if (detectedCategory) {
      message += `\n\n🔄 I've also updated the shop to show **${detectedCategory}** - check it out!`;
    }

    // Extract relevant product keywords from the found products
    // This helps filter the shop page more accurately
    const productKeywords = this.extractProductKeywords(products, query);
    
    // Build action to update shop UI
    let action: ClerkAction | undefined;
    if (detectedCategory) {
      action = {
        type: "filter",
        payload: {
          filterType: "filter_by_category",
          value: detectedCategory,
          searchQuery: query,
          productKeywords: productKeywords,
        },
      };
    } else {
      // Even without a specific category, trigger a search filter
      action = {
        type: "filter",
        payload: {
          filterType: "search",
          value: query,
          productKeywords: productKeywords,
        },
      };
    }

    return {
      message,
      products,
      action,
    };
  }

  /**
   * Handle inventory check
   */
  private async handleInventoryCheck(
    productName: string,
    size?: string,
    color?: string
  ): Promise<ClerkResponse> {
    // Try to find the product first
    const products = await searchProductsSemantic(productName, 1);
    if (products.length === 0) {
      return {
        message: `I couldn't find a product matching "${productName}". Could you be more specific?`,
      };
    }

    const product = products[0];
    const inventory = await checkInventory(product.id, size, color);

    if (inventory.available) {
      return {
        message: `Yes! ${product.name} is available. We have ${inventory.stock} in stock. Available sizes: ${product.sizes.join(", ")}. Would you like to add it to your cart?`,
        products: [product],
      };
    } else {
      return {
        message: `I'm sorry, but ${product.name} is currently out of stock. Would you like me to show you similar products?`,
        products: [product],
      };
    }
  }

  /**
   * Handle product recommendations
   */
  private async handleRecommendations(
    sessionId: string
  ): Promise<ClerkResponse> {
    let products = await getRecommendedProducts(sessionId, 4);

    if (products.length === 0) {
      // Fallback to all products
      products = await getProducts({}, { field: "created_at", order: "desc" });
      if (products.length === 0) {
        // Ultimate fallback: use local products
        const { products: localProducts } = await import("@/lib/products");
        products = localProducts.slice(0, 4).map((p: any) => ({
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
      } else {
        products = products.slice(0, 4);
      }
    }

    return {
      message: `Here are some great options I think you'll love:\n\n${products.map(p => `• **${p.name}** - $${p.price}`).join("\n")}\n\nWould you like to see more details?`,
      products,
    };
  }

  /**
   * Handle filter/sort actions (Vibe Filter)
   * This is the "Vibe Filter" - the Clerk can control the website UI in real-time
   */
  private async handleFilter(
    filterType: string,
    value: any
  ): Promise<ClerkResponse> {
    let message = "";
    let actionPayload: any = { filterType, value };
    let products: Product[] = [];

    if (filterType === "sort_by_price") {
      // Get products sorted by price to show in chat
      products = await getProducts({}, { field: "price", order: value as "asc" | "desc" });
      products = products.slice(0, 4);
      
      if (value === "asc") {
        message = `🔄 I'm updating the shop to show the most affordable options first!\n\nHere are some budget-friendly picks:`;
        actionPayload = { filterType: "sort_by_price", value: "asc" };
      } else {
        message = `🔄 I'm sorting products by price, highest first!\n\nHere are our premium picks:`;
        actionPayload = { filterType: "sort_by_price", value: "desc" };
      }
    } else if (filterType === "filter_by_category") {
      products = await getProducts({ category: value });
      products = products.slice(0, 4);
      message = `🔄 I'm filtering the shop to show ${value}!\n\nHere are some great ${value.toLowerCase()}:`;
      actionPayload = { filterType: "filter_by_category", value };
    } else if (filterType === "filter_by_price_range") {
      products = await getProducts({ minPrice: value.min, maxPrice: value.max });
      products = products.slice(0, 4);
      message = `🔄 I'm filtering products in your price range!`;
      actionPayload = { filterType: "filter_by_price_range", value };
    } else {
      message = "🔄 I'm updating the shop view for you!";
    }

    return {
      message: message + "\n\nCheck the Shop page - it's been updated! ➡️",
      products: products.length > 0 ? products : undefined,
      action: {
        type: "filter",
        payload: actionPayload,
      },
    };
  }

  /**
   * Handle size response when user provides a size after we asked
   */
  private async handleSizeResponse(
    sizeInput: string,
    sessionId: string
  ): Promise<ClerkResponse> {
    // Get the product we're waiting to add
    const product = this.pendingAddToCart;
    
    if (!product) {
      // No pending product - try to use last shown products
      if (this.lastShownProducts.length > 0) {
        this.pendingAddToCart = this.lastShownProducts[0];
        return this.handleSizeResponse(sizeInput, sessionId);
      }
      return {
        message: "I'm not sure which product you want. Could you tell me which item you'd like to add to cart?",
      };
    }

    // Extract the size from the input
    let size = sizeInput.toUpperCase().replace(/SIZE\s*:?\s*/i, "").trim();
    
    // Map common size words to standard sizes
    const sizeMap: Record<string, string> = {
      "small": "S",
      "medium": "M",
      "large": "L",
      "extra large": "XL",
      "extra small": "XS",
    };
    
    if (sizeMap[size.toLowerCase()]) {
      size = sizeMap[size.toLowerCase()];
    }

    // Validate the size is available
    if (product.sizes && product.sizes.length > 0 && !product.sizes.includes(size)) {
      return {
        message: `Sorry, size "${size}" is not available for **${product.name}**.\n\nAvailable sizes: ${product.sizes.join(", ")}\n\nPlease choose a different size.`,
        products: [product],
      };
    }

    // Clear pending product
    this.pendingAddToCart = null;

    // Add to cart
    try {
      await addToCart(product.id, size, 1);
    } catch (error) {
      console.warn("[Clerk Agent] Supabase cart add failed, using local cart:", error);
    }

    return {
      message: `Added **${product.name}** (size ${size}) to your cart! 🛒\n\nWould you like to continue shopping or checkout?`,
      products: [product],
      action: {
        type: "add_to_cart",
        payload: { productId: product.id, size, quantity: 1 },
      },
    };
  }

  /**
   * Handle add to cart from user message
   * Extracts product name from message and finds it in recently shown products
   */
  private async handleAddToCartFromMessage(
    userMessage: string,
    sessionId: string
  ): Promise<ClerkResponse> {
    const lowerMessage = userMessage.toLowerCase();
    
    // If there's a pending add-to-cart, complete it
    if (this.pendingAddToCart) {
      // Check if user provided a size
      const sizeMatch = lowerMessage.match(/size\s*:?\s*(\w+)/i) ||
                        lowerMessage.match(/\b(xs|s|m|l|xl|xxl)\b/i) ||
                        lowerMessage.match(/\b(3[6-9]|4[0-9])\b/);
      
      if (sizeMatch) {
        return this.handleSizeResponse(sizeMatch[1] || sizeMatch[0], sessionId);
      }
    }
    
    // Get recently shown products
    const recentProducts = this.lastShownProducts.length > 0 
      ? this.lastShownProducts 
      : this.getRecentProductsFromHistory();

    // Product name patterns for matching
    const productKeywords = [
      { pattern: /classic\s*sneaker/i, name: "Classic Sneakers" },
      { pattern: /chelsea\s*boot/i, name: "Chelsea Boots" },
      { pattern: /running\s*sneaker/i, name: "Running Sneakers" },
      { pattern: /linen\s*blazer/i, name: "Linen Blazer" },
      { pattern: /canvas\s*tote/i, name: "Canvas Tote" },
      { pattern: /wool\s*overcoat/i, name: "Wool Overcoat" },
      { pattern: /relaxed\s*trouser/i, name: "Relaxed Trousers" },
      { pattern: /leather\s*belt/i, name: "Leather Belt" },
      { pattern: /knit\s*sweater/i, name: "Knit Sweater" },
      { pattern: /denim\s*jacket/i, name: "Denim Jacket" },
      { pattern: /silk\s*scarf/i, name: "Silk Scarf" },
      { pattern: /crossbody\s*bag/i, name: "Crossbody Bag" },
    ];
    
    let matchedProduct: Product | null = null;
    
    // Try to match specific product names first
    for (const { pattern, name } of productKeywords) {
      if (pattern.test(lowerMessage)) {
        // Check in recent products
        matchedProduct = recentProducts.find(p => 
          p.name.toLowerCase() === name.toLowerCase()
        ) || null;
        
        // If not found, search
        if (!matchedProduct) {
          const searchResults = await searchProductsSemantic(name, 1);
          if (searchResults.length > 0) {
            matchedProduct = searchResults[0];
          }
        }
        break;
      }
    }
    
    // Try matching by partial product name in recent products
    if (!matchedProduct && recentProducts.length > 0) {
      for (const product of recentProducts) {
        const productNameLower = product.name.toLowerCase();
        
        // Full name match
        if (lowerMessage.includes(productNameLower)) {
          matchedProduct = product;
          break;
        }
        
        // Word-by-word match (e.g., "blazer" matches "Linen Blazer")
        const productWords = productNameLower.split(/\s+/);
        for (const word of productWords) {
          if (word.length > 3 && lowerMessage.includes(word)) {
            matchedProduct = product;
            break;
          }
        }
        if (matchedProduct) break;
      }
    }

    // For generic "add it", "buy it" etc., use first recent product
    if (!matchedProduct && recentProducts.length > 0) {
      const genericAddPhrases = ["add it", "buy it", "get it", "take it", "add to cart", "yes", "ok", "sure"];
      if (genericAddPhrases.some(phrase => lowerMessage.includes(phrase))) {
        matchedProduct = recentProducts[0];
      }
    }
    
    // Last resort: search for it
    if (!matchedProduct) {
      const allProducts = await getProducts({}, { field: "created_at", order: "desc" });
      
      // Try to match by any word in the message
      for (const product of allProducts) {
        const productWords = product.name.toLowerCase().split(/\s+/);
        for (const word of productWords) {
          if (word.length > 3 && lowerMessage.includes(word)) {
            matchedProduct = product;
            break;
          }
        }
        if (matchedProduct) break;
      }
      
      if (!matchedProduct) {
        return {
          message: "I'd be happy to add something to your cart! Which product would you like? Here are some options:",
          products: allProducts.slice(0, 4),
        };
      }
    }

    // Check if user specified a size
    const sizeMatch = lowerMessage.match(/size\s*:?\s*(\w+)/i) ||
                      lowerMessage.match(/\b(xs|s|m|l|xl|xxl)\b/i) ||
                      lowerMessage.match(/\b(3[6-9]|4[0-9])\b/);
    
    // If product has multiple sizes and user didn't specify, ask for size
    if (!sizeMatch && matchedProduct.sizes && matchedProduct.sizes.length > 1) {
      // Store the product so we remember it when user responds with size
      this.pendingAddToCart = matchedProduct;
      
      return {
        message: `Great choice! **${matchedProduct.name}** is available in these sizes:\n\n${matchedProduct.sizes.join(", ")}\n\nWhich size would you like?`,
        products: [matchedProduct],
      };
    }

    // Determine size
    let size = "";
    if (sizeMatch) {
      size = (sizeMatch[1] || sizeMatch[0]).toUpperCase();
    } else if (matchedProduct.sizes && matchedProduct.sizes.length > 0) {
      size = matchedProduct.sizes[0];
    }

    // Clear any pending state
    this.pendingAddToCart = null;

    // Add to cart
    try {
      await addToCart(matchedProduct.id, size, 1);
    } catch (error) {
      console.warn("[Clerk Agent] Supabase cart add failed, using local cart:", error);
    }

    return {
      message: `Added **${matchedProduct.name}** (size ${size}) to your cart! 🛒\n\nWould you like to continue shopping or checkout?`,
      products: [matchedProduct],
      action: {
        type: "add_to_cart",
        payload: { productId: matchedProduct.id, size, quantity: 1 },
      },
    };
  }
  
  /**
   * Get recent products from conversation history
   */
  private getRecentProductsFromHistory(): Product[] {
    const products: Product[] = [];
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      const msg = this.conversationHistory[i];
      if (msg.products && msg.products.length > 0) {
        products.push(...msg.products);
        if (products.length >= 4) break;
      }
    }
    return products;
  }

  /**
   * Handle add to cart (direct call with product ID)
   */
  private async handleAddToCart(
    productId: string,
    size: string,
    quantity: number
  ): Promise<ClerkResponse> {
    try {
      await addToCart(productId, size, quantity);
      const product = await getProductById(productId);

      return {
        message: `Perfect! I've added ${quantity}x ${product?.name || "item"}${size ? ` (size: ${size})` : ""} to your cart. Would you like to see your cart or continue shopping?`,
        products: product ? [product] : undefined,
        action: {
          type: "add_to_cart",
          payload: { productId, size, quantity },
        },
      };
    } catch (error) {
      return {
        message: "I'm sorry, but I couldn't add that item to your cart. Please try again.",
      };
    }
  }

  /**
   * Handle haggle/discount requests
   */
  private async handleHaggle(
    message: string,
    sessionId: string
  ): Promise<ClerkResponse> {
    const { processHaggle } = await import("./haggle");
    const result = await processHaggle(message, sessionId);

    return {
      message: result.message,
      action: result.success
        ? {
          type: "filter",
          payload: {
            action: "apply_coupon",
            couponCode: result.couponCode,
          },
        }
        : undefined,
    };
  }

  /**
   * Handle general conversation - ALWAYS grounded in real products
   */
  private async handleGeneralChat(message: string): Promise<ClerkResponse> {
    const lowerMessage = message.toLowerCase().trim();
    
    // Simple greetings
    if (lowerMessage === "hi" || lowerMessage === "hello" || lowerMessage === "hey" || lowerMessage === "hi!" || lowerMessage === "hello!") {
      return {
        message: "Hello! Welcome to TrendZone! 👋\n\nI'm here to help you find the perfect items. What are you looking for today?\n\n• Browse our collection (\"show me shoes\")\n• Get recommendations (\"what do you suggest?\")\n• Ask about discounts (\"it's my birthday!\")",
      };
    }
    
    // Thanks/bye
    if (lowerMessage.includes("thank") || lowerMessage === "bye" || lowerMessage === "goodbye") {
      return {
        message: "You're welcome! Happy shopping at TrendZone! 🛍️",
      };
    }
    
    // Cart/checkout queries
    if (lowerMessage.includes("cart") || lowerMessage.includes("checkout")) {
      return {
        message: "You can view your cart by clicking the cart icon in the top right. Ready to checkout? Just head to your cart! 🛒",
      };
    }
    
    // If user says yes/ok/sure and we have recent products - might be confirming an add
    if ((lowerMessage === "yes" || lowerMessage === "ok" || lowerMessage === "sure" || lowerMessage === "yeah") && this.lastShownProducts.length > 0) {
      // Treat as wanting to add the first product
      const sessionId = typeof localStorage !== 'undefined' 
        ? localStorage.getItem("cart_session_id") || "default" 
        : "default";
      return this.handleAddToCartFromMessage("add it to cart", sessionId);
    }
    
    // For other messages, provide helpful response
    return {
      message: "I can help you with:\n\n• Finding products - \"show me shoes\" or \"I need a jacket\"\n• Adding to cart - \"add the blazer to my cart\"\n• Getting discounts - \"it's my birthday!\"\n• Sorting products - \"show me cheaper options\"\n\nWhat would you like to do?",
    };
  }

  /**
   * Extract relevant keywords from products for better shop filtering
   * This extracts product type words (sneakers, boots, blazer) from product names
   */
  private extractProductKeywords(products: Product[], originalQuery: string): string {
    const lowerQuery = originalQuery.toLowerCase();
    
    // Common product type keywords to look for
    const productTypeKeywords = [
      "sneakers", "sneaker", "boots", "boot", "shoes", "shoe",
      "blazer", "jacket", "sweater", "overcoat", "coat", "trousers", "pants",
      "tote", "bag", "crossbody",
      "belt", "scarf"
    ];
    
    // Check if the original query contains a specific product type
    for (const keyword of productTypeKeywords) {
      if (lowerQuery.includes(keyword)) {
        return keyword;
      }
    }
    
    // If no specific keyword in query, extract from first product name
    if (products.length > 0) {
      const firstProductName = products[0].name.toLowerCase();
      for (const keyword of productTypeKeywords) {
        if (firstProductName.includes(keyword)) {
          return keyword;
        }
      }
      
      // If still no match, use key words from product names
      // Extract the main product type word (usually the last word)
      const words = products[0].name.split(/\s+/);
      if (words.length > 0) {
        // Try to get a meaningful product word (not adjectives like "Classic", "Wool")
        const lastWord = words[words.length - 1].toLowerCase();
        if (lastWord.length > 3) {
          return lastWord;
        }
      }
    }
    
    // Fallback to original query
    return originalQuery;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
    ];
    this.pendingAddToCart = null;
    this.lastShownProducts = [];
    this.context = {
      lastSearchQuery: null,
      lastCategory: null,
      lastMentionedProducts: [],
      userPreferences: {},
      topicHistory: [],
    };
  }
  
  /**
   * Get current conversation context (for debugging/status)
   */
  getContext(): ConversationContext {
    return { ...this.context };
  }
}
