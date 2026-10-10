import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logoImg from '../../assets/images/logo/logo.png';
import firstBgSvg from '../../assets/images/UI/first_onboarding_bg.svg';
import secondBgSvg from '../../assets/images/UI/second_onboarding_bg.svg';
import thirdBgSvg from '../../assets/images/UI/third_onboarding_bg.svg';
import './OnboardingScreen.css';

const ONBOARDING_STEPS = [
  {
    step: '01',
    total: '03',
    headingMain: 'Book Your',
    headingHighlight: 'Appointment Easily',
    description:
      'Browse available services, select a date, and book your appointment in just a few clicks.',
    bgImage: firstBgSvg,
    buttonText: 'Next',
  },
  {
    step: '02',
    total: '03',
    headingMain: 'Join Virtual',
    headingHighlight: 'Queue Seamlessly',
    description:
      'Enter the digital line remotely, track live turn updates, and avoid waiting in crowded lines.',
    bgImage: secondBgSvg,
    buttonText: 'Next',
  },
  {
    step: '03',
    total: '03',
    headingMain: 'Track Your',
    headingHighlight: 'Queue in Real-Time',
    description:
      'Get your token, track your live queue status, and know when it is your turn - all in real time',
    bgImage: thirdBgSvg,
    buttonText: 'Get Started',
  },
];

export const OnboardingScreen = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();

  // For mobile screens (<= 768px), onboarding screen will not appear; redirect directly to login
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        navigate('/login', { replace: true });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [navigate]);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    navigate('/login');
  };

  // Prevent flash of onboarding screen on mobile viewports
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    return null;
  }

  return (
    <div
      className="onboarding-page"
      style={{
        backgroundImage: `url("${currentStep.bgImage}")`,
      }}
    >
      {/* 1. Header with Logo, Company Name (like Admin Portal) & Tagline */}
      <header className="onboarding-header">
        <Link to="/home" className="onboarding-brand-link">
          <img
            src={logoImg}
            alt="QueueLess Logo"
            className="onboarding-brand-logo"
          />
          <div className="onboarding-brand-text-col">
            <div className="onboarding-brand-title">
              <span className="brand-queue">Queue</span>
              <span className="brand-less">Less</span>
            </div>
          </div>
        </Link>
      </header>

      {/* 2. Main Hero Content Area */}
      <main className="onboarding-main">
        <div className="onboarding-content-card" key={currentStepIndex}>
          {/* Step Indicator: 01 / 03 & Segmented Progress Bars */}
          <div className="onboarding-progress-section">
            <div className="onboarding-step-counter">
              <span className="onboarding-step-current">{currentStep.step}</span>
              <span className="onboarding-step-divider"> / </span>
              <span className="onboarding-step-total">{currentStep.total}</span>
            </div>
            <div className="onboarding-bars-row">
              {ONBOARDING_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`onboarding-bar-pill ${idx === currentStepIndex ? 'active' : ''} ${idx < currentStepIndex ? 'completed' : ''}`}
                  onClick={() => setCurrentStepIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Heading */}
          <h1 className="onboarding-heading">
            <span className="onboarding-heading-main">{currentStep.headingMain}</span>
            <span className="onboarding-heading-highlight">{currentStep.headingHighlight}</span>
          </h1>

          {/* Description */}
          <p className="onboarding-description">
            {currentStep.description}
          </p>

          {/* Action Buttons: Next & Skip */}
          <div className="onboarding-actions">
            <button
              type="button"
              className="onboarding-next-btn"
              onClick={handleNext}
            >
              <span>{currentStep.buttonText}</span>
              <ArrowRight size={18} strokeWidth={2.4} className="next-btn-icon" />
            </button>

            <button
              type="button"
              className="onboarding-skip-btn"
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OnboardingScreen;
