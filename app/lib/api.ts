const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * CLIENT API FETCH
 * Used only inside "use client" components
 * Supports BOTH:
 *  - Cookie-based auth (fallback)
 *  - Token-based auth (primary)
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // ✅ Get token from localStorage (client only)
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,

    credentials: "include", // keep for fallback

    headers: {
      "Content-Type": "application/json",

      // ✅ NEW: Send Bearer token
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),

      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = "Request failed";

    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // ignore JSON parse errors
    }

    throw new Error(message);
  }

  return res.json();
}
