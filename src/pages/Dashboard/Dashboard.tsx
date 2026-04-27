import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
  instructor: string;
  category: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessed: string;
  accent: string;
  icon: string;
  nextLesson: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  color: string;
  earnedDate?: string;
}

interface ActivityDay {
  day: string;
  minutes: number;
}

interface UpcomingItem {
  id: string;
  title: string;
  course: string;
  dueIn: string;
  type: "quiz" | "assignment" | "live";
  accent: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MY_COURSES: Course[] = [
  {
    id: "c1",
    title: "Full-Stack React Development",
    instructor: "Sarah Chen",
    category: "Engineering",
    progress: 68,
    totalLessons: 48,
    completedLessons: 33,
    lastAccessed: "2h ago",
    accent: "#f59e0b",
    icon: "⚛️",
    nextLesson: "Custom Hooks Deep Dive",
  },
  {
    id: "c2",
    title: "Machine Learning Foundations",
    instructor: "Dr. James Park",
    category: "Data Science",
    progress: 42,
    totalLessons: 64,
    completedLessons: 27,
    lastAccessed: "Yesterday",
    accent: "#10b981",
    icon: "🧠",
    nextLesson: "Linear Regression Models",
  },
  {
    id: "c3",
    title: "UX Design Systems",
    instructor: "Maya Torres",
    category: "Design",
    progress: 91,
    totalLessons: 32,
    completedLessons: 29,
    lastAccessed: "3d ago",
    accent: "#8b5cf6",
    icon: "🎨",
    nextLesson: "Final Portfolio Project",
  },
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "a1",
    title: "First Steps",
    description: "Completed your first lesson",
    icon: "🚀",
    earned: true,
    color: "#f59e0b",
    earnedDate: "Jan 12",
  },
  {
    id: "a2",
    title: "Week Streak",
    description: "Studied 7 days in a row",
    icon: "🔥",
    earned: true,
    color: "#ef4444",
    earnedDate: "Jan 18",
  },
  {
    id: "a3",
    title: "Fast Learner",
    description: "Finished a course in record time",
    icon: "⚡",
    earned: true,
    color: "#3b82f6",
    earnedDate: "Feb 2",
  },
  {
    id: "a4",
    title: "Perfect Score",
    description: "100% on a quiz",
    icon: "🎯",
    earned: false,
    color: "#10b981",
  },
  {
    id: "a5",
    title: "Night Owl",
    description: "Study after midnight",
    icon: "🦉",
    earned: false,
    color: "#8b5cf6",
  },
  {
    id: "a6",
    title: "Scholar",
    description: "Complete 5 courses",
    icon: "🎓",
    earned: false,
    color: "#f59e0b",
  },
];

const ACTIVITY: ActivityDay[] = [
  { day: "Mon", minutes: 45 },
  { day: "Tue", minutes: 90 },
  { day: "Wed", minutes: 30 },
  { day: "Thu", minutes: 120 },
  { day: "Fri", minutes: 75 },
  { day: "Sat", minutes: 150 },
  { day: "Sun", minutes: 60 },
];

const UPCOMING: UpcomingItem[] = [
  {
    id: "u1",
    title: "React Hooks Quiz",
    course: "Full-Stack React",
    dueIn: "Today",
    type: "quiz",
    accent: "#f59e0b",
  },
  {
    id: "u2",
    title: "ML Assignment #3",
    course: "ML Foundations",
    dueIn: "2 days",
    type: "assignment",
    accent: "#10b981",
  },
  {
    id: "u3",
    title: "Live Design Review",
    course: "UX Design Systems",
    dueIn: "4 days",
    type: "live",
    accent: "#8b5cf6",
  },
];

const NAV_ITEMS = [
  { icon: GridIcon, label: "Dashboard", path: "/dashboard", active: true },
  { icon: BookIcon, label: "My Courses", path: "/courses", active: false },
  { icon: ExploreIcon, label: "Explore", path: "/explore", active: false },
  { icon: CalendarIcon, label: "Schedule", path: "/schedule", active: false },
  {
    icon: TrophyIcon,
    label: "Achievements",
    path: "/achievements",
    active: false,
  },
  { icon: ChartIcon, label: "Analytics", path: "/analytics", active: false },
];

// ─── SVG Icon Components ──────────────────────────────────────────────────────

function GridIcon({ className }: { className?: string }) {
  return (
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
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}
function BookIcon({ className }: { className?: string }) {
  return (
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
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
function ExploreIcon({ className }: { className?: string }) {
  return (
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
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}
function CalendarIcon({ className }: { className?: string }) {
  return (
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
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
function TrophyIcon({ className }: { className?: string }) {
  return (
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
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  );
}
function ChartIcon({ className }: { className?: string }) {
  return (
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
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

// ─── Animated Counter ──────────────────────────────────────────────────────────

const Counter: React.FC<{
  value: number;
  suffix?: string;
  duration?: number;
}> = ({ value, suffix = "", duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    ref.current = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        if (ref.current) clearInterval(ref.current);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [value, duration]);

  return (
    <>
      {count}
      {suffix}
    </>
  );
};

// ─── Activity Bar Chart ────────────────────────────────────────────────────────

const ActivityChart: React.FC<{ data: ActivityDay[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.minutes));
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => {
        const pct = (d.minutes / max) * 100;
        return (
          <div
            key={d.day}
            className="flex-1 flex flex-col items-center gap-1.5 group"
          >
            <div className="relative w-full flex items-end justify-center h-20">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 pointer-events-none">
                <div className="bg-[#1e2230] border border-white/10 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                  {d.minutes}m
                </div>
              </div>
              <div
                className="w-full rounded-t-md transition-all duration-700 ease-out group-hover:opacity-100"
                style={{
                  height: animated ? `${pct}%` : "0%",
                  transitionDelay: `${i * 60}ms`,
                  background: `linear-gradient(to top, #f59e0b, #fbbf24)`,
                  opacity: 0.6 + (pct / max) * 0.4,
                  minHeight: animated ? "4px" : "0",
                }}
              />
            </div>
            <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">
              {d.day}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Circular Progress ────────────────────────────────────────────────────────

const CircularProgress: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  color: string;
}> = ({ value, size = 56, stroke = 4, color }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 200);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (animated / 100) * circ}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const totalMinutes = ACTIVITY.reduce((a, d) => a + d.minutes, 0);
  const earnedCount = ACHIEVEMENTS.filter((a) => a.earned).length;

  return (
    <div className="min-h-screen bg-[#0d0f14] text-slate-300 flex font-sans overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Syne', sans-serif; }

        .sidebar-item { transition: all 0.18s ease; }
        .sidebar-item:hover { background: rgba(255,255,255,0.04); }
        .sidebar-item.active { background: rgba(245,158,11,0.1); }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .delay-1 { animation-delay:0.05s; opacity:0; }
        .delay-2 { animation-delay:0.12s; opacity:0; }
        .delay-3 { animation-delay:0.19s; opacity:0; }
        .delay-4 { animation-delay:0.26s; opacity:0; }
        .delay-5 { animation-delay:0.33s; opacity:0; }

        .card { background:#13161d; border:1px solid rgba(255,255,255,0.05); border-radius:16px; }
        .card:hover { border-color:rgba(255,255,255,0.09); }

        .progress-bar-wrap { background:rgba(255,255,255,0.05); border-radius:999px; overflow:hidden; }
        .progress-bar { border-radius:999px; transition: width 1.2s cubic-bezier(.4,0,.2,1); }

        /* scrollbar */
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:999px; }

        @keyframes pulse-dot {
          0%,100%{transform:scale(1);opacity:1}
          50%{transform:scale(1.5);opacity:0.7}
        }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

        .notif-panel {
          position:absolute; top:calc(100% + 12px); right:0; width:320px;
          background:#13161d; border:1px solid rgba(255,255,255,0.08);
          border-radius:16px; z-index:50; overflow:hidden;
          animation: fadeUp 0.2s ease forwards;
        }
      `}</style>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-[#0f1117] border-r border-white/5 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-[#0d0f14]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              <path d="M9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
            </svg>
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            LearnForge
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-3">
            Main
          </p>
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = label === activeNav;
            return (
              <Link
                key={label}
                to={path}
                onClick={() => {
                  setActiveNav(label);
                  setSidebarOpen(false);
                }}
                className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
                  isActive
                    ? "active text-amber-400"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/5">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-3">
              Account
            </p>
            <Link
              to="/profile"
              className="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profile
            </Link>
            <Link
              to="/settings"
              className="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </Link>
          </div>
        </nav>

        {/* User card at bottom */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/3">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-[#0d0f14] text-sm font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user?.name ?? "Learner"}
              </p>
              <p className="text-slate-600 text-xs capitalize">
                {user?.role ?? "student"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-20 bg-[#0d0f14]/90 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 hover:text-white transition-colors"
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

          {/* Search */}
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600"
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
                placeholder="Search courses…"
                className="w-full bg-white/4 border border-white/6 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-9 h-9 rounded-xl bg-white/4 border border-white/6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/6 transition-all"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="pulse-dot absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
              </button>

              {notifOpen && (
                <div className="notif-panel shadow-2xl">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-white text-sm font-semibold">
                      Notifications
                    </span>
                    <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                      3 new
                    </span>
                  </div>
                  {[
                    {
                      icon: "🎯",
                      text: "New quiz available in React course",
                      time: "5m ago",
                    },
                    {
                      icon: "🏆",
                      text: "You earned a new achievement!",
                      time: "2h ago",
                    },
                    {
                      icon: "📚",
                      text: "ML assignment deadline in 2 days",
                      time: "1d ago",
                    },
                  ].map((n, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors cursor-pointer border-b border-white/4 last:border-0"
                    >
                      <span className="text-xl shrink-0">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 leading-snug">
                          {n.text}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {n.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 text-center">
                    <button className="text-xs text-amber-400 hover:text-amber-300">
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center text-[#0d0f14] text-sm font-bold cursor-pointer">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-6 xl:p-8 space-y-6">
          {/* Welcome Row */}
          <div className="fade-up delay-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-slate-500 text-sm">{greeting()},</p>
              <h1 className="font-display text-2xl xl:text-3xl font-bold text-white mt-0.5">
                {user?.name?.split(" ")[0] ?? "Learner"} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                7-day streak 🔥
              </div>
              <button className="bg-amber-400 text-[#0d0f14] text-xs font-semibold px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors">
                + Enroll Course
              </button>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className="fade-up delay-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Courses Enrolled",
                value: 3,
                suffix: "",
                icon: "📚",
                delta: "+1 this month",
                color: "#f59e0b",
              },
              {
                label: "Hours Learned",
                value: Math.round(totalMinutes / 60),
                suffix: "h",
                icon: "⏱️",
                delta: "This week",
                color: "#10b981",
              },
              {
                label: "Lessons Done",
                value: 89,
                suffix: "",
                icon: "✅",
                delta: "+12 this week",
                color: "#3b82f6",
              },
              {
                label: "Achievements",
                value: earnedCount,
                suffix: `/${ACHIEVEMENTS.length}`,
                icon: "🏅",
                delta: "Badges earned",
                color: "#8b5cf6",
              },
            ].map((kpi, i) => (
              <div
                key={kpi.label}
                className="card p-5 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-200"
              >
                <div
                  className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ background: kpi.color }}
                />
                <div className="text-2xl mb-2">{kpi.icon}</div>
                <div className="font-display text-2xl font-bold text-white">
                  <Counter
                    value={kpi.value}
                    suffix={kpi.suffix}
                    duration={900 + i * 100}
                  />
                </div>
                <div className="text-slate-400 text-xs mt-0.5">{kpi.label}</div>
                <div
                  className="text-xs mt-2 font-medium"
                  style={{ color: kpi.color }}
                >
                  {kpi.delta}
                </div>
              </div>
            ))}
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Continue Learning (2 cols) */}
            <div className="xl:col-span-2 space-y-4">
              <div className="fade-up delay-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-white">
                  Continue Learning
                </h2>
                <Link
                  to="/courses"
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  View all
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>

              <div className="fade-up delay-3 space-y-3">
                {MY_COURSES.map((course) => (
                  <div
                    key={course.id}
                    className="card p-5 group hover:scale-[1.005] transition-all duration-200 cursor-pointer"
                  >
                    {/* Top accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-px rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${course.accent}, transparent)`,
                      }}
                    />

                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: `${course.accent}18` }}
                      >
                        {course.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">
                              {course.category}
                            </p>
                            <h3 className="text-slate-100 font-semibold text-sm leading-snug group-hover:text-white transition-colors">
                              {course.title}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              by {course.instructor}
                            </p>
                          </div>
                          <div className="relative shrink-0">
                            <CircularProgress
                              value={course.progress}
                              color={course.accent}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">
                                {course.progress}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="progress-bar-wrap h-1.5 w-full">
                            <div
                              className="progress-bar h-full"
                              style={{
                                width: `${course.progress}%`,
                                background: course.accent,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-slate-600">
                              {course.completedLessons}/{course.totalLessons}{" "}
                              lessons
                            </span>
                            <span className="text-xs text-slate-600">
                              {course.lastAccessed}
                            </span>
                          </div>
                        </div>

                        {/* Next lesson */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Next: {course.nextLesson}
                          </div>
                          <button
                            className="text-xs font-semibold px-3 py-1 rounded-lg transition-all duration-150"
                            style={{
                              color: course.accent,
                              background: `${course.accent}15`,
                            }}
                          >
                            Resume →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Weekly Activity */}
              <div className="fade-up delay-3 card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-base font-bold text-white">
                    Weekly Activity
                  </h2>
                  <span className="text-xs text-slate-500">
                    {totalMinutes}m total
                  </span>
                </div>
                <ActivityChart data={ACTIVITY} />
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-center">
                    <div className="font-display text-lg font-bold text-white">
                      <Counter
                        value={Math.round(totalMinutes / 7)}
                        suffix="m"
                        duration={800}
                      />
                    </div>
                    <div className="text-xs text-slate-600">Daily avg</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-lg font-bold text-amber-400">
                      7
                    </div>
                    <div className="text-xs text-slate-600">Day streak</div>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-lg font-bold text-white">
                      <Counter value={150} suffix="m" duration={800} />
                    </div>
                    <div className="text-xs text-slate-600">Best day</div>
                  </div>
                </div>
              </div>

              {/* Upcoming */}
              <div className="fade-up delay-4 card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-base font-bold text-white">
                    Upcoming
                  </h2>
                  <Link
                    to="/schedule"
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {UPCOMING.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 group cursor-pointer"
                    >
                      <div
                        className="w-1 h-10 rounded-full shrink-0"
                        style={{ background: item.accent }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 font-medium truncate group-hover:text-white transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {item.course}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: item.accent,
                            background: `${item.accent}18`,
                          }}
                        >
                          {item.dueIn}
                        </span>
                        <p className="text-[10px] text-slate-600 mt-0.5 capitalize">
                          {item.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Achievements ── */}
          <div className="fade-up delay-5 card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Achievements
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {earnedCount} of {ACHIEVEMENTS.length} earned
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 progress-bar-wrap">
                  <div
                    className="progress-bar h-full bg-amber-400"
                    style={{
                      width: `${(earnedCount / ACHIEVEMENTS.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {Math.round((earnedCount / ACHIEVEMENTS.length) * 100)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.id}
                  title={a.description}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center group cursor-pointer transition-all duration-200 ${
                    a.earned
                      ? "border-white/8 hover:border-white/14 hover:scale-105"
                      : "border-white/4 opacity-40 grayscale"
                  }`}
                  style={a.earned ? { background: `${a.color}08` } : {}}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={
                      a.earned
                        ? { background: `${a.color}15` }
                        : { background: "rgba(255,255,255,0.03)" }
                    }
                  >
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 leading-tight">
                      {a.title}
                    </p>
                    {a.earnedDate && (
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {a.earnedDate}
                      </p>
                    )}
                  </div>
                  {a.earned && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: a.color }}
                    >
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Recommended ── */}
          <div className="fade-up delay-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-white">
                Recommended For You
              </h2>
              <Link
                to="/explore"
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                Explore all
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "TypeScript Advanced Patterns",
                  cat: "Engineering",
                  icon: "🔷",
                  accent: "#3b82f6",
                  students: "8.2k",
                  hours: 36,
                  rating: 4.8,
                },
                {
                  title: "Data Visualization with D3",
                  cat: "Data Science",
                  icon: "📊",
                  accent: "#10b981",
                  students: "5.1k",
                  hours: 28,
                  rating: 4.7,
                },
                {
                  title: "Motion Design Principles",
                  cat: "Design",
                  icon: "✨",
                  accent: "#ec4899",
                  students: "3.9k",
                  hours: 22,
                  rating: 4.9,
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="card p-5 group cursor-pointer hover:scale-[1.02] transition-all duration-200 relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)`,
                    }}
                  />
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${c.accent}18` }}
                    >
                      {c.icon}
                    </div>
                    <button
                      className="text-xs font-semibold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: c.accent, background: `${c.accent}18` }}
                    >
                      Enroll
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {c.cat}
                  </p>
                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors leading-snug mb-3">
                    {c.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{c.students} students</span>
                    <span>{c.hours}h</span>
                    <span className="text-amber-400">★ {c.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
