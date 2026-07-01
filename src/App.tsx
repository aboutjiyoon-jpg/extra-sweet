import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import BrowsePage from "./pages/BrowsePage";
import { AdminAuthProvider } from "./admin/AdminAuthContext";
import AdminGuard from "./admin/AdminGuard";
import AdminListPage from "./admin/AdminListPage";
import AdminEditPage from "./admin/AdminEditPage";

function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminGuard>
        <Outlet />
      </AdminGuard>
    </AdminAuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminListPage />} />
          <Route path="new" element={<AdminEditPage />} />
          <Route path=":id" element={<AdminEditPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
