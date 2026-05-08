import { lmsFetch } from "./LmsApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
}

export interface CreateCategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  id: string;
  name: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const categoriesApi = {
  // GET all categories
  getAll: () => lmsFetch<Category[]>("/Category", {}),

  // GET category by id
  getById: (id: string, token: string) =>
    lmsFetch<Category>(`/Category/${id}`, {}, token),

  // CREATE category
  create: (payload: CreateCategoryPayload, token: string) =>
    lmsFetch<Category>(
      "/Category",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      token,
    ),

  // UPDATE category
  update: (id: string, payload: UpdateCategoryPayload, token: string) =>
    lmsFetch<Category>(
      `/Category/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      token,
    ),

  // DELETE category
  delete: (id: string, token: string) =>
    lmsFetch<void>(`/Category/${id}`, { method: "DELETE" }, token),
};
