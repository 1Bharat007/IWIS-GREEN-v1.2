import { getToken, clearToken } from "./session";
import { ErrorDictionary } from "./errorDictionary";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://iwis-green-v1-2-1.onrender.com"}/api`;

export class ApiError extends Error {
  public statusCode: number;
  public backendMessage: string;

  constructor(message: string, statusCode: number, backendMessage: string) {
    super(message);
    this.statusCode = statusCode;
    this.backendMessage = backendMessage;
  }
}

export async function apiFetch(endpoint: string, options: any = {}, isRetry = false): Promise<any> {
  const token = await getToken();

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

  // Handle 401 Unauthorized with 1-time automatic token refresh retry
  if (response.status === 401 && !isRetry) {
    console.warn(`[apiFetch] 401 received on ${endpoint}. Retrying with fresh session token...`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newToken = await getToken();
    if (newToken) {
      return apiFetch(endpoint, options, true);
    }
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
    } else if (response.status === 409 && rawBackendMessage.includes("already been accepted")) {
      friendlyMessage = ErrorDictionary.LISTING_ALREADY_ACCEPTED.message;
    } else if (response.status === 429) {
      friendlyMessage = ErrorDictionary.RATE_LIMIT_EXCEEDED.message;
    } else if (response.status >= 500) {
      friendlyMessage = ErrorDictionary.AI_BUSY.message;
    } else if (rawBackendMessage.includes("large")) {
      friendlyMessage = ErrorDictionary.IMAGE_TOO_LARGE.message;
    } else if (response.status === 400 || response.status === 403 || response.status === 404) {
      friendlyMessage = rawBackendMessage.length < 100 ? rawBackendMessage : ErrorDictionary.DEFAULT_ERROR.message;
    }

    console.error(`[apiFetch] HTTP ${response.status} on ${endpoint}:`, rawBackendMessage);
    throw new ApiError(friendlyMessage, response.status, rawBackendMessage);
  }

  return await response.json();
}
