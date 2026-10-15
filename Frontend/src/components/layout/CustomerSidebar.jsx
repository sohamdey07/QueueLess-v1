import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarPlus, Users, CalendarCheck, X } from 'lucide-react';
import logoImg from '../../assets/images/logo/logo.png';
import './CustomerSidebar.css';

const navItems = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/home',
  },
  {
    id: 'book-appointment',
    label: 'Book Appointment',
    icon: CalendarPlus,
    path: '/book-appointment',
  },
  {
    id: 'join-queue',
    label: 'Join Queue',
    icon: Users,
    path: '/join-queue',
  },
  {
    id: 'my-bookings',
    label: 'My Bookings',
    icon: CalendarCheck,
    path: '/my-bookings',
  },
];

export const CustomerSidebar = ({ 
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
          className="customer-sidebar-backdrop" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`customer-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Top Logo Section with bottom border separation matching header */}
        <div className="sidebar-logo-header">
          <Link to="/home" className="sidebar-brand-link" onClick={onClose}>
            <img 
              src={logoImg} 
              alt="QueueLess Logo" 
              className="sidebar-brand-logo" 
            />
            <div className="sidebar-brand-text">
              <span className="brand-queue">Queue</span>
              <span className="brand-less">Less</span>
            </div>
          </Link>
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <ul className="sidebar-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = 
                location.pathname === item.path || 
                (item.path === '/home' && (location.pathname === '/' || location.pathname === '')) ||
                (item.id === 'join-queue' && location.pathname === '/virtual-queue') ||
                (item.id === 'my-bookings' && location.pathname === '/appointment-history');

              return (
                <li key={item.id} className="sidebar-nav-item">
                  <Link
                    to={item.path}
                    className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Icon className="sidebar-nav-icon" size={19} />
                    <span className="sidebar-nav-label">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Logo & Version */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-brand">
            <img 
              src={logoImg} 
              alt="QueueLess" 
              className="sidebar-footer-logo" 
            />
            <div className="sidebar-footer-info">
              <span className="sidebar-footer-title">
                <span className="brand-queue">Queue</span>
                <span className="brand-less">Less</span>
              </span>
              <span className="sidebar-footer-version">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default CustomerSidebar;
