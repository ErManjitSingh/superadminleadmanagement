import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';
import RoleRoute, { RoleDashboardRedirect } from './components/RoleRoute';
import Layout from './components/Layout';
import ComingSoon from './components/ui/ComingSoon';
import {
  Login,
  Register,
  Unauthorized,
  AcceptInvite,
  RoleDashboard,
  Dashboard,
  Leads,
  LeadDetail,
  LeadForm,
  Followups,
  WhatsAppLeads,
  Packages,
  Quotations,
  Reports,
  Team,
  TeamUserProfile,
  AdminAttendancePage,
  Notifications,
  ReactivatedLeadsPage,
  SalesManagerLayout,
  ManagerDashboard,
  TeamLeadsPage,
  ManagerLeadDetailPage,
  LeadAssignmentPage,
  TeamManagementPage,
  TeamDetailPage,
  TeamMonitoringPage,
  FollowUpMonitoringPage,
  QuotationApprovalPage,
  TeamPerformancePage,
  ManagerReportsPage,
  ManagerCalendarPage,
  ManagerNotificationsPage,
  ManagerProfilePage,
  SalesExecutiveLayout,
  ExecutiveDashboard,
  MyLeadsPage,
  ExecutiveLeadDetailPage,
  ExecutiveFollowUpsPage,
  ExecutiveQuotationsPage,
  ExecutiveQuotationBuilder,
  ExecutiveCustomersPage,
  ExecutiveCalendarPage,
  ExecutiveNotificationsPage,
  ExecutiveProfilePage,
  TeamLeaderLayout,
  LeaderDashboard,
  LeaderTeamLeadsPage,
  LeaderLeadDetailPage,
  LeaderFollowUpsPage,
  ExecutivePerformancePage,
  LeadEscalationsPage,
  LeaderQuotationsPage,
  LeaderReportsPage,
  LeaderCalendarPage,
  LeaderNotificationsPage,
  LeaderProfilePage,
  OperationsManagerLayout,
  OperationsDashboard,
  BookingsListPage,
  BookingDetailPage,
  OperationsHotelsPage,
  OperationsTransportPage,
  OperationsActivitiesPage,
  VendorsPage,
  VouchersPage,
  SupportTicketsPage,
  OperationsReportsPage,
  OperationsCalendarPage,
  OperationsProfilePage,
} from './routes/lazyRoutes';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
          <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/accept-invite/:token" element={<AcceptInvite />} />

            <Route
              path="/sales-manager"
              element={
                <ProtectedRoute allowedRoles={['sales_manager']}>
                  <SalesManagerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="leads/:id/view" element={<ManagerLeadDetailPage />} />
              <Route path="leads/:filter" element={<TeamLeadsPage />} />
              <Route path="assignment" element={<LeadAssignmentPage />} />
              <Route path="teams" element={<TeamManagementPage />} />
              <Route path="teams/:id" element={<TeamDetailPage />} />
              <Route path="follow-ups" element={<FollowUpMonitoringPage />} />
              <Route path="team" element={<TeamPerformancePage />} />
              <Route path="quotations/:status" element={<QuotationApprovalPage />} />
              <Route path="reports" element={<ManagerReportsPage />} />
              <Route path="reactivated-leads" element={<ReactivatedLeadsPage />} />
              <Route path="calendar" element={<ManagerCalendarPage />} />
              <Route path="notifications" element={<ManagerNotificationsPage />} />
              <Route path="profile" element={<ManagerProfilePage />} />
            </Route>

            <Route
              path="/sales-executive"
              element={
                <ProtectedRoute allowedRoles={['sales_executive']}>
                  <SalesExecutiveLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ExecutiveDashboard />} />
              <Route path="leads/:id/view" element={<ExecutiveLeadDetailPage />} />
              <Route path="leads/:filter" element={<MyLeadsPage />} />
              <Route path="follow-ups" element={<ExecutiveFollowUpsPage />} />
              <Route path="quotations/new" element={<ExecutiveQuotationBuilder />} />
              <Route path="quotations" element={<ExecutiveQuotationsPage />} />
              <Route path="customers" element={<ExecutiveCustomersPage />} />
              <Route path="calendar" element={<ExecutiveCalendarPage />} />
              <Route path="notifications" element={<ExecutiveNotificationsPage />} />
              <Route path="profile" element={<ExecutiveProfilePage />} />
            </Route>

            <Route
              path="/team-leader"
              element={
                <ProtectedRoute allowedRoles={['team_leader']}>
                  <TeamLeaderLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<LeaderDashboard />} />
              <Route path="leads/:id/view" element={<LeaderLeadDetailPage />} />
              <Route path="leads" element={<LeaderTeamLeadsPage />} />
              <Route path="follow-ups" element={<LeaderFollowUpsPage />} />
              <Route path="performance" element={<ExecutivePerformancePage />} />
              <Route path="escalations" element={<LeadEscalationsPage />} />
              <Route path="quotations/:status" element={<LeaderQuotationsPage />} />
              <Route path="reports" element={<LeaderReportsPage />} />
              <Route path="reactivated-leads" element={<ReactivatedLeadsPage />} />
              <Route path="calendar" element={<LeaderCalendarPage />} />
              <Route path="notifications" element={<LeaderNotificationsPage />} />
              <Route path="profile" element={<LeaderProfilePage />} />
            </Route>

            <Route
              path="/operations-manager"
              element={
                <ProtectedRoute allowedRoles={['operations_manager']}>
                  <OperationsManagerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OperationsDashboard />} />
              <Route path="bookings/:status" element={<BookingsListPage />} />
              <Route path="booking/:id" element={<BookingDetailPage />} />
              <Route path="hotels" element={<OperationsHotelsPage />} />
              <Route path="transport" element={<OperationsTransportPage />} />
              <Route path="activities" element={<OperationsActivitiesPage />} />
              <Route path="vendors" element={<VendorsPage />} />
              <Route path="vouchers" element={<VouchersPage />} />
              <Route path="support" element={<SupportTicketsPage />} />
              <Route path="calendar" element={<OperationsCalendarPage />} />
              <Route path="reports" element={<OperationsReportsPage />} />
              <Route path="profile" element={<OperationsProfilePage />} />
            </Route>

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoleDashboardRedirect />} />
              <Route path="admin/dashboard" element={<RoleRoute roles={['admin']}><Dashboard /></RoleRoute>} />
              <Route path="accountant/dashboard" element={<RoleRoute roles={['accountant']}><RoleDashboard roleKey="accountant" description="Financial reports and quotation approvals" /></RoleRoute>} />
              <Route path="operations/dashboard" element={<RoleRoute roles={['operations_manager']}><RoleDashboard roleKey="operations_manager" description="Packages, inventory, and operations" /></RoleRoute>} />
              <Route path="leads" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/new-leads" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/unassigned" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/assigned" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/converted" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/lost" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/reactivated" element={<PermissionRoute module="leads"><ReactivatedLeadsPage /></PermissionRoute>} />
              <Route path="leads/new" element={<PermissionRoute module="leads" action="create"><LeadForm /></PermissionRoute>} />
              <Route path="leads/:id/edit" element={<PermissionRoute module="leads" action="edit"><LeadForm /></PermissionRoute>} />
              <Route path="leads/:id" element={<PermissionRoute module="leads"><LeadDetail /></PermissionRoute>} />
              <Route path="followups" element={<PermissionRoute module="leads"><Followups /></PermissionRoute>} />
              <Route path="whatsapp" element={<PermissionRoute module="leads"><WhatsAppLeads /></PermissionRoute>} />
              <Route path="customers" element={<PermissionRoute module="customers"><ComingSoon title="Customers" description="Repeat customers and relationship management" /></PermissionRoute>} />
              <Route path="quotations/*" element={<PermissionRoute module="quotations"><Quotations /></PermissionRoute>} />
              <Route path="packages" element={<PermissionRoute module="packages"><Packages /></PermissionRoute>} />
              <Route path="team/attendance" element={<RoleRoute roles={['admin']}><AdminAttendancePage /></RoleRoute>} />
              <Route path="team" element={<PermissionRoute module="users"><Team /></PermissionRoute>} />
              <Route path="team/users/:id" element={<PermissionRoute module="users"><TeamUserProfile /></PermissionRoute>} />
              <Route path="reports" element={<PermissionRoute module="reports"><Reports /></PermissionRoute>} />
              <Route path="calendar" element={<ComingSoon title="Calendar" description="Travel dates, follow-ups, and team schedule" />} />
              <Route path="notifications" element={<PermissionRoute module="leads"><Notifications /></PermissionRoute>} />
              <Route path="settings" element={<ComingSoon title="Settings" description="Company profile, integrations, and permissions" />} />
              <Route path="profile" element={<ComingSoon title="My Profile" description="Personal settings and performance" />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </NotificationProvider>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
