import React, { useState, useEffect, useCallback, useRef } from "react";
import { lmsFetch } from "../../api/LmsApi";
import { useAuth } from "../../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Quiz {
  id: string;
  title: string;
  passScore: number;
  timeLimitMinutes: number;
  courseId: string;
  courseTitle?: string;
  instructorId?: string;
}

interface Question {
  id: string;
  quizId: string;
  text: string;
  type: number; // 0 = SingleChoice, 1 = MultipleChoice, 2 = TrueFalse
  points: number;
}

interface Answer {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
}

interface Course {
  id: string;
  title: string;
  instructorId?: string;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  userName?: string;
  score: number;
  passed: boolean;
  submittedAt: string;
  // FIX: answers now always stored as { questionId, answerId: string[] }[]
  answers: { questionId: string; answerId: string[] }[];
}

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

// Draft types for inline quiz builder
interface DraftAnswer {
  localId: string;
  text: string;
  isCorrect: boolean;
}

interface DraftQuestion {
  localId: string;
  text: string;
  type: number; // 0=Single, 1=Multiple, 2=TrueFalse
  points: number;
  answers: DraftAnswer[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeQuestionType(type: number | string): number {
  if (typeof type === "number") return type;
  if (type === "SingleChoice") return 0;
  if (type === "MultiChoice") return 1;
  return 2; // TrueFalse
}

// ─── API ──────────────────────────────────────────────────────────────────────

const api = {
  getMyCourses: (token: string) =>
    lmsFetch<Course[]>("/Course/my-courses", {}, token),
  getCourses: (token: string) => lmsFetch<Course[]>("/Course", {}, token),

  getQuizzesByCourse: (courseId: string, token: string) =>
    lmsFetch<Quiz[]>(`/Quiz/course/${courseId}`, {}, token),
  updateQuiz: (
    id: string,
    body: {
      quizId: string;
      title: string;
      passScore: number;
      timeLimitMinutes: number;
    },
    token: string,
  ) =>
    lmsFetch<void>(
      `/Quiz/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      token,
    ),
  deleteQuiz: (id: string, token: string) =>
    lmsFetch<void>(`/Quiz/${id}`, { method: "DELETE" }, token),

  getQuestionsByQuiz: (quizId: string, token: string) =>
    lmsFetch<Question[]>(`/Question/quiz/${quizId}`, {}, token),
  deleteQuestion: (id: string, token: string) =>
    lmsFetch<void>(`/Question/${id}`, { method: "DELETE" }, token),
  getMyEnrolledCourses: (token: string) =>
    lmsFetch<{ courseId: string; courseTitle: string }[]>(
      "/enrollments/myEnrollments",
      {},
      token,
    ),

  getAnswersByQuestion: (questionId: string, token: string) =>
    lmsFetch<Answer[]>(`/Answer/question/${questionId}`, {}, token),
  deleteAnswer: (id: string, token: string) =>
    lmsFetch<void>(`/Answer/${id}`, { method: "DELETE" }, token),

  getMyAttempts: (token: string) =>
    lmsFetch<
      {
        attemptId: string;
        quizId: string;
        quizTitle: string;
        score: number;
        passed: boolean;
        attemptedAt: string;
        questions: {
          questionId: string;
          questionText: string;
          answerId: string;
          answerText: string;
          isCorrect: boolean;
        }[];
      }[]
    >("/QuizAttempt/my-attempts", {}, token),
  getQuizStats: (quizId: string, token: string) =>
    lmsFetch<{
      quizId: string;
      totalAttempts: number;
      passedCount: number;
      failedCount: number;
      averageScore: number;
    }>(`/QuizAttempt/quiz/${quizId}/stats`, {}, token),
  getQuizStudents: (quizId: string, token: string) =>
    lmsFetch<{
      quizId: string;
      totalStudents: number;
      totalAttempts: number;
      students: {
        studentId: string;
        studentName: string;
        attempts: {
          attemptId: string;
          score: number;
          passed: boolean;
          attemptedAt: string;
          answers: {
            questionId: string;
            questionText: string;
            answerId: string;
            answerText: string;
            isCorrect: boolean;
          }[];
        }[];
      }[];
    }>(`/QuizAttempt/quiz/${quizId}/students`, {}, token),
  submitAttempt: (
    body: {
      quizId: string;
      answers: { questionId: string; answerId: string }[];
    },
    token: string,
  ) =>
    lmsFetch<{
      attemptId: string;
      score: number;
      passed: boolean;
      remainingAttempts: number;
    }>(
      "/QuizAttempt/submit",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
};

// ─── Raw POST helper ──────────────────────────────────────────────────────────

async function lmsPost<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  const base = (import.meta as any).env?.VITE_API_BASE_URL ?? "/api";
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      detail = j.detail ?? j.title ?? j.message ?? JSON.stringify(j);
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const QUESTION_TYPES = [
  { value: 0, label: "Single Choice", icon: "◎", color: "#3b82f6" },
  { value: 1, label: "Multiple Choice", icon: "☑", color: "#8b5cf6" },
  { value: 2, label: "True / False", icon: "⇄", color: "#f59e0b" },
];

const isInstructor = (role: string) =>
  ["instructor", "admin", "superadmin"].includes(role?.toLowerCase());

const genId = () => Math.random().toString(36).slice(2, 10);

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="relative w-9 h-9">
      <div className="absolute inset-0 rounded-full border-[3px] border-[#f1ede8]" />
      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#c84b31] animate-spin" />
    </div>
  </div>
);

const Toast = ({
  msg,
  type,
  onDismiss,
}: {
  msg: string;
  type: "error" | "success";
  onDismiss?: () => void;
}) => (
  <div
    className={`flex items-start gap-3 rounded-2xl px-5 py-4 text-sm mb-5 border
    ${type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}
  >
    <span className="text-base mt-0.5">{type === "error" ? "⚠️" : "✅"}</span>
    <span className="flex-1 font-semibold">{msg}</span>
    {onDismiss && (
      <button
        onClick={onDismiss}
        className="opacity-40 hover:opacity-80 text-xl leading-none"
      >
        ×
      </button>
    )}
  </div>
);

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
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div
      className={`bg-[#faf7f4] rounded-3xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[92vh] overflow-y-auto border border-[#e8e0d8]`}
    >
      <div className="flex items-center justify-between px-7 py-5 border-b border-[#e8e0d8] sticky top-0 bg-[#faf7f4] rounded-t-3xl z-10">
        <h3
          className="font-black text-[#1a1108] text-lg tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {title}
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-[#9b8a7a] hover:text-[#1a1108] hover:bg-[#f0ebe4] rounded-full transition-colors text-xl"
        >
          ×
        </button>
      </div>
      <div className="p-7">{children}</div>
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
    <p className="text-sm text-[#5c4c3d] mb-6">
      Delete <span className="font-bold text-[#1a1108]">"{what}"</span>? This
      cannot be undone.
    </p>
    <div className="flex justify-end gap-3">
      <button
        onClick={onCancel}
        className="px-5 py-2.5 rounded-xl text-sm font-bold border border-[#d4c9be] text-[#5c4c3d] hover:bg-[#f0ebe4] transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
      >
        Delete
      </button>
    </div>
  </Modal>
);

const Empty = ({
  icon,
  msg,
  action,
}: {
  icon: string;
  msg: string;
  action?: React.ReactNode;
}) => (
  <div className="text-center py-16 border-2 border-dashed border-[#e0d6cc] rounded-3xl bg-[#fdf9f6]">
    <div className="text-5xl mb-4">{icon}</div>
    <p className="font-semibold text-[#9b8a7a] mb-5 text-sm">{msg}</p>
    {action}
  </div>
);

// ─── Score Ring ───────────────────────────────────────────────────────────────

const ScoreRing = ({
  score,
  passed,
  size = 120,
}: {
  score: number;
  passed: boolean;
  size?: number;
}) => {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f0ebe4"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={passed ? "#10b981" : "#ef4444"}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={passed ? "#059669" : "#dc2626"}
        fontSize={size * 0.22}
        fontWeight="900"
        fontFamily="system-ui"
      >
        {score}%
      </text>
    </svg>
  );
};

// ─── Timer ────────────────────────────────────────────────────────────────────

const Timer = ({
  minutes,
  onExpire,
}: {
  minutes: number;
  onExpire: () => void;
}) => {
  const [secs, setSecs] = useState(minutes * 60);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(ref.current!);
          onExpire();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs < 60;

  return (
    <div
      className={`flex items-center gap-2 font-mono font-bold text-sm px-4 py-2 rounded-xl border-2 transition-colors
      ${urgent ? "border-red-300 bg-red-50 text-red-700 animate-pulse" : "border-[#d4c9be] bg-[#f7f2ee] text-[#5c4c3d]"}`}
    >
      ⏱ {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
};

// ─── INLINE QUIZ BUILDER ──────────────────────────────────────────────────────

function QuizBuilder({
  token,
  courses,
  onDone,
  editingQuiz,
}: {
  token: string;
  courses: Course[];
  onDone: () => void;
  editingQuiz?: Quiz | null;
}) {
  const [step, setStep] = useState<"details" | "questions">(
    editingQuiz ? "questions" : "details",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseId, setCourseId] = useState(editingQuiz?.courseId ?? "");
  const [title, setTitle] = useState(editingQuiz?.title ?? "");
  const [passScore, setPassScore] = useState(
    String(editingQuiz?.passScore ?? 70),
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    String(editingQuiz?.timeLimitMinutes ?? 30),
  );

  const [quiz, setQuiz] = useState<Quiz | null>(editingQuiz ?? null);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [loadingQs, setLoadingQs] = useState(!!editingQuiz);

  useEffect(() => {
    if (!editingQuiz) return;
    (async () => {
      try {
        const qs = await api.getQuestionsByQuiz(editingQuiz.id, token);
        const withAnswers = await Promise.all(
          qs.map(async (q) => {
            const ans = await api.getAnswersByQuestion(q.id, token);
            return {
              localId: q.id,
              text: q.text,
              type: normalizeQuestionType(q.type),
              points: q.points,
              answers: ans.map((a) => ({
                localId: a.id,
                text: a.text,
                isCorrect: a.isCorrect,
              })),
            } as DraftQuestion;
          }),
        );
        setQuestions(withAnswers);
      } finally {
        setLoadingQs(false);
      }
    })();
  }, [editingQuiz, token]);

  const addQuestion = (type: number) => {
    const localId = genId();
    let answers: DraftAnswer[] = [];
    if (type === 2) {
      answers = [
        { localId: genId(), text: "True", isCorrect: false },
        { localId: genId(), text: "False", isCorrect: false },
      ];
    }
    setQuestions((prev) => [
      ...prev,
      { localId, text: "", type, points: 1, answers },
    ]);
  };

  const removeQuestion = (localId: string) =>
    setQuestions((prev) => prev.filter((q) => q.localId !== localId));

  const updateQuestion = (localId: string, patch: Partial<DraftQuestion>) =>
    setQuestions((prev) =>
      prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q)),
    );

  const addAnswer = (qLocalId: string) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === qLocalId
          ? {
              ...q,
              answers: [
                ...q.answers,
                { localId: genId(), text: "", isCorrect: false },
              ],
            }
          : q,
      ),
    );

  const removeAnswer = (qLocalId: string, aLocalId: string) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.localId === qLocalId
          ? { ...q, answers: q.answers.filter((a) => a.localId !== aLocalId) }
          : q,
      ),
    );

  const updateAnswer = (
    qLocalId: string,
    aLocalId: string,
    patch: Partial<DraftAnswer>,
  ) =>
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.localId !== qLocalId) return q;
        let answers = q.answers.map((a) =>
          a.localId === aLocalId ? { ...a, ...patch } : a,
        );
        if (patch.isCorrect && (q.type === 0 || q.type === 2)) {
          answers = answers.map((a) => ({
            ...a,
            isCorrect: a.localId === aLocalId,
          }));
        }
        return { ...q, answers };
      }),
    );

  const handleSaveDetails = async () => {
    if (!courseId || !title.trim()) {
      setError("Course and title are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const quizId = await lmsPost<string>(
        "/Quiz",
        {
          courseId,
          title,
          passScore: +passScore,
          timeLimitMinutes: +timeLimitMinutes,
        },
        token,
      );
      if (!quizId) throw new Error("Quiz created but backend returned no ID");
      setQuiz({
        id: quizId,
        courseId,
        title,
        passScore: +passScore,
        timeLimitMinutes: +timeLimitMinutes,
      });
      setStep("questions");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!quiz) return;
    if (questions.length === 0) {
      setError("Add at least one question before publishing.");
      return;
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        setError("All questions must have text.");
        return;
      }
      if (q.answers.length < 2) {
        setError(`"${q.text.slice(0, 30)}…" needs at least 2 answers.`);
        return;
      }
      if (!q.answers.some((a) => a.isCorrect)) {
        setError(`Mark a correct answer for: "${q.text.slice(0, 30)}"`);
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      if (editingQuiz) {
        await api.updateQuiz(
          quiz.id,
          {
            quizId: quiz.id,
            title,
            passScore: +passScore,
            timeLimitMinutes: +timeLimitMinutes,
          },
          token,
        );
        const existingQs = await api.getQuestionsByQuiz(quiz.id, token);
        for (const eq of existingQs) {
          const existingAs = await api.getAnswersByQuestion(eq.id, token);
          for (const ea of existingAs) await api.deleteAnswer(ea.id, token);
          await api.deleteQuestion(eq.id, token);
        }
      }

      for (const dq of questions) {
        const safePoints = Math.max(
          1,
          Math.round(isNaN(dq.points) ? 1 : dq.points),
        );
        const questionId = await lmsPost<string>(
          "/Question",
          {
            quizId: quiz.id,
            text: dq.text.trim(),
            type: dq.type,
            points: safePoints,
          },
          token,
        );
        if (!questionId)
          throw new Error("Question created but backend returned no ID");

        for (const da of dq.answers) {
          await lmsPost<string>(
            "/Answer",
            {
              questionId,
              text: da.text.trim(),
              isCorrect: da.isCorrect,
            },
            token,
          );
        }
      }
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Failed to save quiz.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onDone}
        className="flex items-center gap-2 text-xs font-bold text-[#9b8a7a] hover:text-[#c84b31] mb-6 transition-colors uppercase tracking-wider"
      >
        ← Back to quizzes
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#c84b31] flex items-center justify-center text-white text-2xl shadow-lg shadow-[#c84b31]/30">
          {editingQuiz ? "✏️" : "✦"}
        </div>
        <div>
          <h2
            className="font-black text-2xl text-[#1a1108] tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {editingQuiz ? `Edit: ${editingQuiz.title}` : "Create New Quiz"}
          </h2>
          <p className="text-xs text-[#9b8a7a] font-semibold mt-0.5">
            {step === "details"
              ? "Step 1 of 2 — Quiz details"
              : "Step 2 of 2 — Add questions"}
          </p>
        </div>
      </div>

      {!editingQuiz && (
        <div className="flex items-center gap-2 mb-8">
          {["details", "questions"].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all
                ${
                  step === s
                    ? "bg-[#c84b31] text-white"
                    : step === "questions" && s === "details"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[#f0ebe4] text-[#9b8a7a]"
                }`}
              >
                <span>
                  {step === "questions" && s === "details" ? "✓" : i + 1}
                </span>
                <span className="capitalize">
                  {s === "details" ? "Quiz Details" : "Questions"}
                </span>
              </div>
              {i < 1 && <div className="w-8 h-px bg-[#d4c9be]" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {error && (
        <Toast type="error" msg={error} onDismiss={() => setError(null)} />
      )}

      {step === "details" && (
        <div className="bg-white rounded-3xl border border-[#e8e0d8] p-8 shadow-sm">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-[#5c4c3d] mb-2 uppercase tracking-widest">
                Course *
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full border border-[#e0d6cc] rounded-xl px-4 py-3 text-sm text-[#1a1108] bg-[#fdf9f6] outline-none focus:border-[#c84b31] focus:ring-2 focus:ring-[#c84b31]/10 transition-all"
              >
                <option value="">— Select a course —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#5c4c3d] mb-2 uppercase tracking-widest">
                Quiz Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Module 3 Final Assessment"
                className="w-full border border-[#e0d6cc] rounded-xl px-4 py-3 text-sm text-[#1a1108] bg-[#fdf9f6] outline-none focus:border-[#c84b31] focus:ring-2 focus:ring-[#c84b31]/10 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-[#5c4c3d] mb-2 uppercase tracking-widest">
                  Pass Score (%)
                </label>
                <input
                  type="number"
                  value={passScore}
                  onChange={(e) => setPassScore(e.target.value)}
                  className="w-full border border-[#e0d6cc] rounded-xl px-4 py-3 text-sm text-[#1a1108] bg-[#fdf9f6] outline-none focus:border-[#c84b31] focus:ring-2 focus:ring-[#c84b31]/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#5c4c3d] mb-2 uppercase tracking-widest">
                  Time Limit (min)
                </label>
                <input
                  type="number"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                  className="w-full border border-[#e0d6cc] rounded-xl px-4 py-3 text-sm text-[#1a1108] bg-[#fdf9f6] outline-none focus:border-[#c84b31] focus:ring-2 focus:ring-[#c84b31]/10 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSaveDetails}
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-[#c84b31] text-white font-bold text-sm hover:bg-[#a83928] disabled:opacity-50 transition-all shadow-lg shadow-[#c84b31]/30"
            >
              {saving ? "Saving…" : "Continue to Questions →"}
            </button>
          </div>
        </div>
      )}

      {step === "questions" && (
        <div>
          {loadingQs ? (
            <Spinner />
          ) : (
            <>
              <div className="flex gap-3 mb-6 flex-wrap">
                {QUESTION_TYPES.map((qt) => (
                  <button
                    key={qt.value}
                    onClick={() => addQuestion(qt.value)}
                    className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 border-dashed border-[#d4c9be] text-sm font-bold text-[#5c4c3d] hover:border-[#c84b31] hover:text-[#c84b31] hover:bg-[#fdf3f0] transition-all group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {qt.icon}
                    </span>
                    + {qt.label}
                  </button>
                ))}
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-[#e0d6cc] rounded-3xl bg-[#fdf9f6]">
                  <div className="text-5xl mb-4">📝</div>
                  <p className="font-semibold text-[#9b8a7a] mb-2">
                    No questions yet
                  </p>
                  <p className="text-xs text-[#b5a89a]">
                    Click a question type above to add your first question
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {questions.map((q, qi) => (
                    <QuestionCard
                      key={q.localId}
                      q={q}
                      index={qi}
                      onUpdate={(patch) => updateQuestion(q.localId, patch)}
                      onRemove={() => removeQuestion(q.localId)}
                      onAddAnswer={() => addAnswer(q.localId)}
                      onRemoveAnswer={(aId) => removeAnswer(q.localId, aId)}
                      onUpdateAnswer={(aId, patch) =>
                        updateAnswer(q.localId, aId, patch)
                      }
                    />
                  ))}
                </div>
              )}

              <div className="sticky bottom-4 mt-6">
                <div className="bg-[#1a1108] rounded-2xl px-6 py-4 flex items-center justify-between gap-4 shadow-2xl">
                  <div className="text-sm text-[#9b8a7a]">
                    <span className="font-black text-white text-lg mr-1">
                      {questions.length}
                    </span>
                    question{questions.length !== 1 ? "s" : ""} added
                  </div>
                  <button
                    onClick={handlePublish}
                    disabled={saving || questions.length === 0}
                    className="px-8 py-3 rounded-xl bg-[#c84b31] text-white font-black text-sm hover:bg-[#a83928] disabled:opacity-40 transition-all shadow-lg shadow-[#c84b31]/40"
                  >
                    {saving
                      ? "Publishing…"
                      : editingQuiz
                        ? "✓ Save Changes"
                        : "✓ Publish Quiz"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Question Card (inline editor) ───────────────────────────────────────────

function QuestionCard({
  q,
  index,
  onUpdate,
  onRemove,
  onAddAnswer,
  onRemoveAnswer,
  onUpdateAnswer,
}: {
  q: DraftQuestion;
  index: number;
  onUpdate: (patch: Partial<DraftQuestion>) => void;
  onRemove: () => void;
  onAddAnswer: () => void;
  onRemoveAnswer: (aId: string) => void;
  onUpdateAnswer: (aId: string, patch: Partial<DraftAnswer>) => void;
}) {
  const qt = QUESTION_TYPES.find((t) => t.value === q.type)!;
  const isMultiple = q.type === 1;
  const isTF = q.type === 2;

  return (
    <div className="bg-white rounded-3xl border border-[#e8e0d8] overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div
        className="flex items-center gap-3 px-6 py-4 border-b border-[#f0ebe4]"
        style={{
          background: `linear-gradient(135deg, ${qt.color}08, ${qt.color}04)`,
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
          style={{ background: qt.color }}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: `${qt.color}15`, color: qt.color }}
          >
            {qt.icon} {qt.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={q.points}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              onUpdate({ points: isNaN(v) || v < 1 ? 1 : v });
            }}
            className="w-14 text-center border border-[#e0d6cc] rounded-lg px-2 py-1 text-xs font-bold text-[#5c4c3d] bg-[#fdf9f6]"
            min={1}
            step={1}
            title="Points"
          />
          <span className="text-[10px] text-[#9b8a7a]">pts</span>
          <button
            onClick={onRemove}
            className="w-7 h-7 flex items-center justify-center text-[#b5a89a] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors text-lg"
          >
            ×
          </button>
        </div>
      </div>

      <div className="px-6 pt-5 pb-4">
        <textarea
          value={q.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Type your question here…"
          rows={2}
          className="w-full text-sm font-semibold text-[#1a1108] placeholder-[#c5b8aa] bg-transparent resize-none outline-none border-b-2 border-[#f0ebe4] focus:border-[#c84b31] pb-2 transition-colors"
        />
      </div>

      <div className="px-6 pb-5 space-y-2">
        {q.answers.map((a) => (
          <div
            key={a.localId}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border-2 transition-all
            ${a.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-[#f0ebe4] bg-[#fdf9f6]"}`}
          >
            {isMultiple ? (
              <button
                onClick={() =>
                  onUpdateAnswer(a.localId, { isCorrect: !a.isCorrect })
                }
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all
                  ${a.isCorrect ? "bg-emerald-500 border-emerald-500 text-white" : "border-[#d4c9be]"}`}
              >
                {a.isCorrect && (
                  <span className="text-[10px] font-black">✓</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => onUpdateAnswer(a.localId, { isCorrect: true })}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${a.isCorrect ? "bg-emerald-500 border-emerald-500" : "border-[#d4c9be]"}`}
              >
                {a.isCorrect && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            )}

            {isTF ? (
              <span
                className={`flex-1 text-sm font-bold ${a.isCorrect ? "text-emerald-700" : "text-[#5c4c3d]"}`}
              >
                {a.text}
              </span>
            ) : (
              <input
                value={a.text}
                onChange={(e) =>
                  onUpdateAnswer(a.localId, { text: e.target.value })
                }
                placeholder="Answer option…"
                className="flex-1 text-sm bg-transparent outline-none text-[#1a1108] placeholder-[#c5b8aa]"
              />
            )}

            {a.isCorrect && (
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                Correct
              </span>
            )}
            {!isTF && q.answers.length > 2 && (
              <button
                onClick={() => onRemoveAnswer(a.localId)}
                className="w-5 h-5 flex items-center justify-center text-[#c5b8aa] hover:text-red-500 rounded transition-colors shrink-0"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {!isTF && (
          <button
            onClick={onAddAnswer}
            className="flex items-center gap-2 text-xs font-bold text-[#9b8a7a] hover:text-[#c84b31] transition-colors mt-1 ml-1"
          >
            + Add answer option
          </button>
        )}
      </div>
    </div>
  );
}

// ─── STUDENT: Quiz List ───────────────────────────────────────────────────────

// Shape returned by GET /QuizAttempt/my-attempts
interface MyAttemptRecord {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
  questions: {
    questionId: string;
    questionText: string;
    answerId: string;
    answerText: string;
    isCorrect: boolean;
  }[];
}

// Fetch full answer options for each question in an attempt record,
// then merge with the student's chosen answers to produce the complete
// QuizAttempt + QuestionWithAnswers[] needed by QuizResult.
//
// Flow:
//   1. Group attempt rows by questionId → know what the student chose
//   2. Fetch GET /Answer/question/{id} for each question → full option list
//      with isCorrect flags (instructor sees these)
//   3. Build QuestionWithAnswers with ALL options; mark chosen ones via attempt.answers
//   4. Question-level correctness = chosen set exactly matches correct set
async function buildResultFromAttemptRecord(
  record: MyAttemptRecord,
  userId: string,
  token: string,
): Promise<{ attempt: QuizAttempt; questions: QuestionWithAnswers[] }> {
  // Step 1 — group chosen answers by questionId
  const chosenMap = new Map<string, { text: string; chosenAnswerIds: string[] }>();
  for (const row of record.questions) {
    if (!chosenMap.has(row.questionId)) {
      chosenMap.set(row.questionId, { text: row.questionText, chosenAnswerIds: [] });
    }
    chosenMap.get(row.questionId)!.chosenAnswerIds.push(row.answerId);
  }

  // Step 2 — fetch full answer list for every question in parallel
  const questions: QuestionWithAnswers[] = await Promise.all(
    Array.from(chosenMap.entries()).map(async ([qId, q]) => {
      let allAnswers: Answer[] = [];
      try {
        allAnswers = await api.getAnswersByQuestion(qId, token);
      } catch {
        // Fallback: build synthetic answers from what we know
        // (only the chosen answer, with isCorrect from the attempt)
        const chosenRows = record.questions.filter((r) => r.questionId === qId);
        allAnswers = chosenRows.map((r) => ({
          id: r.answerId,
          questionId: qId,
          text: r.answerText,
          isCorrect: r.isCorrect,
        }));
      }
      return {
        id: qId,
        quizId: record.quizId,
        text: q.text,
        type: 0,
        points: 1,
        answers: allAnswers,
      };
    }),
  );

  // Step 3 — build the attempt with chosen answer IDs per question
  const attempt: QuizAttempt = {
    id: record.attemptId,
    quizId: record.quizId,
    userId,
    score: record.score,
    passed: record.passed,
    submittedAt: record.attemptedAt,
    answers: Array.from(chosenMap.entries()).map(([qId, q]) => ({
      questionId: qId,
      answerId: q.chosenAnswerIds,
    })),
  };

  return { attempt, questions };
}

function StudentQuizList({ token, userId }: { token: string; userId: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  // keyed by quizId — null means not attempted
  const [attemptRecords, setAttemptRecords] = useState<Record<string, MyAttemptRecord | null>>({});
  // for attempts made THIS session (score + full question data already in memory)
  const [sessionResults, setSessionResults] = useState<Record<string, { attempt: QuizAttempt; questions: QuestionWithAnswers[] }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);
  const [viewingResult, setViewingResult] = useState<{
    quiz: Quiz;
    attempt: QuizAttempt;
    questions: QuestionWithAnswers[];
  } | null>(null);

  useEffect(() => {
    api
      .getMyEnrolledCourses(token)
      .then((enrollments) =>
        setCourses(enrollments.map((e) => ({ id: e.courseId, title: e.courseTitle }))),
      )
      .catch(console.error);
  }, [token, userId]);

  const loadQuizzesAndAttempts = useCallback(async (courseId: string) => {
    if (!courseId) { setQuizzes([]); setAttemptRecords({}); return; }
    setLoading(true);
    try {
      const [qs, myAttempts] = await Promise.all([
        api.getQuizzesByCourse(courseId, token),
        api.getMyAttempts(token).catch(() => [] as MyAttemptRecord[]),
      ]);
      const arr = Array.isArray(qs) ? qs : [];
      setQuizzes(arr);
      const map: Record<string, MyAttemptRecord | null> = {};
      for (const q of arr) {
        // Use the most recent attempt for this quiz
        const found = (myAttempts as MyAttemptRecord[])
          .filter((a) => a.quizId === q.id)
          .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())[0] ?? null;
        map[q.id] = found;
      }
      setAttemptRecords(map);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadQuizzesAndAttempts(selectedCourse); }, [selectedCourse, loadQuizzesAndAttempts]);

  if (takingQuiz) {
    return (
      <StudentQuizTaker
        quiz={takingQuiz}
        token={token}
        userId={userId}
        onDone={(attempt, questions) => {
          setTakingQuiz(null);
          setSessionResults((prev) => ({ ...prev, [takingQuiz.id]: { attempt, questions } }));
          setViewingResult({ quiz: takingQuiz, attempt, questions });
          // Refresh attempt records in the background so score shows immediately
          loadQuizzesAndAttempts(selectedCourse);
        }}
        onBack={() => setTakingQuiz(null)}
      />
    );
  }

  if (viewingResult) {
    return <QuizResult {...viewingResult} onBack={() => setViewingResult(null)} />;
  }

  return (
    <div>
      {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
      <div className="mb-6">
        <label className="block text-xs font-black text-[#5c4c3d] mb-2 uppercase tracking-widest">
          Your Enrolled Courses
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full border border-[#e0d6cc] rounded-xl px-4 py-3 text-sm text-[#1a1108] bg-[#fdf9f6] outline-none focus:border-[#c84b31] focus:ring-2 focus:ring-[#c84b31]/10 transition-all"
        >
          <option value="">— Choose a course —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {!selectedCourse ? (
        <Empty icon="📚" msg="Select an enrolled course to see available quizzes." />
      ) : loading ? (
        <Spinner />
      ) : quizzes.length === 0 ? (
        <Empty icon="🧩" msg="No quizzes available for this course yet." />
      ) : (
        <div className="grid gap-4">
          {quizzes.map((q) => {
            const record = attemptRecords[q.id];
            const hasAttempt = !!record;
            const sessionResult = sessionResults[q.id];
            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border p-5 flex items-center gap-5 transition-all
                ${hasAttempt ? "border-[#e8e0d8]" : "border-[#e8e0d8] hover:border-[#c84b31]/40 hover:shadow-lg hover:shadow-[#c84b31]/5"}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0
                  ${hasAttempt ? (record!.passed ? "bg-emerald-100" : "bg-red-100") : "bg-gradient-to-br from-[#c84b31] to-[#e07054]"}`}
                >
                  {hasAttempt ? (record!.passed ? "✅" : "❌") : "🧩"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1a1108] text-base">{q.title}</p>
                  <div className="flex gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs text-[#9b8a7a]">⏱ {q.timeLimitMinutes} min</span>
                    <span className="text-xs text-[#9b8a7a]">🎯 Pass at {q.passScore}%</span>
                    {hasAttempt && (
                      <span className={`text-xs font-bold ${record!.passed ? "text-emerald-600" : "text-red-600"}`}>
                        Score: {record!.score}%
                      </span>
                    )}
                  </div>
                </div>
                {hasAttempt ? (
                  <button
                    onClick={async () => {
                      // Prefer session result (already has full question+answer data)
                      if (sessionResult) {
                        setViewingResult({ quiz: q, ...sessionResult });
                      } else {
                        // Fetch full answer options for each question, then show result
                        const { attempt, questions } = await buildResultFromAttemptRecord(record!, userId, token);
                        setViewingResult({ quiz: q, attempt, questions });
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[#e0d6cc] text-[#5c4c3d] hover:bg-[#f7f2ee] transition-colors shrink-0"
                  >
                    View Result
                  </button>
                ) : (
                  <button
                    onClick={() => setTakingQuiz(q)}
                    className="px-5 py-2.5 rounded-xl bg-[#c84b31] text-white text-sm font-bold hover:bg-[#a83928] transition-all shadow-md shadow-[#c84b31]/30 shrink-0"
                  >
                    Start Quiz →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── STUDENT: Quiz Taker ──────────────────────────────────────────────────────

function StudentQuizTaker({
  quiz,
  token,
  userId,
  onDone,
  onBack,
}: {
  quiz: Quiz;
  token: string;
  userId: string;
  onDone: (attempt: QuizAttempt, questions: QuestionWithAnswers[]) => void;
  onBack: () => void;
}) {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSubmitted = useRef(false);

  const select = (questionId: string, answerId: string, type: number) => {
    setSelections((prev) => {
      if (type === 1) {
        const cur = prev[questionId] ?? [];
        return {
          ...prev,
          [questionId]: cur.includes(answerId)
            ? cur.filter((x) => x !== answerId)
            : [...cur, answerId],
        };
      }
      return { ...prev, [questionId]: [answerId] };
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const qs = await api.getQuestionsByQuiz(quiz.id, token);
        const withAnswers = await Promise.all(
          qs.map(async (q) => {
            const ans = await api.getAnswersByQuestion(q.id, token);
            return {
              ...q,
              type: normalizeQuestionType(q.type),
              answers: [...ans].sort(() => Math.random() - 0.5),
            };
          }),
        );
        setQuestions(withAnswers);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    })();
  }, [quiz.id, token]);

  // submit receives qs and sels as direct parameters — no stale closure or ref timing issues.
  const submit = async (
    qs: QuestionWithAnswers[],
    sels: Record<string, string[]>,
  ) => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setSubmitting(true);
    setError(null);
    try {
      // Backend expects exactly ONE row per question (each questionId once).
      // For single/true-false: the one chosen answerId.
      // For multiple-choice: send only the first selected answer —
      // the backend schema doesn't support multi-answer rows.
      // Skip questions the student left unanswered entirely.
      const answerRows: { questionId: string; answerId: string }[] = [];
      for (const q of qs) {
        const chosen = sels[q.id] ?? [];
        if (chosen.length > 0) {
          answerRows.push({ questionId: q.id, answerId: chosen[0] });
        }
      }

      // Store what the student selected (for the review screen)
      const storedAnswers = qs.map((q) => ({
        questionId: q.id,
        answerId: sels[q.id] ?? [],
      }));

      // Submit to backend — use its score/passed as the source of truth.
      // Client-side grading is unreliable because GET /Answer/question/{id}
      // does not return isCorrect to students (would expose answers).
      const res = await api.submitAttempt(
        { quizId: quiz.id, answers: answerRows },
        token,
      );

      // Re-fetch answers now that the attempt is recorded — the backend may
      // now return isCorrect so the review screen can highlight correct answers.
      // If it still hides isCorrect, the review will just show what was chosen.
      const qsWithCorrect = await Promise.all(
        qs.map(async (q) => {
          try {
            const freshAnswers = await api.getAnswersByQuestion(q.id, token);
            return { ...q, answers: freshAnswers };
          } catch {
            return q;
          }
        }),
      );

      onDone(
        {
          id: res.attemptId,
          quizId: quiz.id,
          userId,
          score: res.score,
          passed: res.passed,
          submittedAt: new Date().toISOString(),
          answers: storedAnswers,
        },
        qsWithCorrect,
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
      hasSubmitted.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Toast type="error" msg={error} />;
  if (questions.length === 0)
    return (
      <Empty
        icon="📝"
        msg="This quiz has no questions yet."
        action={
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl text-sm font-bold border border-[#d4c9be] text-[#5c4c3d]"
          >
            ← Back
          </button>
        }
      />
    );

  const q = questions[current];
  const chosen = selections[q.id] ?? [];
  const answered = Object.keys(selections).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-[#9b8a7a] hover:text-[#c84b31] flex items-center gap-1 mb-1 transition-colors"
          >
            ← Back to quizzes
          </button>
          <h2
            className="font-black text-xl text-[#1a1108] tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {quiz.title}
          </h2>
        </div>
        <Timer
          minutes={quiz.timeLimitMinutes}
          onExpire={() => submit(questions, selections)}
        />
      </div>

      <div className="relative h-1.5 bg-[#f0ebe4] rounded-full mb-2 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-[#c84b31] rounded-full transition-all duration-500"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#9b8a7a] mb-6">
        <span>
          Question {current + 1} of {questions.length}
        </span>
        <span>
          {answered} of {questions.length} answered
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-[#e8e0d8] shadow-sm overflow-hidden mb-6">
        <div className="px-7 py-5 bg-[#fdf9f6] border-b border-[#f0ebe4]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#c84b31] bg-[#fdf3f0] border border-[#f5cfc5] px-2.5 py-1 rounded-full">
              {QUESTION_TYPES.find((t) => t.value === q.type)?.icon}{" "}
              {QUESTION_TYPES.find((t) => t.value === q.type)?.label}
            </span>
            <span className="text-[10px] font-bold text-[#9b8a7a]">
              {q.points} pt{q.points !== 1 ? "s" : ""}
            </span>
          </div>
          <p
            className="font-bold text-[#1a1108] text-lg leading-relaxed"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {q.text}
          </p>
          {q.type === 1 && (
            <p className="text-xs text-[#c84b31] mt-2 font-semibold">
              Select all that apply
            </p>
          )}
        </div>
        <div className="p-5 space-y-3">
          {q.answers.map((a) => {
            const isChosen = chosen.includes(a.id);
            return (
              <button
                key={a.id}
                onClick={() => select(q.id, a.id, q.type)}
                className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all font-medium text-sm
                  ${isChosen ? "border-[#c84b31] bg-[#fdf3f0] text-[#1a1108] shadow-sm" : "border-[#f0ebe4] bg-[#fdf9f6] text-[#5c4c3d] hover:border-[#f5cfc5] hover:bg-[#fef7f5]"}`}
              >
                <div
                  className={`w-5 h-5 ${q.type === 1 ? "rounded-md" : "rounded-full"} border-2 flex items-center justify-center shrink-0 transition-all
                  ${isChosen ? "border-[#c84b31] bg-[#c84b31]" : "border-[#d4c9be]"}`}
                >
                  {isChosen &&
                    (q.type === 1 ? (
                      <span className="text-white text-[10px] font-black">
                        ✓
                      </span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ))}
                </div>
                {a.text}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
          className="px-5 py-2.5 rounded-xl text-sm font-bold border border-[#d4c9be] text-[#5c4c3d] hover:bg-[#f7f2ee] disabled:opacity-30 transition-colors"
        >
          ← Previous
        </button>
        <div className="flex gap-1.5 items-center">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? "bg-[#c84b31] w-5 h-2" : selections[questions[i].id] ? "bg-[#f5cfc5] w-2 h-2" : "bg-[#e0d6cc] w-2 h-2"}`}
            />
          ))}
        </div>
        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            disabled={!chosen.length}
            className="px-5 py-2.5 rounded-xl bg-[#c84b31] text-white text-sm font-bold hover:bg-[#a83928] disabled:opacity-30 transition-all shadow-md shadow-[#c84b31]/30"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => submit(questions, selections)}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#c84b31] text-white text-sm font-bold hover:bg-[#a83928] disabled:opacity-50 transition-all shadow-md shadow-[#c84b31]/30"
          >
            {submitting ? "Submitting…" : "Submit Quiz ✓"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── STUDENT: Quiz Result ─────────────────────────────────────────────────────

function QuizResult({
  quiz,
  attempt,
  questions,
  onBack,
}: {
  quiz: Quiz;
  attempt: QuizAttempt;
  questions: QuestionWithAnswers[];
  onBack: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`rounded-3xl p-8 mb-6 text-center border-2 ${attempt.passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
      >
        <div className="flex justify-center mb-4">
          <ScoreRing score={attempt.score} passed={attempt.passed} size={130} />
        </div>
        <h2
          className={`font-black text-2xl tracking-tight mb-1 ${attempt.passed ? "text-emerald-800" : "text-red-800"}`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {attempt.passed ? "🎉 Congratulations!" : "😔 Not quite there"}
        </h2>
        <p
          className={`text-sm font-medium ${attempt.passed ? "text-emerald-600" : "text-red-600"}`}
        >
          {attempt.passed
            ? `You passed "${quiz.title}"!`
            : `You need ${quiz.passScore}% to pass.`}
        </p>
        <div className="inline-flex gap-6 mt-5 bg-white/60 rounded-2xl px-6 py-4">
          <div className="text-center">
            <div className="text-2xl font-black text-[#1a1108]">
              {attempt.score}%
            </div>
            <div className="text-xs text-[#9b8a7a] font-semibold mt-0.5">
              Your Score
            </div>
          </div>
          <div className="w-px bg-[#e8e0d8]" />
          <div className="text-center">
            <div className="text-2xl font-black text-[#1a1108]">
              {quiz.passScore}%
            </div>
            <div className="text-xs text-[#9b8a7a] font-semibold mt-0.5">
              Pass Score
            </div>
          </div>
        </div>
      </div>

      <h3
        className="font-black text-[#1a1108] text-base mb-4 tracking-tight"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        📋 Answer Review
      </h3>
      <div className="space-y-4 mb-8">
        {questions.map((q, idx) => {
          // userAnswerIds = what the student actually selected
          const userAnswerIds: string[] =
            attempt.answers.find((a) => a.questionId === q.id)?.answerId ?? [];

          // correctIds = ALL answer options that are correct for this question
          const correctIds = q.answers.filter((a) => a.isCorrect).map((a) => a.id);

          // Question is fully correct only if:
          //   - student chose exactly the correct set (no extras, no missing)
          const isFullyCorrect =
            correctIds.length > 0 &&
            correctIds.length === userAnswerIds.length &&
            correctIds.every((id) => userAnswerIds.includes(id));

          // Partial: student chose some correct answers but missed others,
          // and didn't choose any wrong ones
          const choseOnlyCorrect = userAnswerIds.every((id) => correctIds.includes(id));
          const missedSomeCorrect = correctIds.some((id) => !userAnswerIds.includes(id));
          const isPartial = !isFullyCorrect && choseOnlyCorrect && missedSomeCorrect;

          const borderCls = isFullyCorrect
            ? "border-emerald-200"
            : isPartial
            ? "border-amber-200"
            : "border-red-200";
          const headerBg = isFullyCorrect
            ? "bg-emerald-50"
            : isPartial
            ? "bg-amber-50"
            : "bg-red-50";
          const icon = isFullyCorrect ? "✅" : isPartial ? "⚠️" : "❌";

          return (
            <div key={q.id} className={`rounded-2xl border-2 overflow-hidden ${borderCls}`}>
              <div className={`px-5 py-3 flex items-start gap-3 ${headerBg}`}>
                <span className="text-lg shrink-0">{icon}</span>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#9b8a7a]">
                    Q{idx + 1} · {q.points} pt{q.points !== 1 ? "s" : ""}
                  </span>
                  <p className="font-bold text-[#1a1108] text-sm mt-0.5">{q.text}</p>
                  {isPartial && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      Partial — you missed some required answers
                    </p>
                  )}
                </div>
              </div>
              <div className="px-5 py-3 bg-white space-y-2">
                {q.answers.map((a) => {
                  const userChose = userAnswerIds.includes(a.id);

                  // Colour logic:
                  //  ✓ green  — student chose it AND it's correct
                  //  ✗ red    — student chose it AND it's wrong
                  //  ○ amber  — student did NOT choose it BUT it's correct (missed)
                  //  ○ grey   — student did NOT choose it AND it's wrong (irrelevant)
                  let cls = "border-[#f0ebe4] bg-[#fdf9f6] text-[#9b8a7a]"; // grey
                  if (userChose && a.isCorrect)
                    cls = "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold";
                  else if (userChose && !a.isCorrect)
                    cls = "border-red-300 bg-red-50 text-red-700";
                  else if (!userChose && a.isCorrect)
                    cls = "border-amber-300 bg-amber-50 text-amber-800";

                  const marker = userChose
                    ? a.isCorrect ? "✓" : "✗"
                    : a.isCorrect ? "○" : "○";

                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${cls}`}
                    >
                      <span className="shrink-0 font-bold">{marker}</span>
                      <span className="flex-1">{a.text}</span>
                      {userChose && a.isCorrect && (
                        <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                          Your answer ✓
                        </span>
                      )}
                      {userChose && !a.isCorrect && (
                        <span className="ml-auto text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                          Wrong ✗
                        </span>
                      )}
                      {!userChose && a.isCorrect && (
                        <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                          Correct answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="px-8 py-3.5 rounded-2xl bg-[#c84b31] text-white font-bold hover:bg-[#a83928] transition-all shadow-lg shadow-[#c84b31]/30"
        >
          ← Back to Quizzes
        </button>
      </div>
    </div>
  );
}

// ─── INSTRUCTOR: Quiz Manager ─────────────────────────────────────────────────

function InstructorQuizManager({
  token,
  user,
}: {
  token: string;
  user: { id: string; role: string };
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "edit" | "results">(
    "list",
  );
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [viewingResultsFor, setViewingResultsFor] = useState<Quiz | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [, setDeleting] = useState(false);

  useEffect(() => {
    api.getMyCourses(token).then(setCourses).catch(console.error);
  }, [token, user]);

  const loadQuizzes = useCallback(
    async (courseId: string) => {
      if (!courseId) {
        setQuizzes([]);
        return;
      }
      setLoading(true);
      try {
        const result = await api.getQuizzesByCourse(courseId, token);
        setQuizzes(Array.isArray(result) ? result : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadQuizzes(selectedCourse);
  }, [selectedCourse, loadQuizzes]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteQuiz(deleteTarget.id, token);
      setDeleteTarget(null);
      flash("Quiz deleted.");
      loadQuizzes(selectedCourse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setDeleting(false);
    }
  };

  if (view === "create") {
    return (
      <QuizBuilder
        token={token}
        courses={courses}
        onDone={() => {
          setView("list");
          flash("Quiz published!");
          loadQuizzes(selectedCourse);
        }}
      />
    );
  }
  if (view === "edit" && editingQuiz) {
    return (
      <QuizBuilder
        token={token}
        courses={courses}
        editingQuiz={editingQuiz}
        onDone={() => {
          setView("list");
          flash("Quiz updated!");
          loadQuizzes(selectedCourse);
        }}
      />
    );
  }
  if (view === "results" && viewingResultsFor) {
    return (
      <InstructorResults
        quiz={viewingResultsFor}
        token={token}
        onBack={() => setView("list")}
      />
    );
  }

  return (
    <div>
      {error && (
        <Toast type="error" msg={error} onDismiss={() => setError(null)} />
      )}
      {success && <Toast type="success" msg={success} />}

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-black text-[#5c4c3d] mb-2 uppercase tracking-widest">
            Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full border border-[#e0d6cc] rounded-xl px-4 py-3 text-sm text-[#1a1108] bg-[#fdf9f6] outline-none focus:border-[#c84b31] focus:ring-2 focus:ring-[#c84b31]/10 transition-all"
          >
            <option value="">— Select a course —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setView("create")}
          disabled={!selectedCourse}
          className="px-6 py-3 rounded-xl bg-[#c84b31] text-white font-bold text-sm hover:bg-[#a83928] disabled:opacity-40 transition-all shadow-md shadow-[#c84b31]/30 shrink-0"
        >
          + New Quiz
        </button>
      </div>

      {!selectedCourse ? (
        <Empty icon="📋" msg="Select a course to manage its quizzes." />
      ) : loading ? (
        <Spinner />
      ) : quizzes.length === 0 ? (
        <Empty
          icon="🧩"
          msg="No quizzes yet."
          action={
            <button
              onClick={() => setView("create")}
              className="px-5 py-2.5 rounded-xl bg-[#c84b31] text-white font-bold text-sm"
            >
              Create first quiz
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-[#e8e0d8] p-5 flex items-center gap-4 hover:border-[#c84b31]/30 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#fdf3f0] border border-[#f5cfc5] flex items-center justify-center text-xl shrink-0">
                🧩
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1a1108] group-hover:text-[#c84b31] transition-colors">
                  {q.title}
                </p>
                <div className="flex gap-4 mt-1 flex-wrap">
                  <span className="text-xs text-[#9b8a7a]">
                    ⏱ {q.timeLimitMinutes} min
                  </span>
                  <span className="text-xs text-[#9b8a7a]">
                    🎯 Pass: {q.passScore}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => {
                    setViewingResultsFor(q);
                    setView("results");
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 border-[#c84b31] text-[#c84b31] hover:bg-[#fdf3f0] transition-colors"
                >
                  📊 Results
                </button>
                <button
                  onClick={() => {
                    setEditingQuiz(q);
                    setView("edit");
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[#d4c9be] text-[#5c4c3d] hover:bg-[#f7f2ee] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(q)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete
          what={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── INSTRUCTOR: Results View ─────────────────────────────────────────────────

interface QuizStats {
  quizId: string;
  totalAttempts: number;
  passedCount: number;
  failedCount: number;
  averageScore: number;
}

interface StudentAttempt {
  attemptId: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
  answers: {
    questionId: string;
    questionText: string;
    answerId: string;
    answerText: string;
    isCorrect: boolean;
  }[];
}

interface StudentRecord {
  studentId: string;
  studentName: string;
  attempts: StudentAttempt[];
}

function InstructorResults({
  quiz,
  token,
  onBack,
}: {
  quiz: Quiz;
  token: string;
  onBack: () => void;
}) {
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, studentsRes] = await Promise.all([
          api.getQuizStats(quiz.id, token),
          api.getQuizStudents(quiz.id, token),
        ]);
        setStats(statsRes);
        setStudents(studentsRes.students ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    })();
  }, [quiz.id, token]);

  if (loading) return <Spinner />;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-[#9b8a7a] hover:text-[#c84b31] mb-6 transition-colors uppercase tracking-wider"
      >
        ← Back to quizzes
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#c84b31] flex items-center justify-center text-white text-2xl shadow-lg shadow-[#c84b31]/30">
          📊
        </div>
        <div>
          <h2
            className="font-black text-2xl text-[#1a1108] tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {quiz.title} — Results
          </h2>
          <p className="text-xs text-[#9b8a7a] font-semibold mt-0.5">
            {stats?.totalAttempts ?? 0} attempt{(stats?.totalAttempts ?? 0) !== 1 ? "s" : ""} · {students.length} student{students.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {error && <Toast type="error" msg={error} />}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Attempts", value: stats?.totalAttempts ?? 0, icon: "📝" },
          { label: "Passed", value: stats?.passedCount ?? 0, icon: "✅" },
          { label: "Failed", value: stats?.failedCount ?? 0, icon: "❌" },
          { label: "Avg Score", value: stats ? `${Math.round(stats.averageScore)}%` : "—", icon: "📈" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#e8e0d8] p-4 text-center">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-xl font-black text-[#1a1108]">{stat.value}</div>
            <div className="text-[10px] text-[#9b8a7a] font-semibold mt-0.5 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {students.length === 0 ? (
        <Empty icon="📭" msg="No student submissions yet." />
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const best = student.attempts.reduce((b, a) => a.score > b.score ? a : b, student.attempts[0]);
            const isExpanded = expandedStudent === student.studentId;
            return (
              <div key={student.studentId} className="bg-white rounded-2xl border border-[#e8e0d8] overflow-hidden">
                {/* Student row */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[#fdf9f6] transition-colors"
                  onClick={() => setExpandedStudent(isExpanded ? null : student.studentId)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0
                    ${best.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {best.score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1a1108] text-sm">{student.studentName}</p>
                    <p className="text-xs text-[#9b8a7a]">
                      {student.attempts.length} attempt{student.attempts.length !== 1 ? "s" : ""} · Best: {best.score}%
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full
                      ${best.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {best.passed ? "PASSED" : "FAILED"}
                    </span>
                    <span className="text-[#9b8a7a] text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded: list of attempts */}
                {isExpanded && (
                  <div className="border-t border-[#f0ebe4] bg-[#fdf9f6]">
                    {student.attempts
                      .slice()
                      .sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime())
                      .map((attempt, ai) => {
                        const attemptExpanded = expandedAttempt === attempt.attemptId;
                        // Group answers by question
                        const qMap = new Map<string, { text: string; answers: typeof attempt.answers }>();
                        for (const row of attempt.answers) {
                          if (!qMap.has(row.questionId)) qMap.set(row.questionId, { text: row.questionText, answers: [] });
                          qMap.get(row.questionId)!.answers.push(row);
                        }
                        return (
                          <div key={attempt.attemptId} className="border-b border-[#f0ebe4] last:border-b-0">
                            {/* Attempt header */}
                            <div
                              className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#f7f2ee] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedAttempt(attemptExpanded ? null : attempt.attemptId);
                              }}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0
                                ${attempt.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {attempt.score}%
                              </div>
                              <div className="flex-1">
                                <span className="text-xs font-bold text-[#5c4c3d]">
                                  Attempt {ai + 1}
                                </span>
                                <span className="text-xs text-[#9b8a7a] ml-2">
                                  {new Date(attempt.attemptedAt).toLocaleString()}
                                </span>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full
                                ${attempt.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {attempt.passed ? "PASSED" : "FAILED"}
                              </span>
                              <span className="text-[#9b8a7a] text-xs ml-1">{attemptExpanded ? "▲" : "▼"}</span>
                            </div>

                            {/* Per-question breakdown */}
                            {attemptExpanded && (
                              <div className="px-5 pb-4 space-y-3">
                                {Array.from(qMap.entries()).map(([qId, q], idx) => {
                                  const allCorrect = q.answers.every((a) => a.isCorrect);
                                  return (
                                    <div key={qId}
                                      className={`rounded-xl border p-4 ${allCorrect ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"}`}>
                                      <div className="flex items-start gap-2 mb-2">
                                        <span className="text-sm shrink-0">{allCorrect ? "✅" : "❌"}</span>
                                        <p className="text-sm font-bold text-[#1a1108] flex-1">
                                          <span className="text-[#9b8a7a] font-normal">Q{idx + 1}: </span>
                                          {q.text}
                                        </p>
                                      </div>
                                      <div className="space-y-1 ml-6">
                                        {q.answers.map((a) => (
                                          <div key={a.answerId}
                                            className={`flex items-center gap-2 text-xs
                                            ${a.isCorrect ? "text-emerald-700 font-semibold" : "text-red-600"}`}>
                                            <span>{a.isCorrect ? "✓" : "✗"}</span>
                                            <span>{a.answerText}</span>
                                            {!a.isCorrect && (
                                              <span className="text-[10px] font-bold text-red-400">(wrong)</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PAGE SHELL ───────────────────────────────────────────────────────────────

export default function QuizzesPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<"take" | "manage">("take");

  if (!token || !user) return null;

  const instructor = isInstructor(user.role);

  return (
    <div
      className="min-h-screen bg-[#faf7f4]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900&family=Playfair+Display:wght@700;900&display=swap');
      `}</style>

      <div className="h-1 bg-gradient-to-r from-[#c84b31] via-[#e07054] to-[#f5a88a]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🧩</span>
              <h1
                className="text-3xl font-black text-[#1a1108] tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Quizzes
              </h1>
            </div>
            <p className="text-sm text-[#9b8a7a] font-medium">
              {instructor
                ? "Create quizzes, manage questions & view student results"
                : "Test your knowledge from your enrolled courses"}
            </p>
          </div>
          <div
            className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border-2
            ${instructor ? "bg-[#fdf3f0] border-[#f5cfc5] text-[#c84b31]" : "bg-sky-50 border-sky-200 text-sky-700"}`}
          >
            {user.role}
          </div>
        </div>

        {instructor && (
          <div className="flex gap-1 bg-[#f0ebe4] p-1 rounded-2xl mb-8 w-fit">
            {[
              { key: "take" as const, label: "📖 Take Quiz" },
              { key: "manage" as const, label: "⚙️ Manage" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${tab === t.key ? "bg-white text-[#c84b31] shadow-sm" : "text-[#9b8a7a] hover:text-[#5c4c3d]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === "take" || !instructor ? (
          <StudentQuizList token={token} userId={user.id} />
        ) : (
          <InstructorQuizManager token={token} user={user} />
        )}
      </div>
    </div>
  );
}