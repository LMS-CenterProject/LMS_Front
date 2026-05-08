import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useRef } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationsModal from "../components/Notifications";

interface AppLayoutProps {
  children: React.ReactNode;
  /** Page title shown in the header strip below the main topbar */
  pageTitle?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, pageTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/");
    setUserMenuOpen(false);
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-app-layout * { font-family: 'DM Sans', sans-serif; }
        .lf-app-layout .font-display { font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>

      <div className="lf-app-layout min-h-screen bg-gray-50 flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsible
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header bar */}
          <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0 shadow-sm">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Page title */}
            {pageTitle && (
              <h1 className="font-semibold text-gray-900 text-base">
                {pageTitle}
              </h1>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Notifications */}
            <NotificationsModal align="right" />

            {/* Help */}
            <div ref={userRef} className="relative shrink-0">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                  {user?.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name || "avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full">
                      {user?.name?.charAt(0)?.toUpperCase() || "L"}
                    </span>
                  )}
                </div>
                <svg
                  className="w-3.5 h-3.5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="lf-user-menu absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900 text-sm">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  {[
                    { label: "Dashboard", to: "/dashboard", icon: "🎯" },
                    { label: "My Courses", to: "/courses", icon: "📚" },
                    { label: "Profile", to: "/profile", icon: "👤" },
                    { label: "Settings", to: "/settings", icon: "⚙️" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span>🚪</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </>
  );
};

export default AppLayout;
