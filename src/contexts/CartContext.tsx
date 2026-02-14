import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getCart, addToCart as addToCartAPI, updateCartItem as updateCartItemAPI, removeCartItem as removeCartItemAPI, clearCart as clearCartAPI, getCartTotal, validateCoupon } from "@/lib/api/cart";
import type { CartItem as SupabaseCartItem, Coupon } from "@/lib/api/cart";

const LOCAL_CART_KEY = "trendzone_cart";

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
  productId?: string; // For Supabase integration
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: number | string, size: string) => Promise<void>;
  updateQuantity: (id: number | string, size: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  count: number;
  loading: boolean;
  couponCode?: string;
  discount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

// Helper to load local cart
function loadLocalCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(LOCAL_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to save local cart
function saveLocalCart(items: CartItem[]) {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to save cart to localStorage");
  }
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState<string>();
  const [discount, setDiscount] = useState(0);
  const [useLocalCart, setUseLocalCart] = useState(false);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save to localStorage whenever items change (if using local cart)
  useEffect(() => {
    if (useLocalCart && items.length > 0) {
      saveLocalCart(items);
    }
  }, [items, useLocalCart]);

  // Update totals when items or coupon changes
  useEffect(() => {
    updateTotals();
  }, [items, couponCode]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const supabaseItems = await getCart();
      if (supabaseItems.length > 0) {
        const formattedItems: CartItem[] = supabaseItems.map((item) => ({
          id: item.id,
          productId: item.product_id,
          name: item.product?.name || "Unknown Product",
          price: item.product?.price || 0,
          image: item.product?.image_url || "",
          size: item.size,
          quantity: item.quantity,
        }));
        setItems(formattedItems);
        setUseLocalCart(false);
      } else {
        // Try loading from localStorage
        const localItems = loadLocalCart();
        if (localItems.length > 0) {
          setItems(localItems);
        }
        setUseLocalCart(true);
      }
    } catch (error) {
      console.warn("Supabase cart unavailable, using local storage:", error);
      const localItems = loadLocalCart();
      setItems(localItems);
      setUseLocalCart(true);
    } finally {
      setLoading(false);
    }
  };

  const updateTotals = async () => {
    if (items.length === 0) {
      setDiscount(0);
      return;
    }
    
    if (couponCode) {
      try {
        // Try to validate and calculate discount
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const coupon = await validateCoupon(couponCode);
        
        if (coupon) {
          let calcDiscount = 0;
          if (coupon.discount_type === "percentage") {
            calcDiscount = (subtotal * coupon.discount_value) / 100;
          } else {
            calcDiscount = coupon.discount_value;
          }
          setDiscount(calcDiscount);
        } else {
          setDiscount(0);
          setCouponCode(undefined);
        }
      } catch (error) {
        console.error("Error calculating totals:", error);
      }
    }
  };

  const addItem = async (item: CartItem) => {
    // Always add to local state first (for responsiveness)
    setItems(prev => {
      const existing = prev.find(i => 
        (i.productId || i.id) === (item.productId || item.id) && i.size === item.size
      );
      
      if (existing) {
        return prev.map(i => 
          (i.productId || i.id) === (item.productId || item.id) && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      
      // Generate local ID for new items
      const newItem = {
        ...item,
        id: item.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      return [...prev, newItem];
    });
    
    // Also save to localStorage
    const updatedItems = [...items];
    const existing = updatedItems.find(i => 
      (i.productId || i.id) === (item.productId || item.id) && i.size === item.size
    );
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      updatedItems.push({
        ...item,
        id: item.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
    }
    saveLocalCart(updatedItems);

    // Try Supabase in background (non-blocking)
    try {
      const productId = item.productId || String(item.id);
      await addToCartAPI(productId, item.size, item.quantity);
    } catch (error) {
      console.warn("Supabase add to cart failed, using local cart:", error);
    }
  };

  const removeItem = async (id: number | string, size: string) => {
    setItems(prev => prev.filter(i => !(String(i.id) === String(id) && i.size === size)));
    saveLocalCart(items.filter(i => !(String(i.id) === String(id) && i.size === size)));
    
    try {
      await removeCartItemAPI(String(id));
    } catch (error) {
      console.warn("Supabase remove failed, using local cart:", error);
    }
  };

  const updateQuantity = async (id: number | string, size: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(id, size);
      return;
    }
    
    setItems(prev => prev.map(i => 
      String(i.id) === String(id) && i.size === size ? { ...i, quantity } : i
    ));
    saveLocalCart(items.map(i => 
      String(i.id) === String(id) && i.size === size ? { ...i, quantity } : i
    ));
    
    try {
      await updateCartItemAPI(String(id), quantity);
    } catch (error) {
      console.warn("Supabase update failed, using local cart:", error);
    }
  };

  const clearCart = async () => {
    setItems([]);
    setCouponCode(undefined);
    setDiscount(0);
    saveLocalCart([]);
    
    try {
      await clearCartAPI();
    } catch (error) {
      console.warn("Supabase clear failed:", error);
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const coupon = await validateCoupon(code);
      
      if (coupon) {
        setCouponCode(code.toUpperCase());
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        let calcDiscount = 0;
        if (coupon.discount_type === "percentage") {
          calcDiscount = (subtotal * coupon.discount_value) / 100;
        } else {
          calcDiscount = coupon.discount_value;
        }
        setDiscount(calcDiscount);
        return { success: true };
      } else {
        return { success: false, error: "Invalid or expired coupon code" };
      }
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to apply coupon" };
    }
  };

  const removeCoupon = () => {
    setCouponCode(undefined);
    setDiscount(0);
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0) - discount;
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total: Math.max(0, total),
        count,
        loading,
        couponCode,
        discount,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
