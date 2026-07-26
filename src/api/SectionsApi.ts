import { lmsFetch } from "./LmsApi";
import type { CourseSection } from "./CoursesApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSectionPayload {
  courseId: string;
  title: string;
  orderIndex: number;
}

export interface UpdateSectionPayload {
  sectionId: string;
  title: string;
  orderIndex: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const sectionsApi = {
  /** GET /api/Sections/Course/{courseId} */
  getByCourse: (courseId: string, token: string) =>
    lmsFetch<CourseSection[]>(`/Sections/Course/${courseId}`, {}, token),

  /** POST /api/Sections */
  create: (payload: CreateSectionPayload, token: string) =>
    lmsFetch<CourseSection>(
      "/Sections",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),

  /** PUT /api/Sections/{id} */
  update: (id: string, payload: UpdateSectionPayload, token: string) =>
    lmsFetch<CourseSection>(
      `/Sections/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      token,
    ),

  /** DELETE /api/Sections/{id} */
  delete: (id: string, token: string) =>
    lmsFetch<void>(`/Sections/${id}`, { method: "DELETE" }, token),
};
