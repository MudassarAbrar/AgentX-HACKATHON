import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";

const SignIn = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-12 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-display font-bold text-foreground text-3xl mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="font-body text-muted-foreground text-sm">
              {isSignUp ? "Join TrendZone and discover bold fashion." : "Sign in to your TrendZone account."}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="font-display text-sm font-medium text-foreground block mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            )}

            <div>
              <label className="font-display text-sm font-medium text-foreground block mb-2">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>

            <div>
              <label className="font-display text-sm font-medium text-foreground block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-12 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="text-right">
                <a href="#" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-foreground text-primary-foreground font-display font-semibold rounded-full py-4 text-sm hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300"
            >
              {isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="font-body text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-display font-medium text-foreground hover:text-accent transition-colors"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-4 font-body text-muted-foreground">or continue with</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button className="border-2 border-border rounded-full py-3 font-display text-sm font-medium text-foreground hover:border-foreground transition-colors">
                Google
              </button>
              <button className="border-2 border-border rounded-full py-3 font-display text-sm font-medium text-foreground hover:border-foreground transition-colors">
                Apple
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
