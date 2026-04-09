import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { setToken } from "../../lib/adminApi";

export default function AdminLogin() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok) {
        setError(data.error || "Invalid secret code");
        return;
      }
      if (data.token) {
        setToken(data.token);
        navigate("/admin");
      }
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-green-brand/20 rounded-full flex items-center justify-center mb-4">
            <Lock size={28} className="text-green-accent" />
          </div>
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-text-secondary text-sm mt-1">
            Enter the secret code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Secret code"
            required
            className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-green-accent"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-brand hover:bg-green-accent text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
