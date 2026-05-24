import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { enrollmentsApi } from "../../api/EnrollmentsApi";
import type { Enrollment } from "../../api/EnrollmentsApi";
import { coursesApi, type Course } from "../../api/CoursesApi";
import { decodeImageSrc } from "../../helpers/decodeImage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ErrorBanner = ({
  msg,
  onDismiss,
}: {
  msg: string;
  onDismiss?: () => void;
}) => (
  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
    <span className="flex-1">{msg}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600">
        ✕
      </button>
    )}
  </div>
);

const SuccessBanner = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
    {msg}
  </div>
);

const ProgressBar = ({ pct }: { pct: number }) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{
        width: `${Math.min(pct, 100)}%`,
        background: pct >= 100 ? "#10b981" : "#6d28d9",
      }}
    />
  </div>
);

const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Enrollment Card ──────────────────────────────────────────────────────────

const EnrollmentCard = ({
  enrollment,
  onClick,
}: {
  enrollment: Enrollment;
  onClick: () => void;
}) => {
  const imgSrc = decodeImageSrc(enrollment.thumbnailUrl);
  const pct = enrollment.progressPercentage;
  const done = pct >= 100;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-violet-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={enrollment.courseTitle}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl">📚</span>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
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
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Continue Learning
          </span>
        </div>

        {/* Status badge */}
        <div className="absolute top-2.5 right-2.5">
          {done ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              ✓ Completed
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {enrollment.status}
            </span>
          )}
        </div>

        {/* Certificate badge */}
        {enrollment.hasCertificate && (
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              🏆 Certificate
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors mb-0.5">
          {enrollment.courseTitle}
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          by {enrollment.instructorName}
        </p>

        {/* Progress */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Progress</span>
            <span
              className={`font-bold ${done ? "text-emerald-600" : "text-violet-600"}`}
            >
              {pct}%
            </span>
          </div>
          <ProgressBar pct={pct} />
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{fmtSeconds(enrollment.totalWatchedSeconds)} watched</span>
          <span>{fmtDate(enrollment.enrolledAt)}</span>
        </div>
      </div>
    </button>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-36 bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-3 bg-gray-100 rounded-full w-1/3" />
      <div className="h-2 bg-gray-100 rounded-full w-full" />
      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnrollmentsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setEnrollments(await enrollmentsApi.getMyEnrollments(token));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    coursesApi.getAll(token).then(setCourses).catch(console.error);
  }, [token]);

  const handleEnroll = async () => {
    if (!selectedCourseId || !token) return;
    setSaving(true);
    setError(null);
    try {
      await enrollmentsApi.enroll(selectedCourseId, token);
      setEnrollModal(false);
      setSelectedCourseId("");
      setSuccess("Enrolled successfully!");
      setTimeout(() => setSuccess(null), 3000);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalWatched = enrollments.reduce(
    (a, e) => a + e.totalWatchedSeconds,
    0,
  );
  const completed = enrollments.filter(
    (e) => e.progressPercentage >= 100,
  ).length;
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((a, e) => a + e.progressPercentage, 0) /
            enrollments.length,
        )
      : 0;

  return (
    <div className="lf-page min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap'); .lf-page{font-family:'DM Sans',sans-serif;} .lf-page .font-display{font-family:'Syne',sans-serif;}`}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-violet-500 mb-1">
              My Learning
            </p>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Enrollments
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {enrollments.length} course{enrollments.length !== 1 ? "s" : ""}{" "}
              enrolled
            </p>
          </div>
          <button
            onClick={() => setEnrollModal(true)}
            className="inline-flex items-center gap-2 bg-[#6d28d9] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#5b21b6] transition-colors shadow-sm shadow-purple-200"
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
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Enroll in Course
          </button>
        </div>

        {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}
        {success && <SuccessBanner msg={success} />}

        {/* Stats strip */}
        {!loading && enrollments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              {
                label: "Enrolled",
                value: enrollments.length,
                sub: `${enrollments.filter((e) => e.status === "Active").length} active`,
                color: "text-violet-700",
                bg: "bg-violet-50",
              },
              {
                label: "Completed",
                value: completed,
                sub: "courses finished",
                color: "text-emerald-700",
                bg: "bg-emerald-50",
              },
              {
                label: "Time Watched",
                value: fmtSeconds(totalWatched),
                sub: "total learning time",
                color: "text-blue-700",
                bg: "bg-blue-50",
              },
              {
                label: "Avg Progress",
                value: `${avgProgress}%`,
                sub: "across all courses",
                color: "text-amber-700",
                bg: "bg-amber-50",
              },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
                <div className={`font-display text-2xl font-bold ${s.color}`}>
                  {s.value}
                </div>
                <div className="text-xs font-semibold text-gray-700 mt-0.5">
                  {s.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-3xl">
              📋
            </div>
            <p className="font-bold text-gray-700">Not enrolled yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Start learning by enrolling in a course
            </p>
            <button
              onClick={() => setEnrollModal(true)}
              className="text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl transition-colors"
            >
              Enroll in a course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {enrollments.map((e) => (
              <EnrollmentCard
                key={e.id}
                enrollment={e}
                onClick={() =>
                  navigate(`/courses/${e.courseId}/sections`, {
                    state: { enrollmentId: e.id, fromEnrollments: true },
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Enroll modal */}
      {enrollModal && (
        <Modal title="Enroll in a Course" onClose={() => setEnrollModal(false)}>
          {error && (
            <ErrorBanner msg={error} onDismiss={() => setError(null)} />
          )}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setEnrollModal(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={saving || !selectedCourseId}
              onClick={handleEnroll}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6] disabled:opacity-50"
            >
              {saving ? "Enrolling…" : "Enroll"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
