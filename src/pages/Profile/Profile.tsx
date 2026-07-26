import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_API_URL as string;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl: string;
  role: string;
  authProvider: string;
  isActive: boolean;
  createdAt: string;
}

type Tab = "profile" | "security" | "preferences";

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium
        ${
          type === "success"
            ? "bg-white border-green-200 text-green-700"
            : "bg-white border-red-200 text-red-600"
        }`}
      style={{ animation: "toastIn 0.25s ease" }}
    >
      <span className="text-base">{type === "success" ? "✓" : "✕"}</span>
      {message}
    </div>
  );
};

// ─── Section card wrapper ─────────────────────────────────────────────────────

const Card: React.FC<{
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = "" }) => (
  <div
    className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className}`}
  >
    {(title || subtitle) && (
      <div className="px-6 py-5 border-b border-gray-100">
        {title && (
          <h2 className="font-display text-base font-bold text-gray-900">
            {title}
          </h2>
        )}
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// ─── Form field ───────────────────────────────────────────────────────────────

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const inputCls =
  "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500";

// ─── Tab button ───────────────────────────────────────────────────────────────

const TabBtn: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left
      ${
        active
          ? "bg-purple-50 text-[#6d28d9] font-semibold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
  >
    <span className={active ? "text-[#6d28d9]" : "text-gray-400"}>{icon}</span>
    {label}
  </button>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle: React.FC<{ value: boolean; onChange: () => void }> = ({
  value,
  onChange,
}) => (
  <button
    onClick={onChange}
    className={`relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6d28d9]
      ${value ? "bg-[#6d28d9]" : "bg-gray-200"}`}
  >
    <span
      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
        ${value ? "translate-x-5" : "translate-x-1"}`}
    />
  </button>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
);

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  user: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  lock: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),
  sliders: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
      />
    </svg>
  ),
  camera: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  eye: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
  eyeOff: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  ),
  check: (
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
  ),
  back: (
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
        d="M15 19l-7-7 7-7"
      />
    </svg>
  ),
  logout: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { token, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // ── State ────────────────────────────────────────────────────────────────

  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profile form
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    avatarUrl: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Preferences (local only — extend to API if backend supports)
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    marketingEmails: false,
    compactView: false,
  });

  // Toast
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") =>
    setToast({ msg, type });

  // ── Fetch profile ────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const res = await fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data: UserProfile = await res.json();
      setProfile(data);
      setForm({
        fullName: data.fullName ?? "",
        phoneNumber: data.phoneNumber ?? "",
        avatarUrl: data.avatarUrl ?? "",
      });
    } catch (e: unknown) {
      setProfileError(
        e instanceof Error ? e.message : "Could not load profile",
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Save profile ─────────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!token) return;
    setSavingProfile(true);
    try {
      const body = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        avatarUrl: form.avatarUrl,
      };
      const res = await fetch(`${API}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail ?? "Failed to update profile");
      }
      const updated: UserProfile = await res.json();
      setProfile(updated);
      updateUser({ name: updated.fullName, picture: updated.avatarUrl });
      showToast("Profile updated successfully");
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ──────────────────────────────────────────────────────

  const changePassword = async () => {
    setPwdError(null);
    if (!passwords.currentPassword) {
      setPwdError("Current password is required.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      setPwdError("Passwords do not match.");
      return;
    }
    if (!token) return;
    setSavingPwd(true);
    try {
      const res = await fetch(`${API}/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail ?? "Password change failed");
      }
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
      showToast("Password changed successfully");
    } catch (e: unknown) {
      setPwdError(e instanceof Error ? e.message : "Password change failed");
    } finally {
      setSavingPwd(false);
    }
  };

  // ── Avatar file pick ─────────────────────────────────────────────────────

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
      // If your backend accepts a URL, you'd upload the file first then set the URL.
      // For now we store the preview locally and leave avatarUrl for the URL input.
    };
    reader.readAsDataURL(file);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const avatarSrc = avatarPreview ?? form.avatarUrl ?? null;

  const initials = (form.fullName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isGoogleAccount = profile?.authProvider?.toLowerCase() === "google";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="lf-profile min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-profile, .lf-profile * { font-family: 'DM Sans', sans-serif; }
        .lf-profile .font-display { font-family: 'Syne', sans-serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lf-fade { animation: fadeUp 0.38s ease forwards; }
        .lf-d1 { animation-delay: 0.04s; opacity: 0; }
        .lf-d2 { animation-delay: 0.10s; opacity: 0; }
        .lf-d3 { animation-delay: 0.17s; opacity: 0; }
        .pwd-strength-bar { transition: width 0.3s ease, background 0.3s ease; }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Profile hero ── */}
        <div className="lf-fade lf-d1 bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
          {/* Top banner */}
          <div className="h-24 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-400 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 40px)",
              }}
            />
          </div>

          <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-purple-100">
                {loadingProfile ? (
                  <div className="w-full h-full animate-pulse bg-gray-200" />
                ) : avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={form.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#6d28d9] flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                {Icons.camera}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 mt-2 sm:mt-0">
              {loadingProfile ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-56" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-xl font-bold text-gray-900">
                      {profile?.fullName ?? "—"}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#6d28d9] capitalize">
                      {profile?.role ?? "Student"}
                    </span>
                    {profile?.isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Active
                      </span>
                    )}
                    {isGoogleAccount && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Google
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {profile?.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Member since {memberSince}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Layout: sidebar tabs + content ── */}
        <div className="lf-fade lf-d2 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar nav */}
          <aside className="space-y-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-2">
              {(
                [
                  { id: "profile" as Tab, icon: Icons.user, label: "Profile" },
                  {
                    id: "security" as Tab,
                    icon: Icons.lock,
                    label: "Password & Security",
                  },
                  {
                    id: "preferences" as Tab,
                    icon: Icons.sliders,
                    label: "Preferences",
                  },
                ] as const
              ).map((t) => (
                <TabBtn
                  key={t.id}
                  active={tab === t.id}
                  icon={t.icon}
                  label={t.label}
                  onClick={() => setTab(t.id)}
                />
              ))}
            </div>

            {/* Account meta card */}
            {!loadingProfile && profile && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
                <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                  Account
                </p>
                {[
                  { label: "Provider", value: profile.authProvider ?? "Email" },
                  {
                    label: "ID",
                    value: profile.id.slice(0, 8) + "…",
                  },
                  {
                    label: "Status",
                    value: profile.isActive ? "Active" : "Inactive",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-gray-400">{row.label}</span>
                    <span className="text-gray-700 font-medium truncate max-w-[100px] text-right">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Danger zone */}
            <div className="bg-white border border-red-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wider">
                Danger
              </p>
              <button className="w-full text-xs text-red-500 border border-red-200 rounded-xl py-2 hover:bg-red-50 transition-colors">
                Delete account
              </button>
            </div>
          </aside>

          {/* Content panels */}
          <div className="lf-fade lf-d3 min-w-0">
            {/* ── PROFILE TAB ── */}
            {tab === "profile" && (
              <div className="space-y-5">
                {profileError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
                    {profileError}
                    <button
                      onClick={fetchProfile}
                      className="underline text-red-600 ml-4"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <Card
                  title="Personal Information"
                  subtitle="Update your name, phone number, and avatar URL."
                >
                  {loadingProfile ? (
                    <div className="grid sm:grid-cols-2 gap-5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-1.5">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field label="Full Name">
                        <input
                          className={inputCls}
                          value={form.fullName}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              fullName: e.target.value,
                            }))
                          }
                          placeholder="Your full name"
                        />
                      </Field>

                      <Field label="Email Address">
                        <input
                          className={inputCls}
                          value={profile?.email ?? ""}
                          disabled
                          placeholder="email@example.com"
                        />
                      </Field>

                      <Field
                        label="Phone Number"
                        hint="Include country code, e.g. +20 100 000 0000"
                      >
                        <input
                          className={inputCls}
                          value={form.phoneNumber}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              phoneNumber: e.target.value,
                            }))
                          }
                          placeholder="+20 100 000 0000"
                          type="tel"
                        />
                      </Field>

                      <Field
                        label="Avatar URL"
                        hint="Paste a direct image link, or upload a file above."
                      >
                        <input
                          className={inputCls}
                          value={form.avatarUrl}
                          onChange={(e) => {
                            setAvatarPreview(null);
                            setForm((p) => ({
                              ...p,
                              avatarUrl: e.target.value,
                            }));
                          }}
                          placeholder="https://..."
                          type="url"
                        />
                      </Field>

                      <Field label="Role">
                        <input
                          className={inputCls}
                          value={profile?.role ?? ""}
                          disabled
                        />
                      </Field>

                      <Field label="Auth Provider">
                        <input
                          className={inputCls}
                          value={profile?.authProvider ?? "Email"}
                          disabled
                        />
                      </Field>
                    </div>
                  )}

                  {!loadingProfile && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        Fields grayed out are managed by your auth provider.
                      </p>
                      <button
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className="flex items-center gap-2 bg-[#6d28d9] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#5b21b6] transition-colors disabled:opacity-60 shadow-sm shadow-purple-200"
                      >
                        {savingProfile ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          Icons.check
                        )}
                        Save changes
                      </button>
                    </div>
                  )}
                </Card>

                {/* Avatar upload helper */}
                <Card>
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-100 shrink-0 border border-gray-200">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#6d28d9] flex items-center justify-center text-white text-xl font-bold">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        Profile photo
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        JPG or PNG · Recommended 200×200px or larger.
                      </p>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="mt-2 text-xs font-semibold text-[#6d28d9] hover:text-[#5b21b6] transition-colors flex items-center gap-1"
                      >
                        {Icons.camera}
                        Upload photo
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {tab === "security" && (
              <div className="space-y-5">
                <Card
                  title="Change Password"
                  subtitle="Keep your account safe by using a strong, unique password."
                >
                  {isGoogleAccount && (
                    <div className="mb-5 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
                      <svg
                        className="w-4 h-4 mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      You signed in with Google. You can set a password to also
                      enable email login.
                    </div>
                  )}

                  {pwdError && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
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
                      {pwdError}
                    </div>
                  )}

                  <div className="space-y-4">
                    {(
                      [
                        {
                          label: "Current Password",
                          key: "currentPassword" as const,
                          show: showPwd.current,
                          toggle: () =>
                            setShowPwd((s) => ({ ...s, current: !s.current })),
                        },
                        {
                          label: "New Password",
                          key: "newPassword" as const,
                          show: showPwd.next,
                          toggle: () =>
                            setShowPwd((s) => ({ ...s, next: !s.next })),
                        },
                        {
                          label: "Confirm New Password",
                          key: "confirm" as const,
                          show: showPwd.confirm,
                          toggle: () =>
                            setShowPwd((s) => ({
                              ...s,
                              confirm: !s.confirm,
                            })),
                        },
                      ] as const
                    ).map((f) => (
                      <Field key={f.key} label={f.label}>
                        <div className="relative">
                          <input
                            type={f.show ? "text" : "password"}
                            className={inputCls + " pr-11"}
                            value={passwords[f.key]}
                            onChange={(e) =>
                              setPasswords((p) => ({
                                ...p,
                                [f.key]: e.target.value,
                              }))
                            }
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={f.toggle}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            {f.show ? Icons.eyeOff : Icons.eye}
                          </button>
                        </div>
                      </Field>
                    ))}

                    {/* Password strength */}
                    {passwords.newPassword && (
                      <div>
                        <div className="flex gap-1.5 mb-1">
                          {[1, 2, 3, 4].map((s) => {
                            const strength = Math.min(
                              4,
                              [
                                passwords.newPassword.length >= 8,
                                /[A-Z]/.test(passwords.newPassword),
                                /[0-9]/.test(passwords.newPassword),
                                /[^A-Za-z0-9]/.test(passwords.newPassword),
                              ].filter(Boolean).length,
                            );
                            const colors = [
                              "bg-red-400",
                              "bg-orange-400",
                              "bg-yellow-400",
                              "bg-green-500",
                            ];
                            return (
                              <div
                                key={s}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                  s <= strength
                                    ? colors[strength - 1]
                                    : "bg-gray-200"
                                }`}
                              />
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-400">
                          Use uppercase, numbers, and symbols for a strong
                          password.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={changePassword}
                      disabled={savingPwd}
                      className="flex items-center gap-2 bg-[#6d28d9] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#5b21b6] transition-colors disabled:opacity-60 shadow-sm shadow-purple-200"
                    >
                      {savingPwd ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        Icons.check
                      )}
                      Update password
                    </button>
                  </div>
                </Card>

                {/* Security tips */}
                <Card title="Security Tips">
                  <ul className="space-y-3">
                    {[
                      "Use a unique password you don't use elsewhere.",
                      "Enable two-factor authentication when available.",
                      "Never share your credentials with anyone.",
                      "Review and revoke active sessions you don't recognize.",
                    ].map((tip) => (
                      <li
                        key={tip}
                        className="flex items-start gap-3 text-sm text-gray-600"
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-[#6d28d9] flex items-center justify-center mt-0.5 shrink-0">
                          {Icons.check}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}

            {/* ── PREFERENCES TAB ── */}
            {tab === "preferences" && (
              <div className="space-y-5">
                <Card
                  title="Notifications"
                  subtitle="Choose which emails and alerts you'd like to receive."
                >
                  <div className="divide-y divide-gray-100">
                    {(
                      [
                        {
                          key: "emailNotifications" as const,
                          label: "Email notifications",
                          desc: "Receive updates and activity via email",
                        },
                        {
                          key: "pushNotifications" as const,
                          label: "Push notifications",
                          desc: "Browser push alerts for real-time updates",
                        },
                        {
                          key: "weeklyDigest" as const,
                          label: "Weekly digest",
                          desc: "A summary of your weekly learning progress",
                        },
                        {
                          key: "marketingEmails" as const,
                          label: "Marketing emails",
                          desc: "Product news, offers, and announcements",
                        },
                      ] as const
                    ).map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <Toggle
                          value={prefs[item.key]}
                          onChange={() =>
                            setPrefs((p) => ({
                              ...p,
                              [item.key]: !p[item.key],
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card
                  title="Display"
                  subtitle="Customize your viewing experience."
                >
                  <div className="divide-y divide-gray-100">
                    {(
                      [
                        {
                          key: "compactView" as const,
                          label: "Compact view",
                          desc: "Reduce spacing and padding in lists",
                        },
                      ] as const
                    ).map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                        <Toggle
                          value={prefs[item.key]}
                          onChange={() =>
                            setPrefs((p) => ({
                              ...p,
                              [item.key]: !p[item.key],
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Language & Region">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Language">
                      <select className={inputCls}>
                        {["English", "Arabic", "French"].map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Timezone">
                      <select className={inputCls}>
                        {[
                          "UTC+2 (Cairo)",
                          "UTC+0 (London)",
                          "UTC-5 (New York)",
                          "UTC+8 (Singapore)",
                        ].map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </Card>

                <Card title="Data Export">
                  <p className="text-sm text-gray-500 mb-4">
                    Download a copy of all your personal data stored on
                    LearnForge.
                  </p>
                  <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Export my data
                  </button>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
