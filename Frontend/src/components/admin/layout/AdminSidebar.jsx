import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  CalendarClock, 
  Store, 
  Users, 
  ClipboardList, 
  X 
} from 'lucide-react';
import logoImg from '../../../assets/images/logo/logo.png';
import './AdminSidebar.css';

const adminNavItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
  },
  {
    id: 'service',
    label: 'Service',
    icon: Layers,
    path: '/admin/service',
  },
  {
    id: 'availability',
    label: 'Availability',
    icon: CalendarClock,
    path: '/admin/availability',
  },
  {
    id: 'counter',
    label: 'Counter',
    icon: Store,
    path: '/admin/counter',
  },
  {
    id: 'staff',
    label: 'Manage users',
    icon: Users,
    path: '/admin/staff',
  },
  {
    id: 'queue-logs',
    label: 'Queue Logs',
    icon: ClipboardList,
    path: '/admin/queue-logs',
  },
];

export const AdminSidebar = ({ 
  isOpen = false,
  onClose
}) => {
  const location = useLocation();

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = (originalOverflow && originalOverflow !== 'hidden') ? originalOverflow : '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Top Logo Section matching Customer Portal Header */}
        <div className="admin-sidebar-logo-header">
          <Link to="/admin/dashboard" className="admin-sidebar-brand-link" onClick={onClose}>
            <img 
              src={logoImg} 
              alt="QueueLess Logo" 
              className="admin-sidebar-brand-logo" 
            />
            <div className="admin-sidebar-brand-text">
              <span className="brand-queue">Queue</span>
              <span className="brand-less">Less</span>
            </div>
          </Link>
          <button 
            type="button" 
            className="admin-sidebar-close-btn" 
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="admin-sidebar-nav">
          <ul className="admin-sidebar-nav-list">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = 
                location.pathname === item.path || 
                (item.id === 'dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/options')) ||
                (item.id === 'service' && location.pathname === '/admin/service-management') ||
                (item.id === 'availability' && location.pathname === '/admin/availability-management') ||
                (item.id === 'counter' && location.pathname === '/admin/counter-management') ||
                (item.id === 'staff' && (location.pathname === '/admin/staff-management' || location.pathname === '/admin/manage-users'));

              return (
                <li key={item.id} className="admin-sidebar-nav-item">
                  <Link
                    to={item.path}
                    className={`admin-sidebar-nav-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Icon className="admin-sidebar-nav-icon" size={19} />
                    <span className="admin-sidebar-nav-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Logo & Version */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-footer-brand">
            <img 
              src={logoImg} 
              alt="QueueLess" 
              className="admin-sidebar-footer-logo" 
            />
            <div className="admin-sidebar-footer-info">
              <span className="admin-sidebar-footer-title">
                <span className="brand-queue">Queue</span>
                <span className="brand-less">Less</span>
              </span>
              <span className="admin-sidebar-footer-version">Admin Portal v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
