import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Check,
  AlertCircle,
  RotateCw,
  MailCheck,
  Sparkles,
  Inbox
} from 'lucide-react';
import logoImg from '../../assets/images/logo/logo.png';
import loginHeroImg from '../../assets/images/UI/login.webp';
import authApi from '../../services/api/auth.api.js';
import './ForgotPasswordScreen.css';

export const ForgotPasswordScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cooldown timer for resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      showToast('Please enter your registered email address.', 'warning');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(trimmedEmail);

      const msg = response?.message || 'If an account exists with this email, a password reset link has been sent.';
      showToast(msg, 'info');
      setIsSubmitted(true);
      setResendTimer(30);
    } catch (err) {
      console.warn('Failed to request password reset:', err);
      showToast('Unable to process password reset. Please try again.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isLoading) return;
    await handleSubmit();
  };

  return (
    <div className="forgot-page-container">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className={`forgot-toast-notification forgot-toast-${toastMessage.type}`}>
          {toastMessage.type === 'success' && <Check size={16} strokeWidth={2.5} />}
          {toastMessage.type === 'warning' && <AlertCircle size={16} strokeWidth={2.5} />}
          {toastMessage.type === 'info' && <Mail size={16} strokeWidth={2.5} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Fullscreen Two-Column Layout */}
      <div className="forgot-layout-container">
        {/* Left Side: Form Panel */}
        <div className="forgot-form-panel">
          <header className="forgot-panel-header">
            <Link to="/home" className="forgot-brand-logo-group">
              <img
                src={logoImg}
                alt="QueueLess Logo"
                className="forgot-brand-logo"
              />
              <div className="forgot-brand-title">
                <span className="brand-queue">Queue</span>
                <span className="brand-less">Less</span>
              </div>
            </Link>
          </header>

          <main className="forgot-form-content">
            {!isSubmitted ? (
              /* State 1: Request Password Reset Form */
              <div className="forgot-state-enter">
                <div className="forgot-headings-group">
                  <div className="forgot-icon-badge">
                    <KeyRound size={24} className="forgot-badge-icon" />
                  </div>
                  <h1 className="forgot-main-title">Forgot Password?</h1>
                  <p className="forgot-sub-title">
                    No worries! Enter your registered email address and we'll send you a secure link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-actual-form">
                  <div className="forgot-input-group">
                    <label className="forgot-input-label" htmlFor="forgot-email">
                      Registered Email Address
                    </label>
                    <div className="forgot-input-wrapper">
                      <Mail size={18} className="forgot-field-icon" />
                      <input
                        id="forgot-email"
                        type="email"
                        className="forgot-input-field"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="forgot-submit-btn"
                    disabled={isLoading}
                  >
                    <span>{isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}</span>
                    {!isLoading ? (
                      <ArrowRight size={18} strokeWidth={2.4} />
                    ) : (
                      <RotateCw size={18} className="forgot-btn-spinner" />
                    )}
                  </button>
                </form>

                <div className="forgot-back-link-row">
                  <button
                    type="button"
                    className="forgot-back-btn"
                    onClick={() => navigate('/login')}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Login</span>
                  </button>
                </div>
              </div>
            ) : (
              /* State 2: Email Sent Confirmation State (Link-only UX) */
              <div className="forgot-submitted-wrapper">
                <div className="forgot-headings-group">
                  <div className="forgot-icon-badge success-badge">
                    <MailCheck size={26} className="forgot-badge-icon-success" />
                  </div>
                  <h1 className="forgot-main-title">Check Your Email</h1>
                  <p className="forgot-sub-title">
                    We've sent a password reset link to your email address:
                  </p>
                  <div className="forgot-email-pill" title={email}>
                    <Mail size={14} className="forgot-pill-icon" />
                    <span>{email}</span>
                  </div>
                </div>

                {/* Modern Link-Instructions Card */}
                <div className="forgot-instructions-card">
                  <div className="forgot-card-header">
                    <Inbox size={20} className="forgot-card-icon" />
                    <span className="forgot-card-title">Next Steps</span>
                  </div>
                  <p className="forgot-card-desc">
                    Click the prominent <strong>“Reset Password”</strong> button in the email to securely choose a new password. The link is valid for <strong>15 minutes</strong>.
                  </p>
                  <div className="forgot-card-tip">
                    <Sparkles size={14} className="forgot-tip-icon" />
                    <span>Didn't receive it? Check your spam or junk folder.</span>
                  </div>
                </div>

                {/* Resend Action */}
                <div className="forgot-resend-row">
                  <span className="forgot-resend-prompt">Still waiting for the email?</span>
                  {resendTimer > 0 ? (
                    <span className="forgot-resend-timer">
                      Resend in <strong>{resendTimer}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="forgot-resend-btn"
                      onClick={handleResend}
                      disabled={isLoading}
                    >
                      <RotateCw size={13} className={isLoading ? 'forgot-btn-spinner' : ''} />
                      <span>{isLoading ? 'Sending...' : 'Resend Email'}</span>
                    </button>
                  )}
                </div>

                <div className="forgot-footer-actions">
                  <button
                    type="button"
                    className="forgot-change-email-btn"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Use a different email
                  </button>
                  <span className="forgot-divider">•</span>
                  <button
                    type="button"
                    className="forgot-back-btn"
                    onClick={() => navigate('/login')}
                  >
                    <ArrowLeft size={15} />
                    <span>Back to Login</span>
                  </button>
                </div>
              </div>
            )}
          </main>

          <footer className="forgot-panel-footer" />
        </div>

        {/* Right Side: Hero Visual Frame */}
        <div className="forgot-image-panel">
          <div className="forgot-image-frame">
            <img
              src={loginHeroImg}
              alt="QueueLess - Smart Queue Management"
              className="forgot-hero-img"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
