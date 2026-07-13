import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/api/query-client';
import { AuthProvider, useAuth } from './features/authentication/context/AuthContext';
import DashboardLayout from './shared/components/layout/DashboardLayout';

const Login = React.lazy(() => import('./pages/Login'));
const ConfirmPasswordReset = React.lazy(() => import('./pages/ConfirmPasswordReset'));
const RequestPasswordReset = React.lazy(() => import('./pages/RequestPasswordReset'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const AcceptInvitation = React.lazy(() => import('./pages/AcceptInvitation'));
const Signup = React.lazy(() => import('./pages/Signup'));
const Overview = React.lazy(() => import('./pages/dashboard/Overview'));
const Programs = React.lazy(() => import('./pages/dashboard/Programs'));
const Cohorts = React.lazy(() => import('./pages/dashboard/Cohorts'));
const Applications = React.lazy(() => import('./pages/dashboard/Applications'));
const Assignments = React.lazy(() => import('./pages/dashboard/Assignments'));
const Modules = React.lazy(() => import('./pages/dashboard/Weeks'));
const Announcements = React.lazy(() => import('./pages/dashboard/Announcements'));
const Settings = React.lazy(() => import('./pages/dashboard/Settings'));
const Profile = React.lazy(() => import('./pages/dashboard/Profile'));

import { Loader2 } from 'lucide-react';

function RouteFallback() {
  return (
    <div className="min-h-screen skx-grid-bg flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 text-[#141414] animate-spin" />
      <p className="skx-page-label">Loading workspace...</p>
    </div>
  );
}

// Guard for protected dashboards
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen skx-grid-bg flex flex-col items-center justify-center space-y-4" id="app-auth-loading">
        <Loader2 className="w-10 h-10 text-[#141414] animate-spin" />
        <p className="skx-page-label">Authorizing session credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

// Guard for public auth gates
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen skx-grid-bg flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#141414] animate-spin" />
        <p className="skx-page-label">Syncing workspace tokens...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public route */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route path="/reset-password" element={<RequestPasswordReset />} />
            <Route path="/reset-password/confirm" element={<ConfirmPasswordReset />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/apply" element={<Navigate to="/signup" replace />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />

            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Overview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/programs" 
              element={
                <ProtectedRoute>
                  <Programs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/cohorts" 
              element={
                <ProtectedRoute>
                  <Cohorts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/applications" 
              element={
                <ProtectedRoute>
                  <Applications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/assignments" 
              element={
                <ProtectedRoute>
                  <Assignments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/modules" 
              element={
                <ProtectedRoute>
                  <Modules />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/announcements" 
              element={
                <ProtectedRoute>
                  <Announcements />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
