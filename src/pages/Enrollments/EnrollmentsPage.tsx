import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { enrollmentsApi } from "../../api/EnrollmentsApi";
import type { Enrollment, EnrollmentDetails } from "../../api/EnrollmentsApi";
import { coursesApi, type Course } from "../../api/CoursesApi";
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

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-7 h-7 border-2 border-purple-200 border-t-[#6d28d9] rounded-full animate-spin" />
  </div>
);

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

const Badge = ({
  text,
  color = "gray",
}: {
  text: string;
  color?: "green" | "gray" | "purple" | "yellow";
}) => {
  const s = {
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${s[color]}`}
    >
      {text}
    </span>
  );
};

const ProgressBar = ({ pct }: { pct: number }) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
    <div
      className="h-full rounded-full bg-[#6d28d9] transition-all duration-500"
      style={{ width: `${Math.min(pct, 100)}%` }}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnrollmentsPage() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [detail, setDetail] = useState<EnrollmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const loadCourses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await coursesApi.getAll(token);
      setCourses(data);
    } catch (e) {
      console.error(e);
    }
  }, [token]);
  useEffect(() => {
    loadCourses();
  }, [loadCourses]);
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
  const loadDetail = async (id: string) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      setDetail(await enrollmentsApi.getById(id, token));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setDetailLoading(false);
    }
  };

  const totalWatched = enrollments.reduce(
    (a, e) => a + e.totalWatchedSeconds,
    0,
  );
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

        {/* Stats */}
        {!loading && enrollments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Total Enrolled",
                value: enrollments.length,
                sub: `${enrollments.filter((e) => e.status === "Active").length} active`,
              },
              {
                label: "Time Watched",
                value: fmtSeconds(totalWatched),
                sub: "Total learning time",
              },
              {
                label: "Avg Progress",
                value: `${avgProgress}%`,
                sub: "Across all courses",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-gray-200 rounded-2xl p-4"
              >
                <div className="font-display text-xl font-bold text-gray-900">
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

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid gap-5 lg:grid-cols-5">
            {/* List — 2 cols */}
            <div className="lg:col-span-2 space-y-3">
              {enrollments.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-gray-500 font-semibold">
                    Not enrolled yet
                  </p>
                  <button
                    onClick={() => setEnrollModal(true)}
                    className="text-[#6d28d9] text-sm underline mt-1"
                  >
                    Enroll in a course
                  </button>
                </div>
              ) : (
                enrollments.map((e) => (
                  <div
                    key={e.id}
                    onClick={() => loadDetail(e.id)}
                    className={`bg-white border rounded-2xl p-4 cursor-pointer hover:border-purple-300 transition-colors ${detail?.id === e.id ? "border-[#6d28d9] ring-1 ring-[#6d28d9]" : "border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {e.courseTitle}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          by {e.instructorName}
                        </p>
                      </div>
                      <Badge
                        text={e.status}
                        color={e.status === "Active" ? "green" : "gray"}
                      />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span className="font-semibold text-[#6d28d9]">
                          {e.progressPercentage}%
                        </span>
                      </div>
                      <ProgressBar pct={e.progressPercentage} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>
                        {fmtSeconds(e.totalWatchedSeconds)} /{" "}
                        {fmtSeconds(e.totalCourseDurationSeconds)}
                      </span>
                      <span>
                        {e.hasCertificate
                          ? "🏆 Certificate"
                          : `$${e.paidPrice}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail pane — 3 cols */}
            <div className="lg:col-span-3">
              {detailLoading ? (
                <Spinner />
              ) : !detail ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center h-64">
                  <p className="text-gray-400 text-sm">
                    Click an enrollment to view details
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-base">
                      {detail.courseTitle}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Enrolled {fmtDate(detail.enrolledAt)}
                    </p>
                  </div>
                  <div className="space-y-5 max-h-[520px] overflow-y-auto pr-1">
                    {detail.sections.map((sec) => (
                      <div key={sec.sectionId}>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                          {sec.title}
                        </p>
                        <div className="space-y-2">
                          {sec.lessons.map((l) => (
                            <div
                              key={l.lessonId}
                              className="flex items-center gap-2.5 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2"
                            >
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${l.isCompleted ? "bg-[#6d28d9] border-[#6d28d9]" : "border-gray-300"}`}
                              >
                                {l.isCompleted && (
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
                                )}
                              </div>
                              <span
                                className={`flex-1 ${l.isCompleted ? "line-through text-gray-400" : ""}`}
                              >
                                {l.title}
                              </span>
                              <span className="text-gray-400">
                                {fmtSeconds(l.durationSeconds)}
                              </span>
                              <Badge text={l.contentType} color="gray" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {enrollModal && (
        <Modal title="Enroll in a Course" onClose={() => setEnrollModal(false)}>
          {error && (
            <ErrorBanner msg={error} onDismiss={() => setError(null)} />
          )}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setEnrollModal(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-gray-700 border border-gray-200"
            >
              Cancel
            </button>

            <button
              disabled={saving || !selectedCourseId}
              onClick={handleEnroll}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#6d28d9] text-white"
            >
              {saving ? "Enrolling…" : "Enroll"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
