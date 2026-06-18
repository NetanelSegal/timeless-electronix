import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useQuote } from "../context/QuoteContext";
import { NAV_LINKS } from "../lib/constants";
import FullLogo from "./FullLogo";

const HEADER_LINKS = NAV_LINKS.filter((l) => l.to !== "/quote");

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useQuote();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 py-3 min-w-0">
        <FullLogo linkToHome className="h-8 w-auto sm:h-10" />

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

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/quote"
            className="flex items-center gap-2 bg-green-brand hover:bg-green-accent transition-colors text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium"
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">My Quote</span>
            <span className="sr-only sm:hidden">My Quote</span>
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
