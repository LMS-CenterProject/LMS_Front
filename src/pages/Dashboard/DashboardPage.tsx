import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { enrollmentsApi } from "../../api/EnrollmentsApi";
import { certificatesApi } from "../../api/CertificatesApi";
import { coursesApi } from "../../api/CoursesApi";
import type { Enrollment } from "../../api/EnrollmentsApi";
import type { Certificate } from "../../api/CertificatesApi";
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

function fmtSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const COURSE_COLORS = [
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#06b6d4",
];
const COURSE_ICONS = ["📚", "🧠", "🎨", "⚛️", "🔷", "📊"];

const Spinner = () => (
  <div className="flex justify-center py-10">
    <div className="w-6 h-6 border-2 border-purple-200 border-t-[#6d28d9] rounded-full animate-spin" />
  </div>
);

const Counter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}> = ({ value, prefix = "", suffix = "", duration = 1100, decimals = 0 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const steps = 40;
    const inc = value / steps;
    let cur = 0;
    ref.current = setInterval(() => {
      cur += inc;
      if (cur >= value) {
        setCount(value);
        clearInterval(ref.current!);
      } else {
        setCount(parseFloat(cur.toFixed(decimals)));
      }
    }, duration / steps);
    return () => clearInterval(ref.current!);
  }, [value, duration, decimals]);
  return (
    <>
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </>
  );
};

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
        stroke="rgba(109,40,217,0.08)"
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

const ProgressBar = ({
  pct,
  color = "#6d28d9",
}: {
  pct: number;
  color?: string;
}) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-1000"
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  </div>
);

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
    <span className="text-xs text-gray-500 ml-1">{value.toFixed(1)}</span>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { bg: string; text: string }> = {
    Published: { bg: "#d1fae5", text: "#065f46" },
    Draft: { bg: "#fef3c7", text: "#92400e" },
    Archived: { bg: "#f3f4f6", text: "#6b7280" },
    Active: { bg: "#dbeafe", text: "#1e40af" },
    Completed: { bg: "#d1fae5", text: "#065f46" },
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
  to?: string;
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
  to,
}) => {
  const inner = (
    <div
      className="lf-fade bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden
      hover:border-purple-200 hover:shadow-md hover:shadow-purple-50 transition-all duration-200 h-full"
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
  return to ? (
    <Link to={to} className="block h-full">
      {inner}
    </Link>
  ) : (
    <>{inner}</>
  );
};

const MiniBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  height?: number;
}> = ({ data, height = 90 }) => {
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

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────

const StudentDashboard: React.FC<{
  enrollments: Enrollment[];
  certificates: Certificate[];
  courses: Course[];
  loading: boolean;
  onRetry: () => void;
}> = ({ enrollments, certificates, courses, loading }) => {
  const totalWatchedSeconds = enrollments.reduce(
    (a, e) => a + e.totalWatchedSeconds,
    0,
  );
  const totalHours = Math.round(totalWatchedSeconds / 3600);
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((a, e) => a + e.progressPercentage, 0) /
            enrollments.length,
        )
      : 0;
  const activeEnrollments = enrollments.filter((e) => e.status === "Active");
  const publishedCourses = courses.filter((c) => c.status === "Published");

  const kpis = [
    {
      label: "Courses Enrolled",
      value: enrollments.length,
      suffix: "",
      icon: "📚",
      delta: `${activeEnrollments.length} active`,
      color: "#f59e0b",
      to: "/enrollments",
    },
    {
      label: "Hours Learned",
      value: totalHours,
      suffix: "h",
      icon: "⏱️",
      delta: fmtSeconds(totalWatchedSeconds) + " total",
      color: "#10b981",
      to: "/progress",
    },
    {
      label: "Avg Progress",
      value: avgProgress,
      suffix: "%",
      icon: "📈",
      delta: "Across all courses",
      color: "#3b82f6",
      to: "/progress",
    },
    {
      label: "Certificates",
      value: certificates.length,
      suffix: "",
      icon: "🏆",
      delta: "Earned so far",
      color: "#8b5cf6",
      to: "/certificates",
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="lf-fade lf-d2 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3" />
                <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            ))
          : kpis.map((k, i) => (
              <KpiCard key={k.label} {...k} delay={`${0.08 + i * 0.06}s`} />
            ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="xl:col-span-2 space-y-4">
          <div className="lf-fade lf-d3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Continue Learning
            </h2>
            <Link
              to="/enrollments"
              className="text-xs text-[#6d28d9] hover:text-[#5b21b6] font-semibold flex items-center gap-1"
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
          <div className="lf-fade lf-d3 space-y-3">
            {loading ? (
              <Spinner />
            ) : enrollments.length === 0 ? (
              <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-500 font-semibold">
                  No enrollments yet
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  <Link to="/enrollments" className="text-[#6d28d9] underline">
                    Enroll in a course
                  </Link>{" "}
                  to get started!
                </p>
              </div>
            ) : (
              enrollments.slice(0, 5).map((enr, idx) => {
                const color = COURSE_COLORS[idx % COURSE_COLORS.length];
                const icon = COURSE_ICONS[idx % COURSE_ICONS.length];
                return (
                  <Link
                    key={enr.id}
                    to="/progress"
                    className="group bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4
                      hover:border-purple-200 hover:shadow-md hover:shadow-purple-50 transition-all duration-200 block"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: `${color}18` }}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-[#6d28d9] transition-colors">
                            {enr.courseTitle}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            by {enr.instructorName}
                          </p>
                        </div>
                        <div className="relative shrink-0">
                          <CircularProgress
                            value={enr.progressPercentage}
                            color={color}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-gray-700">
                              {enr.progressPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar
                          pct={enr.progressPercentage}
                          color={color}
                        />
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-gray-400">
                            {fmtSeconds(enr.totalWatchedSeconds)} /{" "}
                            {fmtSeconds(enr.totalCourseDurationSeconds)}
                          </span>
                          <StatusBadge status={enr.status} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Certificates */}
          <div className="lf-fade lf-d4 bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-gray-900">
                Certificates
              </h2>
              <Link
                to="/certificates"
                className="text-xs text-[#6d28d9] font-semibold hover:text-[#5b21b6]"
              >
                View all
              </Link>
            </div>
            {loading ? (
              <Spinner />
            ) : certificates.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-gray-400 text-sm">
                  No certificates yet.
                  <br />
                  Complete a course to earn one!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-white
                    border border-purple-100 rounded-xl p-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#6d28d9] flex items-center justify-center text-lg shrink-0">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {c.courseTitle}
                      </p>
                      <p className="text-xs text-gray-400">
                        by {c.instructorName}
                      </p>
                    </div>
                    {c.certificateUrl && (
                      <a
                        href={c.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-[#6d28d9] font-semibold shrink-0 hover:underline"
                      >
                        View →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Courses */}
          <div className="lf-fade lf-d4 bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-gray-900">
                Available Courses
              </h2>
              <Link
                to="/courses"
                className="text-xs text-[#6d28d9] font-semibold hover:text-[#5b21b6]"
              >
                Browse
              </Link>
            </div>
            {loading ? (
              <Spinner />
            ) : publishedCourses.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">
                  No published courses yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {publishedCourses.slice(0, 4).map((c, idx) => {
                  const color = COURSE_COLORS[idx % COURSE_COLORS.length];
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 group cursor-pointer"
                    >
                      <div
                        className="w-1 h-10 rounded-full shrink-0"
                        style={{ background: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#6d28d9] transition-colors">
                          {c.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {c.language} ·{" "}
                          {c.price === 0 ? "Free" : `$${c.price}`}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── INSTRUCTOR DASHBOARD ─────────────────────────────────────────────────────

const InstructorDashboard: React.FC<{
  data: InstructorOverview;
  courses: Course[];
  loading: boolean;
}> = ({ data, courses, loading }) => {
  const kpis = [
    {
      label: "My Courses",
      value: data.totalCourses,
      icon: "📚",
      color: "#f59e0b",
      delta: `${data.publishedCourses} published`,
      to: "/courses",
    },
    {
      label: "Total Students",
      value: data.totalStudents,
      icon: "🎓",
      color: "#10b981",
      delta: "Across my courses",
      to: "/enrollments",
    },
    {
      label: "Completion Rate",
      value: data.completionRate,
      icon: "✅",
      color: "#3b82f6",
      delta: "All courses avg",
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
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3" />
                <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            ))
          : kpis.map((k, i) => (
              <KpiCard key={k.label} {...k} delay={`${i * 0.06}s`} />
            ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Students per course chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-display text-base font-bold text-gray-900 mb-1">
              Students per course
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Enrollment distribution
            </p>
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

          {/* Course list */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-bold text-gray-900">
                My courses overview
              </h3>
              <Link
                to="/courses"
                className="text-xs text-[#6d28d9] font-semibold hover:text-[#5b21b6]"
              >
                Manage →
              </Link>
            </div>
            <div className="space-y-3">
              {courses.slice(0, 5).map((c, idx) => {
                const color = COURSE_COLORS[idx % COURSE_COLORS.length];
                const stat = data.courseStats.find((s) => s.courseId === c.id);
                return (
                  <div key={c.id} className="flex items-center gap-3 group">
                    <div
                      className="w-1.5 h-10 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#6d28d9] transition-colors">
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
                        <span
                          className="text-xs font-semibold"
                          style={{ color }}
                        >
                          {c.price === 0 ? "Free" : fmtCurrency(c.price)}
                        </span>
                      </div>
                    </div>
                    {stat && <StarRating value={stat.averageRating} />}
                  </div>
                );
              })}
              {courses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No courses yet.</p>
                  <Link
                    to="/courses"
                    className="text-xs text-[#6d28d9] underline mt-1 inline-block"
                  >
                    Create one →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course performance table */}
      {!loading && (
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
                  {[
                    "Course",
                    "Enrolled",
                    "Completion",
                    "Rating",
                    "Revenue",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 px-4 text-xs font-semibold text-gray-500 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.courseStats.map((stat, i) => {
                  const color = COURSE_COLORS[i % COURSE_COLORS.length];
                  const completionPct =
                    stat.enrollmentCount > 0
                      ? Math.round(
                          (stat.completionCount / stat.enrollmentCount) * 100,
                        )
                      : 0;
                  return (
                    <tr
                      key={stat.courseId}
                      className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1.5 h-8 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                            {stat.courseTitle}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right">
                        {stat.enrollmentCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-500">
                            {completionPct}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${completionPct}%`,
                                background: color,
                              }}
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
                })}
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
      )}
    </div>
  );
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

const AdminDashboard: React.FC<{
  data: AdminOverview;
  courses: Course[];
  loading: boolean;
}> = ({ data, courses, loading }) => {
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

  const kpis = [
    {
      label: "Total Courses",
      value: data.totalCourses,
      icon: "📚",
      color: "#f59e0b",
      delta: `${data.publishedCourses} published`,
      to: "/courses",
    },
    {
      label: "Instructors",
      value: data.totalInstructors,
      icon: "🧑‍🏫",
      color: "#10b981",
      delta: "Active on platform",
    },
    {
      label: "Students",
      value: data.totalStudents,
      icon: "🎓",
      color: "#3b82f6",
      delta: "Across all courses",
      to: "/enrollments",
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
      label: "Avg Rating",
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
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3" />
                <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            ))
          : kpis.map((k, i) => (
              <KpiCard key={k.label} {...k} delay={`${i * 0.06}s`} />
            ))}
      </div>

      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Status breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-display text-base font-bold text-gray-900 mb-4">
              Course status
            </h3>
            <MiniBarChart
              data={Object.entries(statusCounts).map(([label, value], i) => ({
                label,
                value,
                color: COURSE_COLORS[i % COURSE_COLORS.length],
              }))}
              height={120}
            />
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

          {/* Revenue by course */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-display text-base font-bold text-gray-900 mb-1">
              Revenue by course
            </h3>
            <p className="text-xs text-gray-400 mb-4">Top performing courses</p>
            <div className="space-y-2.5">
              {[...data.courseStats]
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
      )}

      {/* All courses table */}
      {!loading && (
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
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                    ${sortBy === opt ? "bg-[#6d28d9] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
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
                  {[
                    "Course",
                    "Enrolled",
                    "Completion",
                    "Rating",
                    "Revenue",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`py-2.5 px-4 text-xs font-semibold text-gray-500 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((stat, i) => {
                  const color = COURSE_COLORS[i % COURSE_COLORS.length];
                  const completionPct =
                    stat.enrollmentCount > 0
                      ? Math.round(
                          (stat.completionCount / stat.enrollmentCount) * 100,
                        )
                      : 0;
                  return (
                    <tr
                      key={stat.courseId}
                      className="border-b border-gray-50 hover:bg-purple-50/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1.5 h-8 rounded-full shrink-0"
                            style={{ background: color }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                              {stat.courseTitle}
                            </p>
                            <p className="text-xs text-gray-400">
                              {stat.instructorName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 text-right">
                        {stat.enrollmentCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-500">
                            {completionPct}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${completionPct}%`,
                                background: color,
                              }}
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
                })}
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
      )}
    </div>
  );
};

// ─── ROLE BADGE ───────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; emoji: string }
> = {
  SuperAdmin: {
    label: "Super Admin",
    bg: "#ede9fe",
    color: "#5b21b6",
    emoji: "🛡️",
  },
  Admin: { label: "Admin", bg: "#ede9fe", color: "#5b21b6", emoji: "⚙️" },
  Instructor: {
    label: "Instructor",
    bg: "#d1fae5",
    color: "#065f46",
    emoji: "🧑‍🏫",
  },
  Student: { label: "Student", bg: "#dbeafe", color: "#1e40af", emoji: "🎓" },
};

// ─── MAIN DASHBOARD PAGE ──────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const { user, token } = useAuth();

  const role = user?.role ?? "Student";
  const isAdmin = ["SuperAdmin", "Admin"].includes(role);
  const isInstructor = role === "Instructor";
  const isStudent = !isAdmin && !isInstructor;

  // ── Shared state ────────────────────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
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

      if (isStudent) {
        // ── Student: own enrollments + certificates ──────────────────────────
        const [enrs, certs] = await Promise.all([
          enrollmentsApi.getMyEnrollments(token),
          certificatesApi.getMyCertificates(token),
        ]);
        setEnrollments(enrs);
        setCertificates(certs);
        setCourses(allCourses);
      } else {
        // ── Instructor / Admin: own or all courses ───────────────────────────
        const myCourses = isAdmin
          ? allCourses
          : allCourses.filter((c) => c.instructorId === user?.id);
        setCourses(myCourses);

        const courseStats: CourseStats[] = myCourses.map((c) => ({
          courseId: c.id,
          courseTitle: c.title,
          instructorName: c.instructorName ?? user?.name ?? "Unknown",
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
        const avgRating =
          courseStats.length > 0
            ? courseStats.reduce((a, s) => a + s.averageRating, 0) /
              courseStats.length
            : 0;

        if (isAdmin) {
          const uniqueInstructors = new Set(
            myCourses.map((c) => c.instructorId ?? c.instructorName),
          ).size;
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
        } else {
          const totalCompletions = courseStats.reduce(
            (a, s) => a + s.completionCount,
            0,
          );
          const completionRate =
            totalStudents > 0
              ? Math.round((totalCompletions / totalStudents) * 100)
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
      }
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, isInstructor, isStudent, user?.id, user?.name]);

  useEffect(() => {
    load();
  }, [load]);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500 text-sm">
        Not authenticated. Please log in.
      </div>
    );
  }

  const roleCfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.Student;

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
        .lf-d1 { animation-delay:0.04s; opacity:0; }
        .lf-d2 { animation-delay:0.10s; opacity:0; }
        .lf-d3 { animation-delay:0.16s; opacity:0; }
        .lf-d4 { animation-delay:0.22s; opacity:0; }
        .lf-d5 { animation-delay:0.28s; opacity:0; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Welcome Header ────────────────────────────────────────────────── */}
        <div className="lf-fade lf-d1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm">{greeting()},</p>
            <h1 className="font-display text-2xl xl:text-3xl font-bold text-gray-900 mt-0.5 flex items-center gap-2 flex-wrap">
              {user?.name?.split(" ")[0] ?? "User"} 👋
              <span
                className="text-sm font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: roleCfg.bg, color: roleCfg.color }}
              >
                {roleCfg.emoji} {roleCfg.label}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#6d28d9] transition-colors px-3 py-2 rounded-xl border border-gray-200 hover:border-purple-200 bg-white"
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
            {isStudent && (
              <Link
                to="/enrollments"
                className="bg-[#6d28d9] text-white text-sm font-semibold px-4 py-2 rounded-xl
                  hover:bg-[#5b21b6] transition-colors shadow-sm shadow-purple-200"
              >
                + Enroll in Course
              </Link>
            )}
            {isInstructor && (
              <Link
                to="/courses"
                className="bg-[#6d28d9] text-white text-sm font-semibold px-4 py-2 rounded-xl
                  hover:bg-[#5b21b6] transition-colors shadow-sm shadow-purple-200"
              >
                + New Course
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/analytics"
                className="bg-[#6d28d9] text-white text-sm font-semibold px-4 py-2 rounded-xl
                  hover:bg-[#5b21b6] transition-colors shadow-sm shadow-purple-200"
              >
                Full Analytics →
              </Link>
            )}
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
            <button onClick={load} className="ml-3 underline text-red-600">
              Retry
            </button>
          </div>
        )}

        {/* ── Role-specific content ─────────────────────────────────────────── */}
        {isStudent && (
          <StudentDashboard
            enrollments={enrollments}
            certificates={certificates}
            courses={courses}
            loading={loading}
            onRetry={load}
          />
        )}

        {isInstructor && instructorData && !loading && (
          <InstructorDashboard
            data={instructorData}
            courses={courses}
            loading={loading}
          />
        )}

        {isInstructor && loading && <Spinner />}

        {isAdmin && adminData && !loading && (
          <AdminDashboard
            data={adminData}
            courses={courses}
            loading={loading}
          />
        )}

        {isAdmin && loading && <Spinner />}
      </div>
    </div>
  );
};

export default DashboardPage;
