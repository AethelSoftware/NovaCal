import React, { useState } from "react";

export default function SignupPage({ onSignup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!email.includes("@") || password.length < 6 || name.trim().length === 0) {
      setError("Please fill all fields correctly");
      return;
    }
    setLoading(true);

    // --- FAKE SIGNUP API MOCK --- //
    await new Promise((r) => setTimeout(r, 900)); // Simulate latency
    const emailTaken = email.toLowerCase() === "test@demo.com";
    if (emailTaken) {
      setError("Account already exists for this email");
      setLoading(false);
      return;
    }
    const fakeApiResponse = {
      token: "mocked.api.token.signup.67890",
      user: { id: Math.floor(Math.random() * 10000), email, name: name.trim() },
    };
    localStorage.setItem("api_token", fakeApiResponse.token);
    if (onSignup) onSignup(fakeApiResponse.user);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f14]">
      <div
        className="max-w-md w-full p-8 rounded-2xl shadow-lg"
        style={{ background: "linear-gradient(180deg,#0a0c0e,#050506)" }}
      >
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
            />
          </label>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(90deg,#7aa2f7,#7b6cff)",
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
