import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/api/query-client';
import { AuthProvider, useAuth } from './features/authentication/context/AuthContext';
import DashboardLayout from './shared/components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import ConfirmPasswordReset from './pages/ConfirmPasswordReset';
import RequestPasswordReset from './pages/RequestPasswordReset';
import VerifyEmail from './pages/VerifyEmail';
import AcceptInvitation from './pages/AcceptInvitation';
import Apply from './pages/Apply';
import Overview from './pages/dashboard/Overview';
import Programs from './pages/dashboard/Programs';
import Cohorts from './pages/dashboard/Cohorts';
import Applications from './pages/dashboard/Applications';
import Assignments from './pages/dashboard/Assignments';
import Weeks from './pages/dashboard/Weeks';
import Announcements from './pages/dashboard/Announcements';
import Settings from './pages/dashboard/Settings';
import Profile from './pages/dashboard/Profile';

import { Loader2 } from 'lucide-react';

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
            <Route path="/apply" element={<Apply />} />
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
              path="/dashboard/weeks" 
              element={
                <ProtectedRoute>
                  <Weeks />
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
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
