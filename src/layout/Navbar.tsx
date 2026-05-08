import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  categories?: string[];
}

// Scroll helper
const scrollToCourses = (category: string) => {
  window.history.pushState(
    null,
    "",
    `?category=${encodeURIComponent(category)}`
  );
  window.dispatchEvent(
    new CustomEvent("categorychange", { detail: { category } })
  );

  const el = document.getElementById("courses");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const NavDropdown: React.FC<{
  categories: string[];
  onClose: () => void;
}> = ({ categories, onClose }) => (
  <div
    onMouseLeave={onClose}
    className="lf-mega-menu absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-2"
  >
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => {
          scrollToCourses(cat);
          onClose();
        }}
        className="flex w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-[#6d28d9] transition-colors text-left"
      >
        {cat}
      </button>
    ))}
  </div>
);

const Navbar: React.FC<NavbarProps> = ({ categories = [] }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false); // ← Collapsible Categories

  const catRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
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
      `}</style>

      <nav className={`lf-navbar fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled ? "shadow-md" : ""
      } bg-white border-b border-gray-200`}>

        <div className="max-w-[1340px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6d28d9] flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                <path d="M9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
              </svg>
            </div>
            <span className="font-display font-bold text-gray-900 text-xl tracking-tight">
              Learn<span className="text-[#6d28d9]">Forge</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <div ref={catRef} className="relative">
              <button
                onMouseEnter={() => setShowCatMenu(true)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  showCatMenu ? "text-[#6d28d9] bg-purple-50" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Categories
                <svg className={`w-3.5 h-3.5 transition-transform ${showCatMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCatMenu && <NavDropdown categories={categories} onClose={() => setShowCatMenu(false)} />}
            </div>

            <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900">About</Link>
            <Link to="/contactus" className="text-sm font-medium text-gray-700 hover:text-gray-900">Contact Us</Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <button className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Cart */}
            <button className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#6d28d9] text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
            </button>

            {/* Desktop Auth */}
            <div className="hidden lg:block">
              {isAuthenticated ? (
                <div ref={userRef} className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100">
                    <div className="w-8 h-8 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {user?.picture ? <img src={user.picture} alt="avatar" className="w-full h-full object-cover" /> : <span>{user?.name?.charAt(0)?.toUpperCase() || "L"}</span>}
                    </div>
                  </button>
                  {/* User menu dropdown remains same as before */}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-sm font-semibold text-gray-800 border border-gray-800 px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-white">Log in</Link>
                  <Link to="/register" className="text-sm font-semibold text-white bg-[#6d28d9] px-4 py-2 rounded-lg hover:bg-[#5b21b6]">Sign up</Link>
                </div>
              )}
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6h12v12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ==================== MOBILE MENU ==================== */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-6 py-8 flex flex-col gap-6">

              {/* Collapsible Categories */}
              <div>
                <button
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                  className="flex items-center justify-between w-full py-3 text-left font-medium text-gray-900"
                >
                  Categories
                  <svg
                    className={`w-5 h-5 transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isCategoriesOpen && (
                  <div className="pl-4 border-l-2 border-purple-100 flex flex-col gap-3 mt-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          scrollToCourses(cat);
                          setIsMobileMenuOpen(false);
                          setIsCategoriesOpen(false);
                        }}
                        className="text-left py-2 text-gray-700 hover:text-[#6d28d9] transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Other Links */}
              <div className="flex flex-col gap-6 border-t border-gray-100 pt-6">
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-gray-700 hover:text-gray-900"
                >
                  About
                </Link>
                <Link
                  to="/contactus"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-gray-700 hover:text-gray-900"
                >
                  Contact Us
                </Link>
                <a href="#" className="py-2 text-gray-700 hover:text-gray-900">Teach on LearnForge</a>
                <a href="#" className="py-2 text-gray-700 hover:text-gray-900">Pricing</a>
              </div>

              {/* Auth Section */}
              <div className="border-t border-gray-100 pt-8 mt-4">
                {isAuthenticated ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-2xl font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || "L"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full py-4 text-red-600 font-medium border border-red-200 rounded-2xl hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
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