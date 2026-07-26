import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { enrollmentsApi } from "../../api/EnrollmentsApi";
import { progressApi } from "../../api/ProgressApi";
import type { Enrollment, EnrollmentDetails } from "../../api/EnrollmentsApi";
import { downloadCertificate } from "../../helpers/useCertificateDownload";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

const COURSE_COLORS = [
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#06b6d4",
];
const COURSE_ICONS = ["📚", "🧠", "🎨", "⚛️", "🔷", "📊"];

function deterministicIndex(id: string, len: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return hash % len;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-6 h-6 border-2 border-purple-100 border-t-[#6d28d9] rounded-full animate-spin" />
  </div>
);

function RadialProgress({
  pct,
  color,
  size = 80,
}: {
  pct: number;
  color: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnim(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={7}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (anim / 100) * circ}
        style={{
          transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </svg>
  );
}

function ThinBar({ pct, color = "#6d28d9" }: { pct: number; color?: string }) {
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  );
}

// ─── Certificate Download Button ──────────────────────────────────────────────

function CertDownloadButton({
  detail,
  recipientName,
  color,
}: {
  detail: EnrollmentDetails;
  recipientName: string;
  color: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  const handleDownload = async () => {
    if (status === "loading") return;
    setStatus("loading");
    try {
      await downloadCertificate({
        courseTitle: detail.courseTitle,
        instructorName: detail.instructorName,
        recipientName,
        issuedAt: detail.certificateIssuedAt ?? new Date().toISOString(),
        certificateId: detail.certificateId ?? undefined,
      });
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={status === "loading"}
      className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg disabled:opacity-60 transition-all hover:opacity-90 active:scale-95"
      style={{ background: color }}
    >
      {status === "loading" ? (
        <>
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="white"
              strokeWidth="3"
              strokeDasharray="28"
              strokeDashoffset="10"
            />
          </svg>
          Generating…
        </>
      ) : status === "done" ? (
        <>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Saved!
        </>
      ) : (
        <>
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Certificate
        </>
      )}
    </button>
  );
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  color,
  isUpdating,
  onMarkDone,
  onUpdateProgress,
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
  color: string;
  isUpdating: boolean;
  onMarkDone: () => void;
  onUpdateProgress: (watched: number) => void;
}) {
  const [sliderVal, setSliderVal] = useState(lesson.watchedSeconds);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) setSliderVal(lesson.watchedSeconds);
  }, [lesson.watchedSeconds, isDragging]);

  const watchedPct =
    lesson.durationSeconds > 0
      ? Math.round((sliderVal / lesson.durationSeconds) * 100)
      : 0;

  const isVideo = lesson.contentType === "Video" || lesson.contentType === "0";

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 ${
        lesson.isCompleted
          ? "bg-gray-50/60 border-gray-100"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Completion toggle */}
        <button
          onClick={lesson.isCompleted ? undefined : onMarkDone}
          disabled={isUpdating || lesson.isCompleted}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            lesson.isCompleted
              ? "bg-emerald-500 border-emerald-500"
              : "border-gray-300 hover:border-[#6d28d9] hover:bg-purple-50"
          } disabled:cursor-default`}
        >
          {lesson.isCompleted && (
            <svg
              className="w-3.5 h-3.5 text-white"
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
          {isUpdating && !lesson.isCompleted && (
            <div className="w-3 h-3 border border-[#6d28d9] border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        {/* Type icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
          style={{ background: `${color}14`, color }}
        >
          {isVideo ? "▶" : "📄"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${lesson.isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}
          >
            {lesson.title}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {lesson.contentType === "0"
              ? "Video"
              : lesson.contentType === "1"
                ? "PDF"
                : lesson.contentType}
            {" · "}
            {fmtSeconds(lesson.durationSeconds)}
            {lesson.isFreePreview && (
              <span className="ml-1.5 text-emerald-600 font-semibold">
                Free
              </span>
            )}
          </p>
        </div>

        {/* Progress pct */}
        {!lesson.isCompleted && lesson.durationSeconds > 0 && (
          <span className="text-xs font-bold shrink-0" style={{ color }}>
            {watchedPct}%
          </span>
        )}

        {/* Completed label */}
        {lesson.isCompleted && (
          <span className="text-[11px] font-semibold text-emerald-600 shrink-0">
            Done ✓
          </span>
        )}
      </div>

      {/* Slider row */}
      {!lesson.isCompleted && isVideo && lesson.durationSeconds > 0 && (
        <div className="px-4 pb-3 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={lesson.durationSeconds}
            value={sliderVal}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onChange={(e) => setSliderVal(Number(e.target.value))}
            onMouseUp={() => {
              setIsDragging(false);
              onUpdateProgress(sliderVal);
            }}
            onTouchEnd={() => {
              setIsDragging(false);
              onUpdateProgress(sliderVal);
            }}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${color} ${watchedPct}%, #e5e7eb ${watchedPct}%)`,
            }}
          />
          <span className="text-[11px] text-gray-400 shrink-0 w-16 text-right">
            {fmtSeconds(sliderVal)} / {fmtSeconds(lesson.durationSeconds)}
          </span>
          <button
            disabled={isUpdating}
            onClick={onMarkDone}
            className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-50 transition-colors"
            style={{ background: color }}
          >
            Mark done
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Enrollment Card ──────────────────────────────────────────────────────────

function EnrollmentCard({
  enrollment,
  isActive,

  onClick,
}: {
  enrollment: Enrollment;
  isActive: boolean;
  idx: number;
  onClick: () => void;
}) {
  const color =
    COURSE_COLORS[deterministicIndex(enrollment.id, COURSE_COLORS.length)];
  const icon =
    COURSE_ICONS[deterministicIndex(enrollment.id, COURSE_ICONS.length)];
  const pct = enrollment.progressPercentage;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 group ${
        isActive
          ? "bg-white border-[#6d28d9] shadow-md shadow-purple-100"
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <RadialProgress pct={pct} color={color} size={52} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base">{icon}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate transition-colors ${isActive ? "text-[#6d28d9]" : "text-gray-800 group-hover:text-gray-900"}`}
          >
            {enrollment.courseTitle}
          </p>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">
            {enrollment.instructorName}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <ThinBar pct={pct} color={color} />
            <span className="text-[11px] font-bold shrink-0" style={{ color }}>
              {pct}%
            </span>
          </div>
        </div>

        <div className="shrink-0">
          {enrollment.status === "Completed" ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600">
              Done
            </span>
          ) : (
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: isActive ? color : "#d1d5db" }}
            />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { token, user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [detail, setDetail] = useState<EnrollmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  // Resolve recipient name from auth context — adjust field to match your User type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyUser = user as any;
  const recipientName: string =
    anyUser?.fullName ?? anyUser?.name ?? anyUser?.displayName ?? "Student";

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!token) return;
    enrollmentsApi
      .getMyEnrollments(token)
      .then((data) => {
        setEnrollments(data);
        if (data.length > 0) loadDetail(data[0].id);
      })
      .catch(() => setError("Failed to load enrollments"))
      .finally(() => setLoading(false));
  }, [token]);

  const loadDetail = async (id: string) => {
    if (!token) return;
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await enrollmentsApi.getById(id, token);
      setDetail(d);
      setExpandedSections(new Set(d.sections.map((s) => s.sectionId)));
    } catch {
      showToast("Failed to load course details", "error");
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
      showToast(
        res.certificateIssued
          ? "🏆 Certificate issued! Download it below or visit Certificates."
          : isCompleted
            ? `Lesson completed! ${res.courseProgressPercentage}% done overall.`
            : "Progress saved.",
      );
      if (detail) loadDetail(detail.id);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setUpdating(null);
    }
  };

  const toggleSection = (id: string) =>
    setExpandedSections((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((a, e) => a + e.progressPercentage, 0) /
            enrollments.length,
        )
      : 0;
  const completedCount = enrollments.filter(
    (e) => e.status === "Completed",
  ).length;
  const totalWatched = enrollments.reduce(
    (a, e) => a + e.totalWatchedSeconds,
    0,
  );

  const detailTotalLessons =
    detail?.sections.reduce((a, s) => a + s.lessons.length, 0) ?? 0;
  const detailCompletedLessons =
    detail?.sections.reduce(
      (a, s) => a + s.lessons.filter((l) => l.isCompleted).length,
      0,
    ) ?? 0;

  return (
    <div className="pg-root min-h-screen bg-[#fafafa]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        .pg-root { font-family: 'DM Sans', sans-serif; }
        .pg-root .font-display { font-family: 'Syne', sans-serif; }
        input[type=range] { -webkit-appearance: none; appearance: none; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #6d28d9;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(109,40,217,0.4);
          transition: transform 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.25); }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pg-anim { animation: slide-up 0.3s ease forwards; }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast-anim { animation: toast-in 0.25s ease forwards; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          className={`toast-anim fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl flex items-center gap-2.5 ${
            toast.type === "success"
              ? "bg-gray-900 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-7">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            My Progress
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Track your learning journey
          </p>
        </div>

        {/* Stats strip */}
        {!loading && enrollments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              {
                label: "Enrolled",
                value: enrollments.length,
                icon: "📚",
                color: "#6d28d9",
              },
              {
                label: "Avg Progress",
                value: `${avgProgress}%`,
                icon: "📈",
                color: "#10b981",
              },
              {
                label: "Completed",
                value: completedCount,
                icon: "🏆",
                color: "#f59e0b",
              },
              {
                label: "Hours Watched",
                value: `${Math.round(totalWatched / 3600)}h`,
                icon: "⏱️",
                color: "#3b82f6",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center gap-3"
              >
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p
                    className="font-display text-lg font-bold leading-none"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center justify-between">
            {error}
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : enrollments.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
            <div className="text-5xl mb-4">📚</div>
            <p className="font-semibold text-gray-600">No enrollments yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Enroll in a course to start tracking progress.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 items-start">
            {/* Left: enrollment list */}
            <div className="w-72 shrink-0 space-y-2 sticky top-6 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">
                {enrollments.length} course{enrollments.length !== 1 ? "s" : ""}
              </p>
              {enrollments.map((e, idx) => (
                <EnrollmentCard
                  key={e.id}
                  enrollment={e}
                  isActive={detail?.courseId === e.courseId}
                  idx={idx}
                  onClick={() => loadDetail(e.id)}
                />
              ))}
            </div>

            {/* Right: detail */}
            <div className="flex-1 min-w-0">
              {detailLoading ? (
                <Spinner />
              ) : !detail ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center h-72 gap-3">
                  <div className="text-4xl">👈</div>
                  <p className="text-gray-400 text-sm font-medium">
                    Select a course to view progress
                  </p>
                </div>
              ) : (
                <div className="pg-anim space-y-4">
                  {/* Course header card */}
                  {(() => {
                    const color =
                      COURSE_COLORS[
                        deterministicIndex(detail.id, COURSE_COLORS.length)
                      ];
                    return (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <RadialProgress
                              pct={detail.progressPercentage}
                              color={color}
                              size={72}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span
                                className="font-display text-sm font-bold"
                                style={{ color }}
                              >
                                {detail.progressPercentage}%
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="font-display text-lg font-bold text-gray-900 truncate">
                              {detail.courseTitle}
                            </h2>
                            <p className="text-sm text-gray-400 mt-0.5">
                              by {detail.instructorName}
                            </p>
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                              <div className="text-center">
                                <p className="font-bold text-gray-800">
                                  {detailCompletedLessons}
                                </p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                  Done
                                </p>
                              </div>
                              <div className="w-px h-6 bg-gray-100" />
                              <div className="text-center">
                                <p className="font-bold text-gray-800">
                                  {detailTotalLessons}
                                </p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                  Total
                                </p>
                              </div>
                              <div className="w-px h-6 bg-gray-100" />
                              <div className="text-center">
                                <p className="font-bold text-gray-800">
                                  {fmtSeconds(detail.totalWatchedSeconds)}
                                </p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                  Watched
                                </p>
                              </div>
                              <div className="w-px h-6 bg-gray-100" />
                              <div className="text-center">
                                <p className="font-bold text-gray-800">
                                  {fmtSeconds(
                                    detail.totalCourseDurationSeconds,
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                  Total
                                </p>
                              </div>

                              {/* Certificate actions — shown once earned */}
                              {detail.hasCertificate && (
                                <div className="ml-auto flex items-center gap-2 flex-wrap">
                                  {/* Download PNG */}
                                  <CertDownloadButton
                                    detail={detail}
                                    recipientName={recipientName}
                                    color={color}
                                  />
                                  {/* View online (if URL present) */}
                                  {detail.certificateUrl && (
                                    <a
                                      href={detail.certificateUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all hover:bg-gray-50"
                                      style={{
                                        color,
                                        borderColor: `${color}40`,
                                      }}
                                    >
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
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                      View Online
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Overall bar */}
                        <div className="mt-4">
                          <ThinBar
                            pct={detail.progressPercentage}
                            color={color}
                          />
                        </div>

                        {/* Certificate earned banner */}
                        {detail.hasCertificate && (
                          <div
                            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
                            style={{
                              background: `${color}0e`,
                              border: `1px solid ${color}25`,
                            }}
                          >
                            <span className="text-xl">🏆</span>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-semibold"
                                style={{ color }}
                              >
                                Certificate Earned
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                You completed this course.{" "}
                                {detail.certificateIssuedAt
                                  ? `Issued on ${new Date(detail.certificateIssuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}.`
                                  : ""}
                              </p>
                            </div>
                            <CertDownloadButton
                              detail={detail}
                              recipientName={recipientName}
                              color={color}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Sections */}
                  {detail.sections
                    .slice()
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((sec, idx) => {
                      const color = COURSE_COLORS[idx % COURSE_COLORS.length];
                      const completedInSec = sec.lessons.filter(
                        (l) => l.isCompleted,
                      ).length;
                      const secPct =
                        sec.lessons.length > 0
                          ? Math.round(
                              (completedInSec / sec.lessons.length) * 100,
                            )
                          : 0;
                      const isOpen = expandedSections.has(sec.sectionId);

                      return (
                        <div
                          key={sec.sectionId}
                          className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
                        >
                          <button
                            onClick={() => toggleSection(sec.sectionId)}
                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/70 transition-colors text-left"
                          >
                            <div
                              className="w-1.5 h-6 rounded-full shrink-0"
                              style={{ background: color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {sec.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="w-24">
                                  <ThinBar pct={secPct} color={color} />
                                </div>
                                <span className="text-[11px] text-gray-400">
                                  {completedInSec}/{sec.lessons.length} lessons
                                </span>
                              </div>
                            </div>
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                              style={{ color, background: `${color}14` }}
                            >
                              {secPct}%
                            </span>
                            <svg
                              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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

                          {isOpen && (
                            <div className="border-t border-gray-100 px-4 py-3 space-y-2">
                              {sec.lessons.map((l) => (
                                <LessonRow
                                  key={l.lessonId}
                                  lesson={l}
                                  color={color}
                                  isUpdating={updating === l.lessonId}
                                  onMarkDone={() =>
                                    handleUpdate(
                                      l.lessonId,
                                      l.durationSeconds,
                                      true,
                                    )
                                  }
                                  onUpdateProgress={(ws) =>
                                    handleUpdate(l.lessonId, ws, false)
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
