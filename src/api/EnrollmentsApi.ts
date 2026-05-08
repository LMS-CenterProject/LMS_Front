import { lmsFetch } from "./LmsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  thumbnailUrl: string | null;
  paidPrice: number;
  status: string;
  totalWatchedSeconds: number;
  totalCourseDurationSeconds: number;
  progressPercentage: number;
  hasCertificate: boolean;
  enrolledAt: string;
  completedAt: string | null;
}

export interface EnrollmentLesson {
  lessonId: string;
  title: string;
  contentType: string;
  durationSeconds: number;
  isCompleted: boolean;
  watchedSeconds: number;
  isFreePreview: boolean;
}

export interface EnrollmentSection {
  sectionId: string;
  title: string;
  orderIndex: number;
  lessons: EnrollmentLesson[];
}

export interface EnrollmentDetails extends Enrollment {
  certificateUrl: string | null;
  sections: EnrollmentSection[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const enrollmentsApi = {
  /** POST /api/enrollments — enroll in a course */
  enroll: (courseId: string, token: string) =>
    lmsFetch<{ enrollmentId: string }>(
      "/enrollments",
      {
        method: "POST",
        body: JSON.stringify({ courseId }),
      },
      token,
    ),

  /** GET /api/enrollments/myEnrollments */
  getMyEnrollments: (token: string) =>
    lmsFetch<Enrollment[]>("/enrollments/myEnrollments", {}, token),

  /** GET /api/enrollments/{id} — full breakdown with lesson progress */
  getById: (id: string, token: string) =>
    lmsFetch<EnrollmentDetails>(`/enrollments/${id}`, {}, token),
};
