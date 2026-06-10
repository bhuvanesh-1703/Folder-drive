import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../Api/api";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [msgError, SetMsgError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    SetMsgError(null);
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      
      localStorage.setItem("token", res.data.token);

      
      navigate("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        SetMsgError(err.response?.data?.message || err.response?.data?.msg || "Invalid credentials. Please try again.");
      } else {
        SetMsgError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-neutral-800 to-neutral-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-neutral-700 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Sign in to access your secure folder
          </p>
        </div>

        {/* Error Message */}
        {msgError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <span className="font-medium">Error:</span> {msgError}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all duration-200"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-violet-500 hover:to-indigo-500 focus:ring-2 focus:ring-violet-500/50 focus:outline-none disabled:opacity-50 transition-all duration-300"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>

        {/* Footer Link */}
        <div className="text-center text-sm">
          <span className="text-neutral-400">Don't have an account? </span>
          <Link
            to="/register"
            className="font-medium text-violet-400 hover:text-violet-300 transition-colors duration-200"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;