import { lmsFetch } from "./LmsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressUpdatePayload {
  watchedSeconds: number;
  isCompleted: boolean;
}

export interface ProgressUpdateResponse {
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
   * Update watch progress. Set isCompleted = true to mark as done.
   * If all lessons complete, enrollment auto-completes and certificate is issued.
   */
  updateLesson: (
    lessonId: string,
    payload: ProgressUpdatePayload,
    token: string,
  ) =>
    lmsFetch<ProgressUpdateResponse>(
      `/progress/lessons/${lessonId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
      token,
    ),
};
