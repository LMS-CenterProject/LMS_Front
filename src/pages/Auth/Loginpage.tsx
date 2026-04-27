import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await login({ email: form.email, password: form.password });
  };

  const fillDemo = () => {
    setForm({ email: "demo@lms.com", password: "password" });
    setErrors({});
    clearError();
  };

  // ── Field helper ─────────────────────────────────────────────────────────

  const fieldClass = (field: string, err?: string) =>
    `w-full bg-[#13161d] border rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 outline-none transition-all duration-200 ${
      err
        ? "border-red-500/70 focus:border-red-500"
        : focusedField === field
          ? "border-amber-400/60 ring-2 ring-amber-400/10"
          : "border-white/8 hover:border-white/15"
    }`;

  return (
    <div className="min-h-screen bg-[#0d0f14] flex font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Syne', sans-serif; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.5s ease forwards; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.3s ease; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #13161d inset !important;
          -webkit-text-fill-color: #e2e8f0 !important;
        }
      `}</style>

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 xl:w-1/2 bg-[#0f1117] border-r border-white/5 p-12 relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-60" />
        {/* Glow */}
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-400/8 blur-[100px]" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
              <svg
                className="w-4.5 h-4.5 text-[#0d0f14]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>
            <span className="font-display font-700 text-white text-xl">
              LearnForge
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-4xl font-800 text-white leading-tight">
            Your Next
            <br />
            <span className="text-amber-400">Breakthrough</span>
            <br />
            Awaits.
          </h2>
          <p className="text-slate-400 leading-relaxed max-w-sm">
            Sign in to access your personalized dashboard, continue your
            courses, and track your progress.
          </p>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Active Courses", value: "2,400+" },
              { label: "Expert Instructors", value: "180+" },
              { label: "Learners Worldwide", value: "120K+" },
              { label: "Completion Rate", value: "98%" },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-white/3 border border-white/5 rounded-xl p-4"
              >
                <div className="font-display text-xl font-bold text-amber-400">
                  {m.value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-600">
          © 2025 LearnForge · All rights reserved
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 grid-bg lg:hidden" />

        <div className="w-full max-w-md animate-slideIn relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-md bg-amber-400 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#0d0f14]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>
            <span className="font-display font-700 text-white">LearnForge</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-800 text-white mb-2">
              Welcome back
            </h1>
            <p className="text-slate-400 text-sm">
              Sign in to continue your learning journey.
            </p>
          </div>

          {/* Demo hint */}
          <button
            onClick={fillDemo}
            className="w-full mb-6 text-xs text-center text-amber-400/70 hover:text-amber-400 transition-colors py-2 border border-amber-400/15 hover:border-amber-400/30 rounded-lg"
          >
            🪄 Fill demo credentials (demo@lms.com / password)
          </button>

          {/* Global error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-shake">
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                Email address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`${fieldClass("email", errors.email)} pl-10`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-slate-400 font-medium">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${fieldClass("password", errors.password)} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPass ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-400 text-[#0d0f14] font-semibold py-3.5 rounded-xl hover:bg-amber-300 transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ boxShadow: "0 0 30px rgba(245,158,11,0.2)" }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0d0f14]/30 border-t-[#0d0f14] rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-slate-600">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* OAuth placeholders */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Google", icon: "G" },
              { name: "GitHub", icon: "⌥" },
            ].map((p) => (
              <button
                key={p.name}
                className="flex items-center justify-center gap-2 border border-white/8 hover:border-white/15 rounded-xl py-3 text-sm text-slate-300 hover:text-white hover:bg-white/3 transition-all duration-200"
              >
                <span className="font-bold text-base">{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>

          <p className="text-center mt-7 text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
