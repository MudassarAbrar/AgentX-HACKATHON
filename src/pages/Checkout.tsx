import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    clearCart();
    toast.success("Order placed successfully!");
  };

  if (items.length === 0 && !submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center px-4">
          <h1 className="font-display text-2xl text-foreground mb-4">Nothing to checkout</h1>
          <Link to="/shop" className="font-body text-accent">Go to shop</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-tz-green/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-tz-emerald" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3">Order Confirmed!</h1>
          <p className="font-body text-muted-foreground max-w-md mx-auto mb-8">
            Thank you for your purchase. You'll receive a confirmation email shortly.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-foreground text-primary-foreground font-display font-semibold rounded-full px-8 py-3 text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
        <Link to="/cart" className="flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to cart
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="font-display font-bold text-foreground text-2xl mb-2">Checkout</h1>

            <div>
              <label className="font-display text-sm font-medium text-foreground block mb-2">Email</label>
              <input required type="email" placeholder="you@example.com" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-display text-sm font-medium text-foreground block mb-2">First name</label>
                <input required placeholder="John" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
              </div>
              <div>
                <label className="font-display text-sm font-medium text-foreground block mb-2">Last name</label>
                <input required placeholder="Doe" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
              </div>
            </div>

            <div>
              <label className="font-display text-sm font-medium text-foreground block mb-2">Address</label>
              <input required placeholder="123 Main St" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="font-display text-sm font-medium text-foreground block mb-2">City</label>
                <input required placeholder="New York" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
              </div>
              <div>
                <label className="font-display text-sm font-medium text-foreground block mb-2">State</label>
                <input required placeholder="NY" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
              </div>
              <div>
                <label className="font-display text-sm font-medium text-foreground block mb-2">ZIP</label>
                <input required placeholder="10001" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="font-display font-bold text-foreground text-lg mb-4">Payment</h2>
              <div>
                <label className="font-display text-sm font-medium text-foreground block mb-2">Card number</label>
                <input required placeholder="4242 4242 4242 4242" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="font-display text-sm font-medium text-foreground block mb-2">Expiry</label>
                  <input required placeholder="MM/YY" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
                </div>
                <div>
                  <label className="font-display text-sm font-medium text-foreground block mb-2">CVC</label>
                  <input required placeholder="123" className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-foreground text-primary-foreground font-display font-semibold rounded-full py-4 text-sm hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Pay ${total.toFixed(2)}
            </button>
          </form>

          {/* Summary */}
          <div>
            <div className="rounded-2xl border border-border bg-card p-6 sticky top-28">
              <h3 className="font-display font-bold text-foreground text-lg mb-6">Your Order</h3>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4">
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-sm font-medium text-foreground">{item.name}</p>
                      <p className="font-body text-xs text-muted-foreground mt-0.5">Size: {item.size} · Qty: {item.quantity}</p>
                    </div>
                    <p className="font-display font-bold text-foreground text-sm">${item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2 font-body text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>Free</span></div>
                <div className="border-t border-border pt-3 flex justify-between font-display font-bold text-foreground text-base">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
