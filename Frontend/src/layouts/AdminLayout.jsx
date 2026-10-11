import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/layout/AdminSidebar';
import AdminHeader from '../components/admin/layout/AdminHeader';
import './AdminLayout.css';

const adminRouteHeaders = {
  '/admin': {
    title: 'Dashboard',
    subtitle: 'Monitor clinic operations, manage queues, and track service analytics.',
  },
  '/admin/dashboard': {
    title: 'Dashboard',
    subtitle: 'Monitor clinic operations, manage queues, and track service analytics.',
  },
  '/admin/options': {
    title: 'Dashboard',
    subtitle: 'Monitor clinic operations, manage queues, and track service analytics.',
  },
  '/admin/service': {
    title: 'Service',
    subtitle: 'Configure clinic services, pricing, durations, and active status.',
  },
  '/admin/service-management': {
    title: 'Service',
    subtitle: 'Configure clinic services, pricing, durations, and active status.',
  },
  '/admin/availability': {
    title: 'Availability',
    subtitle: 'Set service operating hours, slot intervals, and capacity limits.',
  },
  '/admin/availability-management': {
    title: 'Availability',
    subtitle: 'Set service operating hours, slot intervals, and capacity limits.',
  },
  '/admin/counter': {
    title: 'Counter',
    subtitle: 'Configure service desks, booths, and live counter assignments.',
  },
  '/admin/counter-management': {
    title: 'Counter',
    subtitle: 'Configure service desks, booths, and live counter assignments.',
  },
  '/admin/staff': {
    title: 'Manage Users',
    subtitle: 'Manage staff accounts, assign counters, and monitor attendance.',
  },
  '/admin/staff-management': {
    title: 'Manage Users',
    subtitle: 'Manage staff accounts, assign counters, and monitor attendance.',
  },
  '/admin/manage-users': {
    title: 'Manage Users',
    subtitle: 'Manage staff accounts, assign counters, and monitor attendance.',
  },
  '/admin/queue-logs': {
    title: 'Queue Logs',
    subtitle: 'Inspect detailed queue transitions, wait times, and audit logs.',
  },
  '/admin/queue-log': {
    title: 'Queue Logs',
    subtitle: 'Inspect detailed queue transitions, wait times, and audit logs.',
  },
};

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentMeta = adminRouteHeaders[location.pathname] || {
    title: 'Admin Portal',
    subtitle: 'Manage system settings and operations.',
  };

  return (
    <div className="admin-layout-container">
      {/* Sidebar with route-driven active state */}
      <AdminSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="admin-layout-main">
        {/* Top Sticky Header */}
        <AdminHeader 
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Dynamic Page Content */}
        <main className="admin-layout-body">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
