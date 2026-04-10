import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useQuote } from "../context/QuoteContext";
import { NAV_LINKS } from "../lib/constants";

const HEADER_LINKS = NAV_LINKS.filter((l) => l.to !== "/quote");

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useQuote();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-brand font-extrabold text-xs leading-tight text-center">
              TE
            </span>
          </div>
          <span className="text-lg font-bold hidden sm:block">
            TIMELESS
            <br />
            <span className="text-sm font-normal">Electronix</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm hover:text-green-accent transition-colors ${
                location.pathname === link.to
                  ? "text-green-accent font-semibold"
                  : "text-text-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/quote"
            className="flex items-center gap-2 bg-green-brand hover:bg-green-accent transition-colors text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <ShoppingCart size={16} />
            My Quote
            {itemCount > 0 && (
              <span className="bg-white text-green-brand rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-text-secondary hover:text-white"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-border px-4 py-4 space-y-3 bg-bg-primary">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm py-1 ${
                location.pathname === link.to
                  ? "text-green-accent font-semibold"
                  : "text-text-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
