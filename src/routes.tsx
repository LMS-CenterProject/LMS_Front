import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// ─── Pages ────────────────────────────────────────────────────────────────────
import HomePage from "./pages/Home/Homepage";
// import LoginPage from "./pages/Auth/Loginpage";
import RegisterPage from "./pages/Auth/Registerpage";
import DashboardPage from "./pages/Dashboard/Dashboard";
import GoogleLoginButton from "./pages/Auth/Google";
// ─── Guards ───────────────────────────────────────────────────────────────────

/** Redirect authenticated users away from auth pages */
const GuestGuard: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

/** Protect pages that require authentication */
const AuthGuard: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// ─── Loader ───────────────────────────────────────────────────────────────────

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      <p className="text-slate-400 text-sm tracking-widest uppercase">
        Loading
      </p>
    </div>
  </div>
);

// ─── Router ───────────────────────────────────────────────────────────────────

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />

      {/* Guest only (redirect if already logged in) */}
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<GoogleLoginButton />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected */}
      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Add more protected routes here */}
        {/* <Route path="/courses" element={<CoursesPage />} /> */}
        {/* <Route path="/courses/:id" element={<CourseDetailPage />} /> */}
        {/* <Route path="/profile" element={<ProfilePage />} /> */}
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
            <div className="text-center space-y-4">
              <h1 className="text-8xl font-bold text-amber-400/30 font-display">
                404
              </h1>
              <p className="text-slate-400">Page not found</p>
              <a
                href="/"
                className="inline-block text-amber-400 hover:underline text-sm"
              >
                ← Back to home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRouter;
