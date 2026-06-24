import { getToken } from "./session";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api`;

export class ApiError extends Error {
  public statusCode: number;
  public backendMessage: string;

  constructor(message: string, statusCode: number, backendMessage: string) {
    super(message);
    this.statusCode = statusCode;
    this.backendMessage = backendMessage;
  }
}

export async function apiFetch(endpoint: string, options: any = {}) {
  const token = getToken();

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
    });
  } catch (networkError: any) {
    // Pure network failure — server unreachable
    console.error("[apiFetch] Network error:", networkError.message);
    throw new ApiError(
      "Failed to fetch",
      0,
      "Server is unreachable. Please check your connection."
    );
  }

  if (!response.ok) {
    // Server responded but with an error status
    let backendMessage = `Request failed with status ${response.status}`;
    try {
      const json = await response.json();
      backendMessage = json.error || json.message || backendMessage;
    } catch {
      try {
        backendMessage = (await response.text()) || backendMessage;
      } catch {
        // keep default
      }
    }
    console.error(`[apiFetch] HTTP ${response.status} on ${endpoint}:`, backendMessage);
    throw new ApiError(backendMessage, response.status, backendMessage);
  }

  return await response.json();
}
