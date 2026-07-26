import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Course } from "../../../api/CoursesApi";
import { decodeImageSrc } from "../../../helpers/decodeImage";
import CourseDetailModal from "./CourseDetailModal";

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

const Btn = ({
  children,
  onClick,
  variant = "primary",
  size = "sm",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  className?: string;
}) => {
  const base =
    "inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all active:scale-[0.97]";
  const sizes = { sm: "px-2.5 py-1.5 text-[11px]", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "bg-[#6d28d9] text-white hover:bg-[#5b21b6] shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-[#6d28d9] hover:bg-purple-50",
  };
  return (
    <button
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
  canManage?: boolean;
  onEnroll?: (c: Course) => Promise<void>;
  onEdit?: (c: Course) => void;
  onDelete?: (c: Course) => void;
  onPublish?: (c: Course) => void;
  onArchive?: (c: Course) => void;
}

export default function CourseCard({
  course,
  isEnrolled = false,
  canManage = false,
  onEnroll,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}: CourseCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false); // ← new
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const icon = deterministicPick(COURSE_ICONS, course.id);
  const color = deterministicPick(COURSE_COLORS, course.id);
  const imgSrc = decodeImageSrc(course.thumbnailUrl);
  const handleEnroll = async () => {
    if (!onEnroll) return;
    setEnrolling(true);
    setEnrollError(null);
    try {
      await onEnroll(course);
    } catch (e: unknown) {
      setEnrollError(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };
  const showSections = isEnrolled || canManage;
  const hasActions = onPublish || onArchive || onEdit || onDelete;

  return (
    <>
      <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
        {/* ── Thumbnail ── */}
        <div
          className="relative h-40 flex items-center justify-center cursor-pointer shrink-0"
          style={{
            background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
          }}
          onClick={() => setModalOpen(true)}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">
              {icon}
            </span>
          )}

          {/* Gradient overlay on image */}
          {imgSrc && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          )}

          {/* Top-left: Free badge */}
          {course.price === 0 && (
            <div className="absolute top-2.5 left-2.5">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-md text-white tracking-wide"
                style={{ background: color }}
              >
                FREE
              </span>
            </div>
          )}

          {/* Top-right: status + enrolled stacked */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
            {course.status === "Published" ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                Live
              </span>
            ) : course.status === "Draft" ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-white">
                Draft
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-400 text-white">
                {course.status}
              </span>
            )}
            {isEnrolled && !canManage && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white">
                ✓ Enrolled
              </span>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg tracking-wide">
              VIEW DETAILS
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-4 flex flex-col flex-1 min-h-0">
          {/* Category tag */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color }}
            >
              {course.categoryName}
            </span>
            <span className="font-black text-gray-900 text-sm">
              {course.price === 0 ? (
                <span style={{ color }}>Free</span>
              ) : (
                `$${course.price}`
              )}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
            {course.title}
          </h3>

          {/* Instructor */}
          <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
            <svg
              className="w-3 h-3 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {course.instructorName}
          </p>

          {/* Description */}
          <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 leading-relaxed flex-1">
            {course.description}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-gray-100 mb-3">
            <div className="flex-1 flex flex-col items-center py-2 border-r border-gray-100">
              <span className="text-xs font-bold text-gray-800">
                {course.sectionCount ?? 0}
              </span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide">
                Sections
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center py-2 border-r border-gray-100">
              <span className="text-xs font-bold text-gray-800">
                {course.lessonCount ?? 0}
              </span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide">
                Lessons
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center py-2">
              <span className="text-xs font-bold text-gray-800">
                {course.language}
              </span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide">
                Lang
              </span>
            </div>
          </div>
        </div>

        {/* ── Actions footer ── */}
        {(showSections ||
          hasActions ||
          (onEnroll && !isEnrolled && !canManage)) && (
          <div className="border-t border-gray-100 px-3 py-3 flex flex-col gap-2 bg-gray-50/60">
            <div className="flex items-center gap-2">
              {showSections && (
                <button
                  onClick={() => navigate(`/courses/${course.id}/sections`)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6d28d9] bg-purple-100 hover:bg-purple-200 px-2.5 py-1.5 rounded-lg transition-colors"
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
                      strokeWidth={2.5}
                      d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                    />
                  </svg>
                  Sections
                </button>
              )}

              {/* Enroll button — students only, not yet enrolled */}
              {onEnroll && !isEnrolled && !canManage && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-60"
                  style={{ background: enrolling ? "#9ca3af" : "#6d28d9" }}
                >
                  {enrolling ? (
                    <>
                      <svg
                        className="w-3 h-3 animate-spin"
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
                  ) : (
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
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Enroll
                    </>
                  )}
                </button>
              )}

              <div className="ml-auto flex items-center gap-1.5">
                <div className="ml-auto flex items-center gap-1.5">
                  {onPublish && course.status !== "Published" && (
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => onPublish(course)}
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Publish
                    </Btn>
                  )}
                  {onArchive && course.status === "Published" && (
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(course)}
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
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"
                        />
                      </svg>
                      Archive
                    </Btn>
                  )}
                </div>{" "}
              </div>
            </div>

            {/* Enroll error */}
            {enrollError && (
              <p className="text-[10px] text-red-500 font-semibold px-0.5">
                {enrollError}
              </p>
            )}

            {/* Row 2: Edit + Delete — only rendered when either exists */}
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <Btn
                    variant="secondary"
                    size="sm"
                    className="flex-1 justify-center"
                    onClick={() => onEdit(course)}
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </Btn>
                )}
                {onDelete && (
                  <Btn
                    variant="danger"
                    size="sm"
                    className="flex-1 justify-center"
                    onClick={() => onDelete(course)}
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete
                  </Btn>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <CourseDetailModal
          course={course}
          onClose={() => setModalOpen(false)}
          onEnroll={onEnroll}
        />
      )}
    </>
  );
}
