import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Trash2, Send, CheckCircle, Package } from "lucide-react";
import { useQuote } from "../context/QuoteContext";
import { api } from "../lib/api";

export default function Quote() {
  const { items, removeItem, updateQuantity, clearItems, itemCount } =
    useQuote();

  const [customer, setCustomer] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCompany: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.post("/quotes", {
        items: items.map((i) => ({
          partNumber: i.partNumber,
          manufacturer: i.manufacturer,
          quantity: i.quantity,
          ourReference: i.ourReference,
        })),
        ...customer,
      });
      setStatus("sent");
      clearItems();
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <section className="max-w-2xl mx-auto px-4 py-32 text-center">
        <CheckCircle size={56} className="text-green-accent mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Quote Submitted!</h2>
        <p className="text-text-secondary mb-6">
          We&apos;ve received your quote request and will get back to you
          shortly.
        </p>
        <Link
          to="/catalog"
          className="bg-green-brand hover:bg-green-accent text-white px-8 py-3 rounded-lg font-medium transition-colors inline-block"
        >
          Continue Browsing
        </Link>
      </section>
    );
  }

  if (itemCount === 0) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="w-20 h-20 mx-auto bg-bg-card rounded-full flex items-center justify-center mb-6">
          <ShoppingCart size={32} className="text-text-secondary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your quote is empty</h2>
        <p className="text-text-secondary mb-6">
          Browse our catalog and add components to build your quote.
        </p>
        <Link
          to="/catalog"
          className="bg-green-brand hover:bg-green-accent text-white px-8 py-3 rounded-lg font-medium transition-colors inline-block"
        >
          Browse Catalog
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">My Quote</h1>
      <p className="text-text-secondary mb-8">
        {itemCount} {itemCount === 1 ? "item" : "items"} in your quote
      </p>

      {/* Items List */}
      <div className="space-y-3 mb-10">
        {items.map((item) => (
          <div
            key={item.productId}
            className="bg-bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm">{item.partNumber}</h3>
              <p className="text-green-accent text-xs">{item.manufacturer}</p>
              {item.ourReference && (
                <p className="text-text-secondary text-xs">
                  Ref: {item.ourReference}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-text-secondary" />
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQuantity(
                      item.productId,
                      Math.max(1, parseInt(e.target.value, 10) || 1),
                    )
                  }
                  className="w-24 bg-bg-primary border border-border rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-accent"
                />
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-text-secondary hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="text-xl font-bold">Your Details</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            label="Name"
            required
            value={customer.customerName}
            onChange={(v) => setCustomer({ ...customer, customerName: v })}
          />
          <Field
            label="Company"
            value={customer.customerCompany}
            onChange={(v) => setCustomer({ ...customer, customerCompany: v })}
          />
          <Field
            label="Email"
            type="email"
            required
            value={customer.customerEmail}
            onChange={(v) => setCustomer({ ...customer, customerEmail: v })}
          />
          <Field
            label="Phone"
            value={customer.customerPhone}
            onChange={(v) => setCustomer({ ...customer, customerPhone: v })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Additional Notes
          </label>
          <textarea
            rows={3}
            value={customer.message}
            onChange={(e) =>
              setCustomer({ ...customer, message: e.target.value })
            }
            className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-accent"
          />
        </div>

        {status === "error" && (
          <p className="text-red-500 text-sm">
            Failed to submit. Please try again.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full bg-green-brand hover:bg-green-accent text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          <Send size={16} />
          {status === "sending" ? "Submitting..." : "Submit Quote Request"}
        </button>
      </form>
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
        className="w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-accent"
      />
    </div>
  );
}
