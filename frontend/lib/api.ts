import { getToken, clearToken } from "./session";
import { ErrorDictionary } from "./errorDictionary";

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
      ErrorDictionary.NETWORK_ERROR.message,
      0,
      ErrorDictionary.NETWORK_ERROR.message
    );
  }

  if (!response.ok) {
    let rawBackendMessage = `Request failed with status ${response.status}`;
    try {
      const json = await response.json();
      rawBackendMessage = json.error || json.message || rawBackendMessage;
    } catch {
      try {
        rawBackendMessage = (await response.text()) || rawBackendMessage;
      } catch {}
    }
    
    // Default to friendly error
    let friendlyMessage = ErrorDictionary.DEFAULT_ERROR.message;

    // Map to dictionary
    if (response.status === 401) {
      friendlyMessage = ErrorDictionary.SESSION_EXPIRED.message;
      if (typeof window !== "undefined") {
        clearToken();
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${returnUrl}`;
      }
    } else if (response.status === 409 && rawBackendMessage.includes("already been accepted")) {
      friendlyMessage = ErrorDictionary.LISTING_ALREADY_ACCEPTED.message;
    } else if (response.status === 429) {
      friendlyMessage = ErrorDictionary.RATE_LIMIT_EXCEEDED.message;
    } else if (response.status >= 500) {
      friendlyMessage = ErrorDictionary.AI_BUSY.message; // or server busy
    } else if (rawBackendMessage.includes("large")) {
      friendlyMessage = ErrorDictionary.IMAGE_TOO_LARGE.message;
    } else if (response.status === 400 || response.status === 403 || response.status === 404) {
      // Use backend message if it's a validation error, but ensure it's not a stack trace
      friendlyMessage = rawBackendMessage.length < 100 ? rawBackendMessage : ErrorDictionary.DEFAULT_ERROR.message;
    }

    console.error(`[apiFetch] HTTP ${response.status} on ${endpoint}:`, rawBackendMessage);
    throw new ApiError(friendlyMessage, response.status, rawBackendMessage);
  }

  return await response.json();
}
