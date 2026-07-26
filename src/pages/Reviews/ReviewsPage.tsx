import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { reviewsApi, REVIEW_TARGET_LABELS } from "../../api/ReviewsApi";
import { coursesApi } from "../../api/CoursesApi";
import { lessonsApi } from "../../api/LessonsApi";
import { sectionsApi } from "../../api/SectionsApi";
import type { Review, ReviewTargetType } from "../../api/ReviewsApi";
import type { Course, Lesson, CourseSection } from "../../api/CoursesApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchOption {
  id: string;
  label: string;
  sublabel?: string;
}

type TargetTypeKey = "0" | "1" | "2";

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = ({ small }: { small?: boolean }) => (
  <div className={`flex justify-center ${small ? "py-2" : "py-12"}`}>
    <div className={`border-2 border-purple-200 border-t-[#6d28d9] rounded-full animate-spin ${small ? "w-4 h-4" : "w-7 h-7"}`} />
  </div>
);

const ErrorBanner = ({ msg, onDismiss }: { msg: string; onDismiss?: () => void }) => (
  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span className="flex-1">{msg}</span>
    {onDismiss && <button onClick={onDismiss} className="text-red-400 hover:text-red-600 ml-1 shrink-0">✕</button>}
  </div>
);

const SuccessBanner = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4">
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    {msg}
  </div>
);

const Modal = ({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-lg" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Search Dropdown ──────────────────────────────────────────────────────────

function SearchDropdown({
  label, placeholder, options, value, onSelect, loading, disabled,
}: {
  label: string;
  placeholder: string;
  options: SearchOption[];
  value: SearchOption | null;
  onSelect: (opt: SearchOption | null) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (value) setQuery(value.label);
    else setQuery("");
  }, [value]);

  const filtered = options.filter(
    (o) =>
      o.label.toLowerCase().includes(query.toLowerCase()) ||
      (o.sublabel ?? "").toLowerCase().includes(query.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
    if (e.target.value === "") onSelect(null);
  };

  const handleSelect = (opt: SearchOption) => {
    onSelect(opt);
    setQuery(opt.label);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onSelect(null);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text" value={query} onChange={handleInputChange}
          onFocus={() => { if (!disabled) setOpen(true); }}
          placeholder={disabled ? "Select a course first…" : placeholder}
          disabled={disabled}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <div className="w-4 h-4 border-2 border-purple-200 border-t-[#6d28d9] rounded-full animate-spin" />
          ) : value ? (
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <svg className="w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              {loading ? "Loading options…" : query ? "No results found" : "No options available"}
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.id} type="button" onClick={() => handleSelect(opt)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 hover:text-[#6d28d9] transition-colors flex items-center justify-between gap-3 border-b border-gray-50 last:border-0 ${value?.id === opt.id ? "bg-purple-50 text-[#6d28d9] font-semibold" : "text-gray-700"}`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.sublabel && <span className="text-xs text-gray-400 shrink-0">{opt.sublabel}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Star Components ──────────────────────────────────────────────────────────

const StarDisplay = ({ rating, size = "text-base" }: { rating: number; size?: string }) => (
  <div className={`flex gap-0.5 ${size}`}>
    {Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? "text-amber-400" : "text-gray-200"}>★</span>
    ))}
  </div>
);

const StarPicker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const filled = star <= (hovered || value);
        return (
          <button key={star} type="button" onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
            className={`text-2xl transition-transform hover:scale-110 ${filled ? "text-amber-400" : "text-gray-200"}`}>
            ★
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-500 font-medium">{value} / 5</span>
    </div>
  );
};

// ─── Rating Summary ───────────────────────────────────────────────────────────

function RatingSummary({ reviews, avg }: { reviews: Review[]; avg: number }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-6">
        <div className="text-center shrink-0">
          <div className="font-display text-5xl font-bold text-gray-900">{avg.toFixed(1)}</div>
          <StarDisplay rating={avg} size="text-lg" />
          <p className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 space-y-2">
          {counts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-4 shrink-0">{star}</span>
              <span className="text-amber-400 text-xs shrink-0">★</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${(count / max) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-5 text-right shrink-0">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review, onEdit }: { review: Review; onEdit: (r: Review) => void }) {
  const initials = review.studentName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-purple-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6d28d9] to-purple-400 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
            {initials || "?"}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{review.studentName}</p>
            <StarDisplay rating={review.rating} size="text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400">{fmtDate(review.createdAt)}</span>
          <button onClick={() => onEdit(review)} className="text-xs font-semibold text-[#6d28d9] hover:text-[#5b21b6] px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors">
            Edit
          </button>
        </div>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-gray-600 leading-relaxed pl-12">{review.comment}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { token } = useAuth();

  const [targetType, setTargetType] = useState<TargetTypeKey>("0");

  // dropdown data
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instructors, setInstructors] = useState<SearchOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // selections
  const [selectedCourse, setSelectedCourse] = useState<SearchOption | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<SearchOption | null>(null);

  // reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [fetched, setFetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // create modal
  const [createModal, setCreateModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // edit modal
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3500); };

  // load courses + extract instructors on mount
  useEffect(() => {
    if (!token) return;
    setLoadingOptions(true);
    coursesApi.getAll(token)
      .then((data) => {
        setCourses(data);
        const seen = new Set<string>();
        const insts: SearchOption[] = [];
        data.forEach((c: Course) => {
          const id: string = (c as any).instructorId ?? "";
          const name: string = (c as any).instructorName ?? "";
          if (id && name && !seen.has(id)) {
            seen.add(id);
            insts.push({ id, label: name, sublabel: "Instructor" });
          }
        });
        setInstructors(insts);
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, [token]);

  // load sections + lessons when a course is picked (for lesson type)
  useEffect(() => {
    if (targetType !== "2" || !selectedCourse || !token) return;
    setLessons([]); setSections([]); setSelectedTarget(null);
    setLoadingOptions(true);
    sectionsApi.getByCourse(selectedCourse.id, token)
      .then(async (secs) => {
        setSections(secs);
        const allLessons: Lesson[] = [];
        await Promise.all(
          secs.map((sec) =>
            lessonsApi.getBySection(sec.id, token)
              .then((ls) => allLessons.push(...ls))
              .catch(() => {})
          )
        );
        setLessons(allLessons);
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, [selectedCourse, targetType, token]);

  // reset on type change
  useEffect(() => {
    setSelectedTarget(null);
    setSelectedCourse(null);
    setReviews([]);
    setFetched(false);
    setError(null);
  }, [targetType]);

  // build dropdown options per type
  const courseOptions: SearchOption[] = courses.map((c) => ({
    id: c.id,
    label: c.title,
    sublabel: c.status,
  }));

  const lessonOptions: SearchOption[] = lessons.map((l) => {
    const sec = sections.find((s) => (l as any).sectionId === s.id);
    return {
      id: l.id,
      label: l.title,
      sublabel: sec?.title ?? l.contentType,
    };
  });

  const targetOptions: SearchOption[] =
    targetType === "0" ? courseOptions :
    targetType === "1" ? instructors :
    lessonOptions;

  const needsCourseFirst = targetType === "2";
  const targetDisabled = needsCourseFirst && !selectedCourse;

  const loadReviews = async () => {
    const id = selectedTarget?.id;
    if (!id || !token) return;
    setLoading(true); setError(null); setFetched(false);
    try {
      const res = await reviewsApi.getReviews(id, parseInt(targetType) as ReviewTargetType, token);
      setReviews(res.reviews);
      setAvgRating(res.averageRating);
      setFetched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const id = selectedTarget?.id;
    if (!id || !token) return;
    setSaving(true); setError(null);
    try {
      await reviewsApi.create(
        { targetId: id, targetType: parseInt(targetType) as ReviewTargetType, rating, comment },
        token,
      );
      setCreateModal(false); setComment(""); setRating(5);
      flash("Review submitted!"); loadReviews();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!editTarget || !token) return;
    setSaving(true); setError(null);
    try {
      await reviewsApi.update(editTarget.id, { rating: editRating, comment: editComment }, token);
      setEditModal(false); flash("Review updated!"); loadReviews();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const openEdit = (r: Review) => {
    setEditTarget(r); setEditRating(r.rating); setEditComment(r.comment); setEditModal(true);
  };

  const typeLabel = REVIEW_TARGET_LABELS[parseInt(targetType) as ReviewTargetType];

  return (
    <div className="lf-page min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .lf-page { font-family: 'DM Sans', sans-serif; }
        .lf-page .font-display { font-family: 'Syne', sans-serif; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">Browse and submit reviews for courses, teachers, and lessons</p>
        </div>

        {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}
        {success && <SuccessBanner msg={success} />}

        {/* ── Lookup Panel ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 space-y-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Look up reviews</p>

          {/* Type toggle */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">What would you like to review?</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: "0", label: "Course",  emoji: "📚", sub: "Rate a course" },
                { value: "1", label: "Teacher", emoji: "👨‍🏫", sub: "Rate an instructor" },
                { value: "2", label: "Lesson",  emoji: "📖", sub: "Rate a lesson" },
              ] as { value: TargetTypeKey; label: string; emoji: string; sub: string }[]).map((opt) => (
                <button
                  key={opt.value} type="button"
                  onClick={() => setTargetType(opt.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    targetType === opt.value
                      ? "bg-purple-50 border-[#6d28d9] text-[#6d28d9]"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <div className="text-left">
                    <div>{opt.label}</div>
                    <div className={`text-[10px] font-normal ${targetType === opt.value ? "text-purple-400" : "text-gray-400"}`}>{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 1: pick course (only for lesson type) */}
          {targetType === "2" && (
            <SearchDropdown
              label="Step 1 — Select a course"
              placeholder="Search courses by name…"
              options={courseOptions}
              value={selectedCourse}
              onSelect={(opt) => { setSelectedCourse(opt); setSelectedTarget(null); }}
              loading={loadingOptions && courses.length === 0}
            />
          )}

          {/* Step 2 (or Step 1 for course/teacher): pick target */}
          <div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <SearchDropdown
                  label={
                    targetType === "0" ? "Select a course" :
                    targetType === "1" ? "Select a teacher" :
                    "Step 2 — Select a lesson"
                  }
                  placeholder={
                    targetDisabled    ? "Select a course above first…" :
                    targetType === "0" ? "Search courses by name…" :
                    targetType === "1" ? "Search teachers by name…" :
                    "Search lessons by name…"
                  }
                  options={targetOptions}
                  value={selectedTarget}
                  onSelect={setSelectedTarget}
                  loading={targetType === "2" && loadingOptions && !!selectedCourse}
                  disabled={targetDisabled}
                />
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={loadReviews}
                  disabled={!selectedTarget || loading}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-purple-200 whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Loading…
                    </span>
                  ) : "Fetch Reviews"}
                </button>

                {selectedTarget && (
                  <button
                    onClick={() => setCreateModal(true)}
                    className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-[#6d28d9] border border-purple-200 hover:bg-purple-50 transition-colors whitespace-nowrap"
                  >
                    + Write Review
                  </button>
                )}
              </div>
            </div>

            {/* Selected pill */}
            {selectedTarget && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-400">Reviewing:</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-purple-50 text-[#6d28d9] border border-purple-200 px-3 py-1 rounded-full">
                  {targetType === "0" ? "📚" : targetType === "1" ? "👨‍🏫" : "📖"}
                  {selectedTarget.label}
                  {selectedTarget.sublabel && (
                    <span className="text-purple-400 font-normal">· {selectedTarget.sublabel}</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        {loading && <Spinner />}

        {!loading && fetched && (
          reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-3">⭐</div>
              <p className="font-semibold text-gray-700">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to leave a review for <span className="font-medium text-gray-600">"{selectedTarget?.label}"</span>.</p>
              <button
                onClick={() => setCreateModal(true)}
                className="mt-4 px-4 py-2 text-sm font-semibold rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6] transition-colors"
              >
                Write a Review
              </button>
            </div>
          ) : (
            <>
              <RatingSummary reviews={reviews} avg={avgRating} />
              <div className="space-y-3">
                {reviews.map((r) => <ReviewCard key={r.id} review={r} onEdit={openEdit} />)}
              </div>
            </>
          )
        )}

        {!loading && !fetched && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center text-4xl mb-4">⭐</div>
            <p className="font-semibold text-gray-600">Select a {typeLabel.toLowerCase()} above to load reviews</p>
            <p className="text-sm text-gray-400 mt-1">Use the search dropdown to find what you're looking for.</p>
          </div>
        )}
      </div>

      {/* ── Create Review Modal ── */}
      {createModal && (
        <Modal title={`Write a ${typeLabel} Review`} onClose={() => setCreateModal(false)} wide>
          {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}

          {/* Target reminder */}
          <div className="flex items-center gap-3 mb-5 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
            <span className="text-xl">{targetType === "0" ? "📚" : targetType === "1" ? "👨‍🏫" : "📖"}</span>
            <div>
              <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide">Reviewing</p>
              <p className="text-sm font-bold text-gray-900">{selectedTarget?.label}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Your Rating</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Comment</label>
              <textarea
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience — what did you like or find could be improved?"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{comment.length} characters</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setCreateModal(false)} className="px-3 py-2 text-xs font-semibold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">Cancel</button>
            <button disabled={saving} onClick={handleCreate} className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6] disabled:opacity-50">
              {saving ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Review Modal ── */}
      {editModal && editTarget && (
        <Modal title="Edit Review" onClose={() => setEditModal(false)} wide>
          {error && <ErrorBanner msg={error} onDismiss={() => setError(null)} />}

          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-xs mb-5">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Reviews can only be edited within 30 days of posting.
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Rating</label>
              <StarPicker value={editRating} onChange={setEditRating} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Comment</label>
              <textarea
                value={editComment} onChange={(e) => setEditComment(e.target.value)} rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#6d28d9] focus:ring-2 focus:ring-purple-100 transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{editComment.length} characters</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditModal(false)} className="px-3 py-2 text-xs font-semibold rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">Cancel</button>
            <button disabled={saving} onClick={handleUpdate} className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#6d28d9] text-white hover:bg-[#5b21b6] disabled:opacity-50">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}