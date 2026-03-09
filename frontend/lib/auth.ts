import { setToken } from "./session";
const AUTH_BASE_URL = "http://localhost:5000/api/auth";

type AuthPayload = {
  email: string;
  password: string;
};

type AuthResponse = {
  token?: string;
  message?: string;
  error?: string;
};

const parseError = (data: AuthResponse, fallback: string): string => {
  return data?.message || data?.error || fallback;
};

const postAuth = async (path: "login" | "signup", payload: AuthPayload): Promise<AuthResponse> => {
  const response = await fetch(`${AUTH_BASE_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as AuthResponse;
  if (!response.ok) {
    throw new Error(parseError(data, `${path === "login" ? "Login" : "Signup"} failed`));
  }

  return data;
};

export const loginWithEmail = async (payload: AuthPayload): Promise<string> => {
  const data = await postAuth("login", payload);
  if (!data.token) {
    throw new Error("No auth token returned from server");
  }

 setToken(data.token);
  return data.token;
};

export const signupAndLogin = async (payload: AuthPayload): Promise<string> => {
  const signupData = await postAuth("signup", payload);

  const token = signupData.token ?? (await loginWithEmail(payload));
  if (!token) {
    throw new Error("No auth token returned from server");
  }

 setToken(token);
  return token;
};
