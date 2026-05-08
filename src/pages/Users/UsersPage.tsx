import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { lmsFetch } from "../../api/LmsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  authProvider: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Role string → int mapping expected by the API
const ROLE_INT: Record<string, number> = {
  Student: 0,
  Instructor: 1,
  Admin: 2,
  SuperAdmin: 3,
};



const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: "bg-purple-100 text-purple-700 border-purple-200",
  Admin: "bg-blue-100   text-blue-700   border-blue-200",
  Instructor: "bg-amber-100  text-amber-700  border-amber-200",
  Student: "bg-gray-100   text-gray-600   border-gray-200",
};

// ─── API helpers ──────────────────────────────────────────────────────────────

const usersAdminApi = {
  getAll: (
    params: { page: number; pageSize: number; search?: string; role?: string },
    token: string,
  ) => {
    const q = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    if (params.search) q.set("search", params.search);
    if (params.role !== undefined && params.role !== "")
      q.set("role", params.role);
    return lmsFetch<UsersResponse>(`/admin/users?${q}`, {}, token);
  },
  activate: (id: string, token: string) =>
    lmsFetch<void>(`/admin/users/${id}/activate`, { method: "PATCH" }, token),
  deactivate: (id: string, token: string) =>
    lmsFetch<void>(`/admin/users/${id}/deactivate`, { method: "PATCH" }, token),
  changeRole: (id: string, newRole: number, token: string) =>
    lmsFetch<void>(
      `/admin/users/${id}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ newRole }),
      },
      token,
    ),
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-7 h-7 border-2 border-purple-200 border-t-[#6d28d9] rounded-full animate-spin" />
  </div>
);

const ErrorBanner = ({
  msg,
  onDismiss,
}: {
  msg: string;
  onDismiss?: () => void;
}) => (
  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
    <svg
      className="w-4 h-4 shrink-0 mt-0.5"
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
    <span className="flex-1">{msg}</span>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 ml-1"
      >
        ✕
      </button>
    )}
  </div>
);

const SuccessBanner = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
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
        d="M5 13l4 4L19 7"
      />
    </svg>
    {msg}
  </div>
);

const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// Avatar initials
function Avatar({ name, active }: { name: string; active: boolean }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 relative
      ${active ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}
    >
      {initials}
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
        ${active ? "bg-green-400" : "bg-gray-300"}`}
      />
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  currentUserId,
  onToggleActive,
  onChangeRole,
}: {
  user: AdminUser;
  currentUserId: string;
  isSuperAdmin: boolean;
  onToggleActive: (u: AdminUser) => void;
  onChangeRole: (u: AdminUser) => void;
}) {
  const isSelf = user.id === currentUserId;
  const roleClass = ROLE_COLORS[user.role] ?? ROLE_COLORS.Student;
  const date = new Date(user.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={`bg-white border rounded-2xl px-5 py-4 flex items-center gap-4 transition-all duration-200
      ${user.isActive ? "border-gray-200 hover:border-purple-200 hover:shadow-sm hover:shadow-purple-50" : "border-gray-100 opacity-60"}`}
    >
      <Avatar name={user.fullName} active={user.isActive} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">
            {user.fullName}
          </span>
          {isSelf && (
            <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold">
              You
            </span>
          )}
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleClass}`}
          >
            {user.role}
          </span>
          {!user.isActive && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">
              Inactive
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
          {user.phoneNumber && <span>📞 {user.phoneNumber}</span>}
          <span>🔑 {user.authProvider}</span>
          <span>📅 {date}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Change role */}
        <button
          onClick={() => onChangeRole(user)}
          disabled={isSelf}
          title={isSelf ? "Cannot change your own role" : "Change role"}
          className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
        >
          Role
        </button>

        {/* Activate / Deactivate */}
        <button
          onClick={() => onToggleActive(user)}
          disabled={isSelf && user.isActive}
          title={
            isSelf
              ? "Cannot deactivate your own account"
              : user.isActive
                ? "Deactivate"
                : "Activate"
          }
          className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed
            ${
              user.isActive
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-green-200 text-green-700 hover:bg-green-50"
            }`}
        >
          {user.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function UsersPage() {
  const { token, user: authUser } = useAuth();

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  // Role-change modal
  const [roleModal, setRoleModal] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = (authUser as any)?.role === "SuperAdmin";
  const currentUserId = (authUser as any)?.id ?? "";

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await usersAdminApi.getAll(
        {
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
        },
        token,
      );
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, page, debouncedSearch, roleFilter]);
  // ── Role Tabs ─────────────────────────────────────────────
  const ROLE_TABS = [
    { label: "All", value: "" },
    { label: "Students", value: "0" },
    { label: "Instructors", value: "1" },
    { label: "Admins", value: "2" },
    { label: "SuperAdmins", value: "3" },
  ];
  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleToggleActive = async (u: AdminUser) => {
    if (!token) return;
    try {
      if (u.isActive) {
        await usersAdminApi.deactivate(u.id, token);
        flash(`${u.fullName} deactivated.`);
      } else {
        await usersAdminApi.activate(u.id, token);
        flash(`${u.fullName} activated.`);
      }
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const openRoleModal = (u: AdminUser) => {
    setRoleModal(u);
    setNewRole(String(ROLE_INT[u.role] ?? 0));
  };

  const handleChangeRole = async () => {
    if (!roleModal || !token) return;
    setSaving(true);
    try {
      await usersAdminApi.changeRole(roleModal.id, parseInt(newRole), token);
      flash(`Role updated for ${roleModal.fullName}.`);
      setRoleModal(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Stats (from current page + total)
  const users = data?.users ?? [];

  const statCards = [
    {
      label: "Total Users",
      value: data?.totalCount ?? 0,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      label: "Active",
      value: users.filter((u) => u.isActive).length,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Instructors",
      value: users.filter((u) => u.role === "Instructor").length,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      label: "Students",
      value: users.filter((u) => u.role === "Student").length,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
  ];

  // Pagination
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="lf-page min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-page { font-family: 'DM Sans', sans-serif; }
        .lf-page .font-display { font-family: 'Syne', sans-serif; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Users
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data
              ? `${data.totalCount} user${data.totalCount !== 1 ? "s" : ""} total`
              : "Loading…"}
          </p>
        </div>

        {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}
        {success && <SuccessBanner msg={success} />}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={`${s.bg} rounded-2xl p-4 text-center`}
            >
              <div className={`font-display text-2xl font-bold ${s.color}`}>
                {s.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

{/* ── Filters ── */}
<div className="flex flex-col gap-4 mb-5">
  {/* Role Tabs */}
  <div className="flex flex-wrap gap-2">
    {ROLE_TABS.map((tab) => {
      const active = roleFilter === tab.value;

      return (
        <button
          key={tab.value}
          onClick={() => {
            setRoleFilter(tab.value);
            setPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border
            ${
              active
                ? "bg-[#6d28d9] text-white border-[#6d28d9]"
                : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700"
            }`}
        >
          {tab.label}
        </button>
      );
    })}
  </div>

  {/* Search */}
  <div className="relative flex-1 min-w-[220px]">
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>

    <input
      type="text"
      placeholder="Search name or email…"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 bg-white"
    />

    {search && (
      <button
        onClick={() => setSearch("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    )}
  </div>

  <span className="text-xs text-gray-400">
    Page {page} of {totalPages}
  </span>
</div>

        {/* ── List ── */}
        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-semibold text-gray-600">
              No users match your filters.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("");
                setPage(1);
              }}
              className="mt-3 text-sm text-[#6d28d9] underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                currentUserId={currentUserId}
                isSuperAdmin={isSuperAdmin}
                onToggleActive={handleToggleActive}
                onChangeRole={openRoleModal}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm rounded-xl font-semibold transition-colors
                  ${p === page ? "bg-[#6d28d9] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Change Role Modal ── */}
      {roleModal && (
        <Modal title="Change Role" onClose={() => setRoleModal(null)}>
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={roleModal.fullName} active={roleModal.isActive} />
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {roleModal.fullName}
                </p>
                <p className="text-xs text-gray-500">{roleModal.email}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1 font-semibold">
              Current role:{" "}
              <span
                className={`px-2 py-0.5 rounded-full border text-[11px] ${ROLE_COLORS[roleModal.role]}`}
              >
                {roleModal.role}
              </span>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              New Role
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "0",
                  label: "Student",
                  desc: "Can enroll in and view courses",
                },
                {
                  value: "1",
                  label: "Instructor",
                  desc: "Can create and manage courses",
                },
                { value: "2", label: "Admin", desc: "Full admin access" },
                ...(isSuperAdmin
                  ? [
                      {
                        value: "3",
                        label: "SuperAdmin",
                        desc: "Unrestricted platform access",
                      },
                    ]
                  : []),
              ].map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${newRole === r.value ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <input
                    type="radio"
                    name="newRole"
                    value={r.value}
                    checked={newRole === r.value}
                    onChange={() => setNewRole(r.value)}
                    className="accent-[#6d28d9]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {r.label}
                    </p>
                    <p className="text-xs text-gray-500">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setRoleModal(null)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleChangeRole}
              disabled={saving || newRole === String(ROLE_INT[roleModal.role])}
              className="px-4 py-2 text-sm bg-[#6d28d9] text-white rounded-xl font-semibold hover:bg-[#5b21b6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Apply Role"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
