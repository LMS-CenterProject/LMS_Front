import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "instructor";
  agreed: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreed?: string;
}

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): {
  score: number;
  label: string;
  color: string;
  bg: string;
} {
  if (!pw)
    return { score: 0, label: "", color: "transparent", bg: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: "Weak", color: "#ef4444", bg: "#fef2f2" },
    2: { label: "Fair", color: "#f59e0b", bg: "#fffbeb" },
    3: { label: "Good", color: "#10b981", bg: "#ecfdf5" },
    4: { label: "Strong", color: "#059669", bg: "#d1fae5" },
  };
  return {
    score,
    ...(map[score] ?? { label: "Weak", color: "#ef4444", bg: "#fef2f2" }),
  };
}

// ─── Reusable error message ───────────────────────────────────────────────────

const ErrorMsg: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
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
      {msg}
    </p>
  ) : null;

// ─── Field class helper ───────────────────────────────────────────────────────

const fieldBase =
  "w-full bg-white border rounded-xl px-4 py-3 text-gray-900 text-sm placeholder-gray-400 outline-none transition-all duration-200";

const fieldCls = (focused: boolean, err?: string) => {
  if (err) return `${fieldBase} border-red-400 ring-2 ring-red-100`;
  if (focused) return `${fieldBase} border-[#6d28d9] ring-2 ring-purple-100`;
  return `${fieldBase} border-gray-300 hover:border-gray-400`;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const RegisterPage: React.FC = () => {
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    agreed: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const strength = getStrength(form.password);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);
  useEffect(() => () => clearError(), [clearError]);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    else if (form.name.trim().length < 2)
      errs.name = "Name must be at least 2 characters";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const validateStep2 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8)
      errs.password = "Password must be at least 8 characters";
    if (!form.confirmPassword)
      errs.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    if (!form.agreed) errs.agreed = "You must accept the terms to continue";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name as keyof FormErrors])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (error) clearError();
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    await register({
      fullName: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role === "student" ? 0 : 1,
    });
  };

  return (
    <div className="lf-register min-h-screen bg-white flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-register * { font-family: 'DM Sans', sans-serif; }
        .lf-register .font-display { font-family: 'Outfit', sans-serif; }

        @keyframes lf-reg-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .lf-reg-in { animation: lf-reg-in 0.5s cubic-bezier(.4,0,.2,1) forwards; }

        @keyframes lf-step-in {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .lf-step-in { animation: lf-step-in 0.35s cubic-bezier(.4,0,.2,1) forwards; }

        @keyframes lf-step-back {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .lf-step-back { animation: lf-step-back 0.35s cubic-bezier(.4,0,.2,1) forwards; }

        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #fff inset !important;
          -webkit-text-fill-color: #111827 !important;
        }

        .lf-divider::before, .lf-divider::after {
          content: ""; flex: 1; height: 1px; background: #e5e7eb;
        }
        .lf-divider { display: flex; align-items: center; gap: 12px; }
      `}</style>

      {/* ── Left visual panel ── */}
      <div className="hidden lg:flex flex-col w-[440px] xl:w-[500px] shrink-0 bg-gradient-to-br from-[#f5f3ff] via-[#ede9fe] to-[#ddd6fe] p-12 relative overflow-hidden">
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(109,40,217,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(109,40,217,.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#6d28d9]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-0 w-48 h-48 rounded-full bg-white/40 blur-3xl pointer-events-none" />

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

        {/* Body */}
        <div className="relative z-10 flex-1 flex flex-col justify-center space-y-8 mt-12">
          <div>
            <p className="text-[#6d28d9] text-xs font-semibold uppercase tracking-widest mb-3">
              Free forever
            </p>
            <h2 className="font-display font-extrabold text-4xl text-gray-900 leading-tight">
              Join 120,000+
              <br />
              <span className="text-[#6d28d9]">ambitious</span>
              <br />
              learners.
            </h2>
          </div>

          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Start learning today. Free forever — upgrade only when you're ready.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              "Access 2,400+ expert-led courses",
              "Track progress with detailed analytics",
              "Earn shareable certificates",
              "Community of 120K+ learners",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#6d28d9] flex items-center justify-center shrink-0 shadow-sm shadow-purple-200">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">{f}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="bg-white/70 backdrop-blur-sm border border-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="flex -space-x-2 shrink-0">
              {["🧑‍💻", "👩‍🎓", "👨‍🔬", "👩‍🎨"].map((e, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-white border-2 border-white flex items-center justify-center text-sm shadow-sm"
                >
                  {e}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                4,200+ this month
              </p>
              <p className="text-xs text-gray-400">
                new learners joined LearnForge
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-400 mt-8">
          © 2026 LearnForge · All rights reserved
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto relative">
        <div
          className="absolute inset-0 lg:hidden pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="lf-reg-in w-full max-w-[420px] relative z-10 py-8">
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
          <div className="mb-6">
            <h1 className="font-display font-extrabold text-3xl text-gray-900 mb-1">
              Create your account
            </h1>
            <p className="text-gray-500 text-sm">
              Step {step} of 2 —{" "}
              <span className="text-[#6d28d9] font-medium">
                {step === 1 ? "Basic info" : "Security & role"}
              </span>
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step > s
                        ? "bg-[#6d28d9] text-white"
                        : step === s
                          ? "bg-[#6d28d9] text-white shadow-md shadow-purple-200"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {step > s ? (
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      s
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${step >= s ? "text-[#6d28d9]" : "text-gray-400"}`}
                  >
                    {s === 1 ? "Basic info" : "Security"}
                  </span>
                </div>
                {s < 2 && (
                  <div
                    className={`flex-1 h-px transition-all duration-500 ${step > s ? "bg-[#6d28d9]" : "bg-gray-200"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* API error */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
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

          {/* ═══════════ STEP 1 ═══════════ */}
          {step === 1 && (
            <form
              onSubmit={handleNext}
              noValidate
              className="lf-step-back space-y-5"
            >
              {/* Full name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full name
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder="John Doe"
                    autoComplete="name"
                    className={`${fieldCls(focused === "name", errors.name)} pl-10`}
                  />
                </div>
                <ErrorMsg msg={errors.name} />
              </div>

              {/* Email */}
              <div>
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
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`${fieldCls(focused === "email", errors.email)} pl-10`}
                  />
                </div>
                <ErrorMsg msg={errors.email} />
              </div>

              <button
                type="submit"
                className="w-full bg-[#6d28d9] text-white font-bold py-3.5 rounded-xl hover:bg-[#5b21b6] active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-200 mt-2"
              >
                Continue
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
              </button>

              <p className="text-center text-sm text-gray-500 pt-1">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#6d28d9] hover:text-[#5b21b6] transition-colors"
                >
                  Sign in →
                </Link>
              </p>
            </form>
          )}

          {/* ═══════════ STEP 2 ═══════════ */}
          {step === 2 && (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="lf-step-in space-y-5"
            >
              {/* Role selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["student", "instructor"] as const).map((r) => {
                    const active = form.role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: r }))}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "border-[#6d28d9] bg-purple-50 text-[#6d28d9] shadow-md shadow-purple-100"
                            : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-2xl">
                          {r === "student" ? "🎓" : "🧑‍🏫"}
                        </span>
                        <span className="font-bold">
                          {r === "student" ? "Learn" : "Teach"}
                        </span>
                        <span className="text-[11px] opacity-70 font-normal">
                          {r === "student"
                            ? "Access courses"
                            : "Create courses"}
                        </span>
                        {active && (
                          <div className="w-4 h-4 rounded-full bg-[#6d28d9] flex items-center justify-center">
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className={`${fieldCls(focused === "password", errors.password)} pl-10 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {showPass ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                    </svg>
                  </button>
                </div>

                {/* Strength meter */}
                {form.password && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className="flex-1 h-1.5 rounded-full transition-all duration-300"
                          style={{
                            background:
                              strength.score >= s ? strength.color : "#e5e7eb",
                          }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: strength.color,
                            background: strength.bg,
                          }}
                        >
                          {strength.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          password strength
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <ErrorMsg msg={errors.password} />
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm password
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocused("confirmPassword")}
                    onBlur={() => setFocused(null)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={`${fieldCls(focused === "confirmPassword", errors.confirmPassword)} pl-10 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
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
                  </button>
                </div>
                <ErrorMsg msg={errors.confirmPassword} />
              </div>

              {/* Terms checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      name="agreed"
                      checked={form.agreed}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div
                      className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                        form.agreed
                          ? "bg-[#6d28d9] border-[#6d28d9]"
                          : "border-gray-300 group-hover:border-[#6d28d9]/50"
                      }`}
                    >
                      {form.agreed && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 leading-relaxed pt-0.5">
                    I agree to the{" "}
                    <a
                      href="#"
                      className="font-semibold text-[#6d28d9] hover:underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="font-semibold text-[#6d28d9] hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>
                <ErrorMsg msg={errors.agreed} />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 text-sm transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#6d28d9] text-white font-bold py-3.5 rounded-xl hover:bg-[#5b21b6] active:scale-[0.99] transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 pt-1">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#6d28d9] hover:text-[#5b21b6] transition-colors"
                >
                  Sign in →
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
