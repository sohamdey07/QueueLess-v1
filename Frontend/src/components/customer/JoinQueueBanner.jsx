import React from 'react';
import joinQueueBannerImg from '../../assets/images/banners/customer/join queue.png';
import './JoinQueueBanner.css';

export const JoinQueueBanner = () => {
  return (
    <div className="join-queue-banner-card">
      {/* Background illustration banner image */}
      <img
        src={joinQueueBannerImg}
        alt="Join the Virtual Queue"
        className="join-queue-banner-bg"
      />

      {/* Text overlay content matching exact reference layout */}
      <div className="join-queue-banner-content">
        <span className="join-queue-banner-eyebrow">
          ALREADY HERE?
        </span>
        <h1 className="join-queue-banner-title">
          Join the Queue
        </h1>
        <p className="join-queue-banner-description">
          Enter your appointment ID and get your queue<br className="banner-br" />
          token in seconds.
        </p>
      </div>
    </div>
  );
};

export default JoinQueueBanner;
