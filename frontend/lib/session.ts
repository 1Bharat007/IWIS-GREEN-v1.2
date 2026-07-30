export const getToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if ((window as any).Clerk?.session) {
      try {
        const token = await (window as any).Clerk.session.getToken();
        if (token) return token;
      } catch (err) {
        console.warn("[session] Error getting Clerk session token:", err);
      }
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  return null;
};

export const clearToken = () => {
  if (typeof window === "undefined") return;
  try {
    if ((window as any).Clerk) {
      (window as any).Clerk.signOut();
    }
  } catch {}
};
