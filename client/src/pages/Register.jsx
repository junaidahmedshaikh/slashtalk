"use client";

import { useState, useEffect } from "react";
import { UserPlus, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BACKEND_BASE_URL } from "../utils/constant";
import ThemeToggle from "../components/theme-toggle";
import { useAuth } from "../hooks/useAuth";

export default function RegisterPage() {
  const [userDetail, setUserDetail] = useState({
    username: "",
    email: "",
    password: "",
    avatarUrl: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleRegistration = async (e) => {
    e.preventDefault();
    try {
      setError(""); // Clear previous errors
      setIsSubmitting(true);

      const result = await fetch(`${BACKEND_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userDetail),
        credentials: "include",
      });

      const data = await result.json();

      if (result.ok && data.success) {
        console.log("Register user successfully");
        navigate("/");
      } else {
        // Handle registration errors
        if (data.message) {
          setError(data.message);
        } else {
          setError("Registration failed. Please try again.");
        }
      }
    } catch (error) {
      console.log("Error: ", error.message);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setUserDetail({ ...userDetail, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when user starts typing
  };

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <section className="w-full max-w-md p-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 shadow-sm p-6 backdrop-blur">
          <button
            onClick={() => navigate("/login")}
            className="mb-3 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            title="Back to login"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-balance">
              Create your account
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Join SlashTalk in seconds.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleRegistration}>
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={userDetail.username}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={userDetail.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={show ? "text" : "password"}
                  required
                  value={userDetail.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 outline-none pr-10 focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)} // ✅ fixed
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Avatar */}
            <div className="space-y-2">
              <label htmlFor="avatarUrl" className="text-sm font-medium">
                Avatar URL
              </label>
              <input
                id="avatarUrl"
                name="avatarUrl"
                type="text"
                value={userDetail.avatarUrl}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/avatar.png"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-white shadow hover:translate-y-[-1px] hover:shadow-md active:translate-y-0 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <UserPlus size={18} />
              )}
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              onClick={() => navigate("/login")}
              className="text-indigo-600 hover:text-purple-600 font-medium"
            >
              Already have an account? Login
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
