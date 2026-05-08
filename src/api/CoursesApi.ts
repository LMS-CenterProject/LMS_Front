import { lmsFetch } from "./LmsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Matches the real GET /api/Course response shape exactly:
 * { id, title, description, categoryName, categoryId, instructorName,
 *   thumbnailUrl, price, sectionCount, lessonCount, language, status }
 */
export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  language: string;
  status: string;
  // Fields returned by the real API ──────────────────────────────────────────
  categoryName: string;
  categoryId: string;
  instructorId?: string;
  instructorName: string;
  thumbnailUrl: string | null;
  sectionCount: number;
  lessonCount: number;
}

export interface Lesson {
  id: string;
  title: string;
  sectionId: string;
  contentUrl: string;
  contentType: string;
  durationSeconds: number;
  orderIndex: number;
  isFreePreview: boolean;
}

export interface CourseSection {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

/**
 * Returned by GET /api/Course/{id}/details and PUT /api/Course/{id}
 * Adds full detail fields on top of the list shape.
 */
export interface CourseDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  status: number; // numeric enum in details endpoint
  level: number;
  language: string;
  thumbnailUrl: string | null;
  totalWatchSeconds: number;
  instructorId: string;
  instructorName: string;
  categoryId: string;
  categoryName: string;
  sections: CourseSection[];
}

export interface CreateCoursePayload {
  instructorId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  level: number;
  language: string;
}

export interface UpdateCoursePayload {
  courseId: string;
  title: string;
  description: string;
  price: number;
  level: number;
  language: string;
  thumbnailUrl: string;
  categoryId: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const coursesApi = {
  /** Public — no token required */
  getAll: (token?: string) => lmsFetch<Course[]>("/Course", {}, token),

  getById: (id: string, token: string) =>
    lmsFetch<Course>(`/Course/${id}`, {}, token),

  getDetails: (id: string, token: string) =>
    lmsFetch<CourseDetails>(`/Course/${id}/details`, {}, token),

  getMyCourses: (token: string) =>
    lmsFetch<Course[]>("/Course/my-courses", {}, token),

  create: (payload: CreateCoursePayload, token: string) =>
    lmsFetch<Course>(
      "/Course",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),

  update: (id: string, payload: UpdateCoursePayload, token: string) =>
    lmsFetch<CourseDetails>(
      `/Course/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      token,
    ),

  delete: (id: string, token: string) =>
    lmsFetch<void>(`/Course/${id}`, { method: "DELETE" }, token),

  publish: (id: string, token: string) =>
    lmsFetch<void>(`/Course/${id}/publish`, { method: "PUT" }, token),

  archive: (id: string, token: string) =>
    lmsFetch<void>(`/Course/${id}/archive`, { method: "PUT" }, token),
};
