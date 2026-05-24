// AppRouter.tsx
import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import PublicLayout from "./layout/PublicLayout";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ALL_NAV_ITEMS } from "./config/navigation";
import type { Role } from "./utils/rbac";
import CourseGuard from "./components/CourseGuard";

import HomePage from "./pages/Home/Homepage";
import AboutPage from "./pages/About/AboutPage";
import LoginPage from "./pages/Auth/Loginpage";
import RegisterPage from "./pages/Auth/Registerpage";
import NotFound from "./pages/NotFound/NotFound";

// Dynamic content pages
import SectionsPage from "./pages/ContentPage/SectionsPage";
import LessonsPage from "./pages/ContentPage/LessonsPage";

// ─── Layout wrappers ──────────────────────────────────────────────────────────

const PublicLayoutRoute = () => (
  <PublicLayout>
    <Outlet />
  </PublicLayout>
);
const AuthLayoutRoute = () => (
  <PublicLayout hideNav>
    <Outlet />
  </PublicLayout>
);
const AppLayoutRoute = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

// ─── Guards ───────────────────────────────────────────────────────────────────

const GuestGuard: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-[#6d28d9] border-t-transparent animate-spin" />
      <p className="text-gray-400 text-sm tracking-widest uppercase">Loading</p>
    </div>
  </div>
);

// ─── Group nav items by their roles key ──────────────────────────────────────

type RouteGroup = { roles: Role[] | undefined; items: typeof ALL_NAV_ITEMS };

const ROUTE_GROUPS: RouteGroup[] = Object.values(
  ALL_NAV_ITEMS.reduce<Record<string, RouteGroup>>((acc, item) => {
    const key = JSON.stringify(item.roles ?? null);
    if (!acc[key]) acc[key] = { roles: item.roles, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {}),
);

// ─── Router ───────────────────────────────────────────────────────────────────

const AppRouter: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route element={<PublicLayoutRoute />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Route>

    {/* Auth pages — guests only */}
    <Route element={<AuthLayoutRoute />}>
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Route>

    {/* Protected — includes dynamic content routes */}
    <Route element={<AppLayoutRoute />}>
      {/* Dynamic course content routes (accessible to all authenticated users) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<CourseGuard />}>
          <Route
            path="/courses/:courseId/sections"
            element={<SectionsPage />}
          />
          <Route
            path="/courses/:courseId/sections/:sectionId/lessons"
            element={<LessonsPage />}
          />
        </Route>
      </Route>

      {/* Nav-config-driven routes grouped by role */}
      {ROUTE_GROUPS.map(({ roles, items }) => (
        <Route
          key={JSON.stringify(roles ?? null)}
          element={<ProtectedRoute allowedRoles={roles} />}
        >
          {items.map(({ path, component: Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
        </Route>
      ))}
    </Route>

    {/* 403 */}
    <Route
      path="/unauthorized"
      element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center space-y-4">
            <h1 className="text-8xl font-black text-gray-200">403</h1>
            <p className="text-gray-500 font-medium">
              You don't have access to this page.
            </p>
            <a
              href="/dashboard"
              className="inline-block text-[#6d28d9] hover:underline font-semibold text-sm"
            >
              ← Back to dashboard
            </a>
          </div>
        </div>
      }
    />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRouter;
