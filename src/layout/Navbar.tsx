import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  categories?: string[];
}

const Navbar: React.FC<NavbarProps> = ({ categories = [] }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);

  // Desktop category menu
  const [showCatMenu, setShowCatMenu] = useState(false);

  // User dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  // Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  const catRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // =========================
  // Scroll state
  // =========================
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // =========================
  // Outside click handling
  // =========================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setShowCatMenu(false);
      }

      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // =========================
  // Helpers
  // =========================
  const handleLogout = () => {
    logout();

    setUserMenuOpen(false);
    setIsMobileMenuOpen(false);

    navigate("/");
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    setIsMobileMenuOpen(false);

    if (location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      navigate("/");
    }
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/?category=${encodeURIComponent(category)}`);

    window.dispatchEvent(
      new CustomEvent("categorychange", {
        detail: { category },
      }),
    );

    setTimeout(() => {
      document.getElementById("courses")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);

    setShowCatMenu(false);
    setIsMobileMenuOpen(false);
    setIsCategoriesOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .lf-navbar * {
          font-family: 'DM Sans', sans-serif;
        }

        .lf-navbar .font-display {
          font-family: 'Outfit', sans-serif;
        }

        .lf-dropdown {
          animation: fadeIn .15s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <nav
        className={`lf-navbar fixed top-0 inset-x-0 z-50 transition-all duration-200 bg-white border-b border-gray-200 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="max-w-[1340px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* =========================
              Logo
          ========================= */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2"
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
              Learn
              <span className="text-[#6d28d9]">Forge</span>
            </span>
          </Link>

          {/* =========================
              Desktop Navigation
          ========================= */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Categories */}
            <div ref={catRef} className="relative">
              <button
                onMouseEnter={() => setShowCatMenu(true)}
                onClick={() => setShowCatMenu((prev) => !prev)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  showCatMenu
                    ? "text-[#6d28d9] bg-purple-50"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Categories
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${
                    showCatMenu ? "rotate-180" : ""
                  }`}
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
                <div
                  className="lf-dropdown absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 py-2"
                  onMouseLeave={() => setShowCatMenu(false)}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#6d28d9] transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/about"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              About
            </Link>

            <Link
              to="/contactus"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Contact Us
            </Link>
          </div>

          {/* =========================
              Right Side
          ========================= */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <button className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
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
            <button className="relative w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
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

            {/* =========================
                Desktop Auth
            ========================= */}
            <div className="hidden lg:block">
              {isAuthenticated ? (
                <div ref={userRef} className="relative">
                  {/* Avatar Button */}
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#6d28d9] flex items-center justify-center text-white font-bold overflow-hidden">
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {user?.name?.charAt(0)?.toUpperCase() || "L"}
                        </span>
                      )}
                    </div>

                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        userMenuOpen ? "rotate-180" : ""
                      }`}
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

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="lf-dropdown absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      {/* User Info */}
                      <div className="px-5 py-4 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">
                          {user?.name}
                        </p>

                        <p className="text-sm text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Profile
                        </Link>

                        <Link
                          to="/courses"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          My Courses
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Settings
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 rounded-xl text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-gray-800 border border-gray-800 px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/register"
                    className="text-sm font-semibold text-white bg-[#6d28d9] px-4 py-2 rounded-lg hover:bg-[#5b21b6] transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

            {/* =========================
                Mobile Toggle
            ========================= */}
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* =========================
            MOBILE MENU
        ========================= */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-6 py-8 flex flex-col gap-6">
              {/* Categories */}
              <div>
                <button
                  onClick={() => setIsCategoriesOpen((prev) => !prev)}
                  className="flex items-center justify-between w-full py-3 text-left font-medium text-gray-900"
                >
                  Categories
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      isCategoriesOpen ? "rotate-180" : ""
                    }`}
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

                {isCategoriesOpen && (
                  <div className="pl-4 border-l-2 border-purple-100 flex flex-col gap-2 mt-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className="text-left py-2 text-gray-700 hover:text-[#6d28d9] transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="border-t border-gray-100 pt-6 flex flex-col gap-5">
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-700"
                >
                  About
                </Link>

                <Link
                  to="/contactus"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-700"
                >
                  Contact Us
                </Link>

                <a href="#" className="text-gray-700">
                  Teach on LearnForge
                </a>

                <a href="#" className="text-gray-700">
                  Pricing
                </a>
              </div>

              {/* Auth */}
              <div className="border-t border-gray-100 pt-8">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    {/* User Header */}
                    <button
                      onClick={() => setMobileUserMenuOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                          {user?.picture ? (
                            <img
                              src={user.picture}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {user?.name?.charAt(0)?.toUpperCase() || "L"}
                            </span>
                          )}
                        </div>

                        <div className="text-left">
                          <p className="font-semibold text-gray-900">
                            {user?.name}
                          </p>

                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          mobileUserMenuOpen ? "rotate-180" : ""
                        }`}
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

                    {/* Dropdown */}
                    {mobileUserMenuOpen && (
                      <div className="ml-2 border-l-2 border-purple-100 pl-5 flex flex-col gap-1 pt-2">
                        <Link
                          to="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-3 text-gray-700 hover:text-[#6d28d9] transition-colors"
                        >
                          Profile
                        </Link>

                        <Link
                          to="/courses"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-3 text-gray-700 hover:text-[#6d28d9] transition-colors"
                        >
                          My Courses
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="py-3 text-gray-700 hover:text-[#6d28d9] transition-colors"
                        >
                          Settings
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="text-left py-3 text-red-600 hover:text-red-700 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-4 text-center border border-gray-800 rounded-2xl font-semibold hover:bg-gray-50"
                    >
                      Log in
                    </Link>

                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-4 text-center bg-[#6d28d9] text-white rounded-2xl font-semibold"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
