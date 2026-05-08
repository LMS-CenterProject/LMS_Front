import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  categories?: string[]; // real categories passed from parent
}

// ── shared scroll helper ────────────────────────────────────────────────────
const scrollToCourses = (category: string) => {
  history.pushState(null, "", `?category=${encodeURIComponent(category)}`);
  window.dispatchEvent(
    new CustomEvent("categorychange", { detail: { category } }),
  );
  const el = document.getElementById("courses");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};
// ── Simplified dropdown (no subcategories) ──────────────────────────────────
const NavDropdown: React.FC<{
  categories: string[];
  onClose: () => void;
}> = ({ categories, onClose }) => (
  <div
    onMouseLeave={onClose}
    className="lf-mega-menu absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-2 "
  >
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => {
          scrollToCourses(cat);
          onClose();
        }}
        className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#6d28d9] transition-colors cursor-pointer"
      >
        {cat}
      </button>
    ))}
  </div>
);

// ── Navbar ──────────────────────────────────────────────────────────────────
const Navbar: React.FC<NavbarProps> = ({ categories = [] }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const location = useLocation(); // ← add this
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setUserMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-navbar * { font-family: 'DM Sans', sans-serif; }
        .lf-navbar .font-display { font-family: 'Outfit', sans-serif; }
        .lf-mega-menu { animation: lf-fade-in 0.15s ease; }
        @keyframes lf-fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lf-search-ring:focus-within { box-shadow: 0 0 0 3px rgba(109,40,217,0.15); }
        .lf-user-menu { animation: lf-fade-in 0.15s ease; }
      `}</style>

      <nav
        className={`lf-navbar fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled ? "shadow-md" : ""
        } bg-white border-b border-gray-200`}
      >
        <div className="max-w-[1340px] mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2 shrink-0 mr-1"
          >
            <div className="w-8 h-8 rounded-lg bg-[#6d28d9] flex items-center justify-center">
              <svg
                className="w-4.5 h-4.5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                <path d="M9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
              </svg>
            </div>
            <span className="font-display font-bold text-gray-900 text-xl tracking-tight">
              Learn<span className="text-[#6d28d9]">Forge</span>
            </span>
          </Link>

          {/* Categories trigger */}
          <div ref={catRef} className="hidden lg:block relative shrink-0 ">
            <button
              onMouseEnter={() => setShowCatMenu(true)}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg  cursor-pointer transition-colors ${
                showCatMenu
                  ? "text-[#6d28d9] bg-purple-50"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              }`}
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Categories
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showCatMenu ? "rotate-180" : ""}`}
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
            {showCatMenu && (
              <NavDropdown
                categories={categories}
                onClose={() => setShowCatMenu(false)}
              />
            )}
          </div>
          <ul className="flex justify-between">
            <Link
              to="/about"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              About
            </Link>
            <Link
              to="/contactus"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Contact Us
            </Link>
          </ul>

          {/* Right nav links */}
          <div className="hidden lg:flex items-center gap-1 shrink-0 ml-auto">
            {["Teach on LearnForge", "Pricing"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Wishlist */}
          <button className="hidden lg:flex w-9 h-9 items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Cart */}
          <button className="flex w-9 h-9 items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#6d28d9] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </button>

          {/* Auth */}
          {isAuthenticated ? (
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
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-800 border border-gray-800 px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-150"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-[#6d28d9] px-4 py-2 rounded-lg hover:bg-[#5b21b6] transition-all duration-150"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
