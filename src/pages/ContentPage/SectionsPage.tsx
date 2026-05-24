import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { coursesApi } from "../../api/CoursesApi";
import { sectionsApi } from "../../api/SectionsApi";
import type { Course, CourseSection } from "../../api/CoursesApi";

// ─── Types ──────────────────────────────────────────────────────────────────
// sectionsApi.getByCourse may return sections that include a lessonCount field
interface SectionWithMeta extends CourseSection {
  lessonCount?: number;
}

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

const Breadcrumb = ({ course }: { course: Course | null }) => (
  <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
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
    <span className="text-gray-700 font-semibold truncate max-w-xs">
      {course?.title ?? "Loading…"}
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
    <span className="text-violet-600 font-semibold">Sections</span>
  </nav>
);

// ─── Section Card ─────────────────────────────────────────────────────────────

const SectionCard = ({
  section,
  index,
  onClick,
}: {
  section: SectionWithMeta;
  index: number;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group w-full text-left bg-white border border-gray-100 rounded-2xl p-5 hover:border-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
  >
    <div className="flex items-start gap-4">
      {/* Index bubble */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-50 group-hover:bg-violet-100 transition-colors flex items-center justify-center">
        <span className="text-sm font-black text-violet-600">{index + 1}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-violet-700 transition-colors">
          {section.title}
        </h3>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-gray-400">
            {section.lessonCount != null
              ? `${section.lessonCount} lesson${section.lessonCount !== 1 ? "s" : ""}`
              : "Open section"}
          </span>
          <span className="text-gray-200">·</span>
          <span className="text-xs text-gray-400">
            Order #{section.orderIndex}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-violet-600 flex items-center justify-center transition-colors">
        <svg
          className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  </button>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SectionSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded-full w-2/3" />
      <div className="h-3 bg-gray-100 rounded-full w-1/3" />
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SectionsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const canAdd =
    user?.role.includes("Instructor") ||
    user?.role.includes("Admin") ||
    user?.role.includes("SuperAdmin");
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<SectionWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRUD modal state (optional add/edit from this page)
  const [secModal, setSecModal] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [secTarget, setSecTarget] = useState<SectionWithMeta | null>(null);
  const [secForm, setSecForm] = useState({ title: "", orderIndex: "0" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    if (!token || !courseId) return;
    setLoading(true);
    setError(null);
    try {
      const [allCourses, secs] = await Promise.all([
        coursesApi.getAll(token),
        sectionsApi.getByCourse(courseId, token),
      ]);
      setCourse(allCourses.find((c) => String(c.id) === courseId) ?? null);
      setSections(secs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, courseId]);

  const handleCreate = async () => {
    if (!courseId || !token) return;
    setSaving(true);
    setFormError(null);
    try {
      await sectionsApi.create(
        {
          courseId,
          title: secForm.title,
          orderIndex: parseInt(secForm.orderIndex),
        },
        token,
      );
      setSecModal(null);
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!secTarget || !token) return;
    setSaving(true);
    setFormError(null);
    try {
      await sectionsApi.update(
        secTarget.id,
        {
          sectionId: secTarget.id,
          title: secForm.title,
          orderIndex: parseInt(secForm.orderIndex),
        },
        token,
      );
      setSecModal(null);
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!secTarget || !token) return;
    setSaving(true);
    try {
      await sectionsApi.delete(secTarget.id, token);
      setSecModal(null);
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumb course={course} />

        {/* Course hero strip */}
        {course && (
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 rounded-3xl p-6 mb-8">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)",
              }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-violet-200 text-xs font-bold tracking-widest uppercase mb-1.5">
                  Course
                </p>
                <h1
                  className="text-white font-black text-2xl leading-tight mb-2"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  {course.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold bg-white/10 text-white px-2.5 py-1 rounded-full">
                    {course.language}
                  </span>
                  <span className="text-xs font-semibold bg-white/10 text-white px-2.5 py-1 rounded-full">
                    {course.status}
                  </span>
                  {sections.length > 0 && (
                    <span className="text-xs font-semibold bg-white/10 text-white px-2.5 py-1 rounded-full">
                      {sections.length} section
                      {sections.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-white/10 font-black text-8xl leading-none select-none flex-shrink-0 -mt-2">
                {course.title.charAt(0)}
              </div>
            </div>
          </div>
        )}

        {/* Section list header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-black text-gray-900 text-lg"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Sections
          </h2>
          {canAdd && (
            <button
              onClick={() => {
                setSecForm({ title: "", orderIndex: String(sections.length) });
                setSecModal("create");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-colors"
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
              Add Section
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="space-y-2.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SectionSkeleton key={i} />)
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3 text-2xl">
                📂
              </div>
              <p className="font-bold text-gray-700">No sections yet</p>
              {canAdd && (
                <p className="text-sm text-gray-400 mt-1">
                  Add the first section to get started
                </p>
              )}
            </div>
          ) : (
            sections.map((sec, i) => (
              <div key={sec.id} className="relative group/row">
                <SectionCard
                  section={sec}
                  index={i}
                  onClick={() =>
                    navigate(`/courses/${courseId}/sections/${sec.id}/lessons`)
                  }
                />
                {/* Edit/Delete overlay */}
                {canAdd && (
                  <div className="absolute right-14 top-1/2 -translate-y-1/2 hidden group-hover/row:flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSecTarget(sec);
                        setSecForm({
                          title: sec.title,
                          orderIndex: String(sec.orderIndex),
                        });
                        setSecModal("edit");
                      }}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-violet-600 hover:border-violet-200 flex items-center justify-center text-xs transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        setSecTarget(sec);
                        setSecModal("delete");
                      }}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center text-xs transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      {(secModal === "create" || secModal === "edit") && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {secModal === "create" ? "New Section" : "Edit Section"}
              </h3>
              <button
                onClick={() => setSecModal(null)}
                className="text-gray-400 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {formError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={secForm.title}
                  onChange={(e) =>
                    setSecForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Order Index
                </label>
                <input
                  type="number"
                  value={secForm.orderIndex}
                  onChange={(e) =>
                    setSecForm((p) => ({ ...p, orderIndex: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                onClick={() => setSecModal(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={secModal === "create" ? handleCreate : handleUpdate}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : secModal === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
      {secModal === "delete" && secTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-2xl">
              🗑️
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Delete Section?</h3>
            <p className="text-sm text-gray-500 mb-6">
              "{secTarget.title}" will be permanently removed.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setSecModal(null)}
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
