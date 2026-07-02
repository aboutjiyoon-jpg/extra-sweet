import type { ReactNode } from "react";
import { useAdminAuth } from "./AdminAuthContext";
import AdminLoginPage from "./AdminLoginPage";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { password } = useAdminAuth();
  if (!password) return <AdminLoginPage />;
  return <>{children}</>;
}
