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

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map: Record<number, { label: string; color: string }> = {
    1: { label: "Weak", color: "#ef4444" },
    2: { label: "Fair", color: "#f59e0b" },
    3: { label: "Good", color: "#10b981" },
    4: { label: "Strong", color: "#22c55e" },
  };
  return { score, ...(map[score] ?? { label: "Weak", color: "#ef4444" }) };
}

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const strength = getPasswordStrength(form.password);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => () => clearError(), [clearError]);

  // ── Validate step ──────────────────────────────────────────────────────────

  const validateStep1 = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    else if (form.name.trim().length < 2)
      errs.name = "Name must be at least 2 characters";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
    if (!form.agreed) errs.agreed = "You must accept the terms";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

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
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    });
  };

  const fieldClass = (field: string, err?: string) =>
    `w-full bg-[#13161d] border rounded-xl px-4 py-3 text-slate-200 text-sm placeholder-slate-600 outline-none transition-all duration-200 ${
      err
        ? "border-red-500/70 focus:border-red-500"
        : focusedField === field
          ? "border-amber-400/60 ring-2 ring-amber-400/10"
          : "border-white/8 hover:border-white/15"
    }`;

  const ErrorMsg: React.FC<{ msg?: string }> = ({ msg }) =>
    msg ? (
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
        {msg}
      </p>
    ) : null;

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
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.5s ease forwards; }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slideRight { animation: slideRight 0.4s ease forwards; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #13161d inset !important;
          -webkit-text-fill-color: #e2e8f0 !important;
        }
      `}</style>

      {/* ── Left (visual) ── */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 xl:w-1/2 bg-[#0f1117] border-r border-white/5 p-12 relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-60" />
        <div className="absolute top-1/3 right-0 w-80 h-80 rounded-full bg-violet-500/6 blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-400/6 blur-[100px]" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2">
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

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display text-4xl font-800 text-white leading-tight mb-4">
              Join 120,000+
              <br />
              <span className="text-amber-400">Ambitious</span>
              <br />
              Learners.
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Start your learning journey today. Free forever — upgrade only
              when you're ready.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: "✓", text: "Access 2,400+ expert-led courses" },
              { icon: "✓", text: "Track progress with detailed analytics" },
              { icon: "✓", text: "Earn shareable certificates" },
              { icon: "✓", text: "Join a community of learners" },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-3 text-sm text-slate-300"
              >
                <div className="w-5 h-5 rounded-full bg-amber-400/15 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>

          {/* Social proof strip */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-1.5">
              {["🧑‍💻", "👩‍🎓", "👨‍🔬", "👩‍🎨", "🧑‍🚀"].map((e, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-[#1e2230] border border-white/10 flex items-center justify-center text-sm"
                >
                  {e}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              <span className="text-slate-300">4,200+</span> new learners this
              month
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-600">
          © 2025 LearnForge · All rights reserved
        </div>
      </div>

      {/* ── Right (Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg lg:hidden" />

        <div className="w-full max-w-md relative z-10">
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

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl font-800 text-white mb-1">
              Create your account
            </h1>
            <p className="text-slate-400 text-sm">
              Step {step} of 2 — {step === 1 ? "Basic info" : "Security & role"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step >= s
                      ? "bg-amber-400 text-[#0d0f14]"
                      : "bg-white/5 text-slate-500 border border-white/10"
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
                {s < 2 && (
                  <div
                    className={`flex-1 h-px transition-all duration-500 ${step > s ? "bg-amber-400" : "bg-white/8"}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
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

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form
              onSubmit={handleNext}
              noValidate
              className="space-y-5 animate-slideIn"
            >
              {/* Full name */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                  Full name
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="John Doe"
                    autoComplete="name"
                    className={`${fieldClass("name", errors.name)} pl-10`}
                  />
                </div>
                <ErrorMsg msg={errors.name} />
              </div>

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
                <ErrorMsg msg={errors.email} />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-400 text-[#0d0f14] font-semibold py-3.5 rounded-xl hover:bg-amber-300 transition-all duration-200 text-sm flex items-center justify-center gap-2 mt-2"
                style={{ boxShadow: "0 0 30px rgba(245,158,11,0.2)" }}
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
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5 animate-slideRight"
            >
              {/* Role selector */}
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["student", "instructor"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: r }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        form.role === r
                          ? "border-amber-400/60 bg-amber-400/10 text-amber-400"
                          : "border-white/8 hover:border-white/15 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-2xl">
                        {r === "student" ? "🎓" : "🧑‍🏫"}
                      </span>
                      {r === "student" ? "Learn" : "Teach"}
                      <span className="text-xs opacity-70">
                        {r === "student" ? "Access courses" : "Create courses"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                  Password
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
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className={`${fieldClass("password", errors.password)} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
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
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            background:
                              strength.score >= s
                                ? strength.color
                                : "rgba(255,255,255,0.06)",
                          }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className="text-xs" style={{ color: strength.color }}>
                        {strength.label} password
                      </p>
                    )}
                  </div>
                )}
                <ErrorMsg msg={errors.password} />
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                  Confirm password
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className={`${fieldClass("confirmPassword", errors.confirmPassword)} pl-10 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
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

              {/* Terms */}
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
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
                        form.agreed
                          ? "bg-amber-400 border-amber-400"
                          : "border-white/20 group-hover:border-amber-400/40"
                      }`}
                    >
                      {form.agreed && (
                        <svg
                          className="w-2.5 h-2.5 text-[#0d0f14]"
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
                  <span className="text-xs text-slate-400 leading-relaxed">
                    I agree to the{" "}
                    <a href="#" className="text-amber-400 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-amber-400 hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                <ErrorMsg msg={errors.agreed} />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 text-sm transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-amber-400 text-[#0d0f14] font-semibold py-3.5 rounded-xl hover:bg-amber-300 transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ boxShadow: "0 0 30px rgba(245,158,11,0.2)" }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0d0f14]/30 border-t-[#0d0f14] rounded-full animate-spin" />
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
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
