import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  KeyRound,
  RotateCw,
  Loader2,
  Mail,
  Circle
} from 'lucide-react';
import logoImg from '../../assets/images/logo/logo.png';
import loginHeroImg from '../../assets/images/UI/login.webp';
import authApi from '../../services/api/auth.api.js';
import './ResetPasswordScreen.css';

export const ResetPasswordScreen = () => {
  const params = useParams();
  const pathMatch = typeof window !== 'undefined' ? window.location.pathname.match(/\/reset-password\/([^/?#]+)/i) : null;
  const hashMatch = typeof window !== 'undefined' ? window.location.hash.match(/\/reset-password\/([^/?#]+)/i) : null;
  const effectiveToken = params.token || params.resetToken || (hashMatch ? hashMatch[1] : '') || (pathMatch ? pathMatch[1] : '') || '';
  const navigate = useNavigate();

  // Link verification states
  const [isVerifyingLink, setIsVerifyingLink] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [associatedEmail, setAssociatedEmail] = useState('');

  // Password form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Password validation metrics
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = Boolean(confirmPassword && newPassword === confirmPassword);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: '#EF4444' };
      case 2:
        return { score: 2, label: 'Fair', color: '#F59E0B' };
      case 3:
        return { score: 3, label: 'Good', color: '#0EA5E9' };
      case 4:
        return { score: 4, label: 'Strong', color: '#10B981' };
      default:
        return { score: 0, label: '', color: '' };
    }
  };

  const strength = getPasswordStrength(newPassword);

  // Verify the temporary reset link token from Redis on initial load
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!effectiveToken) {
        setIsVerifyingLink(false);
        setIsTokenValid(false);
        setTokenError('Missing password reset authorization link.');
        return;
      }

      setIsVerifyingLink(true);
      try {
        const response = await authApi.verifyResetLink(effectiveToken);

        if (isMounted) {
          if (response?.success && response?.data?.valid) {
            setIsTokenValid(true);
            setTokenError(null);
            if (response.data.email) {
              setAssociatedEmail(response.data.email);
            }
          } else {
            setIsTokenValid(false);
            setTokenError(
              response?.message || 'This password reset link is invalid or has expired.'
            );
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Reset link verification error:', err);
          setIsTokenValid(false);
          setTokenError('This password reset link is invalid or has expired. Please request a new one.');
        }
      } finally {
        if (isMounted) {
          setIsVerifyingLink(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [effectiveToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!effectiveToken || !isTokenValid) {
      showToast('Invalid or expired reset link. Please request a new one.', 'warning');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.resetPassword({
        resetToken: effectiveToken,
        newPassword,
      });

      if (response?.success) {
        showToast('Password updated successfully! Redirecting to login...', 'success');
        setTimeout(() => {
          navigate('/login?reset=success');
        }, 1200);
      } else {
        const errorMsg = response?.message || 'Failed to reset password. Please request a new link.';
        showToast(errorMsg, 'warning');
      }
    } catch (err) {
      console.warn('Password reset submit error:', err);
      showToast(err?.message || 'Invalid or expired reset token. Please request a new link.', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-page-container">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className={`reset-toast-notification reset-toast-${toastMessage.type}`}>
          {toastMessage.type === 'success' && <Check size={16} strokeWidth={2.5} />}
          {toastMessage.type === 'warning' && <AlertCircle size={16} strokeWidth={2.5} />}
          {toastMessage.type === 'info' && <Lock size={16} strokeWidth={2.5} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Fullscreen Two-Column Layout */}
      <div className="reset-layout-container">
        {/* Left Side: Reset Password Form Panel */}
        <div className="reset-form-panel">
          <header className="reset-panel-header">
            <Link to="/home" className="reset-brand-logo-group">
              <img
                src={logoImg}
                alt="QueueLess Logo"
                className="reset-brand-logo"
              />
              <div className="reset-brand-title">
                <span className="brand-queue">Queue</span>
                <span className="brand-less">Less</span>
              </div>
            </Link>
          </header>

          <main className="reset-form-content">
            <div className="reset-headings-group">
              <div className="reset-icon-badge">
                <KeyRound size={24} className="reset-badge-icon" />
              </div>
              <h1 className="reset-main-title">Set New Password</h1>
              <p className="reset-sub-title">
                Choose a strong new password to keep your account safe and secure.
              </p>
              {associatedEmail && (
                <div className="reset-account-pill" title={associatedEmail}>
                  <Mail size={13} className="reset-account-icon" />
                  <span>Account: {associatedEmail}</span>
                </div>
              )}
            </div>

            {/* 1. Loading State while validating reset token */}
            {isVerifyingLink ? (
              <div className="reset-verifying-box">
                <Loader2 size={36} className="reset-spinner-icon" />
                <h3 className="reset-verifying-title">Verifying Reset Link...</h3>
                <p className="reset-verifying-subtitle">
                  Securing your session with the server. Just a moment.
                </p>
              </div>
            ) : !isTokenValid ? (
              /* 2. Invalid or Expired Token State */
              <div className="reset-invalid-token-box">
                <div className="reset-invalid-icon-wrap">
                  <AlertCircle size={32} className="text-warning-icon" />
                </div>
                <h3 className="reset-invalid-title">Reset Link Expired or Invalid</h3>
                <p className="reset-invalid-desc">
                  {tokenError || 'This password reset link has expired or has already been used.'}
                </p>
                <div className="reset-invalid-actions">
                  <button
                    type="button"
                    className="reset-submit-btn"
                    onClick={() => navigate('/forgot-password')}
                  >
                    <span>Request New Reset Link</span>
                    <ArrowRight size={16} />
                  </button>
                  <button
                    type="button"
                    className="reset-secondary-back-btn"
                    onClick={() => navigate('/login')}
                  >
                    <ArrowLeft size={15} />
                    <span>Back to Login</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 3. Valid Token State: New Password Form */
              <form onSubmit={handleSubmit} className="reset-actual-form">
                {/* New Password Field */}
                <div className="reset-input-group">
                  <label className="reset-input-label" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="reset-input-wrapper">
                    <Lock size={18} className="reset-field-icon" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      className="reset-input-field"
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      className="reset-password-toggle-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="reset-strength-meter">
                    <div className="reset-strength-bars">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="reset-strength-bar"
                          style={{
                            backgroundColor:
                              level <= strength.score ? strength.color : '#E2E8F0',
                          }}
                        />
                      ))}
                    </div>
                    <div className="reset-strength-label-row">
                      <span className="reset-strength-caption">Strength:</span>
                      <span
                        className="reset-strength-text"
                        style={{ color: strength.color }}
                      >
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}

                {/* Live Password Requirements Checklist */}
                <div className="reset-checklist-card">
                  <div className={`reset-check-item ${hasMinLength ? 'met' : ''}`}>
                    {hasMinLength ? (
                      <Check size={14} className="reset-check-icon met" />
                    ) : (
                      <Circle size={14} className="reset-check-icon unmet" />
                    )}
                    <span>At least 8 characters long</span>
                  </div>
                  <div className={`reset-check-item ${hasUppercase ? 'met' : ''}`}>
                    {hasUppercase ? (
                      <Check size={14} className="reset-check-icon met" />
                    ) : (
                      <Circle size={14} className="reset-check-icon unmet" />
                    )}
                    <span>Contains an uppercase letter</span>
                  </div>
                  <div className={`reset-check-item ${hasNumber ? 'met' : ''}`}>
                    {hasNumber ? (
                      <Check size={14} className="reset-check-icon met" />
                    ) : (
                      <Circle size={14} className="reset-check-icon unmet" />
                    )}
                    <span>Contains a number</span>
                  </div>
                  {confirmPassword && (
                    <div className={`reset-check-item ${passwordsMatch ? 'met' : ''}`}>
                      {passwordsMatch ? (
                        <Check size={14} className="reset-check-icon met" />
                      ) : (
                        <Circle size={14} className="reset-check-icon unmet" />
                      )}
                      <span>Passwords match</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="reset-input-group">
                  <label className="reset-input-label" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="reset-input-wrapper">
                    <ShieldCheck size={18} className="reset-field-icon" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="reset-input-field"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="reset-password-toggle-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="reset-submit-btn"
                  disabled={isSubmitting || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  <span>{isSubmitting ? 'Updating Password...' : 'Reset Password'}</span>
                  {!isSubmitting ? (
                    <ArrowRight size={18} strokeWidth={2.4} />
                  ) : (
                    <RotateCw size={18} className="reset-btn-spinner" />
                  )}
                </button>
              </form>
            )}

            <div className="reset-back-link-row">
              <button
                type="button"
                className="reset-back-btn"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft size={16} />
                <span>Back to Login</span>
              </button>
            </div>
          </main>

          <footer className="reset-panel-footer" />
        </div>

        {/* Right Side: Hero Visual Frame */}
        <div className="reset-image-panel">
          <div className="reset-image-frame">
            <img
              src={loginHeroImg}
              alt="QueueLess - Smart Queue Management"
              className="reset-hero-img"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
