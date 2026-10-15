import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(userName);

  const profileRef = useRef(null);

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
              aria-label="Open sidebar menu"
            >
              <span className="modern-hamburger-icon" aria-hidden="true">
                <span className="hamburger-bar bar-top" />
                <span className="hamburger-bar bar-middle" />
                <span className="hamburger-bar bar-bottom" />
              </span>
            </button>
          )}
          <div className="header-title-block">
            <h1 className="header-page-title">{title}</h1>
            {subtitle && <p className="header-page-subtitle">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Profile */}
        <div className="header-right">
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
