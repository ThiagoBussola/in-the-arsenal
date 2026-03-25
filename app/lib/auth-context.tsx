"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { apiFetch } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistTokens(tokens: AuthTokens) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("accessToken");
    if (!stored) {
      setLoading(false);
      return;
    }
    setAccessToken(stored);
    apiFetch<{ user: User }>("/auth/me", {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((data) => setUser(data.user))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const handleAuthResponse = useCallback(
    (data: { user: User; accessToken: string; refreshToken: string }) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      persistTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      handleAuthResponse(data);
    },
    [handleAuthResponse]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await apiFetch<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      handleAuthResponse(data);
    },
    [handleAuthResponse]
  );

  const googleLogin = useCallback(
    async (idToken: string) => {
      const data = await apiFetch<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      handleAuthResponse(data);
    },
    [handleAuthResponse]
  );

  const logout = useCallback(async () => {
    const rt = localStorage.getItem("refreshToken");
    if (rt) {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: rt }),
      }).catch(() => {});
    }
    setUser(null);
    setAccessToken(null);
    clearTokens();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, register, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
