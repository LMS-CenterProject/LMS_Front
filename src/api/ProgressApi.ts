import { lmsFetch } from "./LmsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressUpdatePayload {
  watchedSeconds: number;
  isCompleted: boolean;
}

export interface ProgressResponse {
  lessonId: string;
  isCompleted: boolean;
  watchedSeconds: number;
  courseProgressPercentage: number;
  enrollmentCompleted: boolean;
  certificateIssued: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const progressApi = {
  /**
   * PATCH /api/progress/lessons/{lessonId}
   * Set isCompleted = true to mark done.
   * If ALL lessons are done, enrollment auto-completes + certificate issued.
   */
  updateLesson: (
    lessonId: string,
    payload: ProgressUpdatePayload,
    token: string,
  ) =>
    lmsFetch<ProgressResponse>(
      `/progress/lessons/${lessonId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
      token,
    ),
};
