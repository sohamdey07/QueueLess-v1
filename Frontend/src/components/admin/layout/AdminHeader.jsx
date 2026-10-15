import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../../../services/api/auth.api.js';
import tokenStorage from '../../../services/storage/tokenStorage.js';
import CommonAvatar from '../../common/CommonAvatar';
import ProfileModal from '../../common/ProfileModal';
import SettingsModal from '../../common/SettingsModal';
import UserMenuDropdown from '../../common/UserMenuDropdown';
import './AdminHeader.css';

export const AdminHeader = ({ 
  title = 'Dashboard', 
  subtitle = 'Manage services, counters, staff, and real-time queues.',
  userName,
  userInitials,
  onMenuToggle
}) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => tokenStorage.getUser());
  const activeAdminName = currentUser?.name || userName || 'Admin User';
  const activeAdminInitials =
    userInitials ||
    (activeAdminName
      ? activeAdminName
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'AU');

  const [profileOpen, setProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const profileRef = useRef(null);

  const handleCloseProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const handleCloseSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  const handleProfileUpdated = useCallback((updatedData) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedData
    }));
  }, []);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="admin-header">
      {/* Left: Mobile Toggle, Title & Subtitle */}
      <div className="admin-header-left">
        {onMenuToggle && (
          <button 
            type="button" 
            className="admin-mobile-menu-btn" 
            onClick={onMenuToggle}
            aria-label="Open sidebar menu"
          >
            <span className="modern-hamburger-icon" aria-hidden="true">
              <span className="hamburger-bar bar-top" />
              <span className="hamburger-bar bar-middle" />
              <span className="hamburger-bar bar-bottom" />
            </span>
          </button>
        )}
        <div className="admin-header-title-block">
          <h1 className="admin-header-page-title">{title}</h1>
          {subtitle && <p className="admin-header-page-subtitle">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Profile */}
      <div className="admin-header-right">
        {/* User Profile Avatar with Popover */}
        <div className="admin-header-profile-wrap" ref={profileRef}>
          <button 
            type="button" 
            className="admin-header-profile-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-label={`Admin user menu for ${activeAdminName}`}
          >
            <CommonAvatar 
              size={42} 
              showRing={true} 
              showStatusDot={true} 
              isActive={true} 
              alt={`Avatar for ${activeAdminName}`} 
            />
          </button>

          {/* Universal User Dropdown */}
          <UserMenuDropdown
            isOpen={profileOpen}
            userName={activeAdminName}
            userRole="System Administrator"
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

    {/* Admin Profile Modal */}
    <ProfileModal
      isOpen={isProfileModalOpen}
      onClose={handleCloseProfileModal}
      onProfileUpdated={handleProfileUpdated}
      roleLabel="System Administrator"
    />

    {/* Admin Settings Modal */}
    <SettingsModal
      isOpen={isSettingsModalOpen}
      onClose={handleCloseSettingsModal}
    />
  </>
  );
};

export default AdminHeader;
