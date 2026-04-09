import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  CheckCircle,
  Shield,
  HeartPulse,
  Cpu,
  Globe,
  Send,
} from "lucide-react";
import { COMPANY, STATS, CLIENTS } from "../lib/constants";
import { api } from "../lib/api";

const BADGES = [
  "Hard-to-find parts",
  "Military grade",
  "Medical components",
  "Same-day response",
];

export default function Home() {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");

  const handleHeroSearch = (e: FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-30" />
        <div className="relative max-w-5xl mx-auto text-center px-4 py-24 md:py-36">
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            Discover a Faster Way to{" "}
            <span className="text-green-accent">
              Source Electronic Components
            </span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl max-w-3xl mx-auto mb-10">
            At {COMPANY.name}, we&apos;re your dedicated partners in sourcing
            electronic components. Whether you&apos;re a tech giant, a medical
            innovator, or a security solutions provider — we&apos;ve got you
            covered.
          </p>

          <form
            onSubmit={handleHeroSearch}
            className="flex max-w-2xl mx-auto gap-3"
          >
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search by Part Number or Manufacturer..."
                className="w-full pl-11 pr-4 py-3.5 rounded-lg bg-bg-card/80 backdrop-blur border border-border text-white placeholder:text-gray-500 focus:outline-none focus:border-green-accent"
              />
            </div>
            <button
              type="submit"
              className="bg-green-brand hover:bg-green-accent text-white px-6 py-3.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Search <span className="hidden sm:inline">&gt;</span>
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {BADGES.map((badge) => (
              <span
                key={badge}
                className="flex items-center gap-1.5 bg-bg-card/70 backdrop-blur border border-border px-4 py-2 rounded-full text-sm"
              >
                <CheckCircle size={14} className="text-green-accent" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-bg-secondary border-y border-border py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-4 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-black text-green-accent mb-1">
                {stat.value}
              </div>
              <div className="text-text-secondary text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-2">
            Who We Are
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Specialized in Finding Any Component — Including Hard-to-Find Parts
          </h2>
          <p className="text-text-secondary text-lg max-w-3xl">
            We specialize in finding any component you need — fast, ensuring you
            have what you need when you need it. With decades of experience
            serving defense, medical, and technology industries, we are a trusted
            partner worldwide.
          </p>
        </div>
      </section>

      {/* Industries */}
      <section className="bg-green-brand/10 py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-2">
            Industries We Serve
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Trusted Across Critical Sectors
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                Icon: Shield,
                title: "Defense & Military",
                desc: "MOD-certified supplier for defense-grade components",
              },
              {
                Icon: HeartPulse,
                title: "Medical",
                desc: "High-reliability parts for life-critical systems",
              },
              {
                Icon: Cpu,
                title: "Technology",
                desc: "Cutting-edge components for modern tech solutions",
              },
              {
                Icon: Globe,
                title: "Global Distribution",
                desc: "Worldwide shipping with full traceability",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-bg-card border border-border rounded-xl p-6 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-green-brand/20 rounded-full flex items-center justify-center">
                  <item.Icon size={24} className="text-green-accent" />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactSection />

      {/* Clients */}
      <section className="bg-white text-gray-900 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-green-brand text-sm font-semibold uppercase tracking-wider mb-2">
            Our Clients
          </p>
          <h2 className="text-3xl font-bold mb-10">
            Trusted by Industry Leaders
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-10 text-2xl font-bold text-gray-400">
            {CLIENTS.map((client) => (
              <span key={client}>{client}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-bg-primary py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Source Your Components?
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Browse our catalog of 18,000+ parts or contact our experts for a
            custom quote.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/catalog"
              className="bg-green-brand hover:bg-green-accent text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Search Catalog
            </Link>
            <Link
              to="/contact"
              className="border border-green-accent text-green-accent hover:bg-green-accent/10 px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactSection() {
  const [form, setForm] = useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post("/contact", form);
      setStatus("sent");
      setForm({ fullName: "", company: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-2 text-center">
          Get in Touch
        </p>
        <h2 className="text-3xl font-bold mb-2 text-center">
          Contact Our Experts
        </h2>
        <p className="text-text-secondary text-center mb-10">
          Have a sourcing challenge? Send us a message and we&apos;ll respond
          fast.
        </p>

        {status === "sent" ? (
          <div className="bg-green-brand/20 border border-green-accent rounded-lg p-8 text-center">
            <CheckCircle size={40} className="text-green-accent mx-auto mb-3" />
            <p className="text-lg font-semibold">Message sent!</p>
            <p className="text-text-secondary text-sm mt-1">
              We&apos;ll get back to you shortly.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white text-gray-900 rounded-xl p-8 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <Field
                label="Full Name"
                required
                value={form.fullName}
                onChange={(v) => setForm({ ...form, fullName: v })}
              />
              <Field
                label="Company"
                value={form.company}
                onChange={(v) => setForm({ ...form, company: v })}
              />
              <Field
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Tell us about your component needs..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-brand"
              />
            </div>
            {status === "error" && (
              <p className="text-red-500 text-sm">
                Failed to send. Please try again.
              </p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-green-brand hover:bg-green-accent text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <Send size={16} />
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-brand"
      />
    </div>
  );
}
