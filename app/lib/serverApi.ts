import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function serverApiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  /* 1️⃣ Get cookies from browser request */
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  /* 2️⃣ Call backend WITH cookies */
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    cache: "no-store",

    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader, // ⭐ THE ENTIRE AUTH FIX
      ...(options.headers || {}),
    },
  });

  /* 3️⃣ If unauthorized → throw */
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
