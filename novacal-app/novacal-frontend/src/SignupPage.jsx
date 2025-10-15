import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from './lib/supabaseClient';

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    
    if (!email.includes("@") || password.length < 6 || name.trim().length === 0) {
      setError("Please fill all fields correctly (password must be at least 6 characters)");
      return;
    }
    
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Store email for resend functionality
        localStorage.setItem('pending_email', email);
        // Redirect to email confirmation page
        navigate('/email-confirmation');
      }
    } catch (err) {
      setError("Network error: " + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-gradient-to-br from-emerald-900/25 to-sky-900/25">
      <div className="max-w-md w-full p-8 rounded-2xl shadow-lg border border-white/20 bg-black">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-white">Create an account</h1>
          <p className="mt-2 text-sm text-gray-400">Start using the planner</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-gray-400">Full name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md px-3 py-2 bg-[#0f1720] border border-[#1f2a37] text-white placeholder-gray-500 focus:outline-none"
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md px-3 py-2 bg-[#0f1720] border border-[#1f2a37] text-white placeholder-gray-500 focus:outline-none"
              placeholder="you@domain.com"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-400">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md px-3 py-2 bg-[#0f1720] border border-[#1f2a37] text-white placeholder-gray-500 focus:outline-none"
              autoComplete="new-password"
              placeholder="Min. 6 characters"
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-400">Confirm password</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md px-3 py-2 bg-[#0f1720] border border-[#1f2a37] text-white placeholder-gray-500 focus:outline-none"
              autoComplete="new-password"
              placeholder="Re-enter password"
            />
          </label>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg font-semibold text-white transition-all bg-gradient-to-r from-emerald-900/80 to-sky-900/80 hover:from-emerald-800/80 hover:to-sky-800/80"
            style={{
              boxShadow: "0 6px 20px rgba(123,108,255,0.18)",
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <span>Already have an account? </span>
          <a href="/login" className="text-[#7aa2f7] underline">Sign in</a>
        </div>
      </div>
    </div>
  );
}
