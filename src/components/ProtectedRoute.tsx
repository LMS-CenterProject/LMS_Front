import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasPermission, toRole } from "../utils/rbac";
import type { Role } from "../utils/rbac";

interface Props {
  /** Roles that may access this subtree. Omit = everyone authenticated. */
  allowedRoles?: Role[];
  /** Where to send unauthorized (but authenticated) users. */
  unauthorizedPath?: string;
}

/**
 * Wrap any <Route> with this to require:
 *   1. Authentication (redirects → /login if missing)
 *   2. Optionally: a minimum role (redirects → unauthorizedPath if insufficient)
 *
 * Renders a loader while auth state is resolving so there's no flash redirect.
 */
const ProtectedRoute: React.FC<Props> = ({
  allowedRoles,
  unauthorizedPath = "/unauthorized",
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const userRole = toRole(user.role);

  if (!hasPermission(userRole, allowedRoles)) {
    return <Navigate to={unauthorizedPath} replace />;
  }

  return <Outlet />;
};

// ─── Inline loader (avoids extra file for a tiny component) ──────────────────

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#6d28d9] border-t-transparent animate-spin" />
      <p className="text-gray-400 text-sm tracking-widest uppercase">Loading</p>
    </div>
  </div>
);

export default ProtectedRoute;
