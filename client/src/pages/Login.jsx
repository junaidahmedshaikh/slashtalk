"use client";
import { useState } from "react";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BACKEND_BASE_URL } from "../utils/constant";
import ThemeToggle from "../components/theme-toggle";
import { setUser } from "../utils/userSlice";
import { useDispatch } from "react-redux";

export default function LoginPage() {
  // const [loginDetail, setLoginDetail] = useState({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleLogin = async (e) => {
    try {
      e.preventDefault();
      setError(""); // Clear previous errors
      setIsLoading(true);

      const result = await fetch(`${BACKEND_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
        credentials: "include",
      });

      const data = await result.json();

      if (result.ok && data.message === "Login Successful") {
        dispatch(setUser(data.data));
        navigate("/"); // This will now show <ChatPage>
      } else {
        // Handle authentication errors
        if (data.error === "Invalid credentials") {
          setError(
            data.details === "User not found"
              ? "No account found with this email address"
              : "Incorrect password. Please try again."
          );
        } else {
          setError(data.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.log("Error: ", error.message);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="min-h-dvh flex items-center justify-center bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <section className="w-full max-w-md p-6">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 shadow-sm p-6 backdrop-blur">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-balance">
              Welcome to SlashTalk
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sign in to continue the conversation.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 outline-none pr-10 focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-white shadow hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <LogIn size={18} />
              )}
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              onClick={() => {
                navigate("/register");
              }}
              className="text-indigo-600 hover:text-purple-600 font-medium"
            >
              Don’t have an account? Register
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
