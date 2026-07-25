// Legacy auth helper - Clerk is now used for authentication.
export const loginWithEmail = async (): Promise<string> => {
  throw new Error("Use Clerk <SignIn /> component instead.");
};

export const signupAndLogin = async (): Promise<string> => {
  throw new Error("Use Clerk <SignUp /> component instead.");
};
