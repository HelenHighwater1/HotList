import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext, checkCredentials, readStoredUser, writeStoredUser } from "../lib/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(() => readStoredUser());

  const signIn = useCallback((username: string, password: string) => {
    if (!checkCredentials(username, password)) return false;
    setUser(username);
    writeStoredUser(username);
    return true;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    writeStoredUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
