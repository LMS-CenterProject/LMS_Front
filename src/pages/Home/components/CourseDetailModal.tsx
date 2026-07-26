import { useEffect, useState } from "react";
import { type Course } from "../../../api/CoursesApi";
import { decodeImageSrc } from "../../../helpers/decodeImage";
const COURSE_ICONS = [
  "⚛️",
  "🧠",
  "🎨",
  "🔷",
  "📊",
  "🚀",
  "🔒",
  "📱",
  "🌐",
  "🎬",
];
const COURSE_COLORS = [
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

function deterministicPick<T>(arr: T[], id: string): T {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return arr[hash % arr.length];
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Published: { bg: "bg-green-100", text: "text-green-700" },
  Draft: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Archived: { bg: "bg-gray-100", text: "text-gray-600" },
};

interface Props {
  course: Course | null;
  onClose: () => void;
  onEnroll?: (c: Course) => Promise<void>;
}

export default function CourseDetailModal({
  course,
  onClose,
  onEnroll,
}: Props) {
  const currentUser = localStorage.getItem("user");
  const currentUserRole = currentUser && JSON.parse(currentUser).role;
  const isStudent = currentUserRole === "Student";
  const canEnroll = isStudent && course?.status === "Published";
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollDone, setEnrollDone] = useState(false);
  useEffect(() => {
    setEnrolling(false);
    setEnrollError(null);
    setEnrollDone(false);
  }, [course?.id]);

  const handleEnroll = async () => {
    if (!onEnroll || !course) return;
    setEnrolling(true);
    setEnrollError(null);
    try {
      await onEnroll(course);
      setEnrollDone(true);
    } catch (e: unknown) {
      setEnrollError(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };
  // Close on Escape
  useEffect(() => {
    if (!course) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [course, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (course) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [course]);

  if (!course) return null;

  const icon = deterministicPick(COURSE_ICONS, course.id);
  const color = deterministicPick(COURSE_COLORS, course.id);
  const imgSrc = decodeImageSrc(course.thumbnailUrl);
  const status = STATUS_STYLES[course.status] ?? STATUS_STYLES.Archived;

  const metrics = [
    { label: "Sections", value: course.sectionCount },
    { label: "Lessons", value: course.lessonCount },
    { label: "Language", value: course.language },
    { label: "Status", value: course.status },
  ];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Panel */}
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-modal"
        style={{ border: "0.5px solid rgba(0,0,0,0.1)" }}
      >
        {/* Hero */}
        <div
          className="relative h-44 flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: `${color}18` }}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl">{icon}</span>
          )}

          {/* Overlay gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          {/* Status badge */}
          <span
            className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-full ${status.bg} ${status.text}`}
          >
            {course.status}
          </span>

          {/* Free badge */}
          {course.price === 0 && (
            <span
              className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-1 rounded-full text-white"
              style={{ background: color }}
            >
              Free
            </span>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/25 hover:bg-red-500 duration-200  flex items-center justify-center transition-colors cursor-pointer "
            style={course.status ? { right: "calc(3rem + 8px)" } : {}}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Category */}
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color }}
          >
            {course.categoryName}
          </p>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 leading-snug mb-1">
            {course.title}
          </h2>

          {/* Instructor */}
          <p className="text-sm text-gray-500 mb-4">
            by {course.instructorName}
          </p>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[course.language, course.status].map((chip) => (
              <span
                key={chip}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500"
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Description */}
          {course.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {course.description}
            </p>
          )}

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {metrics.map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[11px] text-gray-400 mb-0.5">{m.label}</p>
                <p className="text-sm font-semibold text-gray-800">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <div>
            <p className="text-[11px] text-gray-400 mb-0.5">Price</p>
            <p className="text-xl font-bold text-gray-900">
              {course.price === 0 ? "Free" : `$${course.price}`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {enrollError && (
              <p className="text-[10px] text-red-500 font-semibold">
                {enrollError}
              </p>
            )}

            {canEnroll &&
              (enrollDone ? (
                <span className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-emerald-500 flex items-center gap-1.5">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Enrolled!
                </span>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-85 disabled:opacity-60 flex items-center gap-2"
                  style={{ background: color }}
                >
                  {enrolling ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Enrolling…
                    </>
                  ) : course.price === 0 ? (
                    "Enroll for free"
                  ) : (
                    "Enroll now"
                  )}
                </button>
              ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-modal { animation: modal-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>
    </div>
  );
}
