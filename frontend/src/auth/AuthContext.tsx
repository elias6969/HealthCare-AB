import { createContext, useContext, useState  } from "react";
import type { ReactNode } from "react";

interface User {
  id: number;
  email: string;
  role: string | number;
  firstName?: string;
  lastName?: string;
}

export function normalizeRoleId(role: string | number | undefined): 0 | 1 | null {
  if (role === undefined || role === null) return null;

  if (typeof role === "number") {
    if (role === 0) return 0;
    if (role === 1) return 1;
    return null;
  }

  // numeric strings from backend/localStorage ("0" / "1")
  if (role === "0") return 0;
  if (role === "1") return 1;

  return null;
}

// Helper function to format role text (0/1 or "0"/"1" or "patient"/"caregiver"/"Patient"/"Caregiver")
export function formatRole(role: string | number | undefined): "Patient" | "Caregiver" | "" {
  const id = normalizeRoleId(role);
  if (id === 0) return "Patient";
  if (id === 1) return "Caregiver";

  if (typeof role !== "string") return "";

  const normalized = role.trim().toLowerCase();
  if (normalized === "patient") return "Patient";
  if (normalized === "caregiver") return "Caregiver";

  return "";
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
