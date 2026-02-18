export interface User {
  name: string;
  email: string;
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("iwis-user");
  return stored ? JSON.parse(stored) : null;
}

export function loginUser(user: User) {
  localStorage.setItem("iwis-user", JSON.stringify(user));
}

export function logoutUser() {
  localStorage.removeItem("iwis-user");
}
