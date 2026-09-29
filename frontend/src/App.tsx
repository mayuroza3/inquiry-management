import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { AdminShell } from './components/AdminShell';
import { ActivityPage } from './pages/ActivityPage';
import { DashboardPage } from './pages/DashboardPage';
import { InquirePage } from './pages/InquirePage';
import { InquiryDetailPage } from './pages/InquiryDetailPage';
import { InquiryListPage } from './pages/InquiryListPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/inquire" element={<InquirePage />} />
      <Route
        element={
          <RequireAuth>
            <AdminShell />
          </RequireAuth>
        }
      >
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/inquiries" element={<InquiryListPage />} />
        <Route path="/admin/inquiries/:id" element={<InquiryDetailPage />} />
        <Route path="/admin/activity" element={<ActivityPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        <Route
          path="/admin/users"
          element={
            <RequireAuth role="admin">
              <UsersPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
