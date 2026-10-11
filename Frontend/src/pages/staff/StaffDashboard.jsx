import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import queueApi from '../../services/api/queue.api';
import counterApi from '../../services/api/counter.api';
import tokenStorage from '../../services/storage/tokenStorage';
import { 
  joinQueueRoom, 
  leaveQueueRoom, 
  onQueueUpdated, 
  joinTvDisplay, 
  onTvUpdated 
} from '../../services/socket/socketClient';
import './StaffDashboard.css';

export const StaffDashboard = () => {
  const staffUser = tokenStorage.getUser();

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [hasAssignedCounter, setHasAssignedCounter] = useState(true);

  // Counter & Service metadata from DB
  const [counterData, setCounterData] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [counterActive, setCounterActive] = useState(true);

  // Active Customer state
  const [currentCustomer, setCurrentCustomer] = useState(null);

  // Waiting Queue from DB
  const [waitingQueue, setWaitingQueue] = useState([]);

  // Metrics from DB: Capacity, Served, Remaining, Waiting
  const [stats, setStats] = useState({
    todayAppointments: 0,
    capacity: 0,
    alreadyServed: 0,
    waiting: 0,
    remaining: 0,
  });

  // Consultation elapsed timer
  const [consultationSeconds, setConsultationSeconds] = useState(0);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState(null);

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
        // 2. Start Service: Consultation activation chime (A4 -> E5 -> A5)
        playTone(440.00, now, 0.22, 'triangle', 0.12);
        playTone(659.25, now + 0.08, 0.25, 'sine', 0.14);
        playTone(880.00, now + 0.16, 0.45, 'sine', 0.13);
      } else if (type === 'skip') {
        // 3. Skip / No-Show: Pass tone (D5 -> A4 -> E4)
        playTone(587.33, now, 0.20, 'sine', 0.11);
        playTone(440.00, now + 0.09, 0.22, 'sine', 0.11);
        playTone(329.63, now + 0.18, 0.45, 'triangle', 0.10);
      } else if (type === 'complete') {
        // 4. Complete Service: Celebration chord (C5 -> E5 -> G5 -> C6)
        playTone(523.25, now, 0.26, 'sine', 0.12);
        playTone(659.25, now + 0.08, 0.28, 'sine', 0.13);
        playTone(783.99, now + 0.17, 0.32, 'sine', 0.14);
        playTone(1046.50, now + 0.26, 0.75, 'triangle', 0.16);
      }
    } catch {
      // AudioContext fallback handled silently
    }
  };

  // Fetch real staff overview from Backend API
  const loadStaffOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await queueApi.getStaffOverview();
      const data = res?.data || {};

      if (!data.hasAssignedCounter) {
        setHasAssignedCounter(false);
        setIsLoading(false);
        return;
      }

      setHasAssignedCounter(true);
      setCounterData(data.counter || null);
      setCounterActive(Boolean(data.counter?.isActive));
      setQueueData(data.queue || null);
      setCurrentCustomer(data.currentCustomer || null);
      setWaitingQueue(Array.isArray(data.waitingQueue) ? data.waitingQueue : []);
      setStats({
        todayAppointments: data.stats?.todayAppointments ?? 0,
        capacity: data.stats?.capacity ?? 0,
        alreadyServed: data.stats?.alreadyServed ?? 0,
        waiting: data.stats?.waiting ?? (data.waitingQueue?.length || 0),
        remaining: data.stats?.remaining ?? 0,
      });

      // Calculate elapsed timer if currently serving
      if (data.currentCustomer && data.currentCustomer.status === 'SERVING' && data.currentCustomer.servingAt) {
        const elapsed = Math.floor((Date.now() - new Date(data.currentCustomer.servingAt).getTime()) / 1000);
        setConsultationSeconds(Math.max(0, elapsed));
      } else if (!data.currentCustomer || data.currentCustomer.status !== 'SERVING') {
        setConsultationSeconds(0);
      }

    } catch (err) {
      console.error('[StaffDashboard] Failed to fetch staff queue overview:', err);
      if (!isSilent) {
        showToast(err.message || 'Unable to load staff queue data.', 'warning');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadStaffOverview(false);
  }, [loadStaffOverview]);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    // Join TV channel for general counter updates
    joinTvDisplay();

    // If active queue exists, join that queue room
    if (queueData?.id) {
      joinQueueRoom(queueData.id);
    }

    const unsubQueue = onQueueUpdated((payload) => {
      console.log('[StaffDashboard] Real-time queue update received:', payload);
      loadStaffOverview(true);
    });

    const unsubTv = onTvUpdated((payload) => {
      console.log('[StaffDashboard] Real-time TV update received:', payload);
      loadStaffOverview(true);
    });

    return () => {
      unsubQueue();
      unsubTv();
      if (queueData?.id) {
        leaveQueueRoom(queueData.id);
      }
    };
  }, [queueData?.id, loadStaffOverview]);

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

  // 1. Call Next Token Action
  const handleCallNext = async () => {
    if (!counterActive) {
      showToast('Counter is currently inactive. Turn on counter to call next.', 'warning');
      return;
    }

    if (!queueData?.id) {
      showToast('No active queue available for this service today.', 'warning');
      return;
    }

    if (waitingQueue.length === 0) {
      showToast('No more customers waiting in the queue!', 'warning');
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await queueApi.callNext(queueData.id);
      const calledData = res?.data || {};

      playSoundEffect('call');

      const calledTokenStr = `${counterData?.service?.code || 'T'}-${String(calledData.tokenNumber).padStart(3, '0')}`;
      showToast(`Token ${calledTokenStr} called to ${counterData?.name || 'Counter'}!`, 'success');

      // Refresh overview
      await loadStaffOverview(true);
    } catch (err) {
      console.error('Call next error:', err);
      showToast(err.message || 'Failed to call next customer.', 'warning');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Start Service Action
  const handleStartService = async () => {
    if (!currentCustomer) {
      showToast('Please call a customer token first.', 'warning');
      return;
    }

    if (currentCustomer.status === 'SERVING') {
      showToast('Service is already in progress.', 'info');
      return;
    }

    setIsActionLoading(true);
    try {
      await queueApi.startService(currentCustomer.queueEntryId);

      playSoundEffect('start');
      setConsultationSeconds(0);
      showToast(`Started service for Token ${currentCustomer.token}.`, 'success');

      await loadStaffOverview(true);
    } catch (err) {
      console.error('Start service error:', err);
      showToast(err.message || 'Failed to start service.', 'warning');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Mark No-Show Action
  const handleMarkNoShow = async () => {
    if (!currentCustomer) {
      showToast('No customer currently called.', 'warning');
      return;
    }

    if (currentCustomer.status === 'SERVING') {
      showToast('Cannot mark as no-show after service has started.', 'warning');
      return;
    }

    setIsActionLoading(true);
    try {
      await queueApi.skipCustomer(currentCustomer.queueEntryId);

      playSoundEffect('skip');
      showToast(`Token ${currentCustomer.token} marked as No-Show.`, 'warning');

      await loadStaffOverview(true);
    } catch (err) {
      console.error('Skip error:', err);
      showToast(err.message || 'Failed to mark customer as no-show.', 'warning');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Complete Service Action
  const handleCompleteService = async () => {
    if (!currentCustomer || currentCustomer.status !== 'SERVING') {
      showToast('Please start the service before completing.', 'warning');
      return;
    }

    setIsActionLoading(true);
    try {
      await queueApi.completeService(currentCustomer.queueEntryId);

      playSoundEffect('complete');

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#1D68F2', '#10B981', '#38BDF8']
      });

      showToast(`Service for Token ${currentCustomer.token} completed successfully!`, 'success');

      await loadStaffOverview(true);
    } catch (err) {
      console.error('Complete service error:', err);
      showToast(err.message || 'Failed to complete service.', 'warning');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Toggle Counter Active status
  const handleToggleCounter = async () => {
    if (!counterData?.id) return;

    const nextState = !counterActive;
    try {
      await counterApi.updateCounter(counterData.id, { isActive: nextState });
      setCounterActive(nextState);

      showToast(
        nextState 
          ? `${counterData.name || 'Counter'} is now Active and accepting tokens.` 
          : `${counterData.name || 'Counter'} is now Inactive (Paused).`, 
        'info'
      );

      await loadStaffOverview(true);
    } catch (err) {
      console.error('Toggle counter error:', err);
      showToast(err.message || 'Unable to update counter status.', 'warning');
    }
  };

  // Format timer into mm:ss
  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Format today's date matching "8 Oct 2026"
  const formatTodayDisplayDate = () => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const serviceName = counterData?.service?.name || 'Service Consultation';
  const counterDisplayName = counterData?.name || 'Counter';

  if (!hasAssignedCounter && !isLoading) {
    return (
      <div className="staff-portal-container" style={{ padding: '60px 44px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '560px',
          margin: '0 auto',
          padding: '36px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #EEF2F6',
          boxShadow: '0 10px 30px -4px rgba(15, 23, 42, 0.08)'
        }}>
          <AlertCircle size={48} color="#D97706" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
            No Counter Assigned Yet
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
            Your account ({staffUser?.email || 'Staff'}) is not currently assigned to any service counter.
            Please contact an Administrator to assign you to a counter via <strong>Admin &gt; Counters</strong>.
          </p>
          <button
            type="button"
            onClick={() => loadStaffOverview(false)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1D68F2',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

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

      {/* Upper Panel Card */}
      <div className="staff-upper-panel-card">
        {/* Greeting Section */}
        <div className="staff-greeting-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <h1 className="staff-greeting-title">
                Welcome, {staffUser?.name ? staffUser.name.split(' ')[0] : 'Staff'}!
              </h1>
              <p className="staff-greeting-subtitle">
                Manage your queue and serve customers efficiently.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadStaffOverview(false)}
              style={{
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Refresh Queue"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
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
                  <span className="service-name-text" title={serviceName}>
                    {serviceName}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Counter */}
            <div className="staff-top-card">
              <div className="staff-card-icon-box neutral-box">
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
                <span className="staff-card-value">{counterDisplayName}</span>
              </div>
            </div>

            {/* Card 3: Today's Date */}
            <div className="staff-top-card">
              <div className="staff-card-icon-box neutral-box">
                <Calendar size={19} className="neutral-icon" />
              </div>
              <div className="staff-card-text-block">
                <span className="staff-card-label">Today's Date</span>
                <span className="staff-card-value">{formatTodayDisplayDate()}</span>
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
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: currentCustomer.status === 'SERVING' ? '#DBEAFE' : '#FEF3C7',
                      color: currentCustomer.status === 'SERVING' ? '#1D68F2' : '#D97706'
                    }}>
                      {currentCustomer.status === 'SERVING' ? 'IN SERVICE' : 'CALLED'}
                    </span>
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
                <p className="no-serving-text">
                  No customer currently at {counterDisplayName}. Click "Call Next" to proceed.
                </p>
              </div>
            )}

            {/* 4 Action Buttons Grid */}
            <div className="staff-actions-grid">
              {/* Button 1: Call Next (Blue) */}
              <button 
                type="button" 
                className="staff-action-btn btn-call-next"
                onClick={handleCallNext}
                disabled={!counterActive || waitingQueue.length === 0 || isActionLoading || (currentCustomer && currentCustomer.status !== 'IDLE')}
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

              {/* Button 2: Start Service (Green) */}
              <button 
                type="button" 
                className={`staff-action-btn btn-start-service ${currentCustomer && currentCustomer.status === 'SERVING' ? 'is-active-service' : ''}`}
                onClick={handleStartService}
                disabled={!currentCustomer || currentCustomer.status === 'SERVING' || isActionLoading}
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

              {/* Button 3: Mark No-Show (Orange) */}
              <button 
                type="button" 
                className="staff-action-btn btn-no-show"
                onClick={handleMarkNoShow}
                disabled={!currentCustomer || currentCustomer.status === 'SERVING' || isActionLoading}
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

              {/* Button 4: Complete (Slate Gray) */}
              <button 
                type="button" 
                className="staff-action-btn btn-complete"
                onClick={handleCompleteService}
                disabled={!currentCustomer || currentCustomer.status !== 'SERVING' || isActionLoading}
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
                    key={item.id || item.queueEntryId || index} 
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

      {/* Bottom Summary Bar Card */}
      <footer className="staff-summary-footer">
        {/* Left: Service & Counter Info */}
        <div className="summary-left-block">
          <div className="summary-service-icon-box">
            <Stethoscope size={24} className="summary-stethoscope-icon" />
          </div>
          <div className="summary-service-text">
            <h3 className="summary-service-title">{serviceName}</h3>
            <span className="summary-counter-subtitle">{counterDisplayName}</span>
          </div>
        </div>

        {/* Divider 1 */}
        <div className="summary-col-divider" />

        {/* Middle Metrics Container */}
        <div className="summary-metrics-container">
          {/* Middle Metric 1: Today's Appointments */}
          <div className="summary-metric-col" title="Total appointments for this service today">
            <span className="metric-label">Today's Appointments</span>
            <span className="metric-val">{stats.todayAppointments}</span>
          </div>

          {/* Inner Divider 1 */}
          <div className="summary-col-divider" />

          {/* Middle Metric 2: Already Served */}
          <div className="summary-metric-col" title="Total customers served today">
            <span className="metric-label">Already Served</span>
            <span className="metric-val">{stats.alreadyServed}</span>
          </div>

          {/* Inner Divider 2 */}
          <div className="summary-col-divider" />

          {/* Middle Metric 3: Waiting / Remaining */}
          <div className="summary-metric-col" title="Current waiting customers">
            <span className="metric-label">Waiting in Queue</span>
            <span className="metric-val metric-val-remaining">{stats.waiting}</span>
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
