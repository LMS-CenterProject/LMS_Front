import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
  category: string;
  students: number;
  rating: number;
  hours: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  accent: string;
  icon: string;
}

interface Stat {
  value: string;
  label: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const COURSES: Course[] = [
  {
    id: "1",
    title: "Full-Stack React Development",
    category: "Engineering",
    students: 12_840,
    rating: 4.9,
    hours: 48,
    level: "Intermediate",
    accent: "#f59e0b",
    icon: "⚛️",
  },
  {
    id: "2",
    title: "Machine Learning Foundations",
    category: "Data Science",
    students: 9_210,
    rating: 4.8,
    hours: 64,
    level: "Advanced",
    accent: "#10b981",
    icon: "🧠",
  },
  {
    id: "3",
    title: "UX Design Systems",
    category: "Design",
    students: 7_430,
    rating: 4.7,
    hours: 32,
    level: "Beginner",
    accent: "#8b5cf6",
    icon: "🎨",
  },
  {
    id: "4",
    title: "Cloud Architecture AWS",
    category: "DevOps",
    students: 5_900,
    rating: 4.9,
    hours: 56,
    level: "Advanced",
    accent: "#ef4444",
    icon: "☁️",
  },
];

const STATS: Stat[] = [
  { value: "120K+", label: "Active Learners" },
  { value: "2,400+", label: "Expert Courses" },
  { value: "98%", label: "Completion Rate" },
  { value: "4.9★", label: "Average Rating" },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Frontend Engineer @ Stripe",
    text: "LearnForge completely changed my career trajectory. The course quality is unmatched.",
    avatar: "SC",
  },
  {
    name: "Marcus Webb",
    role: "ML Engineer @ DeepMind",
    text: "The ML curriculum here is rigorous and practical. Landed my dream job within 4 months.",
    avatar: "MW",
  },
  {
    name: "Priya Nair",
    role: "Design Lead @ Figma",
    text: "World-class instructors who are actually practitioners in their fields. Worth every penny.",
    avatar: "PN",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg
        key={s}
        className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-amber-400" : "text-slate-600"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="text-slate-400 text-xs ml-1">{rating}</span>
  </div>
);

const CourseCard: React.FC<{ course: Course; index: number }> = ({
  course,
  index,
}) => (
  <div
    className="group relative bg-[#13161d] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {/* Top accent line */}
    <div
      className="absolute top-0 left-6 right-6 h-px rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
      style={{
        background: `linear-gradient(90deg, transparent, ${course.accent}, transparent)`,
      }}
    />

    <div className="flex items-start justify-between mb-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ background: `${course.accent}15` }}
      >
        {course.icon}
      </div>
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ color: course.accent, background: `${course.accent}15` }}
      >
        {course.level}
      </span>
    </div>

    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
      {course.category}
    </p>
    <h3 className="text-slate-100 font-semibold text-base leading-snug mb-3 group-hover:text-white transition-colors">
      {course.title}
    </h3>

    <StarRating rating={course.rating} />

    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
      <span>{course.students.toLocaleString()} students</span>
      <span>{course.hours}h total</span>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-slate-300 font-sans">
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .font-display { font-family: 'Syne', sans-serif; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeUp { animation: fadeUp 0.7s ease forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.25s; opacity: 0; }
        .delay-3 { animation-delay: 0.4s; opacity: 0; }
        .delay-4 { animation-delay: 0.55s; opacity: 0; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .glow-amber { box-shadow: 0 0 40px rgba(245,158,11,0.25); }
      `}</style>

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0d0f14]/90 backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#0d0f14]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762z" />
                <path d="M9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
              </svg>
            </div>
            <span className="font-display font-700 text-white text-lg tracking-tight">
              LearnForge
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            {["Courses", "Instructors", "Pricing", "Blog"].map((item) => (
              <a
                key={item}
                href="#"
                className="hover:text-white transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-amber-400 text-[#0d0f14] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-slate-300 hover:text-white transition-colors px-3 py-2"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-amber-400 text-[#0d0f14] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-300 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center grid-bg overflow-hidden pt-16"
      >
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-400/5 blur-[120px]" />
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-500/5 blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16 relative z-10">
          {/* Left */}
          <div className="flex-1 space-y-8">
            <div className="animate-fadeUp delay-1 inline-flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              2,400+ live courses now available
            </div>

            <h1 className="animate-fadeUp delay-2 font-display text-5xl lg:text-7xl font-800 text-white leading-[1.05] tracking-tight">
              Master Skills
              <br />
              <span className="text-amber-400">That Matter.</span>
            </h1>

            <p className="animate-fadeUp delay-3 text-lg text-slate-400 max-w-xl leading-relaxed">
              Expert-led courses built for real-world outcomes. From code to
              design to data — accelerate your career with hands-on learning
              that actually sticks.
            </p>

            <div className="animate-fadeUp delay-4 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="glow-amber inline-flex items-center justify-center gap-2 bg-amber-400 text-[#0d0f14] font-semibold px-7 py-3.5 rounded-xl hover:bg-amber-300 transition-all duration-200 text-sm"
              >
                Start Learning Free
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <a
                href="#courses"
                className="inline-flex items-center justify-center gap-2 border border-white/10 text-slate-300 font-medium px-7 py-3.5 rounded-xl hover:bg-white/5 transition-all duration-200 text-sm"
              >
                Browse Courses
              </a>
            </div>

            {/* Social proof */}
            <div className="animate-fadeUp delay-4 flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((l, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0d0f14] flex items-center justify-center text-xs font-bold"
                    style={{
                      background: ["#f59e0b", "#10b981", "#8b5cf6", "#ef4444"][
                        i
                      ],
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-400">
                <span className="text-white font-semibold">120,000+</span>{" "}
                learners already enrolled
              </p>
            </div>
          </div>

          {/* Right — floating card */}
          <div className="flex-1 flex justify-center lg:justify-end animate-float">
            <div className="relative">
              <div className="w-72 bg-[#13161d] border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center text-xl">
                    ⚛️
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      React Development
                    </p>
                    <p className="text-slate-500 text-xs">
                      48 hours · Intermediate
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-5">
                  {[85, 92, 68, 100].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-amber-400/20 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-sm bg-amber-400" />
                      </div>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{w}%</span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold text-white">
                    86%
                  </div>
                  <div className="text-xs text-slate-500">Course Progress</div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                🎉 Certificate Ready
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#13161d] border border-white/10 text-xs px-3 py-2 rounded-xl text-slate-300 shadow-lg">
                ✅ Lesson 12 Completed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-white/5 bg-[#0f1117]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-800 text-amber-400">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Courses ── */}
      <section id="courses" className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-2">
              Top Rated
            </p>
            <h2 className="font-display text-4xl font-800 text-white">
              Featured Courses
            </h2>
          </div>
          <a
            href="#"
            className="hidden md:flex items-center gap-1 text-sm text-slate-400 hover:text-amber-400 transition-colors"
          >
            View all
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COURSES.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-[#0f1117] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-2">
              Success Stories
            </p>
            <h2 className="font-display text-4xl font-800 text-white">
              What Our Learners Say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-[#13161d] border border-white/5 rounded-2xl p-6 relative"
              >
                <div className="text-3xl text-amber-400/30 font-display font-bold absolute top-4 right-6">
                  "
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">
                  {t.text}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-[#0d0f14] text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative bg-gradient-to-br from-amber-400/10 to-amber-600/5 border border-amber-400/20 rounded-3xl p-12 md:p-16 overflow-hidden text-center">
          <div className="absolute inset-0 grid-bg opacity-30 rounded-3xl" />
          <div className="relative z-10 space-y-6">
            <h2 className="font-display text-4xl md:text-5xl font-800 text-white">
              Ready to Level Up?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Join thousands of professionals who've already transformed their
              careers with LearnForge.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-amber-400 text-[#0d0f14] font-semibold px-8 py-4 rounded-xl hover:bg-amber-300 transition-all duration-200 text-sm glow-amber"
            >
              Create Free Account
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-400 flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-[#0d0f14]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
            </div>
            <span className="font-display font-bold text-white text-sm">
              LearnForge
            </span>
          </div>
          <p className="text-slate-600 text-sm">
            © 2026 LearnForge. Built for curious minds.
          </p>
          <div className="flex gap-5 text-sm text-slate-500">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                className="hover:text-slate-300 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
