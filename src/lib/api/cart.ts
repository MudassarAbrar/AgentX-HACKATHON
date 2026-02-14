import { supabase } from "@/lib/supabase";
import type { Product } from "./products";

export interface CartItem {
  id: string;
  session_id: string;
  user_id?: string;
  product_id: string;
  size: string;
  quantity: number;
  product?: Product;
  created_at?: string;
  updated_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  used_count: number;
  created_by_agent: boolean;
  reason?: string;
}

/**
 * Get or create a session ID for guest carts
 */
function getSessionId(): string {
  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
}

/**
 * Get cart items for current session
 */
export async function getCart(): Promise<CartItem[]> {
  if (!supabase) {
    console.warn("[Cart API] Supabase client not initialized");
    return [];
  }

  const sessionId = getSessionId();

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      *,
      product:products(*)
    `
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Cart API] Error fetching cart:", error);
    return [];
  }

  return (data || []).map((item) => ({
    ...item,
    product: item.product as Product,
  }));
}

/**
 * Add item to cart
 */
export async function addToCart(
  productId: string,
  size: string,
  quantity: number = 1
): Promise<CartItem | null> {
  if (!supabase) {
    console.warn("[Cart API] Supabase client not initialized");
    return null;
  }

  const sessionId = getSessionId();

  // Check if item already exists
  const { data: existing } = await supabase
    .from("cart_items")
    .select("*")
    .eq("session_id", sessionId)
    .eq("product_id", productId)
    .eq("size", size)
    .single();

  if (existing) {
    // Update quantity
    return updateCartItem(existing.id, existing.quantity + quantity);
  }

  // Create new cart item
  const { data, error } = await supabase
    .from("cart_items")
    .insert({
      session_id: sessionId,
      product_id: productId,
      size,
      quantity,
    })
    .select()
    .single();

  if (error) {
    console.error("[Cart API] Error adding to cart:", error);
    return null;
  }

  return data;
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<CartItem | null> {
  if (!supabase) {
    console.warn("[Cart API] Supabase client not initialized");
    return null;
  }

  if (quantity <= 0) {
    return removeCartItem(itemId);
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .select()
    .single();

  if (error) {
    console.error("[Cart API] Error updating cart item:", error);
    return null;
  }

  return data;
}

/**
 * Remove item from cart
 */
export async function removeCartItem(itemId: string): Promise<boolean> {
  if (!supabase) {
    console.warn("[Cart API] Supabase client not initialized");
    return false;
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("[Cart API] Error removing cart item:", error);
    return false;
  }

  return true;
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<boolean> {
  if (!supabase) {
    console.warn("[Cart API] Supabase client not initialized");
    return false;
  }

  const sessionId = getSessionId();

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    console.error("[Cart API] Error clearing cart:", error);
    return false;
  }

  return true;
}

/**
 * Validate and get coupon details
 */
export async function validateCoupon(code: string): Promise<Coupon | null> {
  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (!error && data) {
        const now = new Date();
        const validFrom = new Date(data.valid_from);
        const validUntil = new Date(data.valid_until);

        // Check if coupon is valid
        if (now >= validFrom && now <= validUntil) {
          // Check usage limit
          if (!data.usage_limit || data.used_count < data.usage_limit) {
            return data;
          }
        }
      }
    } catch (error) {
      console.warn("[Cart API] Supabase coupon check failed, trying local:", error);
    }
  }

  // Fallback: Check local coupons (from haggle mode)
  try {
    const { getLocalCoupon } = await import("../ai/haggle");
    const localCoupon = getLocalCoupon(code);
    if (localCoupon) {
      // Create a mock coupon object
      return {
        id: `local-${code}`,
        code: code.toUpperCase(),
        discount_type: localCoupon.discount_type,
        discount_value: localCoupon.discount_value,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        used_count: 0,
        created_by_agent: true,
      };
    }
  } catch (error) {
    console.warn("[Cart API] Local coupon check failed:", error);
  }

  return null;
}

/**
 * Apply coupon to cart
 */
export async function applyCoupon(
  code: string,
  cartTotal: number
): Promise<{ coupon: Coupon | null; discount: number; error?: string }> {
  const coupon = await validateCoupon(code);

  if (!coupon) {
    return {
      coupon: null,
      discount: 0,
      error: "Invalid or expired coupon code",
    };
  }

  // Check minimum purchase
  if (coupon.min_purchase && cartTotal < coupon.min_purchase) {
    return {
      coupon: null,
      discount: 0,
      error: `Minimum purchase of $${coupon.min_purchase} required`,
    };
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discount_type === "percentage") {
    discount = (cartTotal * coupon.discount_value) / 100;
    if (coupon.max_discount) {
      discount = Math.min(discount, coupon.max_discount);
    }
  } else {
    discount = coupon.discount_value;
  }

  return { coupon, discount };
}

/**
 * Calculate cart total
 */
export async function getCartTotal(couponCode?: string): Promise<{
  subtotal: number;
  discount: number;
  total: number;
  coupon?: Coupon;
}> {
  const cartItems = await getCart();
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  let discount = 0;
  let coupon: Coupon | undefined;

  if (couponCode) {
    const result = await applyCoupon(couponCode, subtotal);
    discount = result.discount;
    coupon = result.coupon || undefined;
  }

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    coupon,
  };
}
