import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Radio, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  Ticket, 
  Check,
  RefreshCw,
  ArrowRight,
  BellRing
} from 'lucide-react';
import QueueWaitingBanner from '../../components/customer/QueueWaitingBanner';
import generalConsultImg from '../../assets/images/bookings/general_consultation.jpg';
import appointmentApi from '../../services/api/appointment.api';
import queueApi from '../../services/api/queue.api';
import {
  connectSocket,
  joinQueueRoom,
  leaveQueueRoom,
  onQueueJoined,
  onQueueUpdated,
  onQueueError
} from '../../services/socket/socketClient';
import './VirtualQueue.css';

export const VirtualQueue = ({
  queueData: propQueueData
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state?.queueData || location.state?.booking;

  const [liveData, setLiveData] = useState(stateData || null);
  const [todayBookedAppt, setTodayBookedAppt] = useState(null);
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [calledAlert, setCalledAlert] = useState(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Audio chime notification for when customer's token is called
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.2);
      gain2.gain.setValueAtTime(0.2, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.7);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Helper to format today's date in YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format ISO timestamp to human-readable 12h time string
  const formatTime = (ts) => {
    if (!ts) return null;
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  };

  const loadQueueStatus = useCallback(async () => {
    try {
      const res = await appointmentApi.getMyAppointments();
      const appts = Array.isArray(res?.data) ? res.data : [];
      const today = getTodayDateString();

      // Target appointment ID if navigated with state or already loaded
      const targetAppointmentId = stateData?.appointmentId || location.state?.appointmentId;

      // 1. If target appointment ID is known, find that specific appointment first!
      let activeAppt = targetAppointmentId 
        ? appts.find((a) => a.appointmentId === targetAppointmentId)
        : null;

      // 2. If not found by specific appointmentId, prioritize active appointments for today (CHECKED_IN or IN_SERVICE)
      if (!activeAppt) {
        activeAppt = appts.find(
          (a) => a.appointmentDate === today && ['CHECKED_IN', 'IN_SERVICE'].includes(a.status)
        );
      }

      // 3. Fallback to any active checked-in appointment
      if (!activeAppt) {
        activeAppt = appts.find(
          (a) => ['CHECKED_IN', 'IN_SERVICE'].includes(a.status)
        );
      }

      // 4. Finally fallback to today's completed or no-show appointment
      if (!activeAppt) {
        activeAppt = appts.find(
          (a) => a.appointmentDate === today && ['COMPLETED', 'NO_SHOW'].includes(a.status)
        );
      }

      if (activeAppt) {
        const service = activeAppt.serviceId || {};
        const prefix = service.code || 'T';
        let qEntry = activeAppt.queueEntryId || {};
        const isTargetAppt = Boolean(stateData?.appointmentId && stateData.appointmentId === activeAppt.appointmentId);
        let rawTokenNum = qEntry.tokenNumber ?? (typeof activeAppt.tokenNumber === 'number' ? activeAppt.tokenNumber : (isTargetAppt ? stateData?.rawTokenNumber : null));
        let tokenFormatted = qEntry.token || (typeof activeAppt.tokenNumber === 'string' && activeAppt.tokenNumber.includes('-') ? activeAppt.tokenNumber : null) || (rawTokenNum ? `${prefix}-${String(rawTokenNum).padStart(3, '0')}` : (isTargetAppt ? stateData?.tokenNumber : '1'));

        let currentlyServing = '—';
        let peopleBeforeYou = 0;
        let entryStatus = qEntry.status || activeAppt.status;
        let counterName = qEntry.counterId?.name || (qEntry.counterId ? `Counter ${qEntry.counterId}` : 'Counter 1');
        let activeCounters = [];

        // Fetch live queue status if queueId exists, passing activeAppt.appointmentId for exact entry match
        const queueId = qEntry.queueId?._id || qEntry.queueId || activeAppt.queueId || stateData?.queueId;
        if (queueId) {
          try {
            const queueRes = await queueApi.getQueueStatus(queueId, activeAppt.appointmentId);
            if (queueRes?.data) {
              const qObj = queueRes.data.queue || {};
              currentlyServing = qObj.currentTokenFormatted || (qObj.currentToken > 0 ? `${prefix}-${String(qObj.currentToken).padStart(3, '0')}` : '—');
              peopleBeforeYou = queueRes.data.peopleBeforeYou ?? 0;
              activeCounters = Array.isArray(queueRes.data.activeCounters) ? queueRes.data.activeCounters : [];

              if (queueRes.data.queueEntry) {
                const freshQ = queueRes.data.queueEntry;
                qEntry = { ...qEntry, ...freshQ };
                if (freshQ.status) entryStatus = freshQ.status;
                if (freshQ.token) tokenFormatted = freshQ.token;
                if (freshQ.tokenNumber != null) rawTokenNum = freshQ.tokenNumber;
                if (freshQ.counterId?.name) counterName = freshQ.counterId.name;
              }
            }
          } catch (qErr) {
            console.warn('Could not fetch real-time queue counters:', qErr);
          }
        }

        const checkInTimeStr = formatTime(qEntry.joinedAt) || formatTime(activeAppt.checkedInAt) || 'Today';
        const calledTimeStr = formatTime(qEntry.calledAt);
        const servingTimeStr = formatTime(qEntry.servingAt);
        const completedTimeStr = formatTime(qEntry.completedAt) || formatTime(activeAppt.completedAt);
        const skippedTimeStr = ['NO_SHOW', 'SKIPPED'].includes(entryStatus)
          ? (formatTime(activeAppt.noShowAt) || formatTime(qEntry.updatedAt) || 'Missed')
          : null;

        const isCalled = entryStatus === 'CALLED';
        const isServing = entryStatus === 'SERVING' || entryStatus === 'IN_SERVICE';
        const isDone = entryStatus === 'COMPLETED';
        const isNoShow = entryStatus === 'NO_SHOW' || entryStatus === 'SKIPPED';
        const waitTimeText = isCalled
          ? 'Proceed to counter'
          : isServing
          ? 'In consultation'
          : isDone
          ? 'Completed'
          : isNoShow
          ? 'No Show'
          : `${Math.max(5, (peopleBeforeYou + 1) * 10)} mins`;

        setLiveData({
          queueId: queueId ? String(queueId) : null,
          queueEntryId: qEntry._id || activeAppt.queueEntryId?._id || activeAppt.queueEntryId,
          currentlyServing,
          counter: counterName,
          activeCounters,
          userToken: tokenFormatted,
          userTokenNumber: rawTokenNum,
          userPosition: peopleBeforeYou,
          estimatedWaitTime: waitTimeText,
          serviceName: service.name || 'Service Consultation',
          serviceDescription: service.description || 'Please wait for your token to be called at the counter.',
          serviceImage: service.imageUrl || generalConsultImg,
          appointmentId: activeAppt.appointmentId || '—',
          appointmentSchedule: service.service_time || 'Today',
          checkInTime: checkInTimeStr,
          calledTime: calledTimeStr,
          servingTime: servingTimeStr,
          completedTime: completedTimeStr,
          skippedTime: skippedTimeStr,
          status: entryStatus
        });

        if (isCalled) {
          setCalledAlert({
            tokenNumber: tokenFormatted,
            counter: counterName
          });
        }

        setTodayBookedAppt(null);
      } else {
        // Check if there is an appointment booked for today that hasn't joined queue yet
        const todayBooked = appts.find(
          (a) => a.appointmentDate === today && a.status === 'BOOKED'
        );
        if (todayBooked) {
          setTodayBookedAppt(todayBooked);
        }
      }
    } catch (err) {
      console.error('Failed to load virtual queue data:', err);
    }
  }, [stateData, location.state]);

  // Keep fresh references for async socket handlers to avoid stale closures
  const liveDataRef = useRef(liveData);
  liveDataRef.current = liveData;

  const loadQueueStatusRef = useRef(loadQueueStatus);
  loadQueueStatusRef.current = loadQueueStatus;

  useEffect(() => {
    loadQueueStatus();
  }, [loadQueueStatus]);

  const activeQueueId = liveData?.queueId || stateData?.queueId;

  // Real-time Socket.IO room connection & dynamic event handling
  useEffect(() => {
    const s = connectSocket();
    if (!s) return;

    if (s.connected) {
      setIsSocketLive(true);
    }

    const currentApptId = liveDataRef.current?.appointmentId || stateData?.appointmentId || location.state?.appointmentId;

    const handleConnect = () => {
      console.log('[VirtualQueue] Socket connected');
      setIsSocketLive(true);
      if (activeQueueId) {
        joinQueueRoom(activeQueueId, currentApptId);
      }
    };

    const handleDisconnect = () => {
      console.log('[VirtualQueue] Socket disconnected');
      setIsSocketLive(false);
    };

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    if (activeQueueId) {
      joinQueueRoom(activeQueueId, currentApptId);
    }

    const unsubJoined = onQueueJoined((data) => {
      console.log('[VirtualQueue] Socket joined room for queue:', data);
      setIsSocketLive(true);
      if (data?.status && ['WAITING', 'CALLED', 'SERVING', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW', 'SKIPPED'].includes(data.status)) {
        setLiveData((prev) => {
          if (!prev) return prev;
          if (!data.queueEntryId || !prev.queueEntryId || data.queueEntryId === prev.queueEntryId) {
            return { ...prev, status: data.status };
          }
          return prev;
        });
      }
    });

    const unsubError = onQueueError((err) => {
      console.warn('[VirtualQueue] Socket error event:', err);
    });

    // Handle incoming live broadcast updates (CUSTOMER_CALLED, SERVICE_STARTED, etc.)
    const unsubUpdated = onQueueUpdated(async (payload) => {
      console.log('[VirtualQueue] Real-time queue:updated broadcast received:', payload);
      if (!payload) return;

      const curData = liveDataRef.current;
      const targetQId = curData?.queueId || activeQueueId;

      if (payload.queueId && targetQId && String(payload.queueId) !== String(targetQId)) {
        return;
      }

      setIsSocketLive(true);

      const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const payloadTokenNum = payload.tokenNumber;
      const payloadTokenStr = payload.token ? String(payload.token).trim() : null;
      const myTokenStr = curData?.userToken ? String(curData.userToken).trim() : (stateData?.tokenNumber ? String(stateData.tokenNumber).trim() : null);
      const myTokenNum = curData?.userTokenNumber ?? stateData?.rawTokenNumber;

      const isMyToken = Boolean(
        (payloadTokenStr && myTokenStr && payloadTokenStr.toLowerCase() === myTokenStr.toLowerCase()) ||
        (payloadTokenNum && myTokenNum && Number(payloadTokenNum) === Number(myTokenNum)) ||
        (payloadTokenStr && myTokenNum && payloadTokenStr.endsWith(`-${String(myTokenNum).padStart(3, '0')}`))
      );

      // Instant optimistic update for immediate visual feedback
      if (payload.type === 'CUSTOMER_CALLED') {
        const counterDisplayName = payload.counterName || (payload.counterId ? `Counter ${payload.counterId}` : 'Counter 1');
        if (isMyToken) {
          playChime();
          setCalledAlert({
            tokenNumber: payloadTokenStr || myTokenStr,
            counter: counterDisplayName
          });
          setLiveData((prev) => prev ? {
            ...prev,
            counter: counterDisplayName,
            status: 'CALLED',
            calledTime: nowTimeStr,
            userPosition: 0,
            estimatedWaitTime: 'Proceed to counter'
          } : prev);
        }
      } else if (payload.type === 'SERVICE_STARTED') {
        if (isMyToken) {
          setLiveData((prev) => prev ? {
            ...prev,
            status: 'SERVING',
            servingTime: nowTimeStr,
            estimatedWaitTime: 'In consultation'
          } : prev);
        }
      } else if (payload.type === 'SERVICE_COMPLETED') {
        if (isMyToken) {
          setLiveData((prev) => prev ? {
            ...prev,
            status: 'COMPLETED',
            completedTime: nowTimeStr,
            userPosition: 0,
            estimatedWaitTime: 'Completed'
          } : prev);
        }
      } else if (payload.type === 'CUSTOMER_SKIPPED') {
        if (isMyToken) {
          setLiveData((prev) => prev ? {
            ...prev,
            status: 'NO_SHOW',
            skippedTime: nowTimeStr,
            userPosition: 0,
            estimatedWaitTime: 'No Show'
          } : prev);
        }
      }

      // Re-sync authoritative queue state from backend (active counters, position, current token)
      if (loadQueueStatusRef.current) {
        await loadQueueStatusRef.current();
      }
    });

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      unsubJoined();
      unsubError();
      unsubUpdated();
      if (activeQueueId) {
        leaveQueueRoom(activeQueueId);
      }
    };
  }, [activeQueueId, stateData?.tokenNumber, stateData?.rawTokenNumber]);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await loadQueueStatus();
    setTimeout(() => setIsManualSyncing(false), 500);
  };

  const currentStatus = (liveData?.status || 'WAITING').toUpperCase();

  const isWaiting = ['WAITING', 'CHECKED_IN'].includes(currentStatus);
  const isCalled = currentStatus === 'CALLED';
  const isServing = ['SERVING', 'IN_SERVICE'].includes(currentStatus);
  const isNoShow = ['NO_SHOW', 'SKIPPED'].includes(currentStatus);
  const isCompleted = currentStatus === 'COMPLETED';

  // Step 2 (Waiting) state
  const isStep2Completed = ['CALLED', 'SERVING', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW', 'SKIPPED'].includes(currentStatus);
  const step2Status = isWaiting ? 'active' : isStep2Completed ? 'completed' : 'pending';

  // Step 3 (Consultation / Called / Serving / No Show) state
  const isStep3Active = isCalled || isServing;
  const isStep3Completed = isCompleted;
  let step3StatusClass = 'pending';
  if (isNoShow) step3StatusClass = 'skipped';
  else if (isStep3Completed) step3StatusClass = 'completed';
  else if (isStep3Active) step3StatusClass = 'active';

  // Step 4 (Completed) state
  let step4StatusClass = isCompleted ? 'completed' : isNoShow ? 'pending' : 'pending';

  // Milestone connecting lines
  const line1Completed = isWaiting || isStep2Completed;
  const line2Completed = isStep2Completed;
  const line3Completed = isCompleted;

  const queueData = {
    currentlyServing: liveData?.currentlyServing || stateData?.currentlyServing || propQueueData?.currentlyServing || '—',
    counter: liveData?.counter || stateData?.counter || propQueueData?.counter || 'Counter 1',
    activeCounters: liveData?.activeCounters || stateData?.activeCounters || [],
    userToken: liveData?.userToken ?? stateData?.tokenNumber ?? propQueueData?.userToken ?? '—',
    userPosition: liveData?.userPosition ?? stateData?.peopleAhead ?? propQueueData?.userPosition ?? 0,
    estimatedWaitTime: liveData?.estimatedWaitTime || stateData?.estimatedWait || propQueueData?.estimatedWaitTime || '10 mins',
    serviceName: liveData?.serviceName || stateData?.serviceName || propQueueData?.serviceName || 'Service Consultation',
    serviceDescription: liveData?.serviceDescription || stateData?.serviceDescription || propQueueData?.serviceDescription || 'Please wait for your token to be called at the counter.',
    serviceImage: liveData?.serviceImage || stateData?.serviceImage || propQueueData?.serviceImage || generalConsultImg,
    appointmentId: liveData?.appointmentId || stateData?.appointmentId || propQueueData?.appointmentId || '—',
    appointmentSchedule: liveData?.appointmentSchedule || stateData?.appointmentSchedule || propQueueData?.appointmentSchedule || 'Today',
    checkInTime: liveData?.checkInTime || stateData?.joinedAt || propQueueData?.checkInTime || 'Just now',
    calledTime: liveData?.calledTime || null,
    servingTime: liveData?.servingTime || null,
    completedTime: liveData?.completedTime || null,
    skippedTime: liveData?.skippedTime || null,
    status: currentStatus,
    ...(propQueueData || {})
  };

  // Dynamic step titles and descriptions based on live queue status
  const step1Timestamp = queueData.checkInTime || 'Joined';

  let step2TopTime = 'Pending';
  if (isStep2Completed) {
    step2TopTime = queueData.calledTime || 'Turn Reached';
  } else if (isWaiting) {
    step2TopTime = `~${queueData.estimatedWaitTime}`;
  }

  let step2Title = 'Waiting in Line';
  let step2Desc = 'Your turn is coming soon';
  if (isWaiting) {
    if (queueData.userPosition === 0) {
      step2Desc = "You're next in line!";
    } else if (queueData.userPosition === 1) {
      step2Desc = '1 person ahead of you';
    } else {
      step2Desc = `${queueData.userPosition} people ahead of you`;
    }
  } else if (isStep2Completed) {
    step2Title = 'Queue Cleared';
    step2Desc = 'Turn reached at counter';
  }

  let step3TopTime = 'Pending';
  if (isNoShow) {
    step3TopTime = queueData.skippedTime || 'No-Show';
  } else if (isCompleted) {
    step3TopTime = queueData.servingTime || queueData.calledTime || 'Served';
  } else if (isServing) {
    step3TopTime = queueData.servingTime || 'Serving';
  } else if (isCalled) {
    step3TopTime = queueData.calledTime || 'Called';
  }

  let step3Title = 'Counter Consultation';
  let step3Desc = 'You will be called at counter';
  if (isNoShow) {
    step3Title = 'No-Show';
    step3Desc = 'Turn was marked as missed';
  } else if (isCalled) {
    step3Title = 'Called to Counter';
    step3Desc = `Please proceed to ${queueData.counter}`;
  } else if (isServing) {
    step3Title = 'In Consultation';
    step3Desc = `Being served at ${queueData.counter}`;
  } else if (isCompleted) {
    step3Title = 'Consultation Done';
    step3Desc = `Completed at ${queueData.counter}`;
  }

  let step4TopTime = isCompleted ? (queueData.completedTime || 'Done') : isNoShow ? 'Closed' : 'Pending';
  let step4Title = isCompleted ? 'Service Complete' : isNoShow ? 'Visit Ended' : 'Service Complete';
  let step4Desc = isCompleted
    ? 'Service finished successfully'
    : isNoShow
    ? 'Appointment closed as no-show'
    : 'Visit conclusion';

  return (
    <div className="virtual-queue-page">
      {/* 1. Standardized Hero Banner using queue waiting.png */}
      <QueueWaitingBanner />

      {/* Helpful prompt if user has a today appointment not yet checked in */}
      {todayBookedAppt && !liveData && (
        <div style={{
          maxWidth: '1240px',
          margin: '20px auto 0 auto',
          padding: '16px 24px',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Ticket size={22} color="#1D68F2" />
            <div>
              <strong style={{ color: '#1E40AF', fontSize: '15px' }}>
                You have a booked appointment today ({todayBookedAppt.appointmentId})!
              </strong>
              <p style={{ margin: '2px 0 0 0', color: '#3B82F6', fontSize: '13px' }}>
                {todayBookedAppt.serviceId?.name || 'Service Consultation'} &bull; Join the virtual queue now to generate your live queue token.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/join-queue', { state: { appointmentId: todayBookedAppt.appointmentId } })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1D68F2',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer'
            }}
          >
            <span>Join Queue Now</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Real-time Called to Counter Banner Alert */}
      {(calledAlert || currentStatus === 'CALLED') && (
        <div className="vq-called-banner">
          <div className="vq-called-banner-content">
            <div className="vq-called-icon-pulse">
              <BellRing size={22} />
            </div>
            <div>
              <h3 className="vq-called-title">
                It's Your Turn! Please Proceed to {calledAlert?.counter || queueData.counter}
              </h3>
              <p className="vq-called-subtitle">
                Your Token #{calledAlert?.tokenNumber || queueData.userToken} has been called. Please head to {calledAlert?.counter || queueData.counter} for your consultation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Sections Grid with Outer White Padding */}
      <div className="virtual-queue-grid">
        {/* Row 1, Col 1: Currently Serving (Theme: Light Blue) */}
        <section className="vq-card vq-serving-card" aria-label="Currently Serving">
          <div className="vq-card-inner vq-serving-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <Radio size={20} strokeWidth={2.4} className="vq-header-icon vq-serving-icon" />
                <h2 className="vq-card-title">Currently Serving</h2>
              </div>
              <div 
                className={`vq-live-badge ${isSocketLive ? 'live' : 'syncing'}`} 
                aria-label="Live Status" 
                title={isSocketLive ? "Real-time updates active via Socket.IO" : "Connecting live sync..."}
              >
                <span className="vq-live-dot" />
                <span>{isSocketLive ? 'LIVE' : 'SYNCING'}</span>
              </div>
            </div>

            {queueData.activeCounters && queueData.activeCounters.length > 1 ? (
              <div className={`vq-multi-counters-grid count-${queueData.activeCounters.length}`}>
                {queueData.activeCounters.map((cnt) => (
                  <div
                    key={cnt.id || cnt.counterId || cnt.code || cnt.name}
                    className={`vq-mini-counter-card ${['SERVING', 'CALLED'].includes(cnt.status) ? 'active' : 'idle'}`}
                  >
                    <div className="vq-mini-counter-header">
                      <span className="vq-mini-counter-name">
                        {(cnt.name || `Counter ${cnt.code}`).replace(/\s*-\s*/g, '-')}
                      </span>
                      <span className={`vq-mini-counter-status ${cnt.status ? cnt.status.toLowerCase() : 'idle'}`}>
                        {cnt.status === 'SERVING' ? 'Serving' : cnt.status === 'CALLED' ? 'Called' : 'Idle'}
                      </span>
                    </div>
                    <div className="vq-mini-counter-token">
                      {cnt.nowServing || '—'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vq-serving-body">
                <div className="vq-huge-number">{queueData.currentlyServing}</div>
                <div className="vq-counter-indicator">
                  <Calendar size={18} strokeWidth={2.2} className="vq-counter-icon" />
                  <span>{queueData.counter}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Row 1, Col 2: Your Token (Theme: Light Green) */}
        <section className="vq-card vq-token-card" aria-label="Your Token">
          <div className="vq-card-inner vq-token-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <User size={20} strokeWidth={2.4} className="vq-header-icon vq-token-icon" />
                <h2 className="vq-card-title">Your Token</h2>
              </div>
              <div className={`vq-status-pill ${
                currentStatus === 'CALLED' ? 'called' :
                ['SERVING', 'IN_SERVICE'].includes(currentStatus) ? 'serving' :
                currentStatus === 'COMPLETED' ? 'completed' :
                isNoShow ? 'no-show' : 'waiting'
              }`}>
                {currentStatus === 'CALLED' && <span className="vq-live-dot" />}
                {['SERVING', 'IN_SERVICE'].includes(currentStatus) && <span className="vq-live-dot blue-dot" />}
                {currentStatus === 'COMPLETED' && <Check size={12} strokeWidth={3} />}
                {isNoShow && <span className="vq-live-dot red-dot" />}
                <span>
                  {currentStatus === 'CALLED' ? 'CALLED TO COUNTER' :
                   ['SERVING', 'IN_SERVICE'].includes(currentStatus) ? 'SERVING NOW' :
                   currentStatus === 'COMPLETED' ? 'COMPLETED' :
                   isNoShow ? 'NO SHOW' : 'IN QUEUE'}
                </span>
              </div>
            </div>

            <div className="vq-token-body">
              <div className="vq-huge-token-number">{queueData.userToken}</div>

              <div className="vq-token-meta-split">
                {/* Left Column: Your Position */}
                <div className="vq-token-position-col">
                  <span className="vq-meta-label">Your Position</span>
                  <span className="vq-position-big-number">{queueData.userPosition}</span>
                  <span className="vq-meta-subtext">
                    {queueData.userPosition === 1 ? 'person ahead of you' : 'people ahead of you'}
                  </span>
                </div>

                {/* Center Divider */}
                <div className="vq-token-divider" />

                {/* Right Column: Estimated Wait Time */}
                <div className="vq-token-wait-col">
                  <div className="vq-wait-header-line">
                    <span className="vq-meta-label">Estimated Wait Time</span>
                  </div>
                  <div className="vq-wait-big-time">
                    <span>{queueData.estimatedWaitTime}</span>
                  </div>
                  <span className="vq-meta-subtext">Based on real-time flow</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2, Col 1: Service (Theme: Light Violet) */}
        <section className="vq-card vq-service-card" aria-label="Service Details">
          <div className="vq-card-inner vq-service-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <Stethoscope size={20} strokeWidth={2.4} className="vq-header-icon vq-service-icon" />
                <h2 className="vq-card-title">Service</h2>
              </div>
            </div>

            <div className="vq-service-body">
              <img
                src={queueData.serviceImage}
                alt={queueData.serviceName}
                className="vq-service-poster"
              />
              <div className="vq-service-info">
                <h3 className="vq-service-name">{queueData.serviceName}</h3>
                <p className="vq-service-description">{queueData.serviceDescription}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2, Col 2: Appointment ID (Theme: Light Orange) */}
        <section className="vq-card vq-appointment-card" aria-label="Appointment ID Details">
          <div className="vq-card-inner vq-appointment-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <Ticket size={20} strokeWidth={2.4} className="vq-header-icon vq-appointment-icon" />
                <h2 className="vq-card-title">Appointment ID</h2>
              </div>
            </div>

            <div className="vq-appointment-body">
              <div className="vq-ticket-icon-box">
                <Ticket size={22} strokeWidth={2} />
              </div>
              <div className="vq-appointment-info">
                <span className="vq-appointment-code">{queueData.appointmentId}</span>
                <span className="vq-appointment-schedule">{queueData.appointmentSchedule}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Row 3: Your Queue Progress Tracker */}
        <section className="vq-card vq-progress-card" aria-label="Queue Progress Tracker">
          <div className="vq-card-inner vq-progress-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <Clock size={20} strokeWidth={2.4} className="vq-header-icon" />
                <h2 className="vq-card-title">Your Queue Progress</h2>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#64748B',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
                title="Refresh queue status"
              >
                <RefreshCw size={14} className={isManualSyncing ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>
            </div>

            <div className="vq-tracker-container">
              {/* Step 1: Checked In (Milestone 1) */}
              <div className="vq-tracker-step completed">
                <div className={`vq-step-line ${line1Completed ? 'completed' : 'pending'}`} />
                <div className="vq-step-top-timestamp completed">{step1Timestamp}</div>
                <div className="vq-node-circle completed">
                  <Check size={16} strokeWidth={3} className="vq-check-icon" />
                </div>
                <div className="vq-step-text-wrap">
                  <span className="vq-step-title completed">Checked In</span>
                  <span className="vq-step-desc">Token #{queueData.userToken} generated</span>
                  <span className="vq-step-mobile-time">{step1Timestamp}</span>
                </div>
              </div>

              {/* Step 2: In Queue / Waiting (Milestone 2) */}
              <div className={`vq-tracker-step ${step2Status}`}>
                <div className={`vq-step-line ${line2Completed ? 'completed' : 'pending'}`} />
                <div className={`vq-step-top-timestamp ${step2Status === 'active' ? 'active' : step2Status === 'completed' ? 'completed' : 'pending'}`}>
                  {step2TopTime}
                </div>
                {isStep2Completed ? (
                  <div className="vq-node-circle completed">
                    <Check size={16} strokeWidth={3} className="vq-check-icon" />
                  </div>
                ) : isWaiting ? (
                  <div className="vq-node-circle active">
                    <span className="vq-active-pulse-ring" />
                    <span className="vq-active-inner-dot" />
                  </div>
                ) : (
                  <div className="vq-node-circle pending" />
                )}
                <div className="vq-step-text-wrap">
                  <span className={`vq-step-title ${step2Status}`}>
                    {step2Title}
                  </span>
                  <span className="vq-step-desc">{step2Desc}</span>
                  <span className="vq-step-mobile-time">{step2TopTime}</span>
                </div>
              </div>

              {/* Step 3: Counter Consultation (Milestone 3) */}
              <div className={`vq-tracker-step ${step3StatusClass}`}>
                <div className={`vq-step-line ${line3Completed ? 'completed' : 'pending'}`} />
                <div className={`vq-step-top-timestamp ${step3StatusClass === 'skipped' ? 'skipped' : isCalled ? 'called' : isServing ? 'active' : isCompleted ? 'completed' : 'pending'}`}>
                  {step3TopTime}
                </div>
                {isCompleted ? (
                  <div className="vq-node-circle completed">
                    <Check size={16} strokeWidth={3} className="vq-check-icon" />
                  </div>
                ) : isNoShow ? (
                  <div className="vq-node-circle skipped">
                    ✕
                  </div>
                ) : isCalled ? (
                  <div className="vq-node-circle active called-node">
                    <span className="vq-active-pulse-ring called-ring" />
                    <span className="vq-active-inner-dot called-dot" />
                  </div>
                ) : isServing ? (
                  <div className="vq-node-circle active serving-node">
                    <span className="vq-active-pulse-ring" />
                    <span className="vq-active-inner-dot" />
                  </div>
                ) : (
                  <div className="vq-node-circle pending" />
                )}
                <div className="vq-step-text-wrap">
                  <span className={`vq-step-title ${step3StatusClass}`}>
                    {step3Title}
                  </span>
                  <span className="vq-step-desc">{step3Desc}</span>
                  <span className="vq-step-mobile-time">{step3TopTime}</span>
                </div>
              </div>

              {/* Step 4: Service Completed (Milestone 4) */}
              <div className={`vq-tracker-step ${step4StatusClass}`}>
                <div className={`vq-step-top-timestamp ${isCompleted ? 'completed' : isNoShow ? 'skipped' : 'pending'}`}>
                  {step4TopTime}
                </div>
                {isCompleted ? (
                  <div className="vq-node-circle completed">
                    <Check size={16} strokeWidth={3} className="vq-check-icon" />
                  </div>
                ) : isNoShow ? (
                  <div className="vq-node-circle pending skipped-endpoint">
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 700 }}>—</span>
                  </div>
                ) : (
                  <div className="vq-node-circle pending" />
                )}
                <div className="vq-step-text-wrap">
                  <span className={`vq-step-title ${step4StatusClass}`}>
                    {step4Title}
                  </span>
                  <span className="vq-step-desc">{step4Desc}</span>
                  <span className="vq-step-mobile-time">{step4TopTime}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VirtualQueue;
