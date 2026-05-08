import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { enrollmentsApi } from "../../api/EnrollmentsApi";
import { progressApi } from "../../api/ProgressApi";
import type { Enrollment, EnrollmentDetails } from "../../api/EnrollmentsApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

const ProgressBar = ({
  pct,
  color = "#6d28d9",
}: {
  pct: number;
  color?: string;
}) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
    />
  </div>
);

// ─── Lesson Row ───────────────────────────────────────────────────────────────

function LessonProgressRow({
  lesson,
  isUpdating,
  onUpdate,
}: {
  lesson: {
    lessonId: string;
    title: string;
    contentType: string;
    durationSeconds: number;
    isCompleted: boolean;
    watchedSeconds: number;
    isFreePreview: boolean;
  };
  isUpdating: boolean;
  onUpdate: (watchedSeconds: number, isCompleted: boolean) => void;
}) {
  const [watched, setWatched] = useState(String(lesson.watchedSeconds));

  // sync if parent updates
  useEffect(() => {
    setWatched(String(lesson.watchedSeconds));
  }, [lesson.watchedSeconds]);

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${lesson.isCompleted ? "bg-[#6d28d9] border-[#6d28d9]" : "border-gray-300"}`}
      >
        {lesson.isCompleted && (
          <svg
            className="w-3 h-3 text-white"
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

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${lesson.isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}
        >
          {lesson.title}
        </p>
        <div className="mt-1 space-y-1">
          <ProgressBar
            pct={
              lesson.durationSeconds > 0
                ? (lesson.watchedSeconds / lesson.durationSeconds) * 100
                : 0
            }
          />
          <p className="text-xs text-gray-400">
            {lesson.contentType} · {fmtSeconds(lesson.durationSeconds)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <input
            type="number"
            value={watched}
            onChange={(e) => setWatched(e.target.value)}
            className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none focus:border-[#6d28d9] transition-colors"
            placeholder="secs"
            min="0"
            max={lesson.durationSeconds}
          />
          <span className="absolute -bottom-4 left-0 right-0 text-center text-[10px] text-gray-400">
            seconds
          </span>
        </div>
        <button
          disabled={isUpdating}
          onClick={() => onUpdate(parseInt(watched) || 0, false)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isUpdating ? "…" : "Save"}
        </button>
        {!lesson.isCompleted && (
          <button
            disabled={isUpdating}
            onClick={() => onUpdate(lesson.durationSeconds, true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#6d28d9] text-white hover:bg-[#5b21b6] disabled:opacity-50 transition-colors"
          >
            ✓ Done
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const COURSE_COLORS = [
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#06b6d4",
];

export default function ProgressPage() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [detail, setDetail] = useState<EnrollmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    enrollmentsApi
      .getMyEnrollments(token)
      .then(setEnrollments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const loadDetail = async (id: string) => {
    if (!token) return;
    setDetailLoading(true);
    setDetail(null);
    try {
      setDetail(await enrollmentsApi.getById(id, token));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdate = async (
    lessonId: string,
    watchedSeconds: number,
    isCompleted: boolean,
  ) => {
    if (!token) return;
    setUpdating(lessonId);
    setError(null);
    try {
      const res = await progressApi.updateLesson(
        lessonId,
        { watchedSeconds, isCompleted },
        token,
      );
      setSuccess(
        res.certificateIssued
          ? "🏆 Certificate issued! Check your Certificates page."
          : `Progress saved! ${res.courseProgressPercentage}% complete`,
      );
      setTimeout(() => setSuccess(null), 4000);
      if (detail) loadDetail(detail.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setUpdating(null);
    }
  };

  // Overall stats across all enrollments
  // const totalLessons = enrollments.reduce((a, e) => {
  //   // rough estimate from duration
  //   return a;
  // }, 0);
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((a, e) => a + e.progressPercentage, 0) /
            enrollments.length,
        )
      : 0;
  const completedCourses = enrollments.filter(
    (e) => e.progressPercentage >= 100,
  ).length;

  return (
    <div className="lf-page min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap'); .lf-page{font-family:'DM Sans',sans-serif;} .lf-page .font-display{font-family:'Syne',sans-serif;}`}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Progress
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Track and update your lesson progress
          </p>
        </div>

        {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}
        {success && <SuccessBanner msg={success} />}

        {/* Stats row */}
        {!loading && enrollments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Enrolled Courses",
                value: enrollments.length,
                color: "#6d28d9",
              },
              {
                label: "Avg Progress",
                value: `${avgProgress}%`,
                color: "#10b981",
              },
              { label: "Completed", value: completedCourses, color: "#f59e0b" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-gray-200 rounded-2xl p-4"
              >
                <div
                  className="font-display text-2xl font-bold"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {/* Enrollment list */}
            <div className="col-span-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Select Enrollment
              </p>
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {enrollments.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                    <p className="text-gray-400 text-sm">No enrollments yet.</p>
                  </div>
                ) : (
                  enrollments.map((e, idx) => {
                    const color = COURSE_COLORS[idx % COURSE_COLORS.length];
                    return (
                      <button
                        key={e.id}
                        onClick={() => loadDetail(e.id)}
                        className={`w-full text-left px-3 py-3 rounded-xl border text-sm transition-all ${detail?.id === e.id ? "bg-purple-50 border-[#6d28d9]" : "bg-white border-gray-200 hover:border-gray-300"}`}
                      >
                        <p
                          className={`font-semibold truncate ${detail?.id === e.id ? "text-[#6d28d9]" : "text-gray-800"}`}
                        >
                          {e.courseTitle}
                        </p>
                        <p className="text-xs text-gray-400 mb-2 mt-0.5">
                          by {e.instructorName}
                        </p>
                        <ProgressBar pct={e.progressPercentage} color={color} />
                        <p
                          className="text-xs mt-1.5 font-semibold"
                          style={{ color }}
                        >
                          {e.progressPercentage}% complete
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Lesson detail */}
            <div className="col-span-2">
              {detailLoading ? (
                <Spinner />
              ) : !detail ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center h-64 gap-3">
                  <div className="text-4xl">📊</div>
                  <p className="text-gray-400 text-sm">
                    Select an enrollment to manage progress
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Course header */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">
                        {detail.courseTitle}
                      </p>
                      <div className="mt-2">
                        <ProgressBar
                          pct={detail.sections.reduce((total, sec) => {
                            const completed = sec.lessons.filter(
                              (l) => l.isCompleted,
                            ).length;
                            const all = sec.lessons.length;
                            return (
                              total +
                              (all > 0
                                ? ((completed / all) * 100) /
                                  detail.sections.length
                                : 0)
                            );
                          }, 0)}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-2xl font-bold text-[#6d28d9]">
                        {Math.round(
                          detail.sections.reduce((total, sec) => {
                            const completed = sec.lessons.filter(
                              (l) => l.isCompleted,
                            ).length;
                            const all = sec.lessons.length;
                            return (
                              total +
                              (all > 0
                                ? ((completed / all) * 100) /
                                  detail.sections.length
                                : 0)
                            );
                          }, 0),
                        )}
                        %
                      </p>
                      <p className="text-xs text-gray-400">complete</p>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="max-h-[460px] overflow-y-auto space-y-3 pr-1">
                    {detail.sections.map((sec, idx) => {
                      const completed = sec.lessons.filter(
                        (l) => l.isCompleted,
                      ).length;
                      const color = COURSE_COLORS[idx % COURSE_COLORS.length];
                      return (
                        <div
                          key={sec.sectionId}
                          className="bg-white border border-gray-200 rounded-2xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-gray-800 text-sm">
                              {sec.title}
                            </p>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ color, background: `${color}15` }}
                            >
                              {completed}/{sec.lessons.length} done
                            </span>
                          </div>
                          <div className="space-y-1">
                            {sec.lessons.map((l) => (
                              <LessonProgressRow
                                key={l.lessonId}
                                lesson={l}
                                isUpdating={updating === l.lessonId}
                                onUpdate={(ws, ic) =>
                                  handleUpdate(l.lessonId, ws, ic)
                                }
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
