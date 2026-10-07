import React, { useState } from 'react';
import { Bell, ChevronDown, Menu, User, Settings, LogOut } from 'lucide-react';
import Avatar from '../common/Avatar';
import './CustomerHeader.css';

export const CustomerHeader = ({ 
  title = 'Home', 
  subtitle = "Welcome back, John! Here's your QueueLess dashboard.",
  userName = 'John Doe',
  userInitials = 'JD',
  onMenuToggle
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
        <div className="header-notification-wrap">
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

        {/* User Profile (Avatar circle, Name, Chevron - clean naked layout) */}
        <div className="header-profile-wrap">
          <button 
            type="button" 
            className="header-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
          >
            <div className="profile-avatar-circle">
              <span>{userInitials}</span>
            </div>
            <span className="profile-user-name">{userName}</span>
            <ChevronDown size={15} className={`profile-chevron-icon ${profileOpen ? 'open' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="header-dropdown-menu profile-dropdown">
              <div className="profile-dropdown-user-info">
                <span className="profile-dropdown-name">{userName}</span>
                <span className="profile-dropdown-role">Customer Account</span>
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
              <button type="button" className="dropdown-item text-danger">
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
