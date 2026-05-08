import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() { 
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const body =
      mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        login(data.user, data.token);
        navigate("/");
      }
    } catch {
      setError("Could not connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setForm({ name: "", email: "", password: "" });
    setError("");
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div className="hidden md:flex w-1/2 bg-indigo-600 flex-col justify-between p-12">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: "rgba(255,255,255,0.2)" }} className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            £
          </div>
          <span className="text-white font-semibold text-lg">Spendly</span>
        </div>

        {/* Tagline */}
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Take control of your money
          </h1>
          <p className="text-indigo-200 text-sm leading-relaxed">
            Track spending, set budgets, grow savings, and manage your finances | all in one beautiful app.
          </p>
        </div>

        <p className="text-indigo-300 text-xs">© 2026 Spendly. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="w-full md:w-1/2 bg-gray-50 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">

          <h2 className="text-2xl font-semibold text-gray-800 mb-1">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-sm text-gray-400 mb-8">
            {mode === "login" ? "Sign in to manage your finances" : "Start managing your finances today"}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jamie Smith"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors mt-2"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={toggle}
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div> 
  );
}