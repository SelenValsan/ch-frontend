const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * CLIENT API FETCH
 * Used only inside "use client" components
 * Sends cookies automatically
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,

    credentials: "include", // ⭐ CRITICAL (sends auth cookies)

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {}

    throw new Error(message);
  }

  return res.json();
}
