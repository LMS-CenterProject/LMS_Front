const API = import.meta.env.VITE_API_URL as string;

export async function lmsFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/plain",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  // Merge caller-supplied headers (don't overwrite auth)
  const callerHeaders = (options.headers ?? {}) as Record<string, string>;
  Object.assign(headers, callerHeaders);

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.detail ?? body?.title ?? message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}
