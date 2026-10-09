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
import AdminManageUsers from '../pages/admin/AdminManageUsers';
import AdminQueueLogs from '../pages/admin/AdminQueueLogs';

import UnderDevelopment from '../pages/customer/UnderDevelopment';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Default redirect to /home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

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
        <Route path="counter" element={<UnderDevelopment />} />
        <Route path="counter-management" element={<UnderDevelopment />} />
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
