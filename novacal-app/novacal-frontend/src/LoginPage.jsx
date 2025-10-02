import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL || 'http://127.0.0.1:5000';

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        localStorage.setItem("api_token", data.access_token);
        if (onLogin) onLogin({ email });
        setLoading(false);
        navigate("/dashboard"); // Redirect to dashboard after login
      } else {
        setError(data.error || "Login failed");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-gradient-to-br from-sky-900/50 via-slate-900/50 to-indigo-900/50">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-lg bg-black border border-white/20">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-gray-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md px-3 py-2 bg-[#0f1720] border border-[#1f2a37] text-white placeholder-gray-500 focus:outline-none"
              placeholder="you@domain.com"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-400">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md px-3 py-2 bg-[#0f1720] border border-[#1f2a37] text-white placeholder-gray-500 focus:outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg font-semibold text-white transition-all bg-gradient-to-r from-sky-900 to-emerald-900"
            style={{
              boxShadow: "0 6px 20px rgba(123,108,255,0.18)",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <span>Don’t have an account? </span>
          <a href="/signup" className="text-[#7aa2f7] underline">Create one</a>
        </div>

        <style>{`
          h1 { text-shadow: 0 2px 16px rgba(123,108,255,0.12); }
        `}</style>
      </div>
    </div>
  );
}