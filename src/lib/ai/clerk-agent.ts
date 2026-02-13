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

const SYSTEM_PROMPT = `You are The Clerk, a friendly and knowledgeable AI personal shopper for TrendZone, a modern fashion e-commerce store.

Your personality:
- Warm, helpful, and conversational
- Knowledgeable about fashion, style, and trends
- Proactive in suggesting products
- Can negotiate discounts when users have good reasons
- Can control the website UI to help users find what they need

Your capabilities:
1. Semantic Search: Help users find products using natural language queries
2. Inventory Check: Check if products are available in specific sizes/colors
3. Product Recommendations: Suggest products based on user preferences
4. Vibe Filter: You can control the website UI to filter/sort products in real-time
5. Add to Cart: You can add products directly to the user's cart
6. Haggle Mode: Generate discount coupons for users with good reasons

When showing products, always provide:
- Product name
- Price
- Brief description
- Direct link to product page
- Option to add to cart

Be conversational, helpful, and make shopping feel personal and enjoyable.`;

export class ClerkAgent {
  private model: any;
  private conversationHistory: ClerkMessage[] = [];

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

      // Handle different intents
      let response: ClerkResponse;

      switch (intent.type) {
        case "search":
          response = await this.handleSearch(intent.query, sessionId, intent.hasBirthday);
          break;
        case "birthday_recommendations":
          // Handle birthday: show recommendations + offer discount
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
   * Analyze user intent from message
   */
  private async analyzeIntent(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase();

    // Check for birthday/haggle first (but also allow search)
    const hasBirthday = lowerMessage.includes("birthday") || lowerMessage.includes("birth day");
    const hasHaggleKeywords = lowerMessage.includes("discount") || 
                              lowerMessage.includes("deal") || 
                              lowerMessage.includes("cheaper") ||
                              lowerMessage.includes("special");

    // Search intent - be more permissive
    const hasSearchKeywords = lowerMessage.includes("find") ||
      lowerMessage.includes("search") ||
      lowerMessage.includes("looking for") ||
      lowerMessage.includes("need") ||
      lowerMessage.includes("show me") ||
      lowerMessage.includes("want") ||
      lowerMessage.includes("what should") ||
      lowerMessage.includes("wear") ||
      lowerMessage.includes("shoe") ||
      lowerMessage.includes("pant") ||
      lowerMessage.includes("shirt") ||
      lowerMessage.includes("outfit") ||
      lowerMessage.includes("clothes") ||
      lowerMessage.includes("dress");

    // If birthday + search query, prioritize search but note birthday
    if (hasBirthday && hasSearchKeywords) {
      return { type: "search", query: message, hasBirthday: true };
    }

    // If birthday without search, trigger haggle + recommendations
    if (hasBirthday && !hasSearchKeywords) {
      return { type: "birthday_recommendations", query: message };
    }

    // Regular search (but not if it's clearly a discount request)
    if (hasSearchKeywords && !lowerMessage.includes("discount") && !lowerMessage.includes("deal")) {
      return { type: "search", query: message };
    }

    // Inventory check
    if (
      lowerMessage.includes("available") ||
      lowerMessage.includes("in stock") ||
      lowerMessage.includes("have") ||
      lowerMessage.includes("do you have")
    ) {
      return { type: "inventory_check", productName: message };
    }

    // Filter intent
    if (
      lowerMessage.includes("cheaper") ||
      lowerMessage.includes("cheap") ||
      lowerMessage.includes("affordable") ||
      lowerMessage.includes("sort by") ||
      lowerMessage.includes("filter")
    ) {
      if (lowerMessage.includes("cheaper") || lowerMessage.includes("cheap")) {
        return { type: "filter", filterType: "sort_by_price", value: "asc" };
      }
      return { type: "filter", filterType: "sort_by_price", value: "asc" };
    }

    // Add to cart intent - check before search to prioritize
    if (
      lowerMessage.includes("add to cart") ||
      lowerMessage.includes("add to") ||
      lowerMessage.includes("add it") ||
      lowerMessage.includes("add them") ||
      lowerMessage.includes("buy") ||
      lowerMessage.includes("purchase") ||
      lowerMessage.includes("get this") ||
      lowerMessage.includes("i like") ||
      lowerMessage.includes("i want") ||
      lowerMessage.includes("i'll take")
    ) {
      return { type: "add_to_cart", query: message };
    }

    // Recommendations
    if (
      lowerMessage.includes("recommend") ||
      lowerMessage.includes("suggest") ||
      lowerMessage.includes("what should")
    ) {
      return { type: "recommendations" };
    }

    // Haggle - prioritize over search when discount keywords are present
    if (hasHaggleKeywords) {
      return { type: "haggle" };
    }

    // Default: treat as search if it has any product-related words
    const productWords = ["shoe", "pant", "shirt", "jacket", "bag", "belt", "scarf", "sweater", "blazer", "trouser", "sneaker", "boot"];
    if (productWords.some(word => lowerMessage.includes(word))) {
      return { type: "search", query: message };
    }

    return { type: "general" };
  }

  /**
   * Handle product search
   */
  private async handleSearch(
    query: string,
    sessionId: string,
    hasBirthday?: boolean
  ): Promise<ClerkResponse> {
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
      
      return this.formatSearchResponse(retryProducts, query, sessionId, hasBirthday);
    }

    return this.formatSearchResponse(products, query, sessionId, hasBirthday);
  }

  /**
   * Format search response with products
   */
  private async formatSearchResponse(
    products: Product[],
    query: string,
    sessionId: string,
    hasBirthday?: boolean
  ): Promise<ClerkResponse> {
    // Log search activity
    if (supabase) {
      for (const product of products) {
        try {
          const { error } = await supabase.from("user_activity").insert({
            session_id: sessionId,
            activity_type: "view",
            product_id: product.id,
            metadata: { search_query: query },
          });
          if (error) {
            console.warn("[Clerk Agent] Failed to log activity:", error);
          }
        } catch (error) {
          // Ignore errors - activity logging is not critical
          console.warn("[Clerk Agent] Activity logging error:", error);
        }
      }
    }

    const productList = products
      .map(
        (p) =>
          `• **${p.name}** - $${p.price} - ${p.description.substring(0, 80)}...`
      )
      .join("\n");

    let message = `I found ${products.length} great option${products.length > 1 ? "s" : ""} for you:\n\n${productList}\n\nWould you like to see more details about any of these?`;
    
    if (hasBirthday) {
      message += "\n\n🎉 Happy Birthday! I can also help you with a special birthday discount - just ask!";
    }

    return {
      message,
      products,
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
   */
  private async handleFilter(
    filterType: string,
    value: any
  ): Promise<ClerkResponse> {
    let message = "";
    let actionPayload: any = { filterType, value };

    if (filterType === "sort_by_price") {
      if (value === "asc") {
        message = "I'll sort the products to show you the most affordable options first!";
        actionPayload = { filterType: "sort_by_price", value: "asc" };
      } else {
        message = "I'll sort the products by price, highest first!";
        actionPayload = { filterType: "sort_by_price", value: "desc" };
      }
    } else if (filterType === "filter_by_category") {
      message = `I'll show you products from the ${value} category!`;
      actionPayload = { filterType: "filter_by_category", value };
    } else if (filterType === "filter_by_price_range") {
      message = `I'll filter products in your price range!`;
      actionPayload = { filterType: "filter_by_price_range", value };
    } else {
      message = "I'll update the shop view for you!";
    }

    return {
      message,
      action: {
        type: "filter",
        payload: actionPayload,
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
    // Get recently shown products from conversation history
    const recentProducts: Product[] = [];
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      const msg = this.conversationHistory[i];
      if (msg.products && msg.products.length > 0) {
        recentProducts.push(...msg.products);
        break; // Get products from most recent message with products
      }
    }

    if (recentProducts.length === 0) {
      return {
        message: "I'd be happy to add something to your cart! Could you tell me which product you'd like? Or I can show you some options first.",
      };
    }

    // Extract product name from message
    const lowerMessage = userMessage.toLowerCase();
    let matchedProduct: Product | null = null;
    let size = "";

    // Try to match product name - improved matching
    for (const product of recentProducts) {
      const productNameLower = product.name.toLowerCase();
      
      // Exact match (case-insensitive)
      if (lowerMessage.includes(productNameLower)) {
        matchedProduct = product;
        break;
      }
      
      // Partial match - check if all significant words from product name are in message
      const productWords = productNameLower.split(/\s+/).filter(w => w.length > 2);
      const messageWords = lowerMessage.split(/\s+/);
      
      // Count how many product words appear in message
      const matchCount = productWords.filter(pw => 
        messageWords.some(mw => mw.includes(pw) || pw.includes(mw))
      ).length;
      
      // If most words match, it's likely the right product
      if (matchCount >= Math.ceil(productWords.length * 0.6)) {
        matchedProduct = product;
        break;
      }
      
      // Also check individual significant words (longer than 3 chars)
      if (productWords.some(word => word.length > 3 && lowerMessage.includes(word))) {
        matchedProduct = product;
        break;
      }
    }

    // If no exact match, use first product from recent list
    if (!matchedProduct) {
      matchedProduct = recentProducts[0];
    }

    // Extract size from message or use default
    const sizePatterns = [
      /\b(size|sz)\s*:?\s*([smxl\d]+)\b/i,
      /\b([smxl])\b/i,
      /\b(\d{2,3})\b/, // Shoe sizes like 38, 40, etc.
    ];

    for (const pattern of sizePatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        size = match[1] || match[2] || "";
        break;
      }
    }

    // If no size found, use first available size
    if (!size && matchedProduct.sizes && matchedProduct.sizes.length > 0) {
      size = matchedProduct.sizes[0];
    }

    // Extract quantity
    const quantityMatch = userMessage.match(/\b(\d+)\s*(x|times)?\b/i);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

    if (!matchedProduct) {
      return {
        message: "I couldn't identify which product you'd like to add. Could you be more specific?",
      };
    }

    try {
      await addToCart(matchedProduct.id, size, quantity);
      
      return {
        message: `Perfect! I've added ${quantity}x ${matchedProduct.name}${size ? ` (size: ${size})` : ""} to your cart. Would you like to see your cart or continue shopping?`,
        products: [matchedProduct],
        action: {
          type: "add_to_cart",
          payload: { productId: matchedProduct.id, size, quantity },
        },
      };
    } catch (error) {
      console.error("[Clerk Agent] Error adding to cart:", error);
      return {
        message: "I'm sorry, but I couldn't add that item to your cart. Please try again.",
      };
    }
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
   * Handle general conversation
   */
  private async handleGeneralChat(message: string): Promise<ClerkResponse> {
    if (!this.model) {
      return {
        message:
          "I'm here to help you find the perfect fashion items! What are you looking for today? You can ask me to find products, show recommendations, or help with discounts.",
      };
    }

    try {
      const prompt = `${SYSTEM_PROMPT}\n\nConversation history:\n${this.conversationHistory
        .slice(-5)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n")}\n\nUser: ${message}\nAssistant:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return {
        message: text,
      };
    } catch (error) {
      console.error("[Clerk Agent] Error in general chat:", error);
      return {
        message:
          "I'm here to help you find the perfect fashion items! What are you looking for today?",
      };
    }
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
  }
}
