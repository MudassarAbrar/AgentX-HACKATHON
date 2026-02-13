import { useState, useRef, useEffect } from "react";
import { ClerkAgent, type ClerkResponse } from "@/lib/ai/clerk-agent";
import { useFilter } from "@/contexts/FilterContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "@/lib/api/products";

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  action?: any;
  timestamp: Date;
}

const ClerkChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm The Clerk, your AI personal shopper. How can I help you find the perfect fashion items today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<ClerkAgent | null>(null);
  const { applyFilter } = useFilter();
  const { addItem } = useCart();

  // Initialize agent
  useEffect(() => {
    agentRef.current = new ClerkAgent();
  }, []);

  // Get session ID
  const getSessionId = () => {
    let sessionId = localStorage.getItem("cart_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem("cart_session_id", sessionId);
    }
    return sessionId;
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !agentRef.current) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const sessionId = getSessionId();
      const response = await agentRef.current.chat(userMessage, sessionId);

      // Add assistant response
      const assistantMsg: Message = {
        role: "assistant",
        content: response.message,
        products: response.products,
        action: response.action,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Handle actions
      if (response.action) {
        handleAction(response.action);
      }
    } catch (error) {
      console.error("Error chatting with Clerk:", error);
      const errorMsg: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Could you please try again?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (action: any) => {
    if (action.type === "filter" && action.payload) {
      const { filterType, value } = action.payload;
      applyFilter(filterType, value);
    } else if (action.type === "add_to_cart" && action.payload) {
      const { productId, size, quantity } = action.payload;
      // The cart context will handle this
    } else if (action.payload?.action === "apply_coupon") {
      // Coupon will be handled by the cart context
    }
  };

  const handleProductAddToCart = async (product: Product, size: string) => {
    try {
      await addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        size,
        quantity: 1,
      });

      const successMsg: Message = {
        role: "assistant",
        content: `Great! I've added ${product.name} (size: ${size}) to your cart.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMsg]);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-foreground text-primary-foreground shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Open Clerk chat"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col bg-background border border-border rounded-2xl shadow-2xl transition-all duration-300 ${
        isMinimized ? "h-16 w-80" : "h-[600px] w-96"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">The Clerk</h3>
            <p className="text-xs text-muted-foreground">AI Personal Shopper</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-foreground text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Product Cards */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.products.map((product) => (
                          <Card
                            key={product.id}
                            className="p-3 bg-background border border-border"
                          >
                            <div className="flex gap-3">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <Link
                                  to={`/product/${product.id}`}
                                  className="font-display font-medium text-sm hover:text-accent transition-colors block"
                                >
                                  {product.name}
                                </Link>
                                <p className="font-display font-bold text-sm mt-1">
                                  ${product.price}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Link
                                    to={`/product/${product.id}`}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    View →
                                  </Link>
                                  {product.sizes && product.sizes.length > 0 && (
                                    <button
                                      onClick={() =>
                                        handleProductAddToCart(
                                          product,
                                          product.sizes[0]
                                        )
                                      }
                                      className="text-xs text-accent hover:underline"
                                    >
                                      Add to Cart
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about products..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClerkChat;
