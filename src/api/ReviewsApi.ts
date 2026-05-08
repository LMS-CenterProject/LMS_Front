import { lmsFetch } from "./LmsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

/** TargetType: 0 = Course, 1 = Teacher, 2 = Lesson */
export type ReviewTargetType = 0 | 1 | 2;
export const REVIEW_TARGET_LABELS: Record<ReviewTargetType, string> = {
  0: "Course",
  1: "Teacher",
  2: "Lesson",
};

export interface Review {
  id: string;
  studentId: string;
  studentName: string;
  targetId: string;
  targetType: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
}

export interface CreateReviewPayload {
  targetId: string;
  targetType: ReviewTargetType;
  rating: number;
  comment: string;
}

export interface UpdateReviewPayload {
  rating: number;
  comment: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const reviewsApi = {
  /**
   * GET /api/reviews?targetId=...&targetType=...
   * Public endpoint — no auth required, but pass token if available.
   */
  getReviews: (
    targetId: string,
    targetType: ReviewTargetType,
    token?: string | null,
  ) =>
    lmsFetch<ReviewsResponse>(
      `/reviews?targetId=${targetId}&targetType=${targetType}`,
      {},
      token,
    ),

  /**
   * POST /api/reviews
   * Student must be enrolled (Course/Teacher) or have completed lesson.
   */
  create: (payload: CreateReviewPayload, token: string) =>
    lmsFetch<void>(
      "/reviews",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),

  /**
   * PUT /api/reviews/{id}
   * Can only update within 30 days of posting.
   */
  update: (id: string, payload: UpdateReviewPayload, token: string) =>
    lmsFetch<void>(
      `/reviews/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      token,
    ),
};
