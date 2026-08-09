import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { TenantGate, TenantProvider } from '../src/context/TenantContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { ToastProvider } from '../src/context/ToastContext';
import TaskLogin from './TaskLogin';
import TaskShell from './TaskShell';
import AcceptInvitePage from './AcceptInvitePage';
import { fetchMyWorkAccess } from './api/workApi';

function WorkAccessGate({ children }) {
  const accessQuery = useQuery({
    queryKey: ['work-access-me'],
    queryFn: fetchMyWorkAccess,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (accessQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app"><div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" /></div>;
  }

  if (accessQuery.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-app p-5">
        <div className="max-w-md rounded-2xl border border-subtle bg-surface p-7 text-center">
          <h1 className="text-xl font-bold text-content-primary">WorkFlow Hub access unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-content-secondary">
            {accessQuery.error?.response?.data?.message || 'Your account cannot access this product. Contact your administrator.'}
          </p>
          <a href="/app/" className="mt-5 inline-flex rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold text-content-primary">Return to CRM</a>
        </div>
      </main>
    );
  }

  return children;
}

function TaskProtectedRoute({ children }) {
  const { user, loading, getCurrentUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-app">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!(user || getCurrentUser())) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default function TaskApp() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <TenantProvider>
            <TenantGate>
              <AuthProvider>
                <NotificationProvider>
                  <Routes>
                    <Route path="/login" element={<TaskLogin />} />
                    <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
                    <Route
                      path="/*"
                      element={
                        <TaskProtectedRoute>
                          <WorkAccessGate>
                            <TaskShell />
                          </WorkAccessGate>
                        </TaskProtectedRoute>
                      }
                    />
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
