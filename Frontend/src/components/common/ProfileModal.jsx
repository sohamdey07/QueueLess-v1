import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldCheck,
  Check,
  RotateCw,
  ChevronDown
} from 'lucide-react';
import userApi from '../../services/api/user.api.js';
import tokenStorage from '../../services/storage/tokenStorage.js';
import CommonAvatar from './CommonAvatar';
import './ProfileModal.css';

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'USA / Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' }
];

export const ProfileModal = ({
  isOpen,
  onClose,
  onProfileUpdated,
  roleLabel
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [userRole, setUserRole] = useState('STAFF');

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const countryDropdownRef = useRef(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setCountryDropdownOpen(false);
      }
    };
    if (countryDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [countryDropdownOpen]);

  // Helper to parse phone into country code and local digits
  const parseStoredPhone = (rawPhone) => {
    if (!rawPhone || typeof rawPhone !== 'string') {
      return { code: '+91', digits: '' };
    }
    const clean = rawPhone.trim();
    for (const item of COUNTRY_CODES) {
      if (clean.startsWith(item.code)) {
        return {
          code: item.code,
          digits: clean.slice(item.code.length).trim()
        };
      }
    }
    // If starts with another + code
    if (clean.startsWith('+')) {
      const parts = clean.split(' ');
      if (parts.length > 1) {
        return { code: parts[0], digits: parts.slice(1).join(' ') };
      }
    }
    return { code: '+91', digits: clean };
  };

  // Populate form fields directly from stored user data whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const user = tokenStorage.getUser() || {};
      setFullName(user.name || '');
      setEmail(user.email || '');

      const parsed = parseStoredPhone(user.phone || '');
      setCountryCode(parsed.code);
      setPhoneDigits(parsed.digits);

      setIsVerified(user.isVerified !== undefined ? Boolean(user.isVerified) : true);
      setIsActive(user.isActive !== undefined ? Boolean(user.isActive) : true);
      setUserRole(user.role || 'STAFF');
      setFeedback(null);
      setCountryDropdownOpen(false);
    }
  }, [isOpen]);

  // Prevent background scrolling when modal is open and cleanly restore on close
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

  // Ensure body scroll is unlocked on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    // Allow digits and single spaces
    const sanitized = val.replace(/[^\d\s]/g, '');
    setPhoneDigits(sanitized);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedDigits = phoneDigits.trim();

    if (!trimmedName) {
      setFeedback({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    if (!trimmedDigits) {
      setFeedback({ type: 'error', text: 'Please enter your phone number.' });
      return;
    }

    const cleanNumericOnly = trimmedDigits.replace(/\s+/g, '');
    if (cleanNumericOnly.length < 6) {
      setFeedback({ type: 'error', text: 'Please enter a valid phone number (at least 6 digits).' });
      return;
    }

    const fullPhone = `${countryCode} ${trimmedDigits}`.trim();

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await userApi.updateProfile({
        name: trimmedName,
        phone: fullPhone
      });

      const updatedUser = res?.data || {};
      const currentStored = tokenStorage.getUser() || {};
      
      const newStoredUser = {
        ...currentStored,
        name: updatedUser.name || trimmedName,
        phone: updatedUser.phone !== undefined ? updatedUser.phone : fullPhone,
        isVerified: updatedUser.isVerified !== undefined ? updatedUser.isVerified : currentStored.isVerified,
        isActive: updatedUser.isActive !== undefined ? updatedUser.isActive : currentStored.isActive
      };

      // Update local storage so headers and other screens reflect the change
      tokenStorage.setUser(newStoredUser);

      setFeedback({
        type: 'success',
        text: 'Profile updated successfully!'
      });

      if (typeof onProfileUpdated === 'function') {
        onProfileUpdated({
          name: updatedUser.name || trimmedName,
          phone: updatedUser.phone !== undefined ? updatedUser.phone : fullPhone
        });
      }

      // Automatically close after brief success indicator
      setTimeout(() => {
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Determine dynamic role label
  const displayRole = roleLabel || (
    userRole === 'ADMIN'
      ? 'System Administrator'
      : userRole === 'STAFF'
      ? 'Queue Manager'
      : 'Customer'
  );

  return (
    <div className="account-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="account-modal-container profile-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="account-modal-header">
          <div className="account-modal-header-titles">
            <h2 className="account-modal-title">Profile Information</h2>
            <p className="account-modal-subtitle">
              View and manage your personal account details
            </p>
          </div>
          <button 
            type="button" 
            className="account-modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="account-modal-body">
          {/* Identity Header Card with Clean Stylized Avatar & Ambient Waves */}
          <div className="profile-identity-card">
            {/* Background subtle organic wave art */}
            <svg 
              className="profile-identity-bg-waves" 
              viewBox="0 0 360 110" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path 
                d="M170 0C210 40 240 75 360 45V110H140C190 70 170 20 170 0Z" 
                fill="url(#profileWaveGrad)" 
                opacity="0.5" 
              />
              <defs>
                <linearGradient id="profileWaveGrad" x1="160" y1="0" x2="360" y2="110" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#DBEAFE" />
                  <stop offset="1" stopColor="#E0E7FF" />
                </linearGradient>
              </defs>
            </svg>

            <CommonAvatar 
              size={78} 
              showRing={true} 
              showStatusDot={true} 
              isActive={isActive} 
              alt={fullName} 
            />

            <div className="profile-identity-details">
              <h3 className="profile-display-name">{fullName || 'User'}</h3>
              
              {/* Badges Row: Role Badge + Verified Badge */}
              <div className="profile-badges-row">
                <span className="profile-badge-pill role-pill">
                  <ShieldCheck size={14} className="badge-icon-blue" />
                  <span>{displayRole}</span>
                </span>

                {isVerified ? (
                  <span className="profile-badge-pill verified-pill">
                    <CheckCircle2 size={14} className="badge-icon-green" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="profile-badge-pill unverified-pill">
                    <ShieldCheck size={14} className="badge-icon-amber" />
                    <span>Unverified</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section Subheading */}
          <div className="profile-section-heading-group">
            <h4 className="profile-section-title">Account Details</h4>
            <p className="profile-section-subtitle">Update your personal information below.</p>
          </div>

          {/* Feedback Notice */}
          {feedback && (
            <div className={`profile-feedback-box feedback-${feedback.type}`}>
              {feedback.type === 'success' ? (
                <Check size={16} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={16} strokeWidth={2.5} />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="profile-edit-form">
            {/* Field 1: Full Name */}
            <div className="profile-form-group">
              <label className="profile-field-label" htmlFor="profile-fullname">
                Full Name <span className="profile-required-star">*</span>
              </label>
              <div className="profile-field-input-wrapper">
                <User size={18} className="profile-field-icon" />
                <input
                  id="profile-fullname"
                  type="text"
                  className="profile-field-input"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            {/* Field 2: Email Address (Read-only) */}
            <div className="profile-form-group">
              <label className="profile-field-label" htmlFor="profile-email">
                Email Address
              </label>
              <div className="profile-field-input-wrapper input-readonly">
                <Mail size={18} className="profile-field-icon" />
                <input
                  id="profile-email"
                  type="email"
                  className="profile-field-input"
                  value={email}
                  readOnly
                  disabled
                  title="Email address is permanent and cannot be changed"
                />
                <span className="profile-locked-tag" title="Email address is permanent and cannot be changed">
                  <Lock size={12} className="lock-icon" />
                  <span className="locked-tag-text-desktop">Cannot be changed</span>
                  <span className="locked-tag-text-mobile">Locked</span>
                </span>
              </div>
              <span className="profile-field-hint">
                Email address is permanently linked to your QueueLess login.
              </span>
            </div>

            {/* Field 3: Phone Number with Country Code */}
            <div className="profile-form-group">
              <label className="profile-field-label" htmlFor="profile-phone">
                Phone Number <span className="profile-required-star">*</span>
              </label>
              <div className="profile-field-input-wrapper phone-input-wrapper">
                <Phone size={18} className="profile-field-icon" />

                {/* Country Code Trigger & Dropdown */}
                <div className="country-code-picker-wrap" ref={countryDropdownRef}>
                  <button
                    type="button"
                    className={`country-code-btn ${countryDropdownOpen ? 'open' : ''}`}
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    aria-expanded={countryDropdownOpen}
                    disabled={isSaving}
                  >
                    <span>{countryCode}</span>
                    <ChevronDown size={14} className="country-chevron" />
                  </button>

                  {countryDropdownOpen && (
                    <div className="country-code-menu">
                      {COUNTRY_CODES.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className={`country-code-item ${countryCode === item.code ? 'active' : ''}`}
                          onClick={() => {
                            setCountryCode(item.code);
                            setCountryDropdownOpen(false);
                          }}
                        >
                          <span className="item-label">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="phone-field-divider" />

                <input
                  id="profile-phone"
                  type="tel"
                  className="profile-field-input phone-digits-input"
                  placeholder="98765 43210"
                  value={phoneDigits}
                  onChange={handlePhoneChange}
                  disabled={isSaving}
                  required
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="account-modal-actions">
              <button
                type="button"
                className="account-modal-secondary-btn"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="account-modal-primary-btn"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RotateCw size={15} className="spin-icon" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.4} />
                    <span>Update</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
