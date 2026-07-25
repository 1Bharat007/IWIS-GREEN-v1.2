export const getToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if ((window as any).Clerk?.session) {
    try {
      const token = await (window as any).Clerk.session.getToken();
      return token || null;
    } catch (err) {
      console.warn("[session] Error getting Clerk session token:", err);
      return null;
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
