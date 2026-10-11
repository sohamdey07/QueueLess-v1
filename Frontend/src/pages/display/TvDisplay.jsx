import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize, Minimize, Radio } from 'lucide-react';
import logoImg from '../../assets/images/logo/logo.png';
import queueApi from '../../services/api/queue.api';
import { joinTvDisplay, leaveTvDisplay, onTvUpdated } from '../../services/socket/socketClient';
import './TvDisplay.css';

export const TvDisplay = () => {
  const [counters, setCounters] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketLive, setIsSocketLive] = useState(false);

  // Dynamic token capacity state (auto-adjusts to viewport height)
  const [dynamicTokenCount, setDynamicTokenCount] = useState(5);
  const listMeasureRef = useRef(null);

  // Web Audio announcement chime for token calling
  const playCallChime = () => {
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

      // Bright clinic announcement chime (C#5 -> E5 -> G#5)
      playTone(554.37, now, 0.35, 'sine', 0.12);
      playTone(659.25, now + 0.12, 0.35, 'sine', 0.12);
      playTone(830.61, now + 0.24, 0.65, 'sine', 0.14);
    } catch {
      // AudioContext fallback handled silently
    }
  };

  // Fetch real-time TV display data from Backend
  const loadTvOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await queueApi.getTvDisplayOverview();
      const list = Array.isArray(res?.data) ? res.data : [];
      setCounters(list);
    } catch (err) {
      console.error('[TvDisplay] Failed to fetch live TV overview:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTvOverview(false);
  }, [loadTvOverview]);

  // Socket.IO real-time channel subscription
  useEffect(() => {
    joinTvDisplay();
    setIsSocketLive(true);

    const unsubTv = onTvUpdated((payload) => {
      console.log('[TvDisplay] Real-time TV update received:', payload);
      // Play announcement sound if next customer called
      if (payload?.type === 'CUSTOMER_CALLED') {
        playCallChime();
      }
      // Silently refresh counters and upcoming tokens in real-time
      loadTvOverview(true);
    });

    return () => {
      unsubTv();
      leaveTvDisplay();
    };
  }, [loadTvOverview]);

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Dynamic capacity calculation based on available screen space
  useEffect(() => {
    const calculateCapacity = () => {
      if (!listMeasureRef.current) return;
      const containerHeight = listMeasureRef.current.clientHeight;
      if (containerHeight > 0) {
        // Target pill height is ~48px, gap is 10px
        const targetPillHeight = 48;
        const gap = 10;
        // Dynamically compute how many tokens fit without any fixed max limit
        const computedCount = Math.max(2, Math.floor((containerHeight + gap) / (targetPillHeight + gap)));
        setDynamicTokenCount(computedCount);
      }
    };

    calculateCapacity();

    const resizeObserver = new ResizeObserver(() => {
      calculateCapacity();
    });

    if (listMeasureRef.current) {
      resizeObserver.observe(listMeasureRef.current);
    }

    window.addEventListener('resize', calculateCapacity);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateCapacity);
    };
  }, [counters.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Formats date matching: "Fri, 02 Oct 2026"
  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[date.getDay()];
    const dayNum = String(date.getDate()).padStart(2, '0');
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${year}`;
  };

  // Formats time matching: "11:24 AM"
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="tv-display-container">
      {/* 1. Header Bar with Logo, Tagline, Date, and Time */}
      <header className="tv-header">
        <div className="tv-header-left">
          <div className="tv-brand-wrap">
            <img 
              src={logoImg} 
              alt="QueueLess Logo" 
              className="tv-brand-logo" 
            />
            <div className="tv-brand-text">
              <span className="tv-brand-queue">Queue</span>
              <span className="tv-brand-less">Less</span>
            </div>
          </div>
          <div className="tv-header-divider" />
          <span className="tv-header-tagline">Better Services | Shorter Waits</span>
        </div>

        <div className="tv-header-right">
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#EFF6FF',
              padding: '5px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#1D68F2'
            }}
            title="Real-time live queue socket connected"
          >
            <span 
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                display: 'inline-block'
              }} 
            />
            <span>LIVE</span>
          </div>
          <span className="tv-header-date">{formatDate(currentTime)}</span>
          <span className="tv-header-time">{formatTime(currentTime)}</span>
          <button 
            type="button" 
            className="tv-fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </header>

      {/* 2. Main Multi-Column Grid */}
      <main className="tv-grid-container" aria-label="Live Queue Status Display">
        {counters.length > 0 ? (
          counters.map((counter, idx) => {
            const theme = counter.colorTheme || 'blue';
            const upcomingList = Array.isArray(counter.upcomingTokens) ? counter.upcomingTokens : [];
            const displayTokens = upcomingList.slice(0, dynamicTokenCount);

            return (
              <section 
                key={counter.id || counter.counterId || idx} 
                className={`tv-column theme-${theme}`}
                aria-label={`${counter.serviceName} - ${counter.counterName}`}
              >
                {/* Top Card: Now Serving */}
                <div className={`tv-now-serving-card theme-${theme}`}>
                  <h2 className="tv-service-title">{counter.serviceName}</h2>
                  <div className={`tv-title-accent accent-${theme}`} />
                  <span className="tv-now-serving-label">Now Serving</span>
                  <div className="tv-now-serving-token">{counter.nowServing || '—'}</div>
                  <div className={`tv-counter-pill pill-${theme}`}>
                    {counter.counterName}
                  </div>
                </div>

                {/* Bottom Card: Upcoming Tokens (Dynamically sized with no fixed max limit) */}
                <div className="tv-upcoming-card">
                  <h3 className="tv-upcoming-header">Upcoming Tokens</h3>
                  <div 
                    className="tv-upcoming-list"
                    ref={idx === 0 ? listMeasureRef : null}
                  >
                    {displayTokens.length > 0 ? (
                      displayTokens.map((token) => (
                        <div 
                          key={token} 
                          className={`tv-upcoming-item item-${theme}`}
                        >
                          {token}
                        </div>
                      ))
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#94A3B8',
                        fontSize: '14.5px',
                        fontWeight: 600
                      }}>
                        No waiting tokens
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })
        ) : (
          <div style={{
            gridColumn: '1 / -1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            color: '#64748B',
            textAlign: 'center'
          }}>
            {isLoading ? (
              <p style={{ fontSize: '18px', fontWeight: 600 }}>Loading live counter display...</p>
            ) : (
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  No Active Counters Open
                </h2>
                <p style={{ fontSize: '15px' }}>Counters will appear here once activated by staff.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TvDisplay;
