import { createContext, useContext } from "react";

/** Placeholder credentials: replaced by a real user table once the DB lands. */
const DEFAULT_USER = { username: "user1", password: "password" };

const STORAGE_KEY = "hotlist.session";

export type AuthState = {
  user: string | null;
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function checkCredentials(username: string, password: string): boolean {
  return username === DEFAULT_USER.username && password === DEFAULT_USER.password;
}

export function readStoredUser(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredUser(user: string | null) {
  try {
    if (user) sessionStorage.setItem(STORAGE_KEY, user);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode): session stays in memory only */
  }
}
