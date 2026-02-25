import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function serverApiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // read cookies from the incoming browser request
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader, // ⭐ manually forward cookies to backend
      ...(options.headers || {}),
    },
    cache: "no-store", // never cache authenticated requests
  });

  if (!res.ok) {
    let errorMsg = "API Error";
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {}

    throw new Error(errorMsg);
  }

  return res.json();
}
