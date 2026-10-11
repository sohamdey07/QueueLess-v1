import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, Settings, LogOut, ShieldCheck } from 'lucide-react';
import authApi from '../../../services/api/auth.api.js';
import tokenStorage from '../../../services/storage/tokenStorage.js';
import './AdminHeader.css';

export const AdminHeader = ({ 
  title = 'Dashboard', 
  subtitle = 'Manage services, counters, staff, and real-time queues.',
  userName,
  userInitials,
  onMenuToggle
}) => {
  const navigate = useNavigate();
  const currentUser = tokenStorage.getUser();
  const activeAdminName = userName || currentUser?.name || 'Admin User';
  const activeAdminInitials =
    userInitials ||
    (currentUser?.name
      ? currentUser.name
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'AU');

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      tokenStorage.clearAuth();
    }
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="admin-header">
      {/* Left: Mobile Toggle, Title & Subtitle */}
      <div className="admin-header-left">
        {onMenuToggle && (
          <button 
            type="button" 
            className="admin-mobile-menu-btn" 
            onClick={onMenuToggle}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="admin-header-title-block">
          <h1 className="admin-header-page-title">{title}</h1>
          {subtitle && <p className="admin-header-page-subtitle">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="admin-header-right">
        {/* Notification Bell */}
        <div className="admin-header-notification-wrap" ref={notificationRef}>
          <button 
            type="button" 
            className="admin-header-bell-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Admin Notifications"
          >
            <Bell size={21} className="admin-header-bell-icon" />
            <span className="admin-header-bell-dot" />
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="admin-header-dropdown-menu admin-notification-popover">
              <div className="admin-dropdown-header">
                <span className="admin-dropdown-title">System Alerts</span>
                <span className="admin-dropdown-badge">2 New</span>
              </div>
              <div className="admin-notification-item unread">
                <p className="admin-notification-text">General Consultation has reached 80% daily capacity.</p>
                <span className="admin-notification-time">15 mins ago</span>
              </div>
              <div className="admin-notification-item unread" style={{ marginTop: '6px' }}>
                <p className="admin-notification-text">Counter 3 was assigned to Sarah Jenkins.</p>
                <span className="admin-notification-time">45 mins ago</span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Popover */}
        <div className="admin-header-profile-wrap" ref={profileRef}>
          <button 
            type="button" 
            className="admin-header-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-label={`Admin user menu for ${activeAdminName}`}
          >
            <div className="admin-profile-avatar-circle">
              <span>{activeAdminInitials}</span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="admin-header-dropdown-menu admin-profile-dropdown">
              <div className="admin-profile-dropdown-user-info">
                <div className="admin-profile-dropdown-text">
                  <div className="admin-profile-name-row">
                    <span className="admin-profile-dropdown-name">{activeAdminName}</span>
                    <ShieldCheck size={14} className="admin-shield-icon" />
                  </div>
                  <span className="admin-profile-dropdown-role">System Administrator</span>
                </div>
              </div>
              <div className="admin-dropdown-divider" />
              <button type="button" className="admin-dropdown-item">
                <User size={15} />
                <span>Admin Profile</span>
              </button>
              <button type="button" className="admin-dropdown-item">
                <Settings size={15} />
                <span>System Settings</span>
              </button>
              <div className="admin-dropdown-divider" />
              <button type="button" className="admin-dropdown-item text-danger" onClick={handleLogout}>
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
