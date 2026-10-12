import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, Settings, LogOut } from 'lucide-react';
import authApi from '../../services/api/auth.api.js';
import tokenStorage from '../../services/storage/tokenStorage.js';
import './CustomerHeader.css';

export const CustomerHeader = ({ 
  title = 'Home', 
  subtitle,
  userName,
  userInitials,
  onMenuToggle
}) => {
  const navigate = useNavigate();
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
    <header className="customer-header">
      {/* Left: Title & Subtitle */}
      <div className="header-left">
        {onMenuToggle && (
          <button 
            type="button" 
            className="mobile-menu-btn" 
            onClick={onMenuToggle}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="header-title-block">
          <h1 className="header-page-title">{title}</h1>
          {subtitle && <p className="header-page-subtitle">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="header-right">
        {/* Notification Bell (naked outline icon with red dot) */}
        <div className="header-notification-wrap" ref={notificationRef}>
          <button 
            type="button" 
            className="header-bell-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notifications"
          >
            <Bell size={21} className="header-bell-icon" />
            <span className="header-bell-dot" />
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="header-dropdown-menu notification-popover">
              <div className="dropdown-header">
                <span className="dropdown-title">Notifications</span>
                <span className="dropdown-badge">1 New</span>
              </div>
              <div className="notification-item unread">
                <p className="notification-text">Your appointment for General Consultation is confirmed for 26 Sep.</p>
                <span className="notification-time">10 mins ago</span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile (Avatar circle only in header, name and details inside dropdown) */}
        <div className="header-profile-wrap" ref={profileRef}>
          <button 
            type="button" 
            className="header-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-label={`User menu for ${userName}`}
          >
            <div className="profile-avatar-circle">
              <span>{userInitials}</span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="header-dropdown-menu profile-dropdown">
              <div className="profile-dropdown-user-info">
                {/* <div className="profile-dropdown-avatar">
                  <span>{userInitials}</span>
                </div> */}
                <div className="profile-dropdown-text">
                  <span className="profile-dropdown-name">{userName}</span>
                  <span className="profile-dropdown-role">Customer Account</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button type="button" className="dropdown-item">
                <User size={15} />
                <span>My Profile</span>
              </button>
              <button type="button" className="dropdown-item">
                <Settings size={15} />
                <span>Account Settings</span>
              </button>
              <div className="dropdown-divider" />
              <button type="button" className="dropdown-item text-danger" onClick={handleLogout}>
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

export default CustomerHeader;
