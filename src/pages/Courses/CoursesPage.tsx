import React, { useState, useEffect, useCallback, useRef } from "react";
import { coursesApi } from "../../api/CoursesApi";
import { categoriesApi, type Category } from "../../api/CategoriesApi";
import { lmsFetch } from "../../api/LmsApi";
import { useAuth } from "../../context/AuthContext";
import type { Course } from "../../api/CoursesApi";
import { decodeImageSrc } from "../../helpers/decodeImage";
import { encodeFileToBase64 } from "../../helpers/encodeFile";
// ─── Types ────────────────────────────────────────────────────────────────────

interface InstructorOption {
  id: string;
  fullName: string;
  email: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Instructor API ───────────────────────────────────────────────────────────

async function fetchInstructors(token: string): Promise<InstructorOption[]> {
  // Fetch all instructors (role=1). Use a large pageSize to get them all.
  const res = await lmsFetch<{ users: InstructorOption[] }>(
    `/admin/users?role=1&pageSize=200`,
    {},
    token,
  );
  return res?.users ?? [];
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
    <svg
      className="w-4 h-4 shrink-0 mt-0.5"
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
    <span className="flex-1">{msg}</span>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 ml-1"
      >
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
  color?: "purple" | "green" | "yellow" | "red" | "gray" | "blue";
}) => {
  const styles: Record<string, string> = {
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${styles[color]}`}
    >
      {text}
    </span>
  );
};

const Btn = ({
  children,
  onClick,
  variant = "primary",
  size = "sm",
  disabled,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) => {
  const base =
    "inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary:
      "bg-[#6d28d9] text-white hover:bg-[#5b21b6] shadow-sm shadow-purple-200",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
    ghost: "text-[#6d28d9] hover:bg-purple-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
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
      required={required}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 transition-all"
    />
  </div>
);

const Textarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 transition-all resize-none"
    />
  </div>
);

const Select = ({
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
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 bg-white transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

// ─── Image Upload Field ────────────────────────────────────────────────────────

const ImageUploadField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = decodeImageSrc(value);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await encodeFileToBase64(file);
      onChange(encoded);
    } catch {
      // silently ignore
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        Thumbnail Image
      </label>

      {previewSrc && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden mb-2 border border-gray-200">
          <img
            src={previewSrc}
            alt="Thumbnail preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => {
              onChange("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70 transition-colors"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/40 transition-all flex items-center justify-center gap-2"
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
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {previewSrc ? "Replace image" : "Upload image"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
};

const Modal = ({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div
      className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}
    >
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
      Are you sure you want to delete{" "}
      <span className="font-semibold text-gray-900">"{what}"</span>? This cannot
      be undone.
    </p>
    <div className="flex justify-end gap-3">
      <Btn variant="secondary" onClick={onCancel}>
        Cancel
      </Btn>
      <Btn variant="danger" onClick={onConfirm}>
        Delete
      </Btn>
    </div>
  </Modal>
);

// ─── Course Card (grid view) ──────────────────────────────────────────────────

function CourseGridCard({
  course,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
}: {
  course: Course;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onPublish: (c: Course) => void;
  onArchive: (c: Course) => void;
}) {
  const icon = deterministicPick(COURSE_ICONS, course.id);
  const color = deterministicPick(COURSE_COLORS, course.id);
  const imgSrc = decodeImageSrc(course.thumbnailUrl);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-purple-200 hover:shadow-md hover:shadow-purple-50 transition-all duration-200 flex flex-col">
      <div
        className="relative h-36 flex items-center justify-center"
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
        <div className="absolute top-3 right-3">
          {course.status === "Published" ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              Published
            </span>
          ) : course.status === "Draft" ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              Draft
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {course.status}
            </span>
          )}
        </div>
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
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-1"
          style={{ color }}
        >
          {course.categoryName}
        </p>
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mb-3">by {course.instructorName}</p>
        <p className="text-xs text-gray-400 line-clamp-2 mb-3">
          {course.description}
        </p>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span>
              {course.sectionCount} section
              {course.sectionCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {course.lessonCount} lesson{course.lessonCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            <span>{course.language}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="font-extrabold text-gray-900 text-base">
            {course.price === 0 ? "Free" : `$${course.price}`}
          </span>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {course.categoryName}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-1.5 flex-wrap">
        {course.status !== "Published" && (
          <Btn variant="ghost" size="sm" onClick={() => onPublish(course)}>
            Publish
          </Btn>
        )}
        {course.status === "Published" && (
          <Btn variant="ghost" size="sm" onClick={() => onArchive(course)}>
            Archive
          </Btn>
        )}
        <div className="ml-auto flex gap-1.5">
          <Btn variant="secondary" size="sm" onClick={() => onEdit(course)}>
            Edit
          </Btn>
          <Btn variant="danger" size="sm" onClick={() => onDelete(course)}>
            Delete
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "grid" | "list";

export default function CoursesPage() {
  const { token, user: authUser } = useAuth();
  const currentUserRole: string = (authUser as any)?.role ?? "";
  const currentUserEmail: string = (authUser as any)?.email ?? "";
  const isAdmin =
    currentUserRole === "Admin" || currentUserRole === "SuperAdmin";
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [form, setForm] = useState({
    instructorId: "",
    categoryId: "",
    title: "",
    description: "",
    price: "0",
    level: "0",
    language: "English",
    thumbnailBase64: "",
  });

  // Load courses
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await coursesApi.getAll(token ?? undefined));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load categories
  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(console.error);
  }, []);

  // Load instructors (users with role = Instructor)
  useEffect(() => {
    if (!token) return;
    fetchInstructors(token)
      .then((list) => {
        console.log("[CoursesPage] instructors fetched:", list);
        setInstructors(list);
      })
      .catch(console.error);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openCreate = () => {
    setForm({
      // Admins pick from the dropdown; instructors resolve their own ID from the fetched list
      instructorId: isAdmin
        ? ""
        : (instructors.find((i) => i.email === currentUserEmail)?.id ?? ""),
      categoryId: "",
      title: "",
      description: "",
      price: "0",
      level: "0",
      language: "English",
      thumbnailBase64: "",
    });
    console.log(
      "[CoursesPage] openCreate — isAdmin:",
      isAdmin,
      "| currentUserEmail:",
      currentUserEmail,
      "| resolved instructorId:",
      isAdmin
        ? "(admin picks)"
        : (instructors.find((i) => i.email === currentUserEmail)?.id ??
            "(not found)"),
    );
    setModal("create");
  };

  const openEdit = (c: Course) => {
    setSelected(c);
    // Resolve the instructor's UUID by matching instructorName in the fetched list.
    // The GET /Course response only returns instructorName, not instructorId.
    const resolvedInstructorId =
      instructors.find((i) => i.fullName === c.instructorName)?.id ?? "";
    console.log(
      "[CoursesPage] openEdit — course:",
      c.title,
      "| instructorName:",
      c.instructorName,
      "| resolvedInstructorId:",
      resolvedInstructorId,
      "| instructors list:",
      instructors,
    );
    setForm({
      instructorId: resolvedInstructorId,
      categoryId: c.categoryId,
      title: c.title,
      description: c.description,
      price: String(c.price),
      level: "0",
      language: c.language,
      thumbnailBase64: c.thumbnailUrl ?? "",
    });
    setModal("edit");
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!token) return;

    // Guard: admin must pick an instructor
    if (isAdmin && !form.instructorId) {
      setError("Please select an instructor.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Call lmsFetch directly so we own the full request body.
      // coursesApi.create wrappers may silently drop instructorId;
      // this guarantees the selected instructor UUID reaches the API.
      const createPayload = {
        instructorId: form.instructorId,
        categoryId: form.categoryId,
        title: form.title,
        description: form.description,
        thumbnailUrl: form.thumbnailBase64 || "",
        price: parseFloat(form.price),
        level: parseInt(form.level),
        language: form.language,
      };
      console.log("[CoursesPage] handleCreate payload:", createPayload);
      await lmsFetch<unknown>(
        "/Course",
        {
          method: "POST",
          body: JSON.stringify({
            instructorId: form.instructorId,
            categoryId: form.categoryId,
            title: form.title,
            description: form.description,
            thumbnailUrl: form.thumbnailBase64 || "",
            price: parseFloat(form.price),
            level: parseInt(form.level),
            language: form.language,
          }),
        },
        token,
      );

      setModal(null);
      flash("Course created!");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!selected || !token) return;
    if (isAdmin && !form.instructorId) {
      setError("Please select an instructor.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Use lmsFetch directly to guarantee instructorId is in the body.
      const editPayload = {
        courseId: selected.id,
        instructorId: form.instructorId,
        categoryId: form.categoryId,
        title: form.title,
        description: form.description,
        thumbnailUrl: form.thumbnailBase64 || "",
        price: parseFloat(form.price),
        level: parseInt(form.level),
        language: form.language,
      };
      console.log("[CoursesPage] handleEdit payload:", editPayload);
      await lmsFetch<unknown>(
        `/Course/${selected.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            courseId: selected.id,
            instructorId: form.instructorId,
            categoryId: form.categoryId,
            title: form.title,
            description: form.description,
            thumbnailUrl: form.thumbnailBase64 || "",
            price: parseFloat(form.price),
            level: parseInt(form.level),
            language: form.language,
          }),
        },
        token,
      );
      setModal(null);
      flash("Course updated!");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || !token) return;
    setSaving(true);
    try {
      await coursesApi.delete(selected.id, token);
      setModal(null);
      flash("Course deleted.");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (c: Course) => {
    if (!token) return;
    try {
      await coursesApi.publish(c.id, token);
      flash("Published!");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleArchive = async (c: Course) => {
    if (!token) return;
    try {
      await coursesApi.archive(c.id, token);
      flash("Archived.");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.instructorName.toLowerCase().includes(q) ||
      c.categoryName.toLowerCase().includes(q) ||
      c.language.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchCategory =
      filterCategory === "all" || c.categoryId === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Total",
      value: courses.length,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      label: "Published",
      value: courses.filter((c) => c.status === "Published").length,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Draft",
      value: courses.filter((c) => c.status === "Draft").length,
      color: "text-yellow-700",
      bg: "bg-yellow-50",
    },
    {
      label: "Free",
      value: courses.filter((c) => c.price === 0).length,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Sections",
      value: courses.reduce((a, c) => a + c.sectionCount, 0),
      color: "text-gray-700",
      bg: "bg-gray-50",
    },
    {
      label: "Lessons",
      value: courses.reduce((a, c) => a + c.lessonCount, 0),
      color: "text-gray-700",
      bg: "bg-gray-50",
    },
  ];

  // ── Shared form fields ─────────────────────────────────────────────────────
  const formFields = (
    <div className="space-y-4">
      <Input
        label="Title"
        value={form.title}
        onChange={(v) => setForm((p) => ({ ...p, title: v }))}
        required
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(v) => setForm((p) => ({ ...p, description: v }))}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Price ($)"
          type="number"
          value={form.price}
          onChange={(v) => setForm((p) => ({ ...p, price: v }))}
        />
        <Select
          label="Level"
          value={form.level}
          onChange={(v) => setForm((p) => ({ ...p, level: v }))}
          options={[
            { value: "0", label: "Beginner" },
            { value: "1", label: "Intermediate" },
            { value: "2", label: "Advanced" },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Language"
          value={form.language}
          onChange={(v) => setForm((p) => ({ ...p, language: v }))}
        />
        {/* Categories fetched live from /api/Category */}
        <Select
          label="Category"
          value={form.categoryId}
          onChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
          options={[
            { value: "", label: "— Select category —" },
            ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
          ]}
        />
      </div>

      {/* Instructor — admins get a dropdown (create & edit); instructors see themselves */}
      {isAdmin ? (
        <Select
          label="Instructor"
          value={form.instructorId}
          onChange={(v) => setForm((p) => ({ ...p, instructorId: v }))}
          options={[
            { value: "", label: "— Select instructor —" },
            ...instructors.map((inst) => ({
              value: inst.id,
              label: `${inst.fullName}${inst.email ? ` (${inst.email})` : ""}`,
            })),
          ]}
        />
      ) : (
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Instructor
          </label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50">
            <span className="text-sm text-gray-800 font-medium flex-1">
              {instructors.find((i) => i.email === currentUserEmail)
                ?.fullName ??
                (authUser as any)?.fullName ??
                (authUser as any)?.name ??
                "You"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              You
            </span>
          </div>
        </div>
      )}

      {/* File → base64 image upload */}
      <ImageUploadField
        value={form.thumbnailBase64}
        onChange={(v) => setForm((p) => ({ ...p, thumbnailBase64: v }))}
      />
    </div>
  );

  return (
    <div className="lf-page min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-page { font-family: 'DM Sans', sans-serif; }
        .lf-page .font-display { font-family: 'Syne', sans-serif; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Courses
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {courses.length} course{courses.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Btn variant="primary" size="md" onClick={openCreate}>
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
            New Course
          </Btn>
        </div>

        {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}
        {success && <SuccessBanner msg={success} />}

        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* ── Stats strip ── */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className={`${s.bg} rounded-2xl p-3 text-center`}
                >
                  <div className={`font-display text-xl font-bold ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Filters + Search + View toggle ── */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px]">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search title, instructor, category…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 bg-white"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                )}
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6d28d9] bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#6d28d9] bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-[#6d28d9] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  title="Grid view"
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
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 transition-colors ${viewMode === "list" ? "bg-[#6d28d9] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  title="List view"
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              <span className="text-xs text-gray-400 shrink-0">
                {filtered.length} of {courses.length}
              </span>
            </div>

            {/* ── Empty state ── */}
            {filtered.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="text-4xl mb-3">📚</div>
                <p className="font-semibold text-gray-600">
                  {search || filterStatus !== "all" || filterCategory !== "all"
                    ? "No courses match your filters."
                    : "No courses yet. Create the first one!"}
                </p>
                {(search ||
                  filterStatus !== "all" ||
                  filterCategory !== "all") && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilterStatus("all");
                      setFilterCategory("all");
                    }}
                    className="mt-3 text-sm text-[#6d28d9] underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* ── Grid view ── */}
            {filtered.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((c) => (
                  <CourseGridCard
                    key={c.id}
                    course={c}
                    onEdit={openEdit}
                    onDelete={(c) => {
                      setSelected(c);
                      setModal("delete");
                    }}
                    onPublish={handlePublish}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            )}

            {/* ── List view ── */}
            {filtered.length > 0 && viewMode === "list" && (
              <div className="space-y-2">
                {filtered.map((c) => {
                  const color = deterministicPick(COURSE_COLORS, c.id);
                  const icon = deterministicPick(COURSE_ICONS, c.id);
                  const imgSrc = decodeImageSrc(c.thumbnailUrl);
                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-200 transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                        style={{ background: `${color}14` }}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={c.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          icon
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm truncate">
                            {c.title}
                          </span>
                          {c.status === "Published" ? (
                            <Badge text="Published" color="green" />
                          ) : c.status === "Draft" ? (
                            <Badge text="Draft" color="yellow" />
                          ) : (
                            <Badge text={c.status} color="gray" />
                          )}
                          <Badge text={c.language} color="gray" />
                          <Badge text={c.categoryName} color="blue" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          by {c.instructorName} · {c.description}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs font-semibold text-[#6d28d9]">
                            {c.price === 0 ? "Free" : `$${c.price}`}
                          </span>
                          <span className="text-xs text-gray-400">
                            {c.sectionCount} section
                            {c.sectionCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-gray-400">
                            {c.lessonCount} lesson
                            {c.lessonCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {c.status !== "Published" && (
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(c)}
                          >
                            Publish
                          </Btn>
                        )}
                        {c.status === "Published" && (
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(c)}
                          >
                            Archive
                          </Btn>
                        )}
                        <Btn
                          variant="secondary"
                          size="sm"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </Btn>
                        <Btn
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelected(c);
                            setModal("delete");
                          }}
                        >
                          Delete
                        </Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create Modal ── */}
      {modal === "create" && (
        <Modal title="Create Course" onClose={() => setModal(null)} wide>
          {error && (
            <ErrorBanner msg={error} onDismiss={() => setError(null)} />
          )}
          {formFields}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn variant="primary" disabled={saving} onClick={handleCreate}>
              {saving ? "Creating…" : "Create Course"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {modal === "edit" && selected && (
        <Modal
          title={`Edit "${selected.title}"`}
          onClose={() => setModal(null)}
          wide
        >
          {error && (
            <ErrorBanner msg={error} onDismiss={() => setError(null)} />
          )}
          {formFields}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Btn>
            <Btn variant="primary" disabled={saving} onClick={handleEdit}>
              {saving ? "Saving…" : "Save Changes"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {modal === "delete" && selected && (
        <ConfirmDelete
          what={selected.title}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
