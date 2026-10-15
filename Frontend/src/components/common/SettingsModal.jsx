import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  AlertCircle,
  KeyRound,
  RotateCw
} from 'lucide-react';
import userApi from '../../services/api/user.api.js';
import './SettingsModal.css';

export const SettingsModal = ({
  isOpen,
  onClose,
  onPasswordChanged
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setFeedback(null);
    }
  }, [isOpen]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    }
  }, [isOpen]);

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

  const hasMinLength = newPassword.length >= 6;
  const isSameAsCurrent = Boolean(
    currentPassword && 
    newPassword && 
    currentPassword.trim() === newPassword.trim()
  );
  const passwordsMatch = Boolean(confirmPassword && newPassword === confirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      setFeedback({ type: 'error', text: 'Please enter your current password.' });
      return;
    }

    if (!newPassword) {
      setFeedback({ type: 'error', text: 'Please enter your new password.' });
      return;
    }

    if (!hasMinLength) {
      setFeedback({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (currentPassword.trim() === newPassword.trim()) {
      setFeedback({ 
        type: 'error', 
        text: 'Both passwords are the same, cannot change/modify.' 
      });
      return;
    }

    if (!confirmPassword) {
      setFeedback({ type: 'error', text: 'Please confirm your new password.' });
      return;
    }

    if (!passwordsMatch) {
      setFeedback({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await userApi.updateProfile({
        currentPassword: currentPassword.trim(),
        password: newPassword.trim()
      });

      setFeedback({
        type: 'success',
        text: 'Password updated successfully! Keep it secure.'
      });

      if (typeof onPasswordChanged === 'function') {
        onPasswordChanged();
      }

      setTimeout(() => {
        onClose();
      }, 1300);
    } catch (err) {
      console.error('Failed to change password:', err);
      setFeedback({
        type: 'error',
        text: err?.message || 'Failed to update password. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="account-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="account-modal-container settings-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="account-modal-header">
          <div className="account-modal-header-titles">
            <h2 className="account-modal-title">Account Security Settings</h2>
            <p className="account-modal-subtitle">
              Manage your password and protect your account
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
          {/* Security Banner Card */}
          <div className="settings-security-card">
            <div className="settings-security-icon-box">
              <KeyRound size={26} className="settings-key-icon" />
            </div>
            <div className="settings-security-text">
              <h3 className="settings-security-title">Change Password</h3>
              <p className="settings-security-desc">
                Choose a strong new password to keep your QueueLess workspace secure.
              </p>
            </div>
          </div>

          {/* Toast / Feedback Notice */}
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

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="settings-form">
            {/* Field 1: Current Password */}
            <div className="profile-form-group">
              <label className="profile-field-label" htmlFor="settings-current-password">
                Current Password <span className="profile-required-star">*</span>
              </label>
              <div className="profile-field-input-wrapper">
                <Lock size={18} className="profile-field-icon" />
                <input
                  id="settings-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="profile-field-input"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="settings-eye-btn"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Field 2: New Password */}
            <div className="profile-form-group">
              <label className="profile-field-label" htmlFor="settings-new-password">
                New Password <span className="profile-required-star">*</span>
              </label>
              <div className="profile-field-input-wrapper">
                <Lock size={18} className="profile-field-icon" />
                <input
                  id="settings-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  className="profile-field-input"
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="settings-eye-btn"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Requirement / Same password warning indicators */}
              <div className="settings-requirement-row">
                <span className={`requirement-indicator ${hasMinLength ? 'valid' : ''}`}>
                  {hasMinLength ? <Check size={12} strokeWidth={3} /> : <span className="mini-bullet">•</span>}
                  <span>At least 6 characters</span>
                </span>
                {isSameAsCurrent && (
                  <span className="requirement-indicator invalid" style={{ color: '#DC2626' }}>
                    <AlertCircle size={12} strokeWidth={3} />
                    <span>Both passwords can not be same!</span>
                  </span>
                )}
              </div>
            </div>

            {/* Field 3: Confirm Password */}
            <div className="profile-form-group">
              <label className="profile-field-label" htmlFor="settings-confirm-password">
                Confirm Password <span className="profile-required-star">*</span>
              </label>
              <div className="profile-field-input-wrapper">
                <ShieldCheck size={18} className="profile-field-icon" />
                <input
                  id="settings-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="profile-field-input"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="settings-eye-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword && (
                <div className="settings-requirement-row">
                  <span className={`requirement-indicator ${passwordsMatch ? 'valid' : 'invalid'}`}>
                    {passwordsMatch ? (
                      <>
                        <Check size={12} strokeWidth={3} />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} strokeWidth={3} />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="account-modal-actions">
              <button
                type="button"
                className="account-modal-secondary-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="account-modal-primary-btn"
                disabled={isSubmitting || !currentPassword || !hasMinLength || !passwordsMatch || isSameAsCurrent}
              >
                {isSubmitting ? (
                  <>
                    <RotateCw size={15} className="spin-icon" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} strokeWidth={2.4} />
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

export default SettingsModal;
