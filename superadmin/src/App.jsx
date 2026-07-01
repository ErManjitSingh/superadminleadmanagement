import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import CompanyWizardPage from './pages/CompanyWizardPage';
import PlansPage from './pages/PlansPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import DomainsPage from './pages/DomainsPage';
import DnsVerificationPage from './pages/DnsVerificationPage';
import InvoicesPage from './pages/InvoicesPage';
import SupportPage from './pages/SupportPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import AdminsPage from './pages/AdminsPage';
import RolesPage from './pages/RolesPage';
import ApiKeysPage from './pages/ApiKeysPage';
import BackupsPage from './pages/BackupsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/admin/login" element={<LoginPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <SuperAdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="companies/new" element={<CompanyWizardPage />} />
                <Route path="companies/:id" element={<CompanyDetailPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="plans" element={<PlansPage />} />
                <Route path="domains" element={<DomainsPage />} />
                <Route path="dns" element={<DnsVerificationPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="support" element={<SupportPage />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="logs" element={<AuditLogsPage />} />
                <Route path="activity" element={<ActivityLogsPage />} />
                <Route path="admins" element={<AdminsPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="api-keys" element={<ApiKeysPage />} />
                <Route path="backups" element={<BackupsPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
