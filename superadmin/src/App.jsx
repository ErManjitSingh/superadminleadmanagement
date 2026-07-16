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
import FeaturesRolloutPage from './pages/FeaturesRolloutPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import PaymentRequestsPage from './pages/PaymentRequestsPage';
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
import WebsiteDashboardPage from './pages/website/WebsiteDashboardPage';
import WebsiteHomepagePage from './pages/website/WebsiteHomepagePage';
import WebsiteTreksPage from './pages/website/WebsiteTreksPage';
import WebsiteDestinationsPage from './pages/website/WebsiteDestinationsPage';
import WebsiteCategoriesPage from './pages/website/WebsiteCategoriesPage';
import WebsiteBlogsPage from './pages/website/WebsiteBlogsPage';
import WebsiteMediaPage from './pages/website/WebsiteMediaPage';
import WebsiteGalleryPage from './pages/website/WebsiteGalleryPage';
import WebsiteTestimonialsPage from './pages/website/WebsiteTestimonialsPage';
import WebsiteFaqsPage from './pages/website/WebsiteFaqsPage';
import WebsiteMenusPage from './pages/website/WebsiteMenusPage';
import WebsiteSeoPage from './pages/website/WebsiteSeoPage';
import WebsiteLeadsPage from './pages/website/WebsiteLeadsPage';
import WebsiteCouponsPage from './pages/website/WebsiteCouponsPage';
import WebsiteSettingsPage from './pages/website/WebsiteSettingsPage';
import WebsiteRedirectsPage from './pages/website/WebsiteRedirectsPage';
import WebsiteActivityPage from './pages/website/WebsiteActivityPage';

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
                <Route path="payment-requests" element={<PaymentRequestsPage />} />
                <Route path="plans" element={<PlansPage />} />
                <Route path="features" element={<FeaturesRolloutPage />} />
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

                {/* Website Management — isolated trekking CMS */}
                <Route path="website" element={<WebsiteDashboardPage />} />
                <Route path="website/homepage" element={<WebsiteHomepagePage />} />
                <Route path="website/treks" element={<WebsiteTreksPage />} />
                <Route path="website/destinations" element={<WebsiteDestinationsPage />} />
                <Route path="website/categories" element={<WebsiteCategoriesPage />} />
                <Route path="website/blogs" element={<WebsiteBlogsPage />} />
                <Route path="website/media" element={<WebsiteMediaPage />} />
                <Route path="website/gallery" element={<WebsiteGalleryPage />} />
                <Route path="website/testimonials" element={<WebsiteTestimonialsPage />} />
                <Route path="website/faqs" element={<WebsiteFaqsPage />} />
                <Route path="website/menus" element={<WebsiteMenusPage />} />
                <Route path="website/seo" element={<WebsiteSeoPage />} />
                <Route path="website/leads" element={<WebsiteLeadsPage />} />
                <Route path="website/coupons" element={<WebsiteCouponsPage />} />
                <Route path="website/settings" element={<WebsiteSettingsPage />} />
                <Route path="website/redirects" element={<WebsiteRedirectsPage />} />
                <Route path="website/activity" element={<WebsiteActivityPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
