const TOKEN_KEY = "iwis_token";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};
