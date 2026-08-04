export const getToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  // Poll up to 20 times (3 seconds) to allow Clerk script initialization to complete
  for (let attempt = 0; attempt < 20; attempt++) {
    const clerk = (window as any).Clerk;
    if (clerk?.loaded) {
      if (clerk.session) {
        try {
          const token = await clerk.session.getToken();
          if (token) return token;
        } catch (err) {
          console.warn("[session] Error getting Clerk session token:", err);
        }
      } else {
        // Clerk has loaded and confirmed user is signed out
        return null;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
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
