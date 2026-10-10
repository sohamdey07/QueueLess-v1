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

import UnderDevelopment from '../pages/customer/UnderDevelopment';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginScreen initialTab="login" />} />
      <Route path="/register" element={<LoginScreen initialTab="register" />} />
      <Route path="/verify-otp" element={<OtpVerificationScreen />} />
      <Route path="/verify-account" element={<Navigate to="/verify-otp" replace />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />

      {/* Onboarding Screen Route (on mobile screen, onboarding screens will not appear, direct login screen will appear) */}
      <Route
        path="/onboarding"
        element={
          typeof window !== 'undefined' && window.innerWidth <= 768 ? (
            <Navigate to="/login" replace />
          ) : (
            <OnboardingScreen />
          )
        }
      />

      {/* Default entry point: Mobile goes directly to Login, Desktop goes to Onboarding */}
      <Route
        path="/"
        element={
          <Navigate
            to={typeof window !== 'undefined' && window.innerWidth <= 768 ? '/login' : '/onboarding'}
            replace
          />
        }
      />

      {/* Standalone Fullscreen TV Display Screen */}
      <Route path="tv-display" element={<TvDisplay />} />

      {/* Staff Portal Management Routes */}
      <Route path="/staff" element={<StaffLayout />}>
        <Route index element={<StaffDashboard />} />
        <Route path="dashboard" element={<StaffDashboard />} />
      </Route>
      <Route path="/staff-portal" element={<Navigate to="/staff" replace />} />

      {/* Admin Portal Management Routes */}
      <Route path="/admin" element={<AdminLayout />}>
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

      {/* Main Customer Layout with routes */}
      <Route element={<CustomerLayout />}>
        <Route path="home" element={<CustomerHome />} />
        <Route path="book-appointment" element={<BookAppointment />} />
        <Route path="join-queue" element={<JoinQueue />} />
        <Route path="virtual-queue" element={<VirtualQueue />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="appointment-history" element={<AppointmentHistory />} />
        {/* Pages which are not available show Under Development */}
        <Route path="*" element={<UnderDevelopment />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
