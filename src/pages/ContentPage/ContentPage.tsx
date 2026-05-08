import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { coursesApi } from "../../api/CoursesApi";
import { sectionsApi } from "../../api/SectionsApi";
import { lessonsApi } from "../../api/LessonsApi";
import type { Course, CourseSection, Lesson } from "../../api/CoursesApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-8">
    <div className="w-6 h-6 border-2 border-purple-200 border-t-[#6d28d9] rounded-full animate-spin" />
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
  color?: "green" | "gray";
}) => (
  <span
    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${color === "green" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
  >
    {text}
  </span>
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
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

const ConfirmDelete = ({
  what,
  onConfirm,
  onCancel,
}: {
  what: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <Modal title="Confirm Delete" onClose={onCancel}>
    <p className="text-sm text-gray-600 mb-6">
      Delete <span className="font-semibold">"{what}"</span>? This cannot be
      undone.
    </p>
    <div className="flex justify-end gap-3">
      <button
        onClick={onCancel}
        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-red-600 border border-red-200 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  </Modal>
);

const FieldInput = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 transition-all"
    />
  </div>
);

const FieldSelect = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 bg-white transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(
    null,
  );
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [secModal, setSecModal] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [secTarget, setSecTarget] = useState<CourseSection | null>(null);
  const [secForm, setSecForm] = useState({ title: "", orderIndex: "0" });

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
  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  useEffect(() => {
    if (!token) return;
    coursesApi
      .getAll(token)
      .then(setCourses)
      .catch(() => {});
  }, [token]);

  const loadSections = async (c: Course) => {
    if (!token) return;
    setSelectedCourse(c);
    setSelectedSection(null);
    setLessons([]);
    setLoading(true);
    setError(null);
    try {
      setSections(await sectionsApi.getByCourse(c.id, token));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (sec: CourseSection) => {
    if (!token) return;
    setSelectedSection(sec);
    setLoading(true);
    setError(null);
    try {
      setLessons(await lessonsApi.getBySection(sec.id, token));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  // Section CRUD
  const handleCreateSec = async () => {
    if (!selectedCourse || !token) return;
    setSaving(true);
    setError(null);
    try {
      await sectionsApi.create(
        {
          courseId: selectedCourse.id,
          title: secForm.title,
          orderIndex: parseInt(secForm.orderIndex),
        },
        token,
      );
      setSecModal(null);
      flash("Section created!");
      loadSections(selectedCourse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSec = async () => {
    if (!secTarget || !token) return;
    setSaving(true);
    setError(null);
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
      flash("Section updated!");
      if (selectedCourse) loadSections(selectedCourse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSec = async () => {
    if (!secTarget || !token) return;
    setSaving(true);
    try {
      await sectionsApi.delete(secTarget.id, token);
      setSecModal(null);
      flash("Section deleted.");
      if (selectedCourse) loadSections(selectedCourse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  // Lesson CRUD
  const handleCreateLes = async () => {
    if (!selectedSection || !token) return;
    setSaving(true);
    setError(null);
    try {
      await lessonsApi.create(
        {
          sectionId: selectedSection.id,
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
      flash("Lesson created!");
      loadLessons(selectedSection);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLes = async () => {
    if (!lesTarget || !token) return;
    setSaving(true);
    setError(null);
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
      flash("Lesson updated!");
      if (selectedSection) loadLessons(selectedSection);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLes = async () => {
    if (!lesTarget || !token) return;
    setSaving(true);
    try {
      await lessonsApi.delete(lesTarget.id, token);
      setLesModal(null);
      flash("Lesson deleted.");
      if (selectedSection) loadLessons(selectedSection);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePreview = async (l: Lesson) => {
    if (!token) return;
    try {
      await lessonsApi.togglePreview(l.id, token);
      flash("Preview toggled!");
      if (selectedSection) loadLessons(selectedSection);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="lf-page min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap'); .lf-page{font-family:'DM Sans',sans-serif;} .lf-page .font-display{font-family:'Syne',sans-serif;}`}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Sections & Lessons
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage your course content structure
          </p>
        </div>

        {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}
        {success && <SuccessBanner msg={success} />}

        <div className="grid grid-cols-3 gap-4">
          {/* Column 1 — Courses */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              1. Pick a Course
            </p>
            <div className="space-y-1.5 max-h-[560px] overflow-y-auto">
              {courses.length === 0 && (
                <p className="text-xs text-gray-400 py-4 text-center">
                  No courses available
                </p>
              )}
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadSections(c)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${selectedCourse?.id === c.id ? "bg-purple-50 border-[#6d28d9] text-[#6d28d9] font-semibold" : "bg-gray-50 border-gray-100 text-gray-700 hover:border-gray-300 hover:bg-white"}`}
                >
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="text-xs opacity-60 mt-0.5">
                    {c.language} · {c.status}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2 — Sections */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                2. Sections
              </p>
              {selectedCourse && (
                <button
                  onClick={() => {
                    setSecForm({
                      title: "",
                      orderIndex: String(sections.length),
                    });
                    setSecModal("create");
                  }}
                  className="text-xs font-semibold text-[#6d28d9] hover:text-[#5b21b6] flex items-center gap-1"
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
                  Add
                </button>
              )}
            </div>
            {loading && !selectedSection ? (
              <Spinner />
            ) : (
              <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
                {!selectedCourse && (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Select a course first
                  </p>
                )}
                {selectedCourse && sections.length === 0 && (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    No sections yet
                  </p>
                )}
                {sections.map((sec) => (
                  <div
                    key={sec.id}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${selectedSection?.id === sec.id ? "bg-purple-50 border-[#6d28d9]" : "bg-gray-50 border-gray-100 hover:border-gray-300 hover:bg-white"}`}
                    onClick={() => loadLessons(sec)}
                  >
                    <span className="text-sm flex-1 truncate font-medium text-gray-800">
                      {sec.title}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSecTarget(sec);
                          setSecForm({
                            title: sec.title,
                            orderIndex: String(sec.orderIndex),
                          });
                          setSecModal("edit");
                        }}
                        className="text-gray-400 hover:text-[#6d28d9] p-0.5 text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSecTarget(sec);
                          setSecModal("delete");
                        }}
                        className="text-gray-400 hover:text-red-500 p-0.5 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 3 — Lessons */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                3. Lessons
              </p>
              {selectedSection && (
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
                  className="text-xs font-semibold text-[#6d28d9] hover:text-[#5b21b6] flex items-center gap-1"
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
                  Add
                </button>
              )}
            </div>
            {loading && selectedSection ? (
              <Spinner />
            ) : (
              <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
                {!selectedSection && (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Select a section first
                  </p>
                )}
                {selectedSection && lessons.length === 0 && (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    No lessons yet
                  </p>
                )}
                {lessons.map((l) => (
                  <div
                    key={l.id}
                    className="group bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 hover:border-gray-300 hover:bg-white transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {l.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge text={l.contentType} color="gray" />
                          <span className="text-xs text-gray-400">
                            {fmtSeconds(l.durationSeconds)}
                          </span>
                          {l.isFreePreview && (
                            <Badge text="Free" color="green" />
                          )}
                        </div>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePreview(l)}
                          title="Toggle preview"
                          className="text-gray-400 hover:text-green-500 text-xs"
                        >
                          👁
                        </button>
                        <button
                          onClick={() => {
                            setLesTarget(l);
                            setLesForm({
                              title: l.title,
                              contentUrl: l.contentUrl,
                              contentType: l.contentType === "PDF" ? "1" : "0",
                              durationSeconds: String(l.durationSeconds),
                              orderIndex: String(l.orderIndex),
                              isFreePreview: l.isFreePreview,
                            });
                            setLesModal("edit");
                          }}
                          className="text-gray-400 hover:text-[#6d28d9] text-xs"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setLesTarget(l);
                            setLesModal("delete");
                          }}
                          className="text-gray-400 hover:text-red-500 text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section modals */}
      {(secModal === "create" || secModal === "edit") && (
        <Modal
          title={secModal === "create" ? "New Section" : "Edit Section"}
          onClose={() => setSecModal(null)}
        >
          {error && (
            <ErrorBanner msg={error} onDismiss={() => setError(null)} />
          )}
          <div className="space-y-4">
            <FieldInput
              label="Title"
              value={secForm.title}
              onChange={(v) => setSecForm((p) => ({ ...p, title: v }))}
              required
            />
            <FieldInput
              label="Order Index"
              type="number"
              value={secForm.orderIndex}
              onChange={(v) => setSecForm((p) => ({ ...p, orderIndex: v }))}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setSecModal(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={
                secModal === "create" ? handleCreateSec : handleUpdateSec
              }
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6] disabled:opacity-50"
            >
              {saving ? "Saving…" : secModal === "create" ? "Create" : "Save"}
            </button>
          </div>
        </Modal>
      )}
      {secModal === "delete" && secTarget && (
        <ConfirmDelete
          what={secTarget.title}
          onConfirm={handleDeleteSec}
          onCancel={() => setSecModal(null)}
        />
      )}

      {/* Lesson modals */}
      {(lesModal === "create" || lesModal === "edit") && (
        <Modal
          title={lesModal === "create" ? "New Lesson" : "Edit Lesson"}
          onClose={() => setLesModal(null)}
        >
          {error && (
            <ErrorBanner msg={error} onDismiss={() => setError(null)} />
          )}
          <div className="space-y-4">
            <FieldInput
              label="Title"
              value={lesForm.title}
              onChange={(v) => setLesForm((p) => ({ ...p, title: v }))}
              required
            />
            <FieldInput
              label="Content URL"
              value={lesForm.contentUrl}
              onChange={(v) => setLesForm((p) => ({ ...p, contentUrl: v }))}
              placeholder="https://..."
            />
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect
                label="Content Type"
                value={lesForm.contentType}
                onChange={(v) => setLesForm((p) => ({ ...p, contentType: v }))}
                options={[
                  { value: "0", label: "Video" },
                  { value: "1", label: "PDF" },
                ]}
              />
              <FieldInput
                label="Duration (s)"
                type="number"
                value={lesForm.durationSeconds}
                onChange={(v) =>
                  setLesForm((p) => ({ ...p, durationSeconds: v }))
                }
              />
            </div>
            <FieldInput
              label="Order Index"
              type="number"
              value={lesForm.orderIndex}
              onChange={(v) => setLesForm((p) => ({ ...p, orderIndex: v }))}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lesForm.isFreePreview}
                onChange={(e) =>
                  setLesForm((p) => ({ ...p, isFreePreview: e.target.checked }))
                }
                className="rounded border-gray-300 text-[#6d28d9]"
              />
              <span className="text-sm text-gray-700 font-medium">
                Free Preview
              </span>
            </label>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setLesModal(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={
                lesModal === "create" ? handleCreateLes : handleUpdateLes
              }
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6] disabled:opacity-50"
            >
              {saving ? "Saving…" : lesModal === "create" ? "Create" : "Save"}
            </button>
          </div>
        </Modal>
      )}
      {lesModal === "delete" && lesTarget && (
        <ConfirmDelete
          what={lesTarget.title}
          onConfirm={handleDeleteLes}
          onCancel={() => setLesModal(null)}
        />
      )}
    </div>
  );
}
