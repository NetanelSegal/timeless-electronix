import { useState, type FormEvent } from "react";
import { Send, CheckCircle } from "lucide-react";
import { api } from "../lib/api";
import { TextField } from "./TextField";
import { useSubmitPhase } from "../hooks/useSubmitPhase";

interface ContactFormProps {
  variant?: "light" | "dark";
}

export default function ContactForm({ variant = "dark" }: ContactFormProps) {
  const [form, setForm] = useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });
  const { status, run } = useSubmitPhase();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await run(async () => {
      await api.post("/contact", form);
      setForm({ fullName: "", company: "", email: "", phone: "", message: "" });
    });
  };

  const isLight = variant === "light";

  const inputClass = isLight
    ? "w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-brand"
    : "w-full bg-bg-card border border-border rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-accent";

  if (status === "sent") {
    return (
      <div className="bg-green-brand/20 border border-green-accent rounded-lg p-8 text-center">
        <CheckCircle size={40} className="text-green-accent mx-auto mb-3" />
        <p className="text-lg font-semibold">Message sent!</p>
        <p className="text-text-secondary text-sm mt-1">
          We&apos;ll get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-5 ${isLight ? "bg-white text-gray-900 rounded-xl p-8" : ""}`}
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <TextField
          label="Full Name"
          required
          value={form.fullName}
          onChange={(v) => setForm({ ...form, fullName: v })}
          inputClassName={inputClass}
        />
        <TextField
          label="Company"
          value={form.company}
          onChange={(v) => setForm({ ...form, company: v })}
          inputClassName={inputClass}
        />
        <TextField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          inputClassName={inputClass}
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          inputClassName={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={isLight ? 4 : 5}
          placeholder="Tell us about your component needs..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={inputClass}
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
  );
}
