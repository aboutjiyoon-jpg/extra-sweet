import type { ReactNode } from "react";
import { useAdminAuth } from "./AdminAuthContext";
import AdminLoginPage from "./AdminLoginPage";
import AdminShell from "./AdminShell";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { password } = useAdminAuth();
  if (!password) return <AdminShell><AdminLoginPage /></AdminShell>;
  return <AdminShell>{children}</AdminShell>;
}
