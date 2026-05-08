import { lmsFetch } from "./LmsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  certificateUrl: string;
  issuedAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const certificatesApi = {
  /** GET /api/certificates/my — all certificates earned by current student */
  getMyCertificates: (token: string) =>
    lmsFetch<Certificate[]>("/certificates/my", {}, token),
};
