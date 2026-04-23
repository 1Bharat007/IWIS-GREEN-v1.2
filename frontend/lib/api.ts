import { getToken } from "./session";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

export async function apiFetch(endpoint: string, options: any = {}) {
  const token = getToken();

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Request failed");
    }

    return await response.json();
  } catch (error) {
    console.error("API ERROR:", error);
    throw new Error("Failed to connect to backend");
  }
}
