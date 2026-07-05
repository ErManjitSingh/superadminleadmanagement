import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider, TenantGate } from './context/TenantContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';
import RoleRoute, { RoleDashboardRedirect } from './components/RoleRoute';
import Layout from './components/Layout';
import ComingSoon from './components/ui/ComingSoon';
import Login from './pages/Login';
import {
  Signup,
  Register,
  Unauthorized,
  AcceptInvite,
  ImpersonationCallback,
  RoleDashboard,
  Dashboard,
  Leads,
  LeadDetail,
  LeadForm,
  Followups,
  Reminders,
  LeadAnalytics,
  SlaMonitor,
  RecycleBin,
  LeadAuditLog,
  WhatsAppLeads,
  Packages,
  Quotations,
  Reports,
  Payments,
  Team,
  TeamUserProfile,
  AdminAttendancePage,
  DestinationAssignmentPage,
  SkillAssignmentPage,
  Notifications,
  SettingsPage,
  CompanyWorkspacePage,
  VerifyEmailPage,
  WhatsAppTemplatesPage,
  EmailTemplatesPage,
  EmailActivityPage,
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
  ManagerQuotationBuilder,
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
  LeaderQuotationBuilder,
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
  TripTrackerPage,
  OperationsTasksPage,
  TripExecutionDashboard,
  TripExecutionTripsPage,
  VendorConfirmationsPage,
  OperationsAlertsPage,
  VendorConfirmationPage,
} from './routes/lazyRoutes';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
        <TenantProvider>
        <TenantGate>
        <AuthProvider>
          <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/vendor-confirm/:token" element={<VendorConfirmationPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/accept-invite/:token" element={<AcceptInvite />} />
            <Route path="/auth/impersonate" element={<ImpersonationCallback />} />

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
              <Route path="destination-assignment" element={<DestinationAssignmentPage />} />
              <Route path="skill-assignment" element={<SkillAssignmentPage />} />
              <Route path="teams" element={<TeamManagementPage />} />
              <Route path="teams/:id" element={<TeamDetailPage />} />
              <Route path="follow-ups" element={<FollowUpMonitoringPage />} />
              <Route path="team" element={<TeamPerformancePage />} />
              <Route path="email-activity" element={<EmailActivityPage />} />
              <Route path="quotations/new" element={<ManagerQuotationBuilder />} />
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
              <Route path="email-activity" element={<EmailActivityPage />} />
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
              <Route path="leads/:filter" element={<LeaderTeamLeadsPage />} />
              <Route path="leads" element={<LeaderTeamLeadsPage />} />
              <Route path="follow-ups" element={<LeaderFollowUpsPage />} />
              <Route path="email-activity" element={<EmailActivityPage />} />
              <Route path="performance" element={<ExecutivePerformancePage />} />
              <Route path="escalations" element={<LeadEscalationsPage />} />
              <Route path="quotations/new" element={<LeaderQuotationBuilder />} />
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
                <ProtectedRoute allowedRoles={['operations_manager', 'admin']}>
                  <OperationsManagerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<OperationsDashboard />} />
              <Route path="bookings/:status" element={<BookingsListPage />} />
              <Route path="booking/:id" element={<BookingDetailPage />} />
              <Route path="trip-execution" element={<TripExecutionDashboard />} />
              <Route path="trips/active" element={<TripExecutionTripsPage mode="active" />} />
              <Route path="trips/upcoming" element={<TripExecutionTripsPage mode="upcoming" />} />
              <Route path="trips/completed" element={<TripExecutionTripsPage mode="completed" />} />
              <Route path="trip-tracker" element={<TripTrackerPage />} />
              <Route path="tasks" element={<OperationsTasksPage />} />
              <Route path="hotels" element={<OperationsHotelsPage />} />
              <Route path="transport" element={<OperationsTransportPage />} />
              <Route path="activities" element={<OperationsActivitiesPage />} />
              <Route path="vendors" element={<VendorsPage />} />
              <Route path="vendors/confirmations" element={<VendorConfirmationsPage />} />
              <Route path="vouchers" element={<VouchersPage />} />
              <Route path="vouchers/hotel" element={<VouchersPage typeFilter="hotel" />} />
              <Route path="vouchers/cab" element={<VouchersPage typeFilter="transport" />} />
              <Route path="vouchers/activity" element={<VouchersPage typeFilter="activity" />} />
              <Route path="vouchers/flight" element={<VouchersPage typeFilter="flight" />} />
              <Route path="vouchers/travel-kit" element={<VouchersPage typeFilter="travel_kit" />} />
              <Route path="operations/alerts" element={<OperationsAlertsPage />} />
              <Route path="operations/escalations" element={<OperationsAlertsPage />} />
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
              <Route path="leads/inbox/new" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/new-leads" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/hot" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/unassigned" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/assigned" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/converted" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/lost" element={<PermissionRoute module="leads"><Leads /></PermissionRoute>} />
              <Route path="leads/reactivated" element={<PermissionRoute module="leads"><ReactivatedLeadsPage /></PermissionRoute>} />
              <Route path="leads/analytics" element={<PermissionRoute module="leads"><LeadAnalytics /></PermissionRoute>} />
              <Route path="leads/sla" element={<PermissionRoute module="leads"><SlaMonitor /></PermissionRoute>} />
              <Route path="leads/recycle-bin" element={<PermissionRoute module="leads"><RecycleBin /></PermissionRoute>} />
              <Route path="leads/audit-log" element={<RoleRoute roles={['admin', 'sales_manager']}><LeadAuditLog /></RoleRoute>} />
              <Route path="leads/new" element={<PermissionRoute module="leads" action="create"><LeadForm /></PermissionRoute>} />
              <Route path="leads/:id/edit" element={<PermissionRoute module="leads" action="edit"><LeadForm /></PermissionRoute>} />
              <Route path="leads/:id" element={<PermissionRoute module="leads"><LeadDetail /></PermissionRoute>} />
              <Route path="followups" element={<PermissionRoute module="leads"><Followups /></PermissionRoute>} />
              <Route path="reminders" element={<PermissionRoute module="leads"><Reminders /></PermissionRoute>} />
              <Route path="whatsapp" element={<PermissionRoute module="leads"><WhatsAppLeads /></PermissionRoute>} />
              <Route path="email-activity" element={<PermissionRoute module="email" action="send"><EmailActivityPage /></PermissionRoute>} />
              <Route path="customers" element={<PermissionRoute module="customers"><ComingSoon title="Customers" description="Repeat customers and relationship management" /></PermissionRoute>} />
              <Route path="quotations/*" element={<PermissionRoute module="quotations"><Quotations /></PermissionRoute>} />
              <Route path="packages/*" element={<PermissionRoute module="packages"><Packages /></PermissionRoute>} />
              <Route path="team/attendance" element={<RoleRoute roles={['admin']}><AdminAttendancePage /></RoleRoute>} />
              <Route path="team/destination-assignment" element={<RoleRoute roles={['admin', 'sales_manager']}><DestinationAssignmentPage /></RoleRoute>} />
              <Route path="team/skill-assignment" element={<RoleRoute roles={['admin', 'sales_manager']}><SkillAssignmentPage /></RoleRoute>} />
              <Route path="team" element={<PermissionRoute module="users"><Team /></PermissionRoute>} />
              <Route path="team/users/:id" element={<PermissionRoute module="users"><TeamUserProfile /></PermissionRoute>} />
              <Route path="reports" element={<PermissionRoute module="reports"><Reports /></PermissionRoute>} />
              <Route path="payments/*" element={<RoleRoute roles={['admin', 'accountant']}><Payments /></RoleRoute>} />
              <Route path="calendar" element={<ComingSoon title="Calendar" description="Travel dates, follow-ups, and team schedule" />} />
              <Route path="notifications" element={<PermissionRoute module="leads"><Notifications /></PermissionRoute>} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/workspace" element={<RoleRoute roles={['admin']}><CompanyWorkspacePage /></RoleRoute>} />
              <Route path="settings/whatsapp-templates" element={<PermissionRoute module="whatsapp" action="manage"><WhatsAppTemplatesPage /></PermissionRoute>} />
              <Route path="settings/email-templates" element={<PermissionRoute module="email" action="manage"><EmailTemplatesPage /></PermissionRoute>} />
              <Route path="profile" element={<ComingSoon title="My Profile" description="Personal settings and performance" />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </NotificationProvider>
        </AuthProvider>
        </TenantGate>
        </TenantProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
