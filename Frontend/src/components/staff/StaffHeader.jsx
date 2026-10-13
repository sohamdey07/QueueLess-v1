import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogOut, ShieldCheck, User, Settings, Maximize, Minimize } from 'lucide-react';
import authApi from '../../services/api/auth.api.js';
import tokenStorage from '../../services/storage/tokenStorage.js';
import logoImg from '../../assets/images/logo/logo.png';
import CommonAvatar from '../common/CommonAvatar';
import ProfileModal from '../common/ProfileModal';
import SettingsModal from '../common/SettingsModal';
import UserMenuDropdown from '../common/UserMenuDropdown';
import './StaffHeader.css';

export const StaffHeader = ({
  staffName,
  staffFullName,
  counterName = 'Counter 2',
  role = 'Queue Manager'
}) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => tokenStorage.getUser());

  const activeStaffFullName = currentUser?.name || staffFullName || 'Staff Member';
  const activeStaffName = currentUser?.name ? currentUser.name.split(' ')[0] : (staffName || 'Staff');

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      tokenStorage.clearAuth();
    }
    navigate('/login', { replace: true });
  };

  const handleProfileUpdated = useCallback((updatedData) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedData
    }));
  }, []);

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formats date matching: "Wed, 8 Oct 2026"
  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  };

  // Formats time matching: "10:24 AM"
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <>
      <header className="staff-header">
        {/* Left: Brand Logo & Name matching customer portal */}
        <div className="staff-header-left">
          <div className="staff-brand-container">
            <img 
              src={logoImg} 
              alt="QueueLess Logo" 
              className="staff-header-logo" 
            />
            <div className="staff-brand-text">
              <span className="brand-queue">Queue</span>
              <span className="brand-less">Less</span>
            </div>
          </div>
        </div>

        {/* Right: Date, Time & Profile */}
        <div className="staff-header-right">
          {/* Calendar & Time Widget */}
          <div className="staff-datetime-widget">
            <div className="staff-datetime-icon-wrap">
              <Calendar size={20} className="staff-datetime-icon" />
            </div>
            <div className="staff-datetime-info">
              <span className="staff-date-text">{formatDate(currentTime)}</span>
              <span className="staff-time-text">{formatTime(currentTime)}</span>
            </div>
          </div>

          {/* Fullscreen Button matching TV Display */}
          <button
            type="button"
            className="staff-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* Subtle Vertical Divider */}
          <div className="staff-header-divider" />

          {/* Staff Profile Avatar */}
          <div className="staff-profile-wrap" ref={profileRef}>
            <button 
              type="button" 
              className="staff-avatar-btn"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-expanded={profileOpen}
              aria-label={`Staff profile for ${activeStaffName}`}
            >
              <CommonAvatar 
                size={42} 
                showRing={true} 
                showStatusDot={true} 
                isActive={true} 
                alt={`Avatar for ${activeStaffName}`} 
              />
            </button>

            {/* Universal User Dropdown */}
            <UserMenuDropdown
              isOpen={profileOpen}
              userName={activeStaffFullName}
              userRole={role}
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
        roleLabel={role}
      />

      {/* Account Settings / Change Password Pop-up Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
      />
    </>
  );
};

export default StaffHeader;
