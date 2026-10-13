import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, Settings, LogOut } from 'lucide-react';
import authApi from '../../services/api/auth.api.js';
import tokenStorage from '../../services/storage/tokenStorage.js';
import CommonAvatar from '../common/CommonAvatar';
import ProfileModal from '../common/ProfileModal';
import SettingsModal from '../common/SettingsModal';
import UserMenuDropdown from '../common/UserMenuDropdown';
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(userName);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const handleCloseProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const handleCloseSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  useEffect(() => {
    if (userName) setDisplayName(userName);
  }, [userName]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      tokenStorage.clearAuth();
    }
    navigate('/login', { replace: true });
  };

  const handleProfileUpdated = useCallback((updatedData) => {
    if (updatedData?.name) {
      setDisplayName(updatedData.name);
    }
  }, []);

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
    <>
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

          {/* User Profile Avatar */}
          <div className="header-profile-wrap" ref={profileRef}>
            <button 
              type="button" 
              className="header-profile-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-expanded={profileOpen}
              aria-label={`User menu for ${displayName}`}
            >
              <CommonAvatar 
                size={42} 
                showRing={true} 
                showStatusDot={true} 
                isActive={true} 
                alt={`Avatar for ${displayName}`} 
              />
            </button>

            {/* Universal User Dropdown */}
            <UserMenuDropdown
              isOpen={profileOpen}
              userName={displayName || 'Customer'}
              userRole="Customer"
              isActive={true}
              onManageAccount={() => {
                setProfileOpen(false);
                setIsProfileModalOpen(true);
              }}
              onChangePassword={() => {
                setProfileOpen(false);
                setIsSettingsModalOpen(true);
              }}
              onSignOut={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* Profile Details Pop-up Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        onProfileUpdated={handleProfileUpdated}
        roleLabel="Customer"
      />

      {/* Account Settings / Change Password Pop-up Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
      />
    </>
  );
};

export default CustomerHeader;
