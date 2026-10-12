import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  ArrowRight,
  Check,
  AlertCircle
} from 'lucide-react';
import loginHeroImg from '../../assets/images/UI/login.webp';
import authApi from '../../services/api/auth.api.js';
import apiClient from '../../services/api/apiClient.js';
import './LoginScreen.css';

export const LoginScreen = ({ initialTab = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine starting tab from prop or query param (?tab=register or ?verified=true or ?reset=success)
  const searchParams = new URLSearchParams(location.search);
  const isVerifiedParam = searchParams.get('verified') === 'true';
  const isResetSuccessParam = searchParams.get('reset') === 'true' || searchParams.get('reset') === 'success';
  const initialEmail = searchParams.get('email') || '';
  const defaultTab = isVerifiedParam ? 'login' : searchParams.get('tab') || initialTab;

  const [activeTab, setActiveTab] = useState(defaultTab === 'register' ? 'register' : 'login');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: initialEmail,
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Notify user if redirected after successful OTP verification or password reset
  useEffect(() => {
    if (isVerifiedParam) {
      showToast('Account verified successfully! You can now log in.', 'success');
    } else if (isResetSuccessParam) {
      showToast('Password reset successfully. Please login with your new password.', 'success');
    }
  }, [isVerifiedParam, isResetSuccessParam]);

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setToastMessage(null);
  };

  // Helper to resolve portal route based on user role
  const getDestinationForRole = (role) => {
    const normalized = (role || '').toUpperCase();
    if (normalized === 'ADMIN') return '/admin/dashboard';
    if (normalized === 'STAFF') return '/staff/dashboard';
    return '/home'; // CUSTOMER portal
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validations
    if (activeTab === 'register') {
      if (!formData.name.trim()) {
        showToast('Please enter your full name.', 'warning');
        return;
      }
      if (!formData.email.trim()) {
        showToast('Please enter your email address.', 'warning');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        showToast('Password must be at least 6 characters long.', 'warning');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast('Passwords do not match. Please verify.', 'warning');
        return;
      }
    } else {
      if (!formData.email.trim()) {
        showToast('Please enter your email address.', 'warning');
        return;
      }
      if (!formData.password) {
        showToast('Please enter your password.', 'warning');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        // Connect directly to backend auth controller login function
        const response = await authApi.login({
          email: formData.email,
          password: formData.password,
        });

        if (response?.success && response?.data) {
          const userRole = (response.data.role || 'CUSTOMER').toUpperCase();
          const targetPortal = getDestinationForRole(userRole);
          const portalName =
            userRole === 'ADMIN'
              ? 'Admin Portal'
              : userRole === 'STAFF'
              ? 'Staff Portal'
              : 'Customer Portal';

          showToast(`Logged in successfully! Redirecting to ${portalName}...`, 'success');
          setTimeout(() => {
            navigate(targetPortal, { replace: true });
          }, 800);
          return;
        } else {
          showToast(response?.message || 'Invalid email or password.', 'warning');
        }
      } else {
        // Registration flow
        const response = await apiClient('/auth/register', {
          method: 'POST',
          body: {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          },
        });

        if (response?.success) {
          showToast('Verification code sent! Please verify your account.', 'info');
          setTimeout(() => {
            navigate(`/verify-otp?email=${encodeURIComponent(formData.email.trim())}`, {
              state: { email: formData.email.trim() }
            });
          }, 800);
        } else {
          showToast(response?.message || 'Registration failed.', 'warning');
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const errMsg = err?.message || 'Login failed. Please check your credentials and try again.';
      showToast(errMsg, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className={`auth-toast-notification auth-toast-${toastMessage.type}`}>
          {toastMessage.type === 'success' && <Check size={16} strokeWidth={2.5} />}
          {toastMessage.type === 'warning' && <AlertCircle size={16} strokeWidth={2.5} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Fullscreen Two-Column Layout */}
      <div className="auth-layout-container">
        {/* =================================================================
            1. Left Side: Authentication Form & Brand Header
            ================================================================= */}
        <div className="auth-form-panel">
          
          {/* Form Content Area */}
          <main className="auth-form-content">
            {/* Title & Subtitle */}
            <div className="auth-headings-group">
              <h1 className="auth-main-title">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="auth-sub-title">
                {activeTab === 'login'
                  ? 'Login to your account to continue'
                  : 'Sign up to start saving time with QueueLess'}
              </p>
            </div>

            {/* Pill Tab Switcher with Smooth Animated Sliding Indicator */}
            <div className="auth-tabs-pill-container" role="tablist">
              <div
                className={`auth-tab-slider ${activeTab === 'register' ? 'slide-right' : 'slide-left'}`}
                aria-hidden="true"
              />
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'login'}
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('login')}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'register'}
                className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('register')}
              >
                Create Account
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="auth-actual-form">
              {/* Full Name Field (Register Tab Only) */}
              {activeTab === 'register' && (
                <div className="auth-input-group auth-field-animated">
                  <label className="auth-input-label" htmlFor="register-name">
                    Full Name
                  </label>
                  <div className="auth-input-wrapper">
                    <User size={18} className="auth-field-icon" />
                    <input
                      id="register-name"
                      type="text"
                      className="auth-input-field"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Address Field (Both Tabs) */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="auth-email">
                  Email Address
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-field-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-input-field"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password Field (Both Tabs) */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="auth-password">
                  Password
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-field-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input-field"
                    placeholder={
                      activeTab === 'register'
                        ? 'Create a password (min 6 characters)'
                        : 'Enter your password'
                    }
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    autoComplete={activeTab === 'register' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Register Tab Only) */}
              {activeTab === 'register' && (
                <div className="auth-input-group auth-field-animated">
                  <label className="auth-input-label" htmlFor="register-confirm-password">
                    Confirm Password
                  </label>
                  <div className="auth-input-wrapper">
                    <ShieldCheck size={18} className="auth-field-icon" />
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-input-field"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot Password Link (Login Tab Only) */}
              {activeTab === 'login' && (
                <div className="auth-forgot-password-row">
                  <button
                    type="button"
                    className="auth-forgot-password-link"
                    onClick={() => {
                      const emailQuery = formData.email ? `?email=${encodeURIComponent(formData.email)}` : '';
                      navigate(`/forgot-password${emailQuery}`);
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Submit Button: Login / Register */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                <span>
                  {isLoading
                    ? 'Processing...'
                    : activeTab === 'login'
                    ? 'Login'
                    : 'Register'}
                </span>
                {!isLoading && <ArrowRight size={18} strokeWidth={2.4} />}
              </button>
            </form>

            {/* Bottom Switch Link */}
            <div className="auth-bottom-switch-row">
              <span className="auth-bottom-switch-text">
                {activeTab === 'login'
                  ? "Don't have an account?"
                  : 'Already have an account?'}
              </span>
              <button
                type="button"
                className="auth-bottom-switch-btn"
                onClick={() => handleTabSwitch(activeTab === 'login' ? 'register' : 'login')}
              >
                {activeTab === 'login' ? 'Create Account' : 'Login'}
              </button>
            </div>
          </main>

          {/* Footer spacer to balance top header */}
          <footer className="auth-panel-footer" />
        </div>

        {/* =================================================================
            2. Right Side: Immobile Hero Image
            Stationary and firmly anchored on the right side
            ================================================================= */}
        <div className="auth-image-panel">
          <div className="auth-image-frame">
            <img
              src={loginHeroImg}
              alt="Less Waiting, More Living - QueueLess"
              className="auth-hero-img"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
