export const COMPANY = {
  name: "Timeless Electronix",
  phone: "+972-52-5174442",
  fax: "+972-72-2835393",
  email: "sales@timeless-electronix.com",
  whatsapp: "+972-52-5174442",
  modId: "11006221",
  tagline:
    "Your trusted global partner for electronic component sourcing. Fast, reliable, specialized.",
} as const;

export const STATS = [
  { value: "18,000+", label: "Components in Stock" },
  { value: "500+", label: "Manufacturers" },
  { value: "30+", label: "Years Experience" },
  { value: "100%", label: "Quality Assured" },
] as const;

export const INDUSTRIES = [
  {
    title: "Defense & Military",
    description: "MOD-certified supplier for defense-grade components",
    icon: "Shield",
  },
  {
    title: "Medical",
    description: "High-reliability parts for life-critical systems",
    icon: "HeartPulse",
  },
  {
    title: "Technology",
    description: "Cutting-edge components for modern tech solutions",
    icon: "Cpu",
  },
  {
    title: "Global Distribution",
    description: "Worldwide shipping with full traceability",
    icon: "Globe",
  },
] as const;

export const CLIENTS = ["MAGAL", "one", "IDF", "MOD", "TADIRAN"] as const;
