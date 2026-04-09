import { useState, type FormEvent } from "react";
import { Phone, Printer, Mail, Send, CheckCircle } from "lucide-react";
import { COMPANY } from "../lib/constants";
import { api } from "../lib/api";

export default function Contact() {
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
    <>
      {/* Hero */}
      <section className="bg-bg-secondary py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-3">
            Get in Touch
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-text-secondary text-lg">
            Have a sourcing challenge? Need a quote? Our experts are ready to
            help.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12">
        {/* Business Info */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Business Information</h2>
          <div className="space-y-6">
            <InfoRow
              icon={<Phone size={18} className="text-green-accent" />}
              label="Phone"
            >
              <a
                href={`tel:${COMPANY.phone}`}
                className="text-white hover:text-green-accent"
              >
                {COMPANY.phone}
              </a>
            </InfoRow>
            <InfoRow
              icon={<Printer size={18} className="text-green-accent" />}
              label="Fax"
            >
              <span>{COMPANY.fax}</span>
            </InfoRow>
            <InfoRow
              icon={<Mail size={18} className="text-green-accent" />}
              label="Email"
            >
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-white hover:text-green-accent"
              >
                {COMPANY.email}
              </a>
            </InfoRow>
          </div>
        </div>

        {/* Form */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Send Us a Message</h2>
          {status === "sent" ? (
            <div className="bg-green-brand/20 border border-green-accent rounded-lg p-8 text-center">
              <CheckCircle
                size={40}
                className="text-green-accent mx-auto mb-3"
              />
              <p className="font-semibold">Message sent!</p>
              <p className="text-text-secondary text-sm mt-1">
                We&apos;ll get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  rows={5}
                  placeholder="Tell us about your component needs..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-accent"
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
    </>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-text-secondary text-sm">{label}</p>
        <div className="text-lg font-medium">{children}</div>
      </div>
    </div>
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
        className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-accent"
      />
    </div>
  );
}
