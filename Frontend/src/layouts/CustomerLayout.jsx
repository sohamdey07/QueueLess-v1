import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CustomerSidebar from '../components/layout/CustomerSidebar';
import CustomerHeader from '../components/layout/CustomerHeader';
import './CustomerLayout.css';

const routeHeaders = {
  '/home': {
    title: 'Home',
    subtitle: "Welcome back, John! Here's your QueueLess dashboard.",
  },
  '/book-appointment': {
    title: 'Book Appointment',
    subtitle: 'Schedule your clinic visit and choose preferred time slots.',
  },
  '/join-queue': {
    title: 'Join Queue',
    subtitle: 'Already at the venue? Join the virtual queue and skip the line.',
  },
  '/virtual-queue': {
    title: 'Virtual Queue',
    subtitle: 'Track your real-time position and estimated wait time.',
  },
  '/my-bookings': {
    title: 'My Bookings',
    subtitle: 'View and manage your upcoming appointments and queue status.',
  },
  '/appointment-history': {
    title: 'Appointment History',
    subtitle: 'Review your completed and cancelled visits.',
  },
};

export const CustomerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentMeta = routeHeaders[location.pathname] || (
    location.pathname === '/' || location.pathname === ''
      ? routeHeaders['/home']
      : {
          title: 'Under Development',
          subtitle: 'This page is currently under development and will be available soon.',
        }
  );

  return (
    <div className="customer-layout-container">
      {/* Sidebar with route-driven active state */}
      <CustomerSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="customer-layout-main">
        {/* Top Sticky Header */}
        <CustomerHeader 
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          userName="John Doe"
          userInitials="JD"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Dynamic Page Content */}
        <main className="customer-layout-body">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
