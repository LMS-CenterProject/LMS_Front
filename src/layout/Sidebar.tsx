import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasPermission, toRole } from "../utils/rbac";
import type { Role } from "../utils/rbac";
import { NAV_GROUPS } from "../config/navigation";
import type { NavItem } from "../config/navigation";

// ─── Role badge colors ────────────────────────────────────────────────────────

const ROLE_BADGE: Record<Role, { bg: string; text: string }> = {
  Student: { bg: "bg-violet-50", text: "text-[#6d28d9]" },
  Instructor: { bg: "bg-amber-50", text: "text-amber-600" },
  Admin: { bg: "bg-red-50", text: "text-red-600" },
  SuperAdmin: { bg: "bg-gray-100", text: "text-gray-600" },
};

// ─── Sidebar-only icons (nav item icons live in navigation.tsx) ───────────────

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
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
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
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
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
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
);

const LogoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
    <path d="M9.664 16.257l-4.413-1.89v-3.927l4.413 1.89v3.927zm1.34.491l4.413-1.89v-3.927l-4.413 1.89v3.927zM5.25 9.448L3.006 8.482 10 5.554l6.994 2.928L14.75 9.45 10 7.48 5.25 9.448z" />
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsible?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onClose,
  collapsible = true,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────
  const userRole = toRole(user?.role);
  const roleBadge = ROLE_BADGE[userRole] ?? ROLE_BADGE.Student;
  const isActive = (path: string) => location.pathname === path;

  /**
   * Single permission check used by BOTH the sidebar visibility
   * and the route guard in ProtectedRoute — they now always agree.
   */
  const canSee = (item: NavItem): boolean =>
    hasPermission(userRole, item.roles);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
    onClose();
  };

  // ── Sizing ─────────────────────────────────────────────────────────────────
  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          flex flex-col bg-white border-r border-gray-100
          transition-[width,transform] duration-200 ease-in-out
          ${sidebarWidth}
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ── Logo + collapse toggle ─────────────────────────────────────── */}
        <div
          className={`
            flex items-center h-16 border-b border-gray-100 shrink-0
            ${collapsed ? "justify-center px-0" : "px-4 justify-between"}
          `}
        >
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#6d28d9] flex items-center justify-center shrink-0">
                <LogoIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-base truncate">
                Learn<span className="text-[#6d28d9]">Forge</span>
              </span>
            </Link>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {/* Desktop collapse toggle */}
            {collapsible && (
              <button
                onClick={() => setCollapsed((v) => !v)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden lg:flex w-7 h-7 items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeftIcon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    collapsed ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}

            {/* Mobile close */}
            <button
              onClick={onClose}
              className="lg:hidden w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-3">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(canSee);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupLabel}>
                {/* Group label (expanded) or divider (collapsed) */}
                {collapsed ? (
                  <div className="border-t border-gray-100 my-2" />
                ) : (
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
                    {group.groupLabel}
                  </p>
                )}

                <div className="space-y-0.5">
                  {visibleItems.map(({ icon: NavIcon, label, path, badge }) => {
                    const active = isActive(path);

                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={onClose}
                        title={collapsed ? label : undefined}
                        className={`
                          relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl
                          text-sm font-medium transition-all duration-150
                          ${collapsed ? "justify-center" : ""}
                          ${
                            active
                              ? "bg-purple-50 text-[#6d28d9]"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }
                        `}
                      >
                        {/* Icon */}
                        <NavIcon
                          className={`w-5 h-5 shrink-0 transition-colors ${
                            active ? "text-[#6d28d9]" : "text-gray-400"
                          }`}
                        />

                        {/* Label + badge (expanded only) */}
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{label}</span>
                            {badge !== undefined && (
                              <span
                                className={`
                                  text-xs font-semibold px-1.5 py-0.5 rounded-full shrink-0
                                  ${
                                    active
                                      ? "bg-[#6d28d9] text-white"
                                      : "bg-gray-100 text-gray-500"
                                  }
                                `}
                              >
                                {badge}
                              </span>
                            )}
                          </>
                        )}

                        {/* Badge dot (collapsed only) */}
                        {collapsed && badge !== undefined && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-[#6d28d9] rounded-full" />
                        )}

                        {/* Active indicator pill */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#6d28d9] rounded-r-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── User footer ───────────────────────────────────────────────── */}
        <div
          className={`
            border-t border-gray-100 p-3 shrink-0
            ${collapsed ? "flex justify-center" : ""}
          `}
        >
          {collapsed ? (
            /* Collapsed: avatar only */
            <div className="w-9 h-9 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (user?.name?.[0]?.toUpperCase() ?? "L")
              )}
            </div>
          ) : (
            /* Expanded: avatar + name + role + logout */
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user?.name?.[0]?.toUpperCase() ?? "L")
                )}
              </div>

              {/* Name + role badge */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name ?? "Learner"}
                </p>
                <span
                  className={`
                    inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5
                    ${roleBadge.bg} ${roleBadge.text}
                  `}
                >
                  {userRole}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Sign out"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
