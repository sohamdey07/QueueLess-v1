import React from 'react';
import { MapPin } from 'lucide-react';
import homeBannerImg from '../../assets/images/banners/customer/home.png';
import './HeroBanner.css';

export const HeroBanner = () => {
  return (
    <div className="hero-banner-container">
      {/* Background illustration */}
      <img 
        src={homeBannerImg} 
        alt="QueueLess Hero Banner" 
        className="hero-banner-bg-img" 
      />

      {/* Hero Left Content */}
      <div className="hero-banner-content">
        <span className="hero-banner-eyebrow">
          BOOK • QUEUE • GET SERVED EFFORTLESSLY
        </span>
        <h1 className="hero-banner-title">
          Save Time, <span className="hero-banner-highlight">Skip the Wait</span>
        </h1>
        <p className="hero-banner-description">
          Book your appointments, join the virtual queue and<br className="hero-desc-br" />
          get real-time updates — all in one place.
        </p>
      </div>

      {/* Overlay Queue Ticket on right card matching screenshot */}
      <div className="hero-floating-queue-badge">
        <div className="queue-badge-token-row">
          <MapPin size={13} className="queue-pin-icon" />
          <span className="queue-token-number">A-042</span>
        </div>
        <span className="queue-token-label">You're in the Queue</span>
      </div>
    </div>
  );
};

export default HeroBanner;
