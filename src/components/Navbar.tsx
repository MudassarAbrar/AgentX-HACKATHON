import { useState } from "react";
import { Search, ShoppingBag, Menu, X } from "lucide-react";

const navLinks = ["Home", "New Arrival", "Shop", "Contact", "About Us"];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 lg:px-12 h-20">
        {/* Logo */}
        <a href="/" className="font-display text-2xl font-bold tracking-tight text-foreground">
          TrendZone
        </a>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link}>
              <a
                href="#"
                className="font-body text-sm font-medium text-foreground/80 hover:text-foreground transition-opacity duration-200"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button aria-label="Search" className="p-2 hover:opacity-60 transition-opacity">
            <Search className="w-5 h-5" />
          </button>
          <button aria-label="Cart" className="p-2 hover:opacity-60 transition-opacity relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
              2
            </span>
          </button>
          <button className="hidden md:inline-flex font-display text-sm font-medium border-2 border-foreground rounded-full px-6 py-2 hover:bg-foreground hover:text-primary-foreground transition-colors duration-300">
            Sign In
          </button>
          <button
            aria-label="Menu"
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border px-6 pb-8 pt-4">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link}>
                <a href="#" className="font-display text-lg font-medium text-foreground">
                  {link}
                </a>
              </li>
            ))}
            <li>
              <button className="mt-2 font-display text-sm font-medium border-2 border-foreground rounded-full px-6 py-2.5 w-full">
                Sign In
              </button>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
