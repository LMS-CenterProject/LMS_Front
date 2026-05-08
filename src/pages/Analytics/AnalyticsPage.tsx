import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { coursesApi } from "../../api/CoursesApi";
import type { Course } from "../../api/CoursesApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseStats {
  courseId: string;
  courseTitle: string;
  instructorName: string;
  enrollmentCount: number;
  completionCount: number;
  averageRating: number;
  totalRevenue: number;
  totalWatchedSeconds: number;
  totalCourseDurationSeconds: number;
}

interface AdminOverview {
  totalCourses: number;
  publishedCourses: number;
  totalInstructors: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  courseStats: CourseStats[];
}

interface InstructorOverview {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  courseStats: CourseStats[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────



function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtRating(n: number) {
  return n.toFixed(1);
}

// ─── Animated Counter ──────────────────────────────────────────────────────────

const Counter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}> = ({ value, prefix = "", suffix = "", duration = 1200, decimals = 0 }) => {
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
        setCount(parseFloat(current.toFixed(decimals)));
      }
    }, duration / steps);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [value, duration, decimals]);

  return (
    <>
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </>
  );
};

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-6 h-6 border-2 border-purple-200 border-t-[#6d28d9] rounded-full animate-spin" />
  </div>
);

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

const MiniBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  height?: number;
}> = ({ data, height = 80 }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 w-full" style={{ height }}>
      {data.map((d) => (
        <div
          key={d.label}
          className="flex-1 flex flex-col items-center gap-1"
          title={`${d.label}: ${d.value}`}
        >
          <div
            className="w-full rounded-t-sm transition-all duration-700"
            style={{
              height: `${(d.value / max) * (height - 20)}px`,
              background: d.color,
              opacity: 0.85,
            }}
          />
          <span className="text-[10px] text-gray-400 truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating: React.FC<{ value: number }> = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} className="w-3 h-3" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 1l1.35 2.74L10.5 4.2l-2.25 2.2.53 3.1L6 7.9l-2.78 1.6.53-3.1L1.5 4.2l3.15-.46L6 1z"
          fill={i <= Math.round(value) ? "#f59e0b" : "#e5e7eb"}
        />
      </svg>
    ))}
    <span className="text-xs text-gray-500 ml-1">{fmtRating(value)}</span>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { bg: string; text: string }> = {
    Published: { bg: "#d1fae5", text: "#065f46" },
    Draft: { bg: "#fef3c7", text: "#92400e" },
    Archived: { bg: "#f3f4f6", text: "#6b7280" },
  };
  const s = cfg[status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
  delta?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: string;
}> = ({
  label,
  value,
  icon,
  color,
  delta,
  prefix,
  suffix,
  decimals = 0,
  delay = "0s",
}) => (
  <div
    className="lf-fade bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden hover:border-purple-200 hover:shadow-md hover:shadow-purple-50 transition-all duration-200"
    style={{ animationDelay: delay, opacity: 0 }}
  >
    <div
      className="absolute -top-5 -right-5 w-16 h-16 rounded-full opacity-10"
      style={{ background: color }}
    />
    <div className="text-2xl mb-2">{icon}</div>
    <div className="font-display text-2xl font-bold text-gray-900">
      <Counter
        value={value}
        prefix={prefix}
        suffix={suffix}
        decimals={decimals}
        duration={1000}
      />
    </div>
    <div className="text-gray-500 text-xs mt-0.5">{label}</div>
    {delta && (
      <div className="text-xs mt-2 font-semibold" style={{ color }}>
        {delta}
      </div>
    )}
  </div>
);

// ─── Course Row ───────────────────────────────────────────────────────────────

const COURSE_COLORS = [
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#06b6d4",
];

const CourseRow: React.FC<{
  stat: CourseStats;
  idx: number;
  showInstructor?: boolean;
}> = ({ stat, idx, showInstructor = false }) => {
  const color = COURSE_COLORS[idx % COURSE_COLORS.length];
  const completionPct =
    stat.enrollmentCount > 0
      ? Math.round((stat.completionCount / stat.enrollmentCount) * 100)
      : 0;

  return (
    <tr className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-1.5 h-8 rounded-full shrink-0"
            style={{ background: color }}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
              {stat.courseTitle}
            </p>
            {showInstructor && (
              <p className="text-xs text-gray-400">{stat.instructorName}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-gray-700 text-right">
        {stat.enrollmentCount.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-500">{completionPct}%</span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${completionPct}%`, background: color }}
            />
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        <StarRating value={stat.averageRating} />
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-gray-800 text-right">
        {fmtCurrency(stat.totalRevenue)}
      </td>
    </tr>
  );
};

// ─── Admin View ───────────────────────────────────────────────────────────────

const AdminAnalytics: React.FC<{ data: AdminOverview; courses: Course[] }> = ({
  data,
  courses,
}) => {
  const [sortBy, setSortBy] = useState<"enrollments" | "revenue" | "rating">(
    "enrollments",
  );

  const sorted = [...data.courseStats].sort((a, b) => {
    if (sortBy === "enrollments") return b.enrollmentCount - a.enrollmentCount;
    if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue;
    return b.averageRating - a.averageRating;
  });

  const statusCounts = courses.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const chartData = Object.entries(statusCounts).map(([label, value], i) => ({
    label,
    value,
    color: COURSE_COLORS[i % COURSE_COLORS.length],
  }));

  const adminKpis = [
    {
      label: "Total Courses",
      value: data.totalCourses,
      icon: "📚",
      color: "#f59e0b",
      delta: `${data.publishedCourses} published`,
    },
    {
      label: "Total Instructors",
      value: data.totalInstructors,
      icon: "🧑‍🏫",
      color: "#10b981",
      delta: "Active on platform",
    },
    {
      label: "Total Students",
      value: data.totalStudents,
      icon: "🎓",
      color: "#3b82f6",
      delta: "Across all courses",
    },
    {
      label: "Platform Revenue",
      value: data.totalRevenue,
      icon: "💰",
      color: "#8b5cf6",
      delta: "Lifetime total",
      prefix: "$",
    },
    {
      label: "Avg Course Rating",
      value: data.averageRating,
      icon: "⭐",
      color: "#f59e0b",
      delta: "Out of 5.0",
      decimals: 1,
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {adminKpis.map((k, i) => (
          <KpiCard key={k.label} {...k} delay={`${i * 0.06}s`} />
        ))}
      </div>

      {/* Charts + breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Status distribution */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4">
            Course status
          </h3>
          <MiniBarChart data={chartData} height={120} />
          <div className="mt-3 space-y-1.5">
            {Object.entries(statusCounts).map(([status, count], i) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: COURSE_COLORS[i % COURSE_COLORS.length],
                    }}
                  />
                  <span className="text-xs text-gray-600">{status}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top by revenue */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-1">
            Revenue by course
          </h3>
          <p className="text-xs text-gray-400 mb-4">Top performing courses</p>
          <div className="space-y-2.5">
            {data.courseStats
              .sort((a, b) => b.totalRevenue - a.totalRevenue)
              .slice(0, 5)
              .map((s, idx) => {
                const maxRev = Math.max(
                  ...data.courseStats.map((x) => x.totalRevenue),
                  1,
                );
                const pct = (s.totalRevenue / maxRev) * 100;
                const color = COURSE_COLORS[idx % COURSE_COLORS.length];
                return (
                  <div key={s.courseId} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-800 truncate max-w-[160px]">
                          {s.courseTitle}
                        </span>
                        <span className="text-xs font-bold" style={{ color }}>
                          {fmtCurrency(s.totalRevenue)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* All courses table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="font-display text-base font-bold text-gray-900">
              All courses
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {data.courseStats.length} courses across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["enrollments", "revenue", "rating"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === opt
                    ? "bg-[#6d28d9] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">
                  Course
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">
                  Enrolled
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">
                  Completion
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">
                  Rating
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <CourseRow key={s.courseId} stat={s} idx={i} showInstructor />
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    No course data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Instructor View ──────────────────────────────────────────────────────────

const InstructorAnalytics: React.FC<{
  data: InstructorOverview;
  courses: Course[];
}> = ({ data, courses }) => {
  const instructorKpis = [
    {
      label: "My Courses",
      value: data.totalCourses,
      icon: "📚",
      color: "#f59e0b",
      delta: `${data.publishedCourses} published`,
    },
    {
      label: "Total Students",
      value: data.totalStudents,
      icon: "🎓",
      color: "#10b981",
      delta: "Enrolled in my courses",
    },
    {
      label: "Completion Rate",
      value: data.completionRate,
      icon: "✅",
      color: "#3b82f6",
      delta: "Across all courses",
      suffix: "%",
    },
    {
      label: "Avg Rating",
      value: data.averageRating,
      icon: "⭐",
      color: "#f59e0b",
      delta: "Out of 5.0",
      decimals: 1,
    },
    {
      label: "My Revenue",
      value: data.totalRevenue,
      icon: "💰",
      color: "#8b5cf6",
      delta: "Total earnings",
      prefix: "$",
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {instructorKpis.map((k, i) => (
          <KpiCard key={k.label} {...k} delay={`${i * 0.06}s`} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Enrollment trend per course */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4">
            Students per course
          </h3>
          <MiniBarChart
            data={data.courseStats.slice(0, 6).map((s, i) => ({
              label:
                s.courseTitle.length > 10
                  ? s.courseTitle.slice(0, 10) + "…"
                  : s.courseTitle,
              value: s.enrollmentCount,
              color: COURSE_COLORS[i % COURSE_COLORS.length],
            }))}
            height={120}
          />
        </div>

        {/* Course list with status */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-display text-base font-bold text-gray-900 mb-4">
            My courses overview
          </h3>
          <div className="space-y-3">
            {courses.slice(0, 5).map((c, idx) => {
              const color = COURSE_COLORS[idx % COURSE_COLORS.length];
              const stat = data.courseStats.find((s) => s.courseId === c.id);
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-10 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {c.title}
                      </p>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {stat?.enrollmentCount ?? 0} students
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {c.language}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs font-semibold" style={{ color }}>
                        {c.price === 0 ? "Free" : fmtCurrency(c.price)}
                      </span>
                    </div>
                  </div>
                  {stat && <StarRating value={stat.averageRating} />}
                </div>
              );
            })}
            {courses.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                No courses found.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed course stats table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-display text-base font-bold text-gray-900">
            Course performance
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Detailed breakdown for all your courses
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500">
                  Course
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">
                  Enrolled
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">
                  Completion
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">
                  Rating
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold text-gray-500">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {data.courseStats.map((s, i) => (
                <CourseRow key={s.courseId} stat={s} idx={i} />
              ))}
              {data.courseStats.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    No course stats available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Analytics Page ───────────────────────────────────────────────────────────

const AnalyticsPage: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const isAdmin = ["SuperAdmin", "Admin"].includes(user?.role ?? "");
  const isInstructor = user?.role === "Instructor";

  const [courses, setCourses] = useState<Course[]>([]);
  const [adminData, setAdminData] = useState<AdminOverview | null>(null);
  const [instructorData, setInstructorData] =
    useState<InstructorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const allCourses = await coursesApi.getAll(token);

      // Filter instructor's own courses if not admin
      const myCourses = isAdmin
        ? allCourses
        : allCourses.filter((c) => c.instructorId === user?.id);

      setCourses(myCourses);

      if (isAdmin) {
        // ── Admin: fetch system-wide analytics ────────────────────────────────
        // Replace with your actual admin analytics endpoint
        // e.g. const overview = await analyticsApi.getAdminOverview(token);
        // Below we derive a shell from courses; replace with real API data:
        const courseStats: CourseStats[] = myCourses.map((c) => ({
          courseId: c.id,
          courseTitle: c.title,
          instructorName: c.instructorName ?? "Unknown",
          enrollmentCount: (c as any).enrollmentCount ?? 0,
          completionCount: (c as any).completionCount ?? 0,
          averageRating: (c as any).averageRating ?? 0,
          totalRevenue: (c as any).totalRevenue ?? 0,
          totalWatchedSeconds: (c as any).totalWatchedSeconds ?? 0,
          totalCourseDurationSeconds: (c as any).totalDurationSeconds ?? 0,
        }));

        const uniqueInstructors = new Set(
          myCourses.map((c) => c.instructorId ?? c.instructorName),
        ).size;
        const totalStudents = courseStats.reduce(
          (a, s) => a + s.enrollmentCount,
          0,
        );
        const totalRevenue = courseStats.reduce(
          (a, s) => a + s.totalRevenue,
          0,
        );
        const avgRating =
          courseStats.length > 0
            ? courseStats.reduce((a, s) => a + s.averageRating, 0) /
              courseStats.length
            : 0;

        setAdminData({
          totalCourses: myCourses.length,
          publishedCourses: myCourses.filter((c) => c.status === "Published")
            .length,
          totalInstructors: uniqueInstructors,
          totalStudents,
          totalRevenue,
          averageRating: avgRating,
          courseStats,
        });
      } else if (isInstructor) {
        // ── Instructor: fetch analytics for own courses ────────────────────────
        // Replace with your actual instructor analytics endpoint
        // e.g. const overview = await analyticsApi.getInstructorOverview(token);
        const courseStats: CourseStats[] = myCourses.map((c) => ({
          courseId: c.id,
          courseTitle: c.title,
          instructorName: c.instructorName ?? user?.name ?? "Me",
          enrollmentCount: (c as any).enrollmentCount ?? 0,
          completionCount: (c as any).completionCount ?? 0,
          averageRating: (c as any).averageRating ?? 0,
          totalRevenue: (c as any).totalRevenue ?? 0,
          totalWatchedSeconds: (c as any).totalWatchedSeconds ?? 0,
          totalCourseDurationSeconds: (c as any).totalDurationSeconds ?? 0,
        }));

        const totalStudents = courseStats.reduce(
          (a, s) => a + s.enrollmentCount,
          0,
        );
        const totalRevenue = courseStats.reduce(
          (a, s) => a + s.totalRevenue,
          0,
        );
        const totalCompletions = courseStats.reduce(
          (a, s) => a + s.completionCount,
          0,
        );
        const completionRate =
          totalStudents > 0
            ? Math.round((totalCompletions / totalStudents) * 100)
            : 0;
        const avgRating =
          courseStats.length > 0
            ? courseStats.reduce((a, s) => a + s.averageRating, 0) /
              courseStats.length
            : 0;

        setInstructorData({
          totalCourses: myCourses.length,
          publishedCourses: myCourses.filter((c) => c.status === "Published")
            .length,
          totalStudents,
          totalRevenue,
          averageRating: avgRating,
          completionRate,
          courseStats,
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, isInstructor, user?.id, user?.name]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Guard: only Admin and Instructor can access ──────────────────────────────
  if (!token || (!isAdmin && !isInstructor)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-center px-4">
        <div className="text-4xl">🚫</div>
        <p className="text-gray-700 font-semibold">Access restricted</p>
        <p className="text-gray-400 text-sm max-w-xs">
          This page is only available to Admins and Instructors.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-2 text-sm text-[#6d28d9] underline hover:text-[#5b21b6]"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="lf-dash min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-dash { font-family: 'DM Sans', sans-serif; }
        .lf-dash .font-display { font-family: 'Syne', sans-serif; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .lf-fade { animation: fadeUp 0.45s ease forwards; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div
          className="lf-fade flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ animationDelay: "0.04s", opacity: 0 }}
        >
          <div>
            <p className="text-gray-400 text-sm">
              {isAdmin ? "System overview" : "Your performance"}
            </p>
            <h1 className="font-display text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5">
              Analytics{" "}
              <span
                className="text-base font-semibold px-2.5 py-0.5 rounded-full align-middle"
                style={{
                  background: isAdmin ? "#ede9fe" : "#d1fae5",
                  color: isAdmin ? "#5b21b6" : "#065f46",
                }}
              >
                {user?.role === "SuperAdmin"
                  ? "Super Admin"
                  : user?.role === "Admin"
                    ? "Admin"
                    : "Instructor"}{" "}
              </span>
            </h1>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#6d28d9] transition-colors"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
            <button onClick={load} className="ml-3 underline text-red-600">
              Retry
            </button>
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────────────── */}
        {loading ? (
          <Spinner />
        ) : isAdmin && adminData ? (
          <AdminAnalytics data={adminData} courses={courses} />
        ) : isInstructor && instructorData ? (
          <InstructorAnalytics data={instructorData} courses={courses} />
        ) : null}
      </div>
    </div>
  );
};

export default AnalyticsPage;
