import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import CustomerHome from '../pages/customer/CustomerHome';
import BookAppointment from '../pages/customer/BookAppointment';
import JoinQueue from '../pages/customer/JoinQueue';
import VirtualQueue from '../pages/customer/VirtualQueue';
import MyBookings from '../pages/customer/MyBookings';
import AppointmentHistory from '../pages/customer/AppointmentHistory';
import TvDisplay from '../pages/display/TvDisplay';
import StaffLayout from '../layouts/StaffLayout';
import StaffDashboard from '../pages/staff/StaffDashboard';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminServices from '../pages/admin/AdminServices';
import AdminAvailability from '../pages/admin/AdminAvailability';
import AdminCounter from '../pages/admin/AdminCounter';
import AdminManageUsers from '../pages/admin/AdminManageUsers';
import AdminQueueLogs from '../pages/admin/AdminQueueLogs';
import OnboardingScreen from '../pages/onboarding/OnboardingScreen';
import LoginScreen from '../pages/auth/LoginScreen';
import OtpVerificationScreen from '../pages/auth/OtpVerificationScreen';
import ForgotPasswordScreen from '../pages/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../pages/auth/ResetPasswordScreen';

import UnderDevelopment from '../pages/customer/UnderDevelopment';
import { ProtectedRoute, PublicOnlyRoute, getDestinationForRole } from './ProtectedRoute';
import tokenStorage from '../services/storage/tokenStorage';

const extractResetToken = () => {
  if (typeof window === 'undefined') return null;
  const pathMatch = window.location.pathname.match(/\/reset-password\/([^/?#]+)/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1];
  const hashMatch = window.location.hash.match(/\/reset-password\/([^/?#]+)/i);
  if (hashMatch && hashMatch[1]) return hashMatch[1];
  return null;
};

const RootRedirect = () => {
  const token = extractResetToken();
  if (token) {
    return <Navigate to={`/reset-password/${token}`} replace />;
  }

  const isAuth = tokenStorage.isAuthenticated();
  if (isAuth) {
    const role = tokenStorage.getUserRole();
    return <Navigate to={getDestinationForRole(role)} replace />;
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  return <Navigate to={isMobile ? '/login' : '/onboarding'} replace />;
};

const OnboardingRoute = () => {
  const token = extractResetToken();
  if (token) {
    return <Navigate to={`/reset-password/${token}`} replace />;
  }

  const isAuth = tokenStorage.isAuthenticated();
  if (isAuth) {
    const role = tokenStorage.getUserRole();
    return <Navigate to={getDestinationForRole(role)} replace />;
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  if (isMobile) {
    return <Navigate to="/login" replace />;
  }

  return <OnboardingScreen />;
};

const ResetPasswordRouteWrapper = () => {
  const token = extractResetToken();
  if (token) {
    return (
      <PublicOnlyRoute>
        <ResetPasswordScreen />
      </PublicOnlyRoute>
    );
  }
  return <Navigate to="/forgot-password" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes (Only accessible when not logged in) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginScreen initialTab="login" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <LoginScreen initialTab="register" />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordScreen />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <PublicOnlyRoute>
            <ResetPasswordScreen />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/reset-password/:resetToken"
        element={
          <PublicOnlyRoute>
            <ResetPasswordScreen />
          </PublicOnlyRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordRouteWrapper />} />
      <Route path="/verify-otp" element={<OtpVerificationScreen />} />
      <Route path="/verify-account" element={<Navigate to="/verify-otp" replace />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />

      {/* Onboarding Screen Route */}
      <Route path="/onboarding" element={<OnboardingRoute />} />

      {/* Default entry point */}
      <Route path="/" element={<RootRedirect />} />

      {/* Standalone Fullscreen TV Display Screen */}
      <Route path="tv-display" element={<TvDisplay />} />

      {/* Staff Portal Management Routes (strictly STAFF only) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['STAFF']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffDashboard />} />
        <Route path="dashboard" element={<StaffDashboard />} />
      </Route>
      <Route path="/staff-portal" element={<Navigate to="/staff" replace />} />

      {/* Admin Portal Management Routes (strictly ADMIN only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="options" element={<AdminDashboard />} />
        <Route path="service" element={<AdminServices />} />
        <Route path="service-management" element={<AdminServices />} />
        <Route path="availability" element={<AdminAvailability />} />
        <Route path="availability-management" element={<AdminAvailability />} />
        <Route path="counter" element={<AdminCounter />} />
        <Route path="counter-management" element={<AdminCounter />} />
        <Route path="staff" element={<AdminManageUsers />} />
        <Route path="staff-management" element={<AdminManageUsers />} />
        <Route path="manage-users" element={<AdminManageUsers />} />
        <Route path="users" element={<AdminManageUsers />} />
        <Route path="queue-logs" element={<AdminQueueLogs />} />
        <Route path="queue-log" element={<AdminQueueLogs />} />
        <Route path="*" element={<UnderDevelopment />} />
      </Route>
      <Route path="/admin-portal" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Main Customer Layout with routes (strictly CUSTOMER only) */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<CustomerHome />} />
        <Route path="book-appointment" element={<BookAppointment />} />
        <Route path="join-queue" element={<JoinQueue />} />
        <Route path="virtual-queue" element={<VirtualQueue />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="appointment-history" element={<AppointmentHistory />} />
      </Route>

      {/* Fallback for any other unmatched URL */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
