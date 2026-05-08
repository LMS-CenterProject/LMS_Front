import { useState } from "react";
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

interface CourseCardProps {
  course: Course;
  onEdit?: (c: Course) => void;
  onDelete?: (c: Course) => void;
  onPublish?: (c: Course) => void;
  onArchive?: (c: Course) => void;
}

export default function CourseCard({
  course,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}: CourseCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const icon = deterministicPick(COURSE_ICONS, course.id);
  const color = deterministicPick(COURSE_COLORS, course.id);
  const imgSrc = decodeImageSrc(course.thumbnailUrl);

  return (
    <>
      <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-violet-200 hover:shadow-md transition-all flex flex-col relative cursor-pointer">
        {/* Thumbnail */}
        <div
          className="relative h-36 flex items-center justify-center cursor-pointer"
          style={{ background: `${color}12` }}
        >
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl">{icon}</span>
          )}

          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                course.status === "Published"
                  ? "bg-green-100 text-green-700"
                  : course.status === "Draft"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {course.status}
            </span>
          </div>

          {/* Free badge */}
          {course.price === 0 && (
            <div className="absolute top-3 left-3">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: color }}
              >
                Free
              </span>
            </div>
          )}

          {/* ── Hover overlay ── */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-t-2xl">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-5 py-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Show details
            </button>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[10px] font-bold uppercase mb-1" style={{ color }}>
            {course.categoryName}
          </p>
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 mb-1">
            {course.title}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            by {course.instructorName}
          </p>
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">
            {course.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
            <span>{course.sectionCount} sections</span>
            <span>{course.lessonCount} lessons</span>
            <span>{course.language}</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto">
            <span
              className="px-4 py-1 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85 cursor-pointer"
              style={{ background: color }}
            >
              {" "}
              {course.price === 0 ? "Free" : `$${course.price}`}
            </span>{" "}
            <button
              className="px-4 py-1 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-85 cursor-pointer ml-auto"
              style={{ background: color }}
            >
              {course.price === 0 ? "Enroll for free" : "Enroll now"}
            </button>{" "}
            <div className="flex gap-2">
              {onPublish && course.status !== "Published" && (
                <button
                  onClick={() => onPublish(course)}
                  className="text-purple-600 text-xs cursor-pointer"
                >
                  Publish
                </button>
              )}
              {onArchive && course.status === "Published" && (
                <button
                  onClick={() => onArchive(course)}
                  className="text-purple-600 text-xs"
                >
                  Archive
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(course)}
                  className="text-gray-600 text-xs"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(course)}
                  className="text-red-500 text-xs"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {modalOpen && (
        <CourseDetailModal
          course={course}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
