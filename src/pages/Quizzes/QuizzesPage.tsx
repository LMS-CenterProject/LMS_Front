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
}

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  submittedAt: string;
  answers: { questionId: string; answerId: string[] }[];
}

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

const api = {
  getCourses: (token: string) => lmsFetch<Course[]>("/Course", {}, token),
  getQuizzesByCourse: (courseId: string, token: string) =>
    lmsFetch<Quiz[]>(`/Quiz/course/${courseId}`, {}, token),
  createQuiz: (body: Omit<Quiz, "id" | "courseTitle">, token: string) =>
    lmsFetch<Quiz>("/Quiz", { method: "POST", body: JSON.stringify(body) }, token),
  updateQuiz: (id: string, body: { quizId: string; title: string; passScore: number; timeLimitMinutes: number }, token: string) =>
    lmsFetch<void>(`/Quiz/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),
  deleteQuiz: (id: string, token: string) =>
    lmsFetch<void>(`/Quiz/${id}`, { method: "DELETE" }, token),

  getQuestionsByQuiz: (quizId: string, token: string) =>
    lmsFetch<Question[]>(`/Question/quiz/${quizId}`, {}, token),
  createQuestion: (body: { quizId: string; text: string; type: number; points: number }, token: string) =>
    lmsFetch<Question>("/Question", { method: "POST", body: JSON.stringify(body) }, token),
  updateQuestion: (id: string, body: { questionId: string; text: string; type: number; points: number }, token: string) =>
    lmsFetch<void>(`/Question/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),
  deleteQuestion: (id: string, token: string) =>
    lmsFetch<void>(`/Question/${id}`, { method: "DELETE" }, token),

  getAnswersByQuestion: (questionId: string, token: string) =>
    lmsFetch<Answer[]>(`/Answer/question/${questionId}`, {}, token),
  createAnswer: (body: { questionId: string; text: string; isCorrect: boolean }, token: string) =>
    lmsFetch<Answer>("/Answer", { method: "POST", body: JSON.stringify(body) }, token),
  updateAnswer: (id: string, body: { answerId: string; text: string; isCorrect: boolean }, token: string) =>
    lmsFetch<void>(`/Answer/${id}`, { method: "PUT", body: JSON.stringify(body) }, token),
  deleteAnswer: (id: string, token: string) =>
    lmsFetch<void>(`/Answer/${id}`, { method: "DELETE" }, token),

  // Attempt submission — adapt endpoint to your backend as needed
  submitAttempt: (body: { quizId: string; userId: string; answers: { questionId: string; answerIds: string[] }[] }, token: string) =>
    lmsFetch<QuizAttempt>("/QuizAttempt", { method: "POST", body: JSON.stringify(body) }, token),
};

const QUESTION_TYPES = [
  { value: 0, label: "Single Choice" },
  { value: 1, label: "Multiple Choice" },
  { value: 2, label: "True / False" },
];
const questionTypeLabel = (t: number) => QUESTION_TYPES.find((x) => x.value === t)?.label ?? "Unknown";
const isInstructor = (role: string) =>
  role?.toLowerCase() === "instructor" || role?.toLowerCase() === "admin";

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-2 border-[#e8e0ff]" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7c3aed] animate-spin" />
    </div>
  </div>
);

const Toast = ({
  msg, type, onDismiss,
}: {
  msg: string; type: "error" | "success"; onDismiss?: () => void;
}) => (
  <div className={`flex items-start gap-3 rounded-2xl px-5 py-4 text-sm mb-5 border shadow-lg
    ${type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
    <span className="text-base mt-0.5">{type === "error" ? "⚠️" : "✅"}</span>
    <span className="flex-1 font-medium">{msg}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="opacity-50 hover:opacity-100 text-lg leading-none">×</button>
    )}
  </div>
);

const Btn = ({
  children, onClick, variant = "primary", size = "sm", disabled, className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}) => {
  const base =
    "inline-flex items-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed select-none";
  const sizes = {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  const variants = {
    primary: "bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-md shadow-violet-200",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
    ghost: "text-[#7c3aed] hover:bg-violet-50",
    outline: "border-2 border-[#7c3aed] text-[#7c3aed] hover:bg-violet-50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({
  label, value, onChange, placeholder, type = "text", required, rows,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  rows?: number;
}) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
      {label}
      {required && <span className="text-violet-500 ml-0.5">*</span>}
    </label>
    {rows ? (
      <textarea
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none bg-gray-50/50"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all bg-gray-50/50"
      />
    )}
  </div>
);

const Select = ({
  label, value, onChange, options, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
      {label}
      {required && <span className="text-violet-500 ml-0.5">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-gray-50/50 transition-all appearance-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const Modal = ({
  title, onClose, children, wide,
}: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className={`bg-white rounded-3xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[92vh] overflow-y-auto`}>
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
        <h3 className="font-black text-gray-900 text-lg tracking-tight">{title}</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors text-xl"
        >×</button>
      </div>
      <div className="p-7">{children}</div>
    </div>
  </div>
);

const ConfirmDelete = ({
  what, onConfirm, onCancel,
}: {
  what: string; onConfirm: () => void; onCancel: () => void;
}) => (
  <Modal title="Confirm Delete" onClose={onCancel}>
    <p className="text-sm text-gray-600 mb-6">
      Delete <span className="font-bold text-gray-900">"{what}"</span>? This cannot be undone.
    </p>
    <div className="flex justify-end gap-3">
      <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
      <Btn variant="danger" onClick={onConfirm}>Delete</Btn>
    </div>
  </Modal>
);

const Empty = ({
  icon, msg, action,
}: {
  icon: string; msg: string; action?: React.ReactNode;
}) => (
  <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
    <div className="text-5xl mb-4">{icon}</div>
    <p className="font-semibold text-gray-400 mb-5 text-sm">{msg}</p>
    {action}
  </div>
);

// ─── Score Ring ───────────────────────────────────────────────────────────────

const ScoreRing = ({
  score, passed, size = 120,
}: {
  score: number; passed: boolean; size?: number;
}) => {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8e0ff" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={passed ? "#10b981" : "#ef4444"} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={passed ? "#059669" : "#dc2626"}
        fontSize={size * 0.22} fontWeight="900" fontFamily="system-ui"
      >
        {score}%
      </text>
    </svg>
  );
};

// ─── Timer ────────────────────────────────────────────────────────────────────

const Timer = ({
  minutes, onExpire,
}: {
  minutes: number; onExpire: () => void;
}) => {
  const [secs, setSecs] = useState(minutes * 60);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { clearInterval(ref.current!); onExpire(); return 0; }
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
    <div className={`flex items-center gap-2 font-mono font-bold text-sm px-4 py-2 rounded-xl border-2 transition-colors
      ${urgent
        ? "border-red-300 bg-red-50 text-red-700 animate-pulse"
        : "border-violet-200 bg-violet-50 text-violet-700"}`}>
      ⏱ {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
};

// ─── Student: Quiz List ───────────────────────────────────────────────────────

function StudentQuizList({
  token, userId,
}: {
  token: string; userId: string;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);
  const [viewingResult, setViewingResult] = useState<{
    quiz: Quiz; attempt: QuizAttempt; questions: QuestionWithAnswers[];
  } | null>(null);

  useEffect(() => {
    api.getCourses(token).then(setCourses).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!selectedCourse) { setQuizzes([]); return; }
    setLoading(true);
    api.getQuizzesByCourse(selectedCourse, token)
      .then((d) => setQuizzes(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCourse, token]);

  if (takingQuiz) {
    return (
      <StudentQuizTaker
        quiz={takingQuiz}
        token={token}
        userId={userId}
        onDone={(attempt, questions) => {
          setTakingQuiz(null);
          setViewingResult({ quiz: takingQuiz, attempt, questions });
        }}
        onBack={() => setTakingQuiz(null)}
      />
    );
  }

  if (viewingResult) {
    return (
      <QuizResult
        {...viewingResult}
        onBack={() => setViewingResult(null)}
      />
    );
  }

  return (
    <div>
      {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
      <div className="mb-6">
        <Select
          label="Select Course"
          value={selectedCourse}
          onChange={setSelectedCourse}
          options={[
            { value: "", label: "— Choose a course —" },
            ...courses.map((c) => ({ value: c.id, label: c.title })),
          ]}
        />
      </div>

      {!selectedCourse ? (
        <Empty icon="📚" msg="Select a course to see available quizzes." />
      ) : loading ? (
        <Spinner />
      ) : quizzes.length === 0 ? (
        <Empty icon="🧩" msg="No quizzes available for this course yet." />
      ) : (
        <div className="grid gap-4">
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl shadow-md shadow-violet-200 shrink-0">
                🧩
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base group-hover:text-violet-700 transition-colors">
                  {q.title}
                </p>
                <div className="flex gap-4 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-500">⏱ {q.timeLimitMinutes} min</span>
                  <span className="text-xs text-gray-500">🎯 Pass at {q.passScore}%</span>
                </div>
              </div>
              <Btn variant="primary" size="md" onClick={() => setTakingQuiz(q)}>
                Start Quiz →
              </Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Student: Quiz Taker ──────────────────────────────────────────────────────

function StudentQuizTaker({
  quiz, token, userId, onDone, onBack,
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
  // Map questionId → selected answer id(s)
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const qs = await api.getQuestionsByQuiz(quiz.id, token);
        const withAnswers = await Promise.all(
          qs.map(async (q) => {
            const ans = await api.getAnswersByQuestion(q.id, token);
            // Shuffle answers so correct answer isn't always first
            const shuffled = [...ans].sort(() => Math.random() - 0.5);
            return { ...q, answers: shuffled };
          })
        );
        setQuestions(withAnswers);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quiz.id, token]);

  const select = (questionId: string, answerId: string, type: number) => {
    setSelections((prev) => {
      if (type === 1) {
        // MultipleChoice: toggle
        const cur = prev[questionId] ?? [];
        const next = cur.includes(answerId)
          ? cur.filter((x) => x !== answerId)
          : [...cur, answerId];
        return { ...prev, [questionId]: next };
      }
      // SingleChoice / TrueFalse: replace
      return { ...prev, [questionId]: [answerId] };
    });
  };

  /**
   * Auto-grade locally using the correct answers we already fetched.
   * This ensures accurate grading even if the backend endpoint is unavailable.
   */
  const autoGrade = (
    qs: QuestionWithAnswers[],
    sels: Record<string, string[]>
  ): { score: number; passed: boolean } => {
    let earned = 0;
    let total = 0;
    for (const q of qs) {
      total += q.points;
      const correctIds = q.answers.filter((a) => a.isCorrect).map((a) => a.id);
      const chosen = sels[q.id] ?? [];
      const isRight =
        correctIds.length === chosen.length &&
        correctIds.every((id) => chosen.includes(id));
      if (isRight) earned += q.points;
    }
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
    return { score: pct, passed: pct >= quiz.passScore };
  };

  const submit = useCallback(
    async (forcedSels?: Record<string, string[]>) => {
      if (hasSubmitted.current) return;
      hasSubmitted.current = true;

      const sels = forcedSels ?? selections;
      setSubmitting(true);
      setError(null);

      try {
        const { score, passed } = autoGrade(questions, sels);
        let attempt: QuizAttempt;
        try {
          attempt = await api.submitAttempt(
            {
              quizId: quiz.id,
              userId,
              answers: questions.map((q) => ({
                questionId: q.id,
                answerIds: sels[q.id] ?? [],
              })),
            },
            token
          );
        } catch {
          // Fallback: construct local attempt so students still see results
          // even when the backend submission endpoint is not yet implemented
          attempt = {
            id: `local-${Date.now()}`,
            quizId: quiz.id,
            userId,
            score,
            passed,
            submittedAt: new Date().toISOString(),
            answers: questions.map((q) => ({
              questionId: q.id,
              answerId: sels[q.id] ?? [],
            })),
          };
        }
        // Always use local auto-grade for display accuracy
        attempt.score = score;
        attempt.passed = passed;
        onDone(attempt, questions);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Submission failed");
        hasSubmitted.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, selections, quiz.id, userId, token]
  );

  if (loading) return <Spinner />;
  if (error) return <Toast type="error" msg={error} />;
  if (questions.length === 0) {
    return (
      <Empty
        icon="📝"
        msg="This quiz has no questions yet."
        action={<Btn variant="secondary" onClick={onBack}>← Back</Btn>}
      />
    );
  }

  const q = questions[current];
  const chosen = selections[q.id] ?? [];
  const answered = Object.keys(selections).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 mb-1 transition-colors"
          >
            ← Back to quizzes
          </button>
          <h2 className="font-black text-xl text-gray-900 tracking-tight">{quiz.title}</h2>
        </div>
        <Timer
          minutes={quiz.timeLimitMinutes}
          onExpire={() => submit(selections)}
        />
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mb-6">
        <span>Question {current + 1} of {questions.length}</span>
        <span>{answered} of {questions.length} answered</span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-lg shadow-gray-100 overflow-hidden mb-6">
        <div className="px-7 py-5 bg-gradient-to-br from-violet-50 to-purple-50 border-b border-violet-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 bg-violet-100 px-2.5 py-1 rounded-full">
              {questionTypeLabel(q.type)}
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              {q.points} pt{q.points !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="font-bold text-gray-900 text-lg leading-relaxed">{q.text}</p>
          {q.type === 1 && (
            <p className="text-xs text-violet-500 mt-2 font-semibold">
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
                  ${isChosen
                    ? "border-violet-400 bg-violet-50 text-violet-900 shadow-sm shadow-violet-100"
                    : "border-gray-200 bg-gray-50/50 text-gray-700 hover:border-violet-200 hover:bg-violet-50/50"
                  }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${isChosen ? "border-violet-500 bg-violet-500" : "border-gray-300"}`}>
                  {isChosen && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                {a.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Btn
          variant="secondary"
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
          size="md"
        >
          ← Previous
        </Btn>

        {/* Dot navigator */}
        <div className="flex gap-1.5 items-center">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? "bg-violet-500 w-5 h-2"
                  : selections[questions[i].id]
                  ? "bg-violet-300 w-2 h-2"
                  : "bg-gray-200 w-2 h-2"
              }`}
            />
          ))}
        </div>

        {current < questions.length - 1 ? (
          <Btn
            variant="primary"
            onClick={() => setCurrent((c) => c + 1)}
            disabled={!chosen.length}
            size="md"
          >
            Next →
          </Btn>
        ) : (
          <Btn
            variant="primary"
            size="md"
            disabled={submitting}
            onClick={() => submit()}
          >
            {submitting ? "Submitting…" : "Submit Quiz ✓"}
          </Btn>
        )}
      </div>
    </div>
  );
}

// ─── Student: Quiz Result ─────────────────────────────────────────────────────

function QuizResult({
  quiz, attempt, questions, onBack,
}: {
  quiz: Quiz;
  attempt: QuizAttempt;
  questions: QuestionWithAnswers[];
  onBack: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero result card */}
      <div className={`rounded-3xl p-8 mb-6 text-center border-2 ${attempt.passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
        <div className="flex justify-center mb-4">
          <ScoreRing score={attempt.score} passed={attempt.passed} size={130} />
        </div>
        <h2 className={`font-black text-2xl tracking-tight mb-1 ${attempt.passed ? "text-emerald-800" : "text-red-800"}`}>
          {attempt.passed ? "🎉 Congratulations!" : "😔 Not quite there"}
        </h2>
        <p className={`text-sm font-medium ${attempt.passed ? "text-emerald-600" : "text-red-600"}`}>
          {attempt.passed
            ? `You passed "${quiz.title}"!`
            : `You need ${quiz.passScore}% to pass. Keep trying!`}
        </p>
        <div className="flex justify-center gap-8 mt-5">
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">{attempt.score}%</div>
            <div className="text-xs text-gray-400 font-semibold mt-0.5">Your Score</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-black text-gray-900">{quiz.passScore}%</div>
            <div className="text-xs text-gray-400 font-semibold mt-0.5">Pass Score</div>
          </div>
        </div>
      </div>

      {/* Review answers */}
      <h3 className="font-black text-gray-800 text-base mb-4 tracking-tight">📋 Answer Review</h3>
      <div className="space-y-4 mb-8">
        {questions.map((q, idx) => {
          const userAnswerIds: string[] =
            (attempt.answers as { questionId: string; answerId: string[] }[])
              .find((a) => a.questionId === q.id)?.answerId ?? [];
          const correctIds = q.answers.filter((a) => a.isCorrect).map((a) => a.id);
          const isCorrect =
            correctIds.length === userAnswerIds.length &&
            correctIds.every((id) => userAnswerIds.includes(id));

          return (
            <div key={q.id} className={`rounded-2xl border-2 overflow-hidden ${isCorrect ? "border-emerald-200" : "border-red-200"}`}>
              <div className={`px-5 py-3 flex items-start gap-3 ${isCorrect ? "bg-emerald-50" : "bg-red-50"}`}>
                <span className="text-lg shrink-0">{isCorrect ? "✅" : "❌"}</span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Q{idx + 1} · {q.points} pt{q.points !== 1 ? "s" : ""}
                  </span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{q.text}</p>
                </div>
              </div>
              <div className="px-5 py-3 bg-white space-y-2">
                {q.answers.map((a) => {
                  const userChose = userAnswerIds.includes(a.id);
                  const correct = a.isCorrect;
                  let cls = "border-gray-100 bg-gray-50 text-gray-500";
                  if (correct && userChose)
                    cls = "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold";
                  else if (correct)
                    cls = "border-emerald-200 bg-emerald-50/60 text-emerald-700";
                  else if (userChose)
                    cls = "border-red-300 bg-red-50 text-red-700";
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${cls}`}
                    >
                      <span className="shrink-0 font-bold">
                        {correct ? "✓" : userChose ? "✗" : "○"}
                      </span>
                      <span className="flex-1">{a.text}</span>
                      {correct && !userChose && (
                        <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
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
        <Btn variant="primary" size="lg" onClick={onBack}>← Back to Quizzes</Btn>
      </div>
    </div>
  );
}

// ─── Instructor: Quiz Builder ─────────────────────────────────────────────────

function InstructorQuizBuilder({ token }: { token: string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<
    "createQuiz" | "editQuiz" | "deleteQuiz" | "manageQuestions" | null
  >(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [form, setForm] = useState({
    courseId: "", title: "", passScore: "70", timeLimitMinutes: "30",
  });

  useEffect(() => {
    api.getCourses(token).then(setCourses).catch(console.error);
  }, [token]);

  const loadQuizzes = useCallback(async (courseId: string) => {
    if (!courseId) { setQuizzes([]); return; }
    setLoading(true);
    try {
      const d = await api.getQuizzesByCourse(courseId, token);
      setQuizzes(Array.isArray(d) ? d : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadQuizzes(selectedCourse); }, [selectedCourse, loadQuizzes]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openCreate = () => {
    setForm({ courseId: selectedCourse, title: "", passScore: "70", timeLimitMinutes: "30" });
    setModal("createQuiz");
  };

  const openEdit = (q: Quiz) => {
    setActiveQuiz(q);
    setForm({
      courseId: q.courseId, title: q.title,
      passScore: String(q.passScore), timeLimitMinutes: String(q.timeLimitMinutes),
    });
    setModal("editQuiz");
  };

  const handleCreate = async () => {
    if (!form.courseId || !form.title.trim()) { setError("Course and title required."); return; }
    setSaving(true); setError(null);
    try {
      await api.createQuiz(
        { courseId: form.courseId, title: form.title, passScore: +form.passScore, timeLimitMinutes: +form.timeLimitMinutes },
        token
      );
      setModal(null); flash("Quiz created!"); loadQuizzes(selectedCourse);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!activeQuiz) return;
    setSaving(true); setError(null);
    try {
      await api.updateQuiz(
        activeQuiz.id,
        { quizId: activeQuiz.id, title: form.title, passScore: +form.passScore, timeLimitMinutes: +form.timeLimitMinutes },
        token
      );
      setModal(null); flash("Quiz updated!"); loadQuizzes(selectedCourse);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!activeQuiz) return;
    setSaving(true);
    try {
      await api.deleteQuiz(activeQuiz.id, token);
      setModal(null); flash("Quiz deleted."); loadQuizzes(selectedCourse);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const quizForm = (
    <div className="space-y-4">
      {modal === "createQuiz" && (
        <Select
          label="Course" value={form.courseId}
          onChange={(v) => setForm((p) => ({ ...p, courseId: v }))} required
          options={[{ value: "", label: "— Select course —" }, ...courses.map((c) => ({ value: c.id, label: c.title }))]}
        />
      )}
      <Input
        label="Quiz Title" value={form.title} required
        onChange={(v) => setForm((p) => ({ ...p, title: v }))}
        placeholder="e.g. Module 3 Final Quiz"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Pass Score (%)" type="number" value={form.passScore}
          onChange={(v) => setForm((p) => ({ ...p, passScore: v }))}
        />
        <Input
          label="Time Limit (min)" type="number" value={form.timeLimitMinutes}
          onChange={(v) => setForm((p) => ({ ...p, timeLimitMinutes: v }))}
        />
      </div>
    </div>
  );

  return (
    <div>
      {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
      {success && <Toast type="success" msg={success} />}

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Select
            label="Course" value={selectedCourse} onChange={setSelectedCourse}
            options={[
              { value: "", label: "— Select a course —" },
              ...courses.map((c) => ({ value: c.id, label: c.title })),
            ]}
          />
        </div>
        <Btn variant="primary" size="md" onClick={openCreate} disabled={!selectedCourse} className="shrink-0">
          + New Quiz
        </Btn>
      </div>

      {!selectedCourse ? (
        <Empty icon="📋" msg="Select a course to manage its quizzes." />
      ) : loading ? (
        <Spinner />
      ) : quizzes.length === 0 ? (
        <Empty
          icon="🧩" msg="No quizzes yet."
          action={<Btn variant="primary" onClick={openCreate}>Create first quiz</Btn>}
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:border-violet-200 hover:shadow-md hover:shadow-violet-50 transition-all group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-xl shrink-0">
                🧩
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 group-hover:text-violet-700 transition-colors">{q.title}</p>
                <div className="flex gap-4 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400">⏱ {q.timeLimitMinutes} min</span>
                  <span className="text-xs text-gray-400">🎯 Pass: {q.passScore}%</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                <Btn
                  variant="outline" size="sm"
                  onClick={() => { setActiveQuiz(q); setModal("manageQuestions"); }}
                >
                  ✏️ Questions
                </Btn>
                <Btn variant="secondary" size="sm" onClick={() => openEdit(q)}>Edit</Btn>
                <Btn
                  variant="danger" size="sm"
                  onClick={() => { setActiveQuiz(q); setModal("deleteQuiz"); }}
                >
                  Delete
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "createQuiz" && (
        <Modal title="Create New Quiz" onClose={() => setModal(null)}>
          {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
          {quizForm}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="primary" disabled={saving} onClick={handleCreate}>
              {saving ? "Creating…" : "Create Quiz"}
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "editQuiz" && activeQuiz && (
        <Modal title={`Edit "${activeQuiz.title}"`} onClose={() => setModal(null)}>
          {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
          {quizForm}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="primary" disabled={saving} onClick={handleEdit}>
              {saving ? "Saving…" : "Save Changes"}
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "deleteQuiz" && activeQuiz && (
        <ConfirmDelete
          what={activeQuiz.title}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === "manageQuestions" && activeQuiz && (
        <Modal
          title={`Questions: "${activeQuiz.title}"`}
          onClose={() => setModal(null)}
          wide
        >
          <QuestionManager quiz={activeQuiz} token={token} />
        </Modal>
      )}
    </div>
  );
}

// ─── Instructor: Question Manager ────────────────────────────────────────────

function QuestionManager({ quiz, token }: { quiz: Quiz; token: string }) {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"createQ" | "editQ" | "deleteQ" | "manageA" | null>(null);
  const [activeQ, setActiveQ] = useState<QuestionWithAnswers | null>(null);
  const [form, setForm] = useState({ text: "", type: "0", points: "1" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = await api.getQuestionsByQuiz(quiz.id, token);
      const withAnswers = await Promise.all(
        qs.map(async (q) => ({
          ...q,
          answers: await api.getAnswersByQuestion(q.id, token),
        }))
      );
      setQuestions(withAnswers);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [quiz.id, token]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 2500); };

  const handleCreateQ = async () => {
    if (!form.text.trim()) { setError("Question text required."); return; }
    setSaving(true); setError(null);
    try {
      await api.createQuestion(
        { quizId: quiz.id, text: form.text, type: +form.type, points: +form.points },
        token
      );
      setModal(null); flash("Question added!"); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleEditQ = async () => {
    if (!activeQ) return;
    setSaving(true); setError(null);
    try {
      await api.updateQuestion(
        activeQ.id,
        { questionId: activeQ.id, text: form.text, type: +form.type, points: +form.points },
        token
      );
      setModal(null); flash("Question updated!"); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleDeleteQ = async () => {
    if (!activeQ) return;
    setSaving(true);
    try {
      await api.deleteQuestion(activeQ.id, token);
      setModal(null); flash("Question deleted."); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const TYPE_COLORS: Record<number, string> = {
    0: "bg-blue-100 text-blue-700",
    1: "bg-purple-100 text-purple-700",
    2: "bg-amber-100 text-amber-700",
  };

  const qForm = (
    <div className="space-y-4">
      <Input
        label="Question Text" value={form.text} required
        onChange={(v) => setForm((p) => ({ ...p, text: v }))}
        placeholder="Enter your question…" rows={3}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type" value={form.type}
          onChange={(v) => setForm((p) => ({ ...p, type: v }))}
          options={QUESTION_TYPES.map((t) => ({ value: String(t.value), label: t.label }))}
        />
        <Input
          label="Points" type="number" value={form.points}
          onChange={(v) => setForm((p) => ({ ...p, points: v }))}
        />
      </div>
    </div>
  );

  if (loading) return <Spinner />;

  return (
    <div>
      {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
      {success && <Toast type="success" msg={success} />}

      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-gray-500 font-medium">
          {questions.length} question{questions.length !== 1 ? "s" : ""}
        </p>
        <Btn
          variant="primary" size="sm"
          onClick={() => { setForm({ text: "", type: "0", points: "1" }); setModal("createQ"); }}
        >
          + Add Question
        </Btn>
      </div>

      {questions.length === 0 ? (
        <Empty
          icon="📝" msg="No questions yet."
          action={
            <Btn
              variant="primary"
              onClick={() => { setForm({ text: "", type: "0", points: "1" }); setModal("createQ"); }}
            >
              Add first question
            </Btn>
          }
        />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-violet-200 transition-all">
              <div className="flex items-start gap-3 p-4">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-black text-violet-700 shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{q.text}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${TYPE_COLORS[q.type]}`}>
                      {questionTypeLabel(q.type)}
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {q.points} pt{q.points !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {q.answers.length} answer{q.answers.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Quick answer preview */}
                  {q.answers.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {q.answers.map((a) => (
                        <div
                          key={a.id}
                          className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg
                            ${a.isCorrect
                              ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200"
                              : "bg-gray-50 text-gray-500 border border-gray-100"}`}
                        >
                          <span>{a.isCorrect ? "✓" : "○"}</span>
                          {a.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warn if no correct answer */}
                  {q.answers.length > 0 && !q.answers.some((a) => a.isCorrect) && (
                    <p className="text-[10px] text-amber-600 font-bold mt-2">
                      ⚠️ No correct answer marked
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0 flex-wrap">
                  <Btn
                    variant="ghost" size="xs"
                    onClick={() => { setActiveQ(q); setModal("manageA"); }}
                  >
                    Answers
                  </Btn>
                  <Btn
                    variant="secondary" size="xs"
                    onClick={() => {
                      setActiveQ(q);
                      setForm({ text: q.text, type: String(q.type), points: String(q.points) });
                      setModal("editQ");
                    }}
                  >
                    Edit
                  </Btn>
                  <Btn
                    variant="danger" size="xs"
                    onClick={() => { setActiveQ(q); setModal("deleteQ"); }}
                  >
                    Del
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "createQ" && (
        <Modal title="Add Question" onClose={() => setModal(null)}>
          {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
          {qForm}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="primary" disabled={saving} onClick={handleCreateQ}>
              {saving ? "Adding…" : "Add Question"}
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "editQ" && activeQ && (
        <Modal title="Edit Question" onClose={() => setModal(null)}>
          {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
          {qForm}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="primary" disabled={saving} onClick={handleEditQ}>
              {saving ? "Saving…" : "Save"}
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "deleteQ" && activeQ && (
        <ConfirmDelete
          what={activeQ.text.slice(0, 50)}
          onConfirm={handleDeleteQ}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === "manageA" && activeQ && (
        <Modal
          title={`Answers: "${activeQ.text.slice(0, 40)}${activeQ.text.length > 40 ? "…" : ""}"`}
          onClose={() => { setModal(null); load(); }}
          wide
        >
          <AnswerManager question={activeQ} token={token} />
        </Modal>
      )}
    </div>
  );
}

// ─── Instructor: Answer Manager ───────────────────────────────────────────────

function AnswerManager({
  question, token,
}: {
  question: Question; token: string;
}) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [activeA, setActiveA] = useState<Answer | null>(null);
  const [form, setForm] = useState({ text: "", isCorrect: false });

  const load = useCallback(async () => {
    try {
      const d = await api.getAnswersByQuestion(question.id, token);
      setAnswers(Array.isArray(d) ? d : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [question.id, token]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 2500); };

  const validateCorrect = (isMarkedCorrect: boolean, excludeId?: string): string | null => {
    if (!isMarkedCorrect) return null;
    // For SingleChoice (0) and TrueFalse (2), only 1 correct allowed
    if (question.type === 0 || question.type === 2) {
      const alreadyCorrect = answers.filter((a) => a.isCorrect && a.id !== excludeId).length;
      if (alreadyCorrect >= 1) return "Single Choice / True-False can only have one correct answer.";
    }
    return null;
  };

  const handleCreate = async () => {
    if (!form.text.trim()) { setError("Answer text required."); return; }
    const validErr = validateCorrect(form.isCorrect);
    if (validErr) { setError(validErr); return; }
    setSaving(true); setError(null);
    try {
      await api.createAnswer(
        { questionId: question.id, text: form.text, isCorrect: form.isCorrect },
        token
      );
      setModal(null); flash("Answer added!"); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!activeA) return;
    const validErr = validateCorrect(form.isCorrect, activeA.id);
    if (validErr) { setError(validErr); return; }
    setSaving(true); setError(null);
    try {
      await api.updateAnswer(
        activeA.id,
        { answerId: activeA.id, text: form.text, isCorrect: form.isCorrect },
        token
      );
      setModal(null); flash("Answer updated!"); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!activeA) return;
    setSaving(true);
    try {
      await api.deleteAnswer(activeA.id, token);
      setModal(null); flash("Answer deleted."); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  };

  const aForm = (
    <div className="space-y-4">
      <Input
        label="Answer Text" value={form.text} required
        onChange={(v) => setForm((p) => ({ ...p, text: v }))}
        placeholder="Enter answer option…"
      />
      <label
        className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all
          ${form.isCorrect ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}
      >
        <input
          type="checkbox"
          checked={form.isCorrect}
          onChange={(e) => setForm((p) => ({ ...p, isCorrect: e.target.checked }))}
          className="w-4 h-4 accent-emerald-600 mt-0.5 shrink-0"
        />
        <div>
          <p className="text-sm font-bold text-gray-800">Mark as correct answer</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Checking this will count the answer toward the grade
          </p>
        </div>
      </label>
    </div>
  );

  if (loading) return <Spinner />;

  const correctCount = answers.filter((a) => a.isCorrect).length;

  return (
    <div>
      {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
      {success && <Toast type="success" msg={success} />}

      {/* Validation hints */}
      {(question.type === 0 || question.type === 2) && correctCount === 0 && answers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-semibold mb-4">
          ⚠️ No correct answer marked. Students won't be able to earn points on this question.
        </div>
      )}
      {(question.type === 0 || question.type === 2) && correctCount > 1 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-semibold mb-4">
          ❌ Single Choice / True-False should only have 1 correct answer. You have {correctCount} marked.
        </div>
      )}
      {question.type === 1 && correctCount === 0 && answers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-semibold mb-4">
          ⚠️ Mark at least one correct answer for Multiple Choice.
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-gray-400 font-semibold">
          {answers.length} answer{answers.length !== 1 ? "s" : ""} · {correctCount} correct
        </p>
        <Btn
          variant="primary" size="xs"
          onClick={() => { setForm({ text: "", isCorrect: false }); setModal("create"); }}
        >
          + Add Answer
        </Btn>
      </div>

      {answers.length === 0 ? (
        <Empty
          icon="💬" msg="No answers yet."
          action={
            <Btn
              variant="primary" size="sm"
              onClick={() => { setForm({ text: "", isCorrect: false }); setModal("create"); }}
            >
              Add first answer
            </Btn>
          }
        />
      ) : (
        <div className="space-y-2">
          {answers.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all
                ${a.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm shrink-0
                ${a.isCorrect ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                {a.isCorrect ? "✓" : "○"}
              </div>
              <span className={`flex-1 text-sm font-medium ${a.isCorrect ? "text-emerald-800" : "text-gray-700"}`}>
                {a.text}
              </span>
              {a.isCorrect && (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
                  Correct
                </span>
              )}
              <div className="flex gap-1.5 shrink-0">
                <Btn
                  variant="secondary" size="xs"
                  onClick={() => {
                    setActiveA(a);
                    setForm({ text: a.text, isCorrect: a.isCorrect });
                    setModal("edit");
                  }}
                >
                  Edit
                </Btn>
                <Btn
                  variant="danger" size="xs"
                  onClick={() => { setActiveA(a); setModal("delete"); }}
                >
                  Del
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "create" && (
        <Modal title="Add Answer" onClose={() => setModal(null)}>
          {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
          {aForm}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="primary" disabled={saving} onClick={handleCreate}>
              {saving ? "Adding…" : "Add Answer"}
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "edit" && activeA && (
        <Modal title="Edit Answer" onClose={() => setModal(null)}>
          {error && <Toast type="error" msg={error} onDismiss={() => setError(null)} />}
          {aForm}
          <div className="flex justify-end gap-3 mt-6">
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn variant="primary" disabled={saving} onClick={handleEdit}>
              {saving ? "Saving…" : "Save"}
            </Btn>
          </div>
        </Modal>
      )}

      {modal === "delete" && activeA && (
        <ConfirmDelete
          what={activeA.text.slice(0, 40)}
          onConfirm={handleDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Page Shell ───────────────────────────────────────────────────────────────

export default function QuizzesPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<"take" | "manage">("take");

  if (!token || !user) return null;

  const instructor = isInstructor(user.role);

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,400&display=swap');
      `}</style>

      {/* Top accent stripe */}
      <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-3xl">🧩</span>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quizzes</h1>
            </div>
            <p className="text-sm text-gray-400 font-medium">
              {instructor
                ? "Create quizzes, manage questions & answers"
                : "Test your knowledge and track your progress"}
            </p>
          </div>
          <div
            className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border-2
              ${instructor
                ? "bg-violet-50 border-violet-200 text-violet-700"
                : "bg-sky-50 border-sky-200 text-sky-700"}`}
          >
            {user.role}
          </div>
        </div>

        {/* Tabs — instructors/admins only */}
        {instructor && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-8 w-fit">
            {[
              { key: "take" as const, label: "📖 Take Quiz" },
              { key: "manage" as const, label: "⚙️ Manage" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${tab === t.key ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {tab === "take" || !instructor ? (
          <StudentQuizList token={token} userId={user.id} />
        ) : (
          <InstructorQuizBuilder token={token} />
        )}
      </div>
    </div>
  );
}