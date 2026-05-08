import { lmsFetch } from "./LmsApi";
import type { Lesson } from "./CoursesApi";

// ─── Types ────────────────────────────────────────────────────────────────────

/** contentType: 0 = Video, 1 = PDF */
export type ContentTypeEnum = 0 | 1;

export interface CreateLessonPayload {
  sectionId: string;
  title: string;
  contentUrl: string;
  contentType: ContentTypeEnum;
  durationSeconds: number;
  orderIndex: number;
  isFreePreview: boolean;
}

export interface UpdateLessonPayload {
  lessonId: string;
  title: string;
  contentUrl: string;
  contentType: ContentTypeEnum;
  durationSeconds: number;
  orderIndex: number;
  isFreePreview: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const lessonsApi = {
  /** GET /api/Lessons/Section/{sectionId} */
  getBySection: (sectionId: string, token: string) =>
    lmsFetch<Lesson[]>(`/Lessons/Section/${sectionId}`, {}, token),

  /** POST /api/Lessons — instructor only */
  create: (payload: CreateLessonPayload, token: string) =>
    lmsFetch<Lesson>(
      "/Lessons",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),

  /** PUT /api/Lessons/{id} */
  update: (id: string, payload: UpdateLessonPayload, token: string) =>
    lmsFetch<Lesson>(
      `/Lessons/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      token,
    ),

  /** DELETE /api/Lessons/{id} */
  delete: (id: string, token: string) =>
    lmsFetch<void>(`/Lessons/${id}`, { method: "DELETE" }, token),

  /** PUT /api/Lessons/{id}/toggle-preview — flip isFreePreview */
  togglePreview: (id: string, token: string) =>
    lmsFetch<void>(`/Lessons/${id}/toggle-preview`, { method: "PUT" }, token),
};
