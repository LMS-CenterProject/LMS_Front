import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GoogleLoginButton from "./Google";

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

// ─── Shared field style helper ────────────────────────────────────────────────

const fieldBase =
  "w-full bg-white border rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 outline-none transition-all duration-200";

const fieldClass = (focused: boolean, err?: string) => {
  if (err) return `${fieldBase} border-red-400 ring-2 ring-red-100`;
  if (focused) return `${fieldBase} border-[#6d28d9] ring-2 ring-purple-100`;
  return `${fieldBase} border-gray-300 hover:border-gray-400`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/profile", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => () => clearError(), [clearError]);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

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

  return (
    <div className="lf-login min-h-screen bg-white flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-login * { font-family: 'DM Sans', sans-serif; }
        .lf-login .font-display { font-family: 'Outfit', sans-serif; }

        @keyframes lf-slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .lf-slide-in { animation: lf-slide-in 0.5s cubic-bezier(.4,0,.2,1) forwards; }

        @keyframes lf-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          80%       { transform: translateX(-3px); }
        }
        .lf-shake { animation: lf-shake 0.4s ease; }

        @keyframes lf-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lf-fade-1 { animation: lf-fade-up 0.5s ease forwards 0.05s; opacity: 0; }
        .lf-fade-2 { animation: lf-fade-up 0.5s ease forwards 0.15s; opacity: 0; }
        .lf-fade-3 { animation: lf-fade-up 0.5s ease forwards 0.25s; opacity: 0; }
        .lf-fade-4 { animation: lf-fade-up 0.5s ease forwards 0.35s; opacity: 0; }

        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #fff inset !important;
          -webkit-text-fill-color: #111827 !important;
        }

        .lf-divider::before,
        .lf-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .lf-divider { display: flex; align-items: center; gap: 12px; }

        .lf-panel-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #6d28d9; opacity: 0.4;
        }
      `}</style>

      {/* ── Left panel (decorative) ── */}
      <div className="hidden lg:flex flex-col w-[480px] xl:w-[520px] shrink-0 bg-gradient-to-br from-[#f5f3ff] via-[#ede9fe] to-[#ddd6fe] p-12 relative overflow-hidden">
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(109,40,217,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(109,40,217,.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Blobs */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[#6d28d9]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-56 h-56 rounded-full bg-white/50 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#6d28d9] flex items-center justify-center shadow-lg shadow-purple-200">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                <path d="M9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
              </svg>
            </div>
            <span className="font-display font-bold text-gray-900 text-xl">
              Learn<span className="text-[#6d28d9]">Forge</span>
            </span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center space-y-8 mt-12">
          <div>
            <p className="text-[#6d28d9] text-xs font-semibold uppercase tracking-widest mb-3">
              Welcome back
            </p>
            <h2 className="font-display font-extrabold text-4xl text-gray-900 leading-tight">
              Your next
              <br />
              breakthrough
              <br />
              <span className="text-[#6d28d9]">starts here.</span>
            </h2>
          </div>

          <p className="text-gray-500 leading-relaxed text-sm max-w-xs">
            Sign in to access your dashboard, continue your courses, and track
            your learning progress.
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Courses", value: "2,400+" },
              { label: "Instructors", value: "180+" },
              { label: "Learners", value: "120K+" },
              { label: "Completion", value: "98%" },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-white/70 backdrop-blur-sm border border-white rounded-xl p-4 shadow-sm"
              >
                <div className="font-display font-extrabold text-xl text-[#6d28d9]">
                  {m.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/70 backdrop-blur-sm border border-white rounded-2xl p-5 shadow-sm">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-amber-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed italic">
              "LearnForge completely transformed my career. Landed my dream job
              at Stripe within 4 months."
            </p>
            <div className="flex items-center gap-2.5 mt-4">
              <div className="w-8 h-8 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-xs font-bold">
                SC
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  Sarah Chen
                </p>
                <p className="text-[11px] text-gray-400">
                  Frontend Engineer · Stripe
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-400 mt-8">
          © 2026 LearnForge · All rights reserved
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white relative">
        {/* Subtle pattern on mobile */}
        <div
          className="absolute inset-0 lg:hidden pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="lf-slide-in w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#6d28d9] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>
            <span className="font-display font-bold text-gray-900">
              Learn<span className="text-[#6d28d9]">Forge</span>
            </span>
          </div>

          {/* Heading */}
          <div className="lf-fade-1 mb-8">
            <h1 className="font-display font-extrabold text-3xl text-gray-900 mb-1.5">
              Welcome back 👋
            </h1>
            <p className="text-gray-500 text-sm">
              Sign in to continue your learning journey.
            </p>
          </div>

          {/* Global error */}
          {error && (
            <div className="lf-shake mb-5 flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg
                className="w-4 h-4 shrink-0 text-red-500"
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
            <div className="lf-fade-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
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
                  className={`${fieldClass(focusedField === "email", errors.email)} pl-10`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
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
            <div className="lf-fade-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-[#6d28d9] hover:text-[#5b21b6] transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
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
                  className={`${fieldClass(focusedField === "password", errors.password)} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
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
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
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
            <div className="lf-fade-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#6d28d9] text-white font-bold py-3.5 rounded-xl hover:bg-[#5b21b6] active:scale-[0.99] transition-all duration-150 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in to LearnForge
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="lf-divider my-6">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
              or continue with
            </span>
          </div>

          {/* Google */}
          <GoogleLoginButton />

          {/* Footer link */}
          <p className="text-center mt-8 text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#6d28d9] hover:text-[#5b21b6] transition-colors"
            >
              Sign up free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
