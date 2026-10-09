import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Stethoscope, 
  Calendar, 
  Users, 
  Phone, 
  Mail, 
  Clock, 
  Volume2, 
  PlayCircle, 
  SkipForward, 
  CheckCircle2, 
  User,
  Radio,
  Check,
  AlertCircle
} from 'lucide-react';
import './StaffDashboard.css';

// Initial Waiting Queue Data matching the screenshot exactly
const initialWaitingQueue = [
  { id: 1, token: 'A-042', name: 'Priya Singh', joinedTime: '10:20 AM', phone: '+91 98123 45671', email: 'priya.singh@example.com' },
  { id: 2, token: 'A-043', name: 'Amit Kumar', joinedTime: '10:25 AM', phone: '+91 98234 56782', email: 'amit.kumar@example.com' },
  { id: 3, token: 'A-044', name: 'Neha Das', joinedTime: '10:28 AM', phone: '+91 98345 67893', email: 'neha.das@example.com' },
  { id: 4, token: 'A-045', name: 'Sanjay Verma', joinedTime: '10:31 AM', phone: '+91 98456 78904', email: 'sanjay.verma@example.com' },
  { id: 5, token: 'A-046', name: 'Kavita Roy', joinedTime: '10:33 AM', phone: '+91 98567 89015', email: 'kavita.roy@example.com' },
];

export const StaffDashboard = () => {
  // Staff & Counter metadata
  const [selectedService] = useState('General Consultation');
  const [counterActive, setCounterActive] = useState(true);

  // Active Customer state matching screenshot
  const [currentCustomer, setCurrentCustomer] = useState({
    token: 'A-041',
    name: 'Rohit Sharma',
    phone: '+91 98765 43210',
    email: 'rohit.sharma@example.com',
    joinedTime: '10:12 AM',
    status: 'CALLED', // 'CALLED' | 'SERVING' | 'IDLE'
  });

  // Waiting Queue
  const [waitingQueue, setWaitingQueue] = useState(initialWaitingQueue);

  // Stats matching screenshot: Capacity 50, Served 18, Remaining 32
  const [capacity, setCapacity] = useState(50);
  const [alreadyServed, setAlreadyServed] = useState(18);
  const [remaining, setRemaining] = useState(32);

  // Consultation elapsed timer
  const [consultationSeconds, setConsultationSeconds] = useState(0);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState(null);

  // Service timer ticker when SERVING
  useEffect(() => {
    let interval;
    if (currentCustomer && currentCustomer.status === 'SERVING') {
      interval = setInterval(() => {
        setConsultationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentCustomer]);

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Synthesized Audio Feedback Effects using browser Web Audio API
  const playSoundEffect = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const playTone = (freq, time, duration, waveType = 'sine', volume = 0.12) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };

      if (type === 'call') {
        // 1. Call Next: Bright clinic announcement chime (C#5 -> E5 -> G#5)
        playTone(554.37, now, 0.35, 'sine', 0.12);
        playTone(659.25, now + 0.12, 0.35, 'sine', 0.12);
        playTone(830.61, now + 0.24, 0.65, 'sine', 0.14);
      } else if (type === 'start') {
        // 2. Start Service: Energetic ascending consultation activation chime (A4 -> E5 -> A5)
        playTone(440.00, now, 0.22, 'triangle', 0.12);
        playTone(659.25, now + 0.08, 0.25, 'sine', 0.14);
        playTone(880.00, now + 0.16, 0.45, 'sine', 0.13);
      } else if (type === 'skip') {
        // 3. Skip / No-Show: Soft warm descending pass tone (D5 -> A4 -> E4)
        playTone(587.33, now, 0.20, 'sine', 0.11);
        playTone(440.00, now + 0.09, 0.22, 'sine', 0.11);
        playTone(329.63, now + 0.18, 0.45, 'triangle', 0.10);
      } else if (type === 'complete') {
        // 4. Complete Service: Triumphant uplifting celebration chord (C5 -> E5 -> G5 -> C6)
        playTone(523.25, now, 0.26, 'sine', 0.12);
        playTone(659.25, now + 0.08, 0.28, 'sine', 0.13);
        playTone(783.99, now + 0.17, 0.32, 'sine', 0.14);
        playTone(1046.50, now + 0.26, 0.75, 'triangle', 0.16);
      }
    } catch {
      // AudioContext fallback handled silently
    }
  };

  // 1. Call Next Token Action
  const handleCallNext = () => {
    if (!counterActive) {
      showToast('Counter is currently inactive. Turn on counter to call next.', 'warning');
      return;
    }

    if (waitingQueue.length === 0) {
      showToast('No more customers waiting in the queue!', 'warning');
      return;
    }

    playSoundEffect('call');

    const [nextPerson, ...restQueue] = waitingQueue;
    setCurrentCustomer({
      token: nextPerson.token,
      name: nextPerson.name,
      phone: nextPerson.phone,
      email: nextPerson.email,
      joinedTime: nextPerson.joinedTime,
      status: 'CALLED',
    });
    setWaitingQueue(restQueue);
    setConsultationSeconds(0);
    showToast(`Token ${nextPerson.token} (${nextPerson.name}) called to Counter 2!`, 'success');
  };

  // 2. Start Service Action
  const handleStartService = () => {
    if (!currentCustomer || currentCustomer.status === 'IDLE') {
      showToast('Please call a customer token first.', 'warning');
      return;
    }

    if (currentCustomer.status === 'SERVING') {
      showToast('Service is already in progress.', 'info');
      return;
    }

    playSoundEffect('start');

    setCurrentCustomer((prev) => ({
      ...prev,
      status: 'SERVING',
    }));
    setConsultationSeconds(0);
    showToast(`Started service for Token ${currentCustomer.token} (${currentCustomer.name}).`, 'success');
  };

  // 3. Mark No-Show Action (cannot be marked no-show once service has started)
  const handleMarkNoShow = () => {
    if (!currentCustomer || currentCustomer.status === 'SERVING') {
      showToast('Cannot mark as no-show after service has started.', 'warning');
      return;
    }

    playSoundEffect('skip');

    const skippedToken = currentCustomer.token;
    const skippedName = currentCustomer.name;

    setCurrentCustomer(null);
    setRemaining((prev) => Math.max(0, prev - 1));
    showToast(`Token ${skippedToken} (${skippedName}) marked as No-Show.`, 'warning');
  };

  // 4. Complete Service Action (only allowed when service is started/in progress)
  const handleCompleteService = () => {
    if (!currentCustomer || currentCustomer.status !== 'SERVING') {
      showToast('Please start the service before completing.', 'warning');
      return;
    }

    playSoundEffect('complete');

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#1D68F2', '#10B981', '#38BDF8']
    });

    const finishedToken = currentCustomer.token;
    setCurrentCustomer(null);
    setAlreadyServed((prev) => prev + 1);
    setRemaining((prev) => Math.max(0, prev - 1));
    setConsultationSeconds(0);
    showToast(`Service for Token ${finishedToken} completed successfully!`, 'success');
  };

  // Toggle Counter Active status
  const handleToggleCounter = () => {
    setCounterActive(!counterActive);
    showToast(
      !counterActive 
        ? 'Counter 2 is now Active and accepting tokens.' 
        : 'Counter 2 is now Inactive (On Break).', 
      'info'
    );
  };

  // Format timer into mm:ss
  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="staff-portal-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`staff-toast staff-toast-${toastMessage.type}`}>
          {toastMessage.type === 'success' && <Check size={16} />}
          {toastMessage.type === 'warning' && <AlertCircle size={16} />}
          {toastMessage.type === 'info' && <Radio size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Upper Panel Card matching screenshot */}
      <div className="staff-upper-panel-card">
        {/* Greeting Section */}
        <div className="staff-greeting-header">
          <h1 className="staff-greeting-title">Welcome, Arindam!</h1>
          <p className="staff-greeting-subtitle">
            Manage your queue and serve customers efficiently.
          </p>
        </div>

        {/* Soft Light-Blue Tray wrapping the 4 Info Cards */}
        <div className="staff-cards-tray">
          <div className="staff-top-cards-grid">
            {/* Card 1: Selected Service */}
            <div className="staff-top-card">
              <div className="service-card-inner">
                <span className="staff-card-label">Selected Service</span>
                <div className="service-content-row">
                  <div className="service-icon-box">
                    <Stethoscope size={19} className="service-stethoscope-icon" />
                  </div>
                  <span className="service-name-text">{selectedService}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Counter */}
            <div className="staff-top-card">
              <div className="staff-card-icon-box neutral-box">
                {/* Custom Counter/Booth SVG Icon matching the screenshot */}
                <svg 
                  className="counter-booth-svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="12" rx="2" />
                  <circle cx="12" cy="10" r="2.5" />
                  <path d="M7 16v4" />
                  <path d="M17 16v4" />
                  <path d="M3 20h18" />
                </svg>
              </div>
              <div className="staff-card-text-block">
                <span className="staff-card-label">Counter</span>
                <span className="staff-card-value">Counter 2</span>
              </div>
            </div>

            {/* Card 3: Today's Date */}
            <div className="staff-top-card">
              <div className="staff-card-icon-box neutral-box">
                <Calendar size={19} className="neutral-icon" />
              </div>
              <div className="staff-card-text-block">
                <span className="staff-card-label">Today's Date</span>
                <span className="staff-card-value">8 Oct 2026</span>
              </div>
            </div>

            {/* Card 4: Status */}
            <div className="staff-top-card">
              <div className={`staff-card-icon-box status-icon-box ${counterActive ? 'success-box' : 'neutral-box'}`}>
                {counterActive ? (
                  <svg className="status-beacon-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="5" r="1.5" fill="#10B981" />
                    <circle cx="12" cy="12" r="3.8" fill="#10B981" />
                    <path d="M12 17V19.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M10.5 18.5L12 20L13.5 18.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="status-pulse-dot">
                    <span className="status-core-dot off" />
                  </div>
                )}
              </div>
              <div className="staff-card-text-block">
                <span className="staff-card-label">Status</span>
                <span className={`staff-card-value ${counterActive ? 'text-success' : 'text-muted'}`}>
                  {counterActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Serving Box (Left) & Waiting Queue (Right) */}
      <div className="staff-main-grid">
        {/* Left Section: Currently Serving & Action Buttons */}
        <section className="staff-serving-section" aria-label="Currently Serving">
          <div className="staff-serving-card">

            {/* Serving Header */}
            <div className="serving-header-wrap">
              <span className="serving-top-label">Currently Serving</span>
            </div>

            {/* Huge Token Pill */}
            <div className="serving-token-display">
              <div className="token-capsule-box">
                <span className="token-number-huge">
                  {currentCustomer ? currentCustomer.token : '--'}
                </span>
              </div>
            </div>

            {/* Customer Details Box */}
            {currentCustomer ? (
              <div className="serving-customer-box">
                <div className="customer-avatar-wrap">
                  <div className="customer-avatar-circle">
                    <User size={24} className="customer-avatar-icon" />
                  </div>
                </div>

                <div className="customer-info-content">
                  <div className="customer-name-row">
                    <span className="customer-full-name">{currentCustomer.name}</span>
                  </div>

                  <div className="customer-meta-row">
                    <div className="customer-meta-item">
                      <Phone size={14} className="meta-icon" />
                      <span className="meta-text">{currentCustomer.phone}</span>
                    </div>

                    <div className="customer-meta-item">
                      <Mail size={14} className="meta-icon" />
                      <span className="meta-text">{currentCustomer.email}</span>
                    </div>

                    <div className="customer-meta-item">
                      <Clock size={14} className="meta-icon" />
                      <span className="meta-text">Joined {currentCustomer.joinedTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="serving-customer-box empty-state">
                <p className="no-serving-text">No customer currently at Counter 2. Click "Call Next" to proceed.</p>
              </div>
            )}

            {/* 4 Action Buttons Grid */}
            <div className="staff-actions-grid">
              {/* Button 1: Call Next (Blue) */}
              <button 
                type="button" 
                className="staff-action-btn btn-call-next"
                onClick={handleCallNext}
                disabled={!counterActive || waitingQueue.length === 0 || (currentCustomer && currentCustomer.status !== 'IDLE')}
                title={
                  !counterActive 
                    ? 'Counter is inactive' 
                    : waitingQueue.length === 0 
                      ? 'No waiting customers' 
                      : currentCustomer 
                        ? 'Finish or skip current customer before calling next' 
                        : 'Call the next token'
                }
                aria-label="Call Next Token"
              >
                <div className="btn-icon-wrapper">
                  <Volume2 size={24} className="action-btn-icon" />
                </div>
                <div className="btn-text-block">
                  <span className="action-btn-title">Call Next</span>
                  <span className="action-btn-sub">Call the next token</span>
                </div>
              </button>

              {/* Button 2: Start Service (Green) - Replaced by timer when service started */}
              <button 
                type="button" 
                className={`staff-action-btn btn-start-service ${currentCustomer && currentCustomer.status === 'SERVING' ? 'is-active-service' : ''}`}
                onClick={handleStartService}
                disabled={!currentCustomer || currentCustomer.status === 'SERVING'}
                title={
                  !currentCustomer 
                    ? 'Call a token first' 
                    : currentCustomer.status === 'SERVING' 
                      ? `Service in progress: ${formatTimer(consultationSeconds)}` 
                      : 'Begin consultation'
                }
                aria-label={currentCustomer && currentCustomer.status === 'SERVING' ? `Service Timer: ${formatTimer(consultationSeconds)}` : 'Start Service'}
              >
                <div className="btn-icon-wrapper">
                  {currentCustomer && currentCustomer.status === 'SERVING' ? (
                    <Clock size={24} className="action-btn-icon timer-ticking-icon" />
                  ) : (
                    <PlayCircle size={24} className="action-btn-icon" />
                  )}
                </div>
                <div className="btn-text-block">
                  {currentCustomer && currentCustomer.status === 'SERVING' ? (
                    <>
                      <span className="action-btn-title action-btn-timer">
                        {formatTimer(consultationSeconds)}
                      </span>
                      <span className="action-btn-sub">In Service</span>
                    </>
                  ) : (
                    <>
                      <span className="action-btn-title">Start Service</span>
                      <span className="action-btn-sub">Begin consultation</span>
                    </>
                  )}
                </div>
              </button>

              {/* Button 3: Mark No-Show (Orange) - Disabled if service started */}
              <button 
                type="button" 
                className="staff-action-btn btn-no-show"
                onClick={handleMarkNoShow}
                disabled={!currentCustomer || currentCustomer.status === 'SERVING'}
                title={
                  !currentCustomer 
                    ? 'No active customer' 
                    : currentCustomer.status === 'SERVING' 
                      ? 'Cannot mark as no-show once service has started' 
                      : 'Skip this token'
                }
                aria-label="Mark No Show"
              >
                <div className="btn-icon-wrapper">
                  <SkipForward size={24} className="action-btn-icon" />
                </div>
                <div className="btn-text-block">
                  <span className="action-btn-title">Mark No-Show</span>
                  <span className="action-btn-sub">Skip this token</span>
                </div>
              </button>

              {/* Button 4: Complete (Slate Gray) - Disabled if service not started */}
              <button 
                type="button" 
                className="staff-action-btn btn-complete"
                onClick={handleCompleteService}
                disabled={!currentCustomer || currentCustomer.status !== 'SERVING'}
                title={
                  !currentCustomer 
                    ? 'No active customer' 
                    : currentCustomer.status !== 'SERVING' 
                      ? 'Must start service before completing' 
                      : 'Finish service'
                }
                aria-label="Complete Service"
              >
                <div className="btn-icon-wrapper">
                  <CheckCircle2 size={24} className="action-btn-icon" />
                </div>
                <div className="btn-text-block">
                  <span className="action-btn-title">Complete</span>
                  <span className="action-btn-sub">Finish service</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Right Section: Waiting Queue Card */}
        <aside className="staff-queue-aside" aria-label="Waiting Queue">
          <div className="staff-queue-card">
            {/* Queue Header */}
            <div className="queue-card-header">
              <h2 className="queue-header-title">
                <Users size={19} className="queue-title-icon" />
                <span>Waiting Queue</span>
              </h2>
              <div className="queue-count-badge">
                <span className="queue-count-num">{waitingQueue.length}</span>
              </div>
            </div>

            {/* Queue Items List */}
            <div className="queue-items-container">
              {waitingQueue.length > 0 ? (
                waitingQueue.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`queue-item-row ${index === 0 ? 'next-waiting-token' : ''}`}
                  >
                    {/* Index Number */}
                    <span className="queue-item-index">{index + 1}</span>

                    {/* Token Number */}
                    <span className="queue-item-token">{item.token}</span>

                    {/* Customer Info */}
                    <div className="queue-item-details">
                      <span className="queue-customer-name">{item.name}</span>
                      <span className="queue-customer-time">Joined {item.joinedTime}</span>
                    </div>

                    {/* Status Pill Badge */}
                    <div className={`queue-status-pill ${index === 0 ? 'next-status-pill' : ''}`}>
                      <span>Waiting</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="queue-empty-state">
                  <p>Queue is empty</p>
                  <span>No customers currently waiting</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Summary Bar Card matching screenshot */}
      <footer className="staff-summary-footer">
        {/* Left: Service & Counter Info */}
        <div className="summary-left-block">
          <div className="summary-service-icon-box">
            <Stethoscope size={24} className="summary-stethoscope-icon" />
          </div>
          <div className="summary-service-text">
            <h3 className="summary-service-title">{selectedService}</h3>
            <span className="summary-counter-subtitle">Counter 2</span>
          </div>
        </div>

        {/* Divider 1 */}
        <div className="summary-col-divider" />

        {/* Middle Metrics Container */}
        <div className="summary-metrics-container">
          {/* Middle Metric 1: Today's Capacity */}
          <div className="summary-metric-col">
            <span className="metric-label">Today's Capacity</span>
            <span className="metric-val">{capacity}</span>
          </div>

          {/* Inner Divider 1 */}
          <div className="summary-col-divider" />

          {/* Middle Metric 2: Already Served */}
          <div className="summary-metric-col">
            <span className="metric-label">Already Served</span>
            <span className="metric-val">{alreadyServed}</span>
          </div>

          {/* Inner Divider 2 */}
          <div className="summary-col-divider" />

          {/* Middle Metric 3: Remaining */}
          <div className="summary-metric-col">
            <span className="metric-label">Remaining</span>
            <span className="metric-val metric-val-remaining">{remaining}</span>
          </div>
        </div>

        {/* Divider 4 */}
        <div className="summary-col-divider" />

        {/* Right: Counter Status Toggle */}
        <div className="summary-right-status">
          <span className="counter-status-header-label">Counter Status</span>
          <button 
            type="button" 
            className={`counter-toggle-capsule ${counterActive ? 'active' : 'inactive'}`}
            onClick={handleToggleCounter}
            aria-label="Toggle Counter Active Status"
          >
            <div className={`capsule-switch-pill ${counterActive ? 'active' : 'inactive'}`}>
              <div className="switch-slider-knob" />
            </div>
            <span className={`capsule-status-text ${counterActive ? 'text-active' : 'text-inactive'}`}>
              {counterActive ? 'Active' : 'Paused'}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default StaffDashboard;
