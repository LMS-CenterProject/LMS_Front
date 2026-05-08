// src/utils/rbac.ts

export type Role = "Student" | "Instructor" | "Admin" | "SuperAdmin";

export const ROLE_LEVEL: Record<Role, number> = {
  Student: 1,
  Instructor: 2,
  Admin: 3,
  SuperAdmin: 4,
};

export const toRole = (raw?: string | null): Role => {
  if (!raw) return "Student";
  if (raw in ROLE_LEVEL) return raw as Role;
  const match = (Object.keys(ROLE_LEVEL) as Role[]).find(
    (r) => r.toLowerCase() === raw.toLowerCase(),
  );
  return match ?? "Student";
};

/**
 * Exact role match — no hierarchy.
 * The user must be explicitly listed in allowedRoles to get access.
 *
 * roles: ["Admin"]                    → Admin only
 * roles: ["Admin", "SuperAdmin"]      → Admin and SuperAdmin
 * roles: ["Instructor", "Admin", "SuperAdmin"] → those three exactly
 * roles: undefined                    → everyone
 */
export const hasPermission = (
  userRole: Role,
  allowedRoles?: Role[],
): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};
