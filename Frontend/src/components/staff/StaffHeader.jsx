import React, { useState, useEffect, useRef } from 'react';
import { Calendar, User, LogOut, ShieldCheck, ChevronDown, Bell } from 'lucide-react';
import logoImg from '../../assets/images/logo/logo.png';
import './StaffHeader.css';

export const StaffHeader = ({
  staffName = 'Arindam',
  staffFullName = 'Arindam Mukherjee',
  counterName = 'Counter 2',
  role = 'Queue Manager / Staff'
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

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

  return (
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

        {/* Subtle Vertical Divider */}
        <div className="staff-header-divider" />

        {/* Staff Profile Avatar */}
        <div className="staff-profile-wrap" ref={profileRef}>
          <button 
            type="button" 
            className="staff-avatar-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-label={`Staff profile for ${staffName}`}
          >
            <div className="staff-avatar-circle">
              <span>{staffName.charAt(0).toUpperCase()}</span>
            </div>
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="staff-profile-dropdown">
              <div className="staff-profile-header">
                <div className="staff-dropdown-avatar">
                  <span>{staffName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="staff-dropdown-details">
                  <span className="staff-dropdown-name">{staffFullName}</span>
                  <span className="staff-dropdown-counter">{counterName} • Active</span>
                  <span className="staff-dropdown-role">{role}</span>
                </div>
              </div>
              <div className="staff-dropdown-divider" />
              <div className="staff-dropdown-item">
                <ShieldCheck size={16} />
                <span>Duty Mode: Active</span>
              </div>
              <div className="staff-dropdown-divider" />
              <button 
                type="button" 
                className="staff-dropdown-item staff-logout-item"
                onClick={() => setProfileOpen(false)}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;
