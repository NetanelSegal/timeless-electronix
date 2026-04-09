import { Link } from "react-router-dom";
import { Phone, Mail, Printer, MessageCircle, Shield } from "lucide-react";
import { COMPANY } from "../lib/constants";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Product Catalog" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
  { to: "/quote", label: "My Quote" },
];

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-brand font-extrabold text-xs text-center">
                  TE
                </span>
              </div>
              <span className="text-lg font-bold">
                TIMELESS
                <br />
                <span className="text-sm font-normal">Electronix</span>
              </span>
            </div>
            <p className="text-text-secondary text-sm mb-3">
              {COMPANY.tagline}
            </p>
            <span className="inline-flex items-center gap-2 border border-green-brand text-green-accent text-xs px-3 py-1 rounded-full">
              <Shield size={12} />
              MOD Supplier ID: {COMPANY.modId}
            </span>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-text-secondary hover:text-green-accent text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-text-secondary">
                <Phone size={14} className="text-green-accent" />
                <a href={`tel:${COMPANY.phone}`} className="hover:text-white">
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle size={14} className="text-green-accent" />
                <a
                  href={`https://wa.me/${COMPANY.whatsapp.replace(/[^0-9]/g, "")}`}
                  className="text-green-accent hover:text-green-light"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp: {COMPANY.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <Printer size={14} className="text-green-accent" />
                {COMPANY.fax} (Fax)
              </li>
              <li className="flex items-center gap-2 text-text-secondary">
                <Mail size={14} className="text-green-accent" />
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="hover:text-white"
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-text-secondary gap-2">
          <span>&copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</span>
          <span>MOD Supplier &middot; Global Electronic Components Distributor</span>
        </div>
      </div>
    </footer>
  );
}
