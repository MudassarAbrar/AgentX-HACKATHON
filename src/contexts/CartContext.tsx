import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart as clearCartAPI, getCartTotal } from "@/lib/api/cart";
import type { CartItem as SupabaseCartItem } from "@/lib/api/cart";

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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState<string>();
  const [discount, setDiscount] = useState(0);

  // Load cart from Supabase on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Update totals when items or coupon changes
  useEffect(() => {
    updateTotals();
  }, [items, couponCode]);

  const loadCart = async () => {
    setLoading(true);
    try {
      const supabaseItems = await getCart();
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
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTotals = async () => {
    if (items.length === 0) {
      setDiscount(0);
      return;
    }
    try {
      const totals = await getCartTotal(couponCode);
      setDiscount(totals.discount);
    } catch (error) {
      console.error("Error calculating totals:", error);
    }
  };

  const addItem = async (item: CartItem) => {
    try {
      const productId = item.productId || String(item.id);
      await addToCart(productId, item.size, item.quantity);
      await loadCart();
    } catch (error) {
      console.error("Error adding item to cart:", error);
      throw error;
    }
  };

  const removeItem = async (id: number | string, size: string) => {
    try {
      await removeCartItem(String(id));
      await loadCart();
    } catch (error) {
      console.error("Error removing item from cart:", error);
      throw error;
    }
  };

  const updateQuantity = async (id: number | string, size: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(id, size);
      return;
    }
    try {
      await updateCartItem(String(id), quantity);
      await loadCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await clearCartAPI();
      setItems([]);
      setCouponCode(undefined);
      setDiscount(0);
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const totals = await getCartTotal(code);
      if (totals.coupon) {
        setCouponCode(code.toUpperCase());
        setDiscount(totals.discount);
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
