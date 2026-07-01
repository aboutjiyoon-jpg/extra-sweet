import { createContext, useContext, useState, type ReactNode } from "react";

const STORAGE_KEY = "yozm-admin-password";

interface AdminAuthValue {
  password: string | null;
  setPassword: (password: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [password, setPasswordState] = useState<string | null>(() =>
    sessionStorage.getItem(STORAGE_KEY)
  );

  const setPassword = (next: string) => {
    sessionStorage.setItem(STORAGE_KEY, next);
    setPasswordState(next);
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPasswordState(null);
  };

  return (
    <AdminAuthContext.Provider value={{ password, setPassword, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
