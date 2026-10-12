import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Mail,
  RotateCw
} from 'lucide-react';
import logoImg from '../../assets/images/logo/logo.png';
import loginHeroImg from '../../assets/images/UI/login.webp';
import './OtpVerificationScreen.css';

export const OtpVerificationScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Read email and mode from location state or query parameter (?email=...&mode=reset)
  const queryParams = new URLSearchParams(location.search);
  const emailParam = location.state?.email || queryParams.get('email') || 'your email';
  const modeParam = location.state?.mode || queryParams.get('mode') || 'account';
  const isResetMode = modeParam === 'reset' || modeParam === 'password-reset';

  // 6 OTP digit inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const inputRefs = useRef([]);

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Redirect legacy reset-mode requests to forgot-password since recovery is link-based
  useEffect(() => {
    if (isResetMode) {
      navigate('/forgot-password', { replace: true });
    }
  }, [isResetMode, navigate]);

  // Timer countdown for resending OTP
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Focus the first input box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    // Only accept numeric character
    const sanitized = value.replace(/\D/g, '');

    if (!sanitized) {
      // Clear current digit
      const nextDigits = [...otpDigits];
      nextDigits[index] = '';
      setOtpDigits(nextDigits);
      return;
    }

    // If pasted or multi-char, take the last typed character
    const char = sanitized.slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);

    // Auto-focus the next input box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace navigation
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const nextDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(nextDigits);

    // Focus last filled or next unfilled
    const nextFocusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  const handleResendOtp = async () => {
    if (isResendDisabled) return;

    setIsResendDisabled(true);
    setResendTimer(30);

    try {
      showToast(`A new 6-digit OTP has been sent to ${emailParam}`, 'info');
    } catch {
      showToast('New verification code sent!', 'info');
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();

    const fullOtp = otpDigits.join('');

    if (fullOtp.length < 6) {
      showToast('Please enter all 6 digits of your verification code.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      // Standard Account Verification flow
      const response = await fetch('/api/v1/auth/verify-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: emailParam.toLowerCase().trim(),
            otp: fullOtp,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast('Account verified successfully! You can now log in.', 'success');
          setTimeout(() => {
            navigate(`/login?email=${encodeURIComponent(emailParam)}&verified=true`);
          }, 1200);
        } else {
          const errMsg = data?.message || 'Invalid or expired OTP code. Please check and try again.';
          showToast(errMsg, 'warning');
        }
    } catch (err) {
      console.warn('Error during OTP verification:', err);
      showToast('Unable to complete verification. Please try again.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-page-container">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className={`otp-toast-notification otp-toast-${toastMessage.type}`}>
          {toastMessage.type === 'success' && <Check size={16} strokeWidth={2.5} />}
          {toastMessage.type === 'warning' && <AlertCircle size={16} strokeWidth={2.5} />}
          {toastMessage.type === 'info' && <Mail size={16} strokeWidth={2.5} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Fullscreen Two-Column Layout */}
      <div className="otp-layout-container">
        {/* =================================================================
            1. Left Side: OTP Verification Form & Brand Header
            ================================================================= */}
        <div className="otp-form-panel">
          {/* Header Row: System Logo and Name (Admin Portal styling) */}
          <header className="otp-panel-header">
            <Link to="/home" className="otp-brand-logo-group">
              <img
                src={logoImg}
                alt="QueueLess Logo"
                className="otp-brand-logo"
              />
              <div className="otp-brand-title">
                <span className="brand-queue">Queue</span>
                <span className="brand-less">Less</span>
              </div>
            </Link>
          </header>

          {/* Form Content Area */}
          <main className="otp-form-content">
            {/* Title & Subtitle */}
            <div className="otp-headings-group">
              <div className="otp-icon-badge">
                <Mail size={24} className="otp-badge-icon" />
              </div>
              <h1 className="otp-main-title">
                Verify Your Account
              </h1>
              <p className="otp-sub-title">
                We've sent a 6-digit verification code to
              </p>
              <div className="otp-email-pill" title={emailParam}>
                {emailParam}
              </div>
            </div>

            {/* 6 Digit Inputs */}
            <form onSubmit={handleVerify} className="otp-actual-form">
              <div className="otp-boxes-container" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className={`otp-digit-box ${digit ? 'filled' : ''}`}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    aria-label={`Digit ${idx + 1}`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {/* Submit Verification Button */}
              <button
                type="submit"
                className="otp-submit-btn"
                disabled={isLoading}
              >
                <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
                {!isLoading && <ArrowRight size={18} strokeWidth={2.4} />}
              </button>
            </form>

            {/* Resend Code Row */}
            <div className="otp-resend-row">
              <span className="otp-resend-text">Didn't receive the code?</span>
              {isResendDisabled ? (
                <span className="otp-countdown-text">
                  Resend in <strong>{resendTimer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  className="otp-resend-action-btn"
                  onClick={handleResendOtp}
                >
                  <RotateCw size={13} />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

            {/* Back to Login Link */}
            <div className="otp-back-link-row">
              <button
                type="button"
                className="otp-back-btn"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft size={16} />
                <span>Back to Login</span>
              </button>
            </div>
          </main>

          {/* Footer spacer to balance layout */}
          <footer className="otp-panel-footer" />
        </div>

        {/* =================================================================
            2. Right Side: Immobile Hero Image (Stationary on right side)
            ================================================================= */}
        <div className="otp-image-panel">
          <div className="otp-image-frame">
            <img
              src={loginHeroImg}
              alt="Less Waiting, More Living - QueueLess"
              className="otp-hero-img"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationScreen;
