import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import CustomerHome from '../pages/customer/CustomerHome';
import BookAppointment from '../pages/customer/BookAppointment';
import JoinQueue from '../pages/customer/JoinQueue';
import MyBookings from '../pages/customer/MyBookings';
import AppointmentHistory from '../pages/customer/AppointmentHistory';

import UnderDevelopment from '../pages/customer/UnderDevelopment';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Default redirect to /home */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Main Customer Layout with routes */}
      <Route element={<CustomerLayout />}>
        <Route path="home" element={<CustomerHome />} />
        <Route path="book-appointment" element={<BookAppointment />} />
        <Route path="join-queue" element={<JoinQueue />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="appointment-history" element={<AppointmentHistory />} />
        {/* Pages which are not available show Under Development */}
        <Route path="*" element={<UnderDevelopment />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
