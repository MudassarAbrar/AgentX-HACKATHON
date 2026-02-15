import { GoogleGenerativeAI } from "@google/generative-ai";
import { getProducts } from "@/lib/api/products";
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

// Store inventory cache (refreshed periodically)
let productCache: Product[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getInventory(): Promise<Product[]> {
  const now = Date.now();
  if (productCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    return productCache;
  }
  
  try {
    const products = await getProducts({}, { field: "created_at", order: "desc" });
    if (products.length > 0) {
      productCache = products;
      cacheTimestamp = now;
    }
    return productCache;
  } catch (error) {
    console.warn("[Clerk] Failed to fetch inventory:", error);
    return productCache;
  }
}

function formatInventoryForAI(products: Product[]): string {
  return products.map((p, i) => 
    `${i + 1}. "${p.name}" | $${p.price} | Category: ${p.category} | Sizes: ${p.sizes.join(", ")} | Stock: ${p.stock > 0 ? "In Stock" : "Out of Stock"} | ID: ${p.id}`
  ).join("\n");
}

// Function declarations for Gemini (using inline types)
const functionDeclarations = [
  {
    name: "search_products",
    description: "Search for products in the store inventory based on user's needs. Use this when user asks to see products, find items, or browse categories.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        query: {
          type: "STRING" as const,
          description: "Search terms - product type, category, style, occasion, etc."
        },
        category: {
          type: "STRING" as const,
          description: "Filter by category: Shoes, Clothes, Bags, or Accessories",
          enum: ["Shoes", "Clothes", "Bags", "Accessories"]
        },
        max_price: {
          type: "NUMBER" as const,
          description: "Maximum price filter"
        },
        sort_by: {
          type: "STRING" as const,
          description: "Sort order for results",
          enum: ["price_low", "price_high", "newest"]
        }
      },
      required: ["query"]
    }
  },
  {
    name: "add_to_cart",
    description: "Add a product to the user's shopping cart. Only use when user explicitly wants to buy/add a specific product AND has confirmed the size.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        product_id: {
          type: "STRING" as const,
          description: "The product ID to add"
        },
        product_name: {
          type: "STRING" as const,
          description: "The product name for confirmation"
        },
        size: {
          type: "STRING" as const,
          description: "The size selected by the user"
        },
        quantity: {
          type: "NUMBER" as const,
          description: "Quantity to add (default 1)"
        }
      },
      required: ["product_id", "product_name", "size"]
    }
  },
  {
    name: "apply_filter",
    description: "Update the shop page display - sort products or filter by category. Use when user wants to see cheaper/expensive options or browse a category.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        filter_type: {
          type: "STRING" as const,
          description: "Type of filter to apply",
          enum: ["sort_price_low", "sort_price_high", "filter_category"]
        },
        category: {
          type: "STRING" as const,
          description: "Category to filter by (only if filter_type is filter_category)"
        }
      },
      required: ["filter_type"]
    }
  },
  {
    name: "generate_discount",
    description: "Generate a discount coupon for the user. Only use when user gives a valid reason like birthday, wedding, student, first purchase, or bulk order.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        reason: {
          type: "STRING" as const,
          description: "The reason for the discount",
          enum: ["birthday", "wedding", "student", "first_purchase", "bulk_order", "valentines", "loyal_customer"]
        },
        discount_percent: {
          type: "NUMBER" as const,
          description: "Discount percentage (5-20)"
        }
      },
      required: ["reason", "discount_percent"]
    }
  },
  {
    name: "check_inventory",
    description: "Check if a specific product is available in a specific size/color.",
    parameters: {
      type: "OBJECT" as const,
      properties: {
        product_name: {
          type: "STRING" as const,
          description: "Name of the product to check"
        },
        size: {
          type: "STRING" as const,
          description: "Size to check availability for"
        }
      },
      required: ["product_name"]
    }
  }
];

export class ClerkAgent {
  private apiKey: string | null;
  private genAI: GoogleGenerativeAI | null;
  private model: any;
  private chatSession: any;
  private inventory: Product[] = [];
  private lastShownProducts: Product[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    } else {
      this.genAI = null;
      this.model = null;
      console.warn("[Clerk] No API key - AI features disabled");
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    if (this.isInitialized && this.model && this.chatSession) {
      return true;
    }
    
    if (!this.genAI) return false;
    
    try {
      // Load inventory for context
      this.inventory = await getInventory();
      
      if (this.inventory.length === 0) {
        console.warn("[Clerk] No inventory loaded");
      }
      
      const systemInstruction = this.buildSystemPrompt();
      
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction,
        tools: [{ functionDeclarations }] as any,
      });
      
      // Start a chat session
      this.chatSession = this.model.startChat({
        history: [],
      });
      
      this.isInitialized = true;
      console.log("[Clerk] AI Model initialized with", this.inventory.length, "products");
      return true;
    } catch (error) {
      console.error("[Clerk] Failed to initialize model:", error);
      this.model = null;
      return false;
    }
  }

  private buildSystemPrompt(): string {
    const inventoryList = formatInventoryForAI(this.inventory);
    
    return `You are "The Clerk" - a friendly, knowledgeable personal shopper at TrendZone, a modern fashion store. You're not a robot - you're like a helpful friend who works at a cool clothing store.

## YOUR PERSONALITY
- Warm, friendly, and conversational (not formal or robotic)
- Enthusiastic about fashion but not pushy
- Helpful and patient, like a real store clerk
- Use natural language, occasional emojis, and be personable
- Remember context from the conversation

## CURRENT STORE INVENTORY (${this.inventory.length} products)
${inventoryList}

## YOUR CAPABILITIES (use function calls)
1. **search_products** - Help customers find products based on their needs, style, occasion
2. **add_to_cart** - When they decide to buy, help them choose size and add to cart
3. **generate_discount** - For valid reasons (birthday, wedding, student, bulk), offer 10-20% off
4. **apply_filter** - Sort by price or filter by category when asked
5. **check_inventory** - Check if specific product/size is available

## IMPORTANT RULES
1. ONLY recommend products from the inventory above - never make up products
2. When showing products, mention their actual name, price, and key features
3. Before adding to cart, ALWAYS confirm the SIZE with the customer
4. For discounts, only valid reasons get codes: birthday (15%), wedding (20%), student (10%), first order (10%), bulk (12%)
5. Be conversational! Don't just list products - engage naturally
6. If asked about something not in inventory, suggest alternatives we DO have
7. **CRITICAL: ALWAYS call search_products or apply_filter when user asks for products, even if asking follow-up questions**
8. When user asks for a specific item (sunglasses, shoes, etc.) - ALWAYS call search_products to show them
9. When user mentions an occasion (birthday, wedding) - call search_products to show relevant outfit ideas AND generate_discount if appropriate
10. Don't just ask questions without showing products - be proactive and show relevant items

## RESPONSE FORMAT
- Keep responses concise but friendly (2-4 sentences usually)
- When showing products, describe them naturally, don't just list
- ALWAYS call the appropriate function to execute actions
- After showing products, ask follow-up questions to help them decide

## EXAMPLES OF GOOD RESPONSES
- User: "I want shoes" → Call search_products with query:"shoes", then describe the options naturally
- User: "It's my birthday" → Call BOTH generate_discount AND search_products to show birthday outfit ideas
- User: "can you provide sunglasses" → Call search_products with query:"sunglasses" to show sunglasses options
- User: "suggest me something for birthday" → Call search_products for outfit ideas AND generate_discount
- User: "Add the blazer in size M" → Call add_to_cart with the product details
- User: "Show me cheaper options" → Call apply_filter with filter_type:"sort_price_low"
- User: "today's my friend wedding" → Call search_products for wedding outfit ideas (formal clothes, accessories)

## BAD RESPONSES (AVOID THESE)
- NEVER just ask questions without showing products
- NEVER say "Let me show you" without actually calling search_products
- NEVER respond without a function call if user is asking for products`;
  }

  async chat(userMessage: string, sessionId: string): Promise<ClerkResponse> {
    // Ensure model is initialized
    const initialized = await this.ensureInitialized();
    
    // Refresh inventory
    this.inventory = await getInventory();
    
    // If not initialized, use fallback
    if (!initialized || !this.chatSession) {
      console.warn("[Clerk] Using fallback response - not initialized");
      return this.fallbackResponse(userMessage);
    }

    try {
      // Send message to Gemini
      const result = await this.chatSession.sendMessage(userMessage);
      const response = result.response;
      
      // Check for function calls
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        return await this.handleFunctionCalls(functionCalls, response.text(), sessionId);
      }
      
      // No function call - just a text response (conversation/follow-up question)
      const text = response.text();
      
      // Don't show products for conversational responses (follow-up questions, clarifications)
      // Only show products when we explicitly searched for them via function calls
      return {
        message: text || "I'm here to help! What are you looking for today?",
        // Don't carry over old products - this was causing wrong products to show
        // Products should only be returned when Gemini calls search_products function
      };
      
    } catch (error: any) {
      console.error("[Clerk] Chat error:", error);
      
      // Reset session on error
      this.isInitialized = false;
      
      // If it's a rate limit or API error, use fallback
      if (error.message?.includes("429") || error.message?.includes("quota")) {
        return {
          message: "I'm a bit busy right now! Let me show you some of our popular items while things calm down.",
          products: this.inventory.slice(0, 4),
        };
      }
      
      return this.fallbackResponse(userMessage);
    }
  }

  private async handleFunctionCalls(functionCalls: any[], textResponse: string, sessionId: string): Promise<ClerkResponse> {
    let products: Product[] = [];
    let action: ClerkAction | undefined;
    let message = textResponse || "";
    
    for (const call of functionCalls) {
      const { name, args } = call;
      
      switch (name) {
        case "search_products": {
          const searchResults = await this.executeSearch(args);
          products = searchResults;
          this.lastShownProducts = searchResults;
          
          if (args.category) {
            action = {
              type: "filter",
              payload: { filterType: "filter_by_category", value: args.category }
            };
          }
          break;
        }
        
        case "add_to_cart": {
          const cartResult = await this.executeAddToCart(args, sessionId);
          if (cartResult.success) {
            products = cartResult.product ? [cartResult.product] : [];
            action = {
              type: "add_to_cart",
              payload: {
                productId: args.product_id,
                size: args.size,
                quantity: args.quantity || 1
              }
            };
            if (cartResult.message) message = cartResult.message;
          } else {
            message = cartResult.message;
          }
          break;
        }
        
        case "apply_filter": {
          const filterResult = await this.executeFilter(args);
          products = filterResult.products;
          this.lastShownProducts = filterResult.products;
          action = filterResult.action;
          break;
        }
        
        case "generate_discount": {
          const discountResult = await this.executeDiscount(args, sessionId);
          message = discountResult.message;
          if (discountResult.couponCode) {
            action = {
              type: "filter",
              payload: {
                action: "apply_coupon",
                couponCode: discountResult.couponCode
              }
            };
          }
          break;
        }
        
        case "check_inventory": {
          const inventoryResult = await this.executeInventoryCheck(args);
          products = inventoryResult.products;
          if (!message) message = inventoryResult.message;
          break;
        }
      }
    }
    
    return { message, products: products.length > 0 ? products : undefined, action };
  }

  private async executeSearch(args: any): Promise<Product[]> {
    const { query, category, max_price, sort_by } = args;
    
    let results = [...this.inventory];
    
    // Filter by category
    if (category) {
      results = results.filter(p => p.category === category);
    }
    
    // Filter by price
    if (max_price) {
      results = results.filter(p => p.price <= max_price);
    }
    
    // Search by query (name, description, tags)
    if (query) {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);
      
      results = results.filter(p => {
        const searchText = `${p.name} ${p.description} ${p.category} ${(p.tags || []).join(" ")}`.toLowerCase();
        return queryWords.some((word: string) => searchText.includes(word)) || searchText.includes(queryLower);
      });
    }
    
    // Sort
    if (sort_by === "price_low") {
      results.sort((a, b) => a.price - b.price);
    } else if (sort_by === "price_high") {
      results.sort((a, b) => b.price - a.price);
    }
    
    return results.slice(0, 6);
  }

  private async executeAddToCart(args: any, sessionId: string): Promise<{success: boolean; message: string; product?: Product}> {
    const { product_id, product_name, size, quantity = 1 } = args;
    
    // Find the product
    const product = this.inventory.find(p => p.id === product_id) || 
                    this.inventory.find(p => p.name.toLowerCase() === product_name.toLowerCase()) ||
                    this.inventory.find(p => p.name.toLowerCase().includes(product_name.toLowerCase()));
    
    if (!product) {
      return { success: false, message: `I couldn't find "${product_name}" in our inventory. Let me show you what we have!` };
    }
    
    // Validate size
    const validSize = product.sizes.find(s => s.toLowerCase() === size.toLowerCase()) || 
                      product.sizes.find(s => s === size);
    
    if (!validSize) {
      return { 
        success: false, 
        message: `Hmm, size "${size}" isn't available for ${product.name}. We have: ${product.sizes.join(", ")}. Which one would you like?` 
      };
    }
    
    // Add to cart
    try {
      await addToCart(product.id, validSize, quantity);
    } catch (error) {
      console.warn("[Clerk] Cart add failed:", error);
    }
    
    return { 
      success: true, 
      message: `Perfect! I've added **${product.name}** (size ${validSize}) to your cart! 🛒 Ready to checkout, or would you like to keep browsing?`,
      product 
    };
  }

  private async executeFilter(args: any): Promise<{products: Product[]; action: ClerkAction}> {
    const { filter_type, category } = args;
    
    let products = [...this.inventory];
    let actionPayload: any = {};
    
    if (filter_type === "sort_price_low") {
      products.sort((a, b) => a.price - b.price);
      actionPayload = { filterType: "sort_by_price", value: "asc" };
    } else if (filter_type === "sort_price_high") {
      products.sort((a, b) => b.price - a.price);
      actionPayload = { filterType: "sort_by_price", value: "desc" };
    } else if (filter_type === "filter_category" && category) {
      products = products.filter(p => p.category === category);
      actionPayload = { filterType: "filter_by_category", value: category };
    }
    
    return {
      products: products.slice(0, 5),
      action: { type: "filter", payload: actionPayload }
    };
  }

  private async executeDiscount(args: any, sessionId: string): Promise<{message: string; couponCode?: string}> {
    const { reason, discount_percent } = args;
    
    // Validate discount
    const validDiscounts: Record<string, number> = {
      birthday: 15,
      wedding: 20,
      student: 10,
      first_purchase: 10,
      bulk_order: 12,
      valentines: 10,
      loyal_customer: 10,
    };
    
    const discount = validDiscounts[reason] || Math.min(discount_percent, 15);
    
    // Generate coupon code
    const prefixes: Record<string, string> = {
      birthday: "BDAY",
      wedding: "WEDDING",
      student: "STUDENT",
      first_purchase: "WELCOME",
      bulk_order: "BULK",
      valentines: "LOVE",
      loyal_customer: "LOYAL",
    };
    
    const prefix = prefixes[reason] || "SPECIAL";
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const couponCode = `${prefix}-${discount}${suffix}`;
    
    // Save coupon
    try {
      if (supabase) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);
        
        await supabase.from("coupons").insert({
          code: couponCode,
          discount_type: "percentage",
          discount_value: discount,
          valid_from: new Date().toISOString(),
          valid_until: validUntil.toISOString(),
          usage_limit: 1,
          used_count: 0,
          created_by_agent: true,
          reason: reason,
        });
      }
    } catch (error) {
      console.warn("[Clerk] Failed to save coupon to DB:", error);
    }
    
    // Also save locally
    try {
      const storedCoupons = JSON.parse(localStorage.getItem("clerk_coupons") || "{}");
      storedCoupons[couponCode] = { discount_type: "percentage", discount_value: discount };
      localStorage.setItem("clerk_coupons", JSON.stringify(storedCoupons));
    } catch (e) {
      // Ignore localStorage errors
    }
    
    const messages: Record<string, string> = {
      birthday: `Happy Birthday! 🎂 Here's a special ${discount}% discount just for you!`,
      wedding: `Congratulations on your wedding! 💍 Here's ${discount}% off to celebrate!`,
      student: `Student discount activated! 📚 Here's ${discount}% off for you.`,
      first_purchase: `Welcome to TrendZone! 🎉 Here's ${discount}% off your first order!`,
      bulk_order: `Thanks for the bulk order! Here's ${discount}% off for buying multiple items.`,
      valentines: `Spreading the love! 💝 Here's ${discount}% off for Valentine's!`,
      loyal_customer: `Thanks for being a loyal customer! 🌟 Here's ${discount}% off!`,
    };
    
    return {
      message: `${messages[reason] || `Here's a special ${discount}% discount for you!`}\n\nYour code: **${couponCode}**\n\nUse it at checkout!`,
      couponCode,
    };
  }

  private async executeInventoryCheck(args: any): Promise<{products: Product[]; message: string}> {
    const { product_name, size } = args;
    
    // Find matching products
    const matches = this.inventory.filter(p => 
      p.name.toLowerCase().includes(product_name.toLowerCase())
    );
    
    if (matches.length === 0) {
      return {
        products: [],
        message: `I don't see "${product_name}" in our current inventory. Would you like me to show you similar items?`
      };
    }
    
    const product = matches[0];
    const availability = product.stock > 0 ? "in stock" : "currently out of stock";
    let message = `**${product.name}** is ${availability}!`;
    
    if (size && product.sizes.map(s => s.toLowerCase()).includes(size.toLowerCase())) {
      message += ` Size ${size} is available.`;
    } else if (size) {
      message += ` We don't have size ${size}, but we do have: ${product.sizes.join(", ")}`;
    } else {
      message += ` Available sizes: ${product.sizes.join(", ")}`;
    }
    
    return { products: matches.slice(0, 3), message };
  }

  private fallbackResponse(userMessage: string): ClerkResponse {
    const lower = userMessage.toLowerCase();
    
    // Simple keyword matching as fallback when API is unavailable
    if (lower.includes("shoe") || lower.includes("sneaker") || lower.includes("boot") || lower.includes("loafer")) {
      const shoes = this.inventory.filter(p => p.category === "Shoes").slice(0, 4);
      return {
        message: "Let me show you our shoe collection! We've got some great options - from casual sneakers to classic boots. Take a look!",
        products: shoes.length > 0 ? shoes : undefined,
        action: { type: "filter", payload: { filterType: "filter_by_category", value: "Shoes" } }
      };
    }
    
    if (lower.includes("clothes") || lower.includes("clothing") || lower.includes("blazer") || lower.includes("jacket") || lower.includes("sweater")) {
      const clothes = this.inventory.filter(p => p.category === "Clothes").slice(0, 4);
      return {
        message: "Here's our clothing collection! We've got everything from cozy sweaters to sharp blazers.",
        products: clothes.length > 0 ? clothes : undefined,
        action: { type: "filter", payload: { filterType: "filter_by_category", value: "Clothes" } }
      };
    }
    
    if (lower.includes("bag") || lower.includes("tote") || lower.includes("backpack")) {
      const bags = this.inventory.filter(p => p.category === "Bags").slice(0, 4);
      return {
        message: "Check out our bag collection! Perfect for work, travel, or everyday use.",
        products: bags.length > 0 ? bags : undefined,
        action: { type: "filter", payload: { filterType: "filter_by_category", value: "Bags" } }
      };
    }
    
    if (lower.includes("cheap") || lower.includes("affordable") || lower.includes("budget") || lower.includes("low price")) {
      const sorted = [...this.inventory].sort((a, b) => a.price - b.price).slice(0, 5);
      return {
        message: "Looking for something budget-friendly? Here are our most affordable options - great quality without breaking the bank!",
        products: sorted,
        action: { type: "filter", payload: { filterType: "sort_by_price", value: "asc" } }
      };
    }
    
    if (lower.includes("expensive") || lower.includes("premium") || lower.includes("luxury") || lower.includes("high end")) {
      const sorted = [...this.inventory].sort((a, b) => b.price - a.price).slice(0, 5);
      return {
        message: "Looking for something special? Here are our premium picks - top quality pieces that make a statement!",
        products: sorted,
        action: { type: "filter", payload: { filterType: "sort_by_price", value: "desc" } }
      };
    }
    
    if (lower.includes("birthday")) {
      return this.executeDiscount({ reason: "birthday", discount_percent: 15 }, "fallback").then(result => ({
        message: result.message,
        action: result.couponCode ? { type: "filter", payload: { action: "apply_coupon", couponCode: result.couponCode } } : undefined
      })) as any; // Will be resolved
    }
    
    if (lower.includes("wedding")) {
      return {
        message: "Congratulations on the wedding! 💍 I'd love to help you find the perfect outfit AND get you a special discount! Just let me know what you're looking for.",
      };
    }
    
    if (lower.includes("discount") || lower.includes("deal") || lower.includes("coupon")) {
      return {
        message: "I'd love to help with a discount! We offer special codes for:\n\n• 🎂 Birthdays - 15% off\n• 💍 Weddings - 20% off\n• 📚 Students - 10% off\n• 🆕 First order - 10% off\n\nJust let me know your occasion!",
      };
    }
    
    if (lower.includes("cart") || lower.includes("checkout")) {
      return {
        message: "You can check your cart by clicking the cart icon in the top right! Ready to checkout? Everything's waiting for you there. 🛒",
      };
    }
    
    if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
      return {
        message: "Hey there! Welcome to TrendZone! 👋 I'm The Clerk, your personal shopping buddy. Looking for anything specific today? Shoes, clothes, bags - or maybe you want me to surprise you with some recommendations?",
        products: this.inventory.slice(0, 4),
      };
    }
    
    if (lower.includes("thank") || lower.includes("bye") || lower.includes("goodbye")) {
      return {
        message: "You're welcome! It was great helping you today. Come back anytime - I'll be here! Happy shopping! 🛍️",
      };
    }
    
    // Default: show popular items
    return {
      message: "Hey! I'm here to help you find the perfect stuff. Here are some of our popular items - or just tell me what you're looking for! I can help with shoes, clothes, bags, accessories... and I might even have some discounts for you! 😉",
      products: this.inventory.slice(0, 4),
    };
  }

  clearHistory() {
    this.lastShownProducts = [];
    this.isInitialized = false;
    if (this.genAI) {
      this.ensureInitialized(); // Reinitialize with fresh chat
    }
  }

  getContext() {
    return {
      inventoryCount: this.inventory.length,
      lastShownProductCount: this.lastShownProducts.length,
      hasModel: !!this.model,
      isInitialized: this.isInitialized,
    };
  }
}
