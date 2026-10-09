import React, { useState, useEffect, useRef } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import logoImg from '../../assets/images/logo/logo.png';
import './TvDisplay.css';

const countersConfig = [
  {
    id: 'counter-1',
    serviceName: 'General Service',
    counterName: 'Counter 1',
    nowServing: 'A-042',
    colorTheme: 'blue',
    tokenPrefix: 'A',
    startTokenNum: 43,
  },
  {
    id: 'counter-2',
    serviceName: 'Document Verification',
    counterName: 'Counter 2',
    nowServing: 'B-018',
    colorTheme: 'green',
    tokenPrefix: 'B',
    startTokenNum: 19,
  },
  {
    id: 'counter-3',
    serviceName: 'Payments',
    counterName: 'Counter 3',
    nowServing: 'C-007',
    colorTheme: 'purple',
    tokenPrefix: 'C',
    startTokenNum: 8,
  },
  {
    id: 'counter-4',
    serviceName: 'Information & Support',
    counterName: 'Counter 4',
    nowServing: 'D-013',
    colorTheme: 'orange',
    tokenPrefix: 'D',
    startTokenNum: 14,
  },
];

// Generates an array of formatted tokens dynamically with no fixed limit
const generateTokens = (prefix, startNum, count) => {
  return Array.from({ length: count }, (_, i) => {
    const num = startNum + i;
    return `${prefix}-${String(num).padStart(3, '0')}`;
  });
};

export const TvDisplay = () => {
  const [counters] = useState(countersConfig);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic token capacity state (auto-adjusts to viewport height)
  const [dynamicTokenCount, setDynamicTokenCount] = useState(5);
  const listMeasureRef = useRef(null);

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

    // Calculate immediately and whenever container size changes
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
  }, []);

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

      {/* 2. Main 4-Column Grid */}
      <main className="tv-grid-container" aria-label="Live Queue Status Display">
        {counters.map((counter, idx) => (
          <section 
            key={counter.id} 
            className={`tv-column theme-${counter.colorTheme}`}
            aria-label={`${counter.serviceName} - ${counter.counterName}`}
          >
            {/* Top Card: Now Serving */}
            <div className={`tv-now-serving-card theme-${counter.colorTheme}`}>
              <h2 className="tv-service-title">{counter.serviceName}</h2>
              <div className={`tv-title-accent accent-${counter.colorTheme}`} />
              <span className="tv-now-serving-label">Now Serving</span>
              <div className="tv-now-serving-token">{counter.nowServing}</div>
              <div className={`tv-counter-pill pill-${counter.colorTheme}`}>
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
                {generateTokens(counter.tokenPrefix, counter.startTokenNum, dynamicTokenCount).map((token) => (
                  <div 
                    key={token} 
                    className={`tv-upcoming-item item-${counter.colorTheme}`}
                  >
                    {token}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default TvDisplay;
