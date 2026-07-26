import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { coursesApi } from "../../api/CoursesApi";
import { sectionsApi } from "../../api/SectionsApi";
import { lessonsApi } from "../../api/LessonsApi";
import type { Course, CourseSection, Lesson } from "../../api/CoursesApi";
import { toEmbedUrl } from "../../helpers/toEmbedUrl";
// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const TYPE_ICON: Record<string, string> = {
  Video: "▶",
  PDF: "📄",
  "0": "▶",
  "1": "📄",
};

const TYPE_COLOR: Record<string, string> = {
  Video: "text-blue-600 bg-blue-50",
  PDF: "text-orange-600 bg-orange-50",
  "0": "text-blue-600 bg-blue-50",
  "1": "text-orange-600 bg-orange-50",
};

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

const Breadcrumb = ({
  courseId,
  courseName,
  sectionName,
}: {
  courseId: string;
  courseName: string;
  sectionName: string;
}) => (
  <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
    <Link
      to="/courses"
      className="hover:text-violet-600 font-medium transition-colors"
    >
      Courses
    </Link>
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
    <Link
      to={`/courses/${courseId}/sections`}
      className="hover:text-violet-600 font-medium transition-colors truncate max-w-[120px]"
    >
      {courseName || "Course"}
    </Link>
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
    <span className="text-gray-700 font-semibold truncate max-w-[120px]">
      {sectionName || "Section"}
    </span>
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
    <span className="text-violet-600 font-semibold">Lessons</span>
  </nav>
);

// ─── Lesson Row ───────────────────────────────────────────────────────────────

const LessonRow = ({
  lesson,
  index,
  isActive,
  onClick,
  onEdit,
  onDelete,
  onTogglePreview,
}: {
  lesson: Lesson;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePreview: () => void;
}) => {
  const typeKey = lesson.contentType as string;
  const icon = TYPE_ICON[typeKey] ?? "▶";
  const color = TYPE_COLOR[typeKey] ?? "text-gray-600 bg-gray-100";
  const { user } = useAuth();
  const canAdd =
    user?.role.includes("Instructor") ||
    user?.role.includes("Admin") ||
    user?.role.includes("SuperAdmin");
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group w-full text-left border rounded-2xl p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {/* Type icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${color}`}
        >
          {icon}
        </div>

        {/* Index + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-gray-300">
              #{String(index + 1).padStart(2, "0")}
            </span>
            {lesson.isFreePreview && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                Free
              </span>
            )}
          </div>
          <p
            className={`font-semibold text-sm leading-snug truncate transition-colors ${isActive ? "text-violet-700" : "text-gray-800 group-hover:text-violet-700"}`}
          >
            {lesson.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {fmtSeconds(lesson.durationSeconds)}
          </p>
        </div>

        {/* Actions (hover) */}
        <div
          className="hidden group-hover:flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onTogglePreview}
            title="Toggle free preview"
            className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center text-xs transition-colors"
          >
            👁
          </button>
          {canAdd && (
            <button
              onClick={onEdit}
              className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 hover:bg-violet-50 hover:border-violet-200 flex items-center justify-center text-xs transition-colors"
            >
              ✏️
            </button>
          )}
          {canAdd && (
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 hover:bg-red-50 hover:border-red-200 flex items-center justify-center text-xs transition-colors"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-violet-500" />
        )}
      </div>
    </div>
  );
};

// ─── Lesson Detail Panel ──────────────────────────────────────────────────────

const LessonDetail = ({
  lesson,
  onClose,
}: {
  lesson: Lesson;
  onClose: () => void;
}) => {
  const typeKey = lesson.contentType as string;
  const isVideo = typeKey === "Video" || typeKey === "0";

  return (
    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
      {/* Media area */}
      <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
        {isVideo && lesson.contentUrl ? (
          <iframe
            src={toEmbedUrl(lesson.contentUrl)}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen"
            title={lesson.title}
          />
        ) : lesson.contentUrl ? (
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl">
              📄
            </div>
            <a
              href={lesson.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Open PDF
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-4xl">
              🎬
            </div>
            <p className="text-sm font-medium">No content URL</p>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2
            className="font-black text-gray-900 text-lg leading-snug"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {lesson.title}
          </h2>
          {lesson.isFreePreview && (
            <span className="flex-shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              Free Preview
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLOR[typeKey] ?? "text-gray-600 bg-gray-100"}`}
          >
            {TYPE_ICON[typeKey]}{" "}
            {typeKey === "0" ? "Video" : typeKey === "1" ? "PDF" : typeKey}
          </span>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            ⏱ {fmtSeconds(lesson.durationSeconds)}
          </span>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            Order #{lesson.orderIndex}
          </span>
        </div>

        {lesson.contentUrl && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-500 mb-1">Content URL</p>
            <a
              href={lesson.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-600 hover:underline break-all"
            >
              {lesson.contentUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const LessonSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded-full w-3/4" />
      <div className="h-3 bg-gray-100 rounded-full w-1/4" />
    </div>
  </div>
);

// ─── Lesson Form Modal ────────────────────────────────────────────────────────

const LessonModal = ({
  mode,
  form,
  onChange,
  onSave,
  onClose,
  saving,
  error,
}: {
  mode: "create" | "edit";
  form: {
    title: string;
    contentUrl: string;
    contentType: string;
    durationSeconds: string;
    orderIndex: string;
    isFreePreview: boolean;
  };
  onChange: (k: string, v: string | boolean) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">
          {mode === "create" ? "New Lesson" : "Edit Lesson"}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          ✕
        </button>
      </div>
      <div className="p-5 space-y-4">
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {[
          { label: "Title", key: "title", type: "text", required: true },
          {
            label: "Content URL",
            key: "contentUrl",
            type: "url",
            placeholder: "https://…",
          },
          {
            label: "Duration (seconds)",
            key: "durationSeconds",
            type: "number",
          },
          { label: "Order Index", key: "orderIndex", type: "number" },
        ].map(({ label, key, type, placeholder, required }) => (
          <div key={key}>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {label}
              {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <input
              type={type}
              value={form[key as keyof typeof form] as string}
              placeholder={placeholder}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Content Type
          </label>
          <select
            value={form.contentType}
            onChange={(e) => onChange("contentType", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white"
          >
            <option value="0">Video</option>
            <option value="1">PDF</option>
          </select>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isFreePreview}
            onChange={(e) => onChange("isFreePreview", e.target.checked)}
            className="rounded border-gray-300 text-violet-600 w-4 h-4"
          />
          <span className="text-sm text-gray-700 font-medium">
            Free Preview
          </span>
        </label>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          disabled={saving}
          onClick={onSave}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LessonsPage() {
  const { courseId, sectionId } = useParams<{
    courseId: string;
    sectionId: string;
  }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const canAdd =
    user?.role.includes("Instructor") ||
    user?.role.includes("Admin") ||
    user?.role.includes("SuperAdmin");
  const [course, setCourse] = useState<Course | null>(null);
  const [section, setSection] = useState<CourseSection | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lesModal, setLesModal] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [lesTarget, setLesTarget] = useState<Lesson | null>(null);
  const [lesForm, setLesForm] = useState({
    title: "",
    contentUrl: "",
    contentType: "0",
    durationSeconds: "0",
    orderIndex: "0",
    isFreePreview: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  const load = async () => {
    if (!token || !courseId || !sectionId) return;
    setLoading(true);
    setError(null);
    try {
      const [allCourses, allSections, les] = await Promise.all([
        coursesApi.getAll(token),
        sectionsApi.getByCourse(courseId, token),
        lessonsApi.getBySection(sectionId, token),
      ]);
      setCourse(allCourses.find((c) => String(c.id) === courseId) ?? null);
      setSection(allSections.find((s) => String(s.id) === sectionId) ?? null);
      setLessons(les);
      if (les.length > 0 && !activeLesson) setActiveLesson(les[0]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, courseId, sectionId]);

  const patchForm = (k: string, v: string | boolean) =>
    setLesForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!sectionId || !token) return;
    setSaving(true);
    setFormError(null);
    try {
      await lessonsApi.create(
        {
          sectionId,
          title: lesForm.title,
          contentUrl: lesForm.contentUrl,
          contentType: parseInt(lesForm.contentType) as 0 | 1,
          durationSeconds: parseInt(lesForm.durationSeconds),
          orderIndex: parseInt(lesForm.orderIndex),
          isFreePreview: lesForm.isFreePreview,
        },
        token,
      );
      setLesModal(null);
      showFlash("Lesson created!");
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!lesTarget || !token) return;
    setSaving(true);
    setFormError(null);
    try {
      await lessonsApi.update(
        lesTarget.id,
        {
          lessonId: lesTarget.id,
          title: lesForm.title,
          contentUrl: lesForm.contentUrl,
          contentType: parseInt(lesForm.contentType) as 0 | 1,
          durationSeconds: parseInt(lesForm.durationSeconds),
          orderIndex: parseInt(lesForm.orderIndex),
          isFreePreview: lesForm.isFreePreview,
        },
        token,
      );
      setLesModal(null);
      showFlash("Lesson updated!");
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lesTarget || !token) return;
    setSaving(true);
    try {
      await lessonsApi.delete(lesTarget.id, token);
      setLesModal(null);
      if (activeLesson?.id === lesTarget.id) setActiveLesson(null);
      showFlash("Lesson deleted.");
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePreview = async (l: Lesson) => {
    if (!token) return;
    try {
      await lessonsApi.togglePreview(l.id, token);
      showFlash("Preview toggled!");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumb
          courseId={courseId!}
          courseName={course?.title ?? ""}
          sectionName={section?.title ?? ""}
        />

        {/* Flash */}
        {flash && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2.5 text-sm mb-4">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            {flash}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Section header strip */}
        {section && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/courses/${courseId}/sections`)}
                className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:border-violet-300 flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-violet-500">
                  Section
                </p>
                <h1
                  className="font-black text-gray-900 text-xl"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {section.title}
                </h1>
              </div>
            </div>
            {canAdd && (
              <button
                onClick={() => {
                  setLesForm({
                    title: "",
                    contentUrl: "",
                    contentType: "0",
                    durationSeconds: "0",
                    orderIndex: String(lessons.length),
                    isFreePreview: false,
                  });
                  setLesModal("create");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-xl transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
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
                Add Lesson
              </button>
            )}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: lesson list */}
          <div className="lg:col-span-2 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <LessonSkeleton key={i} />
              ))
            ) : lessons.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center bg-white border border-gray-100 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 text-2xl">
                  🎬
                </div>
                <p className="font-bold text-gray-700">No lessons yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add your first lesson above
                </p>
              </div>
            ) : (
              lessons.map((l, i) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  index={i}
                  isActive={activeLesson?.id === l.id}
                  onClick={() => setActiveLesson(l)}
                  onEdit={() => {
                    setLesTarget(l);
                    setLesForm({
                      title: l.title,
                      contentUrl: l.contentUrl,
                      contentType:
                        l.contentType === "PDF" || l.contentType === "1"
                          ? "1"
                          : "0",
                      durationSeconds: String(l.durationSeconds),
                      orderIndex: String(l.orderIndex),
                      isFreePreview: l.isFreePreview,
                    });
                    setLesModal("edit");
                  }}
                  onDelete={() => {
                    setLesTarget(l);
                    setLesModal("delete");
                  }}
                  onTogglePreview={() => handleTogglePreview(l)}
                />
              ))
            )}
          </div>

          {/* Right: detail panel */}
          <div className="lg:col-span-3">
            {activeLesson ? (
              <LessonDetail
                lesson={activeLesson}
                onClose={() => setActiveLesson(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-100 border-dashed rounded-3xl text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 text-3xl">
                  👈
                </div>
                <p className="font-bold text-gray-500">
                  Select a lesson to preview
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Click any lesson on the left
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(lesModal === "create" || lesModal === "edit") && (
        <LessonModal
          mode={lesModal}
          form={lesForm}
          onChange={patchForm}
          onSave={lesModal === "create" ? handleCreate : handleUpdate}
          onClose={() => setLesModal(null)}
          saving={saving}
          error={formError}
        />
      )}
      {lesModal === "delete" && lesTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-2xl">
              🗑️
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Delete Lesson?</h3>
            <p className="text-sm text-gray-500 mb-6">
              "{lesTarget.title}" will be permanently removed.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setLesModal(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
