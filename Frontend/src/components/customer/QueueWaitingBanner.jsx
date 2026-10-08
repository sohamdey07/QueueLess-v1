import React from 'react';
import queueWaitingBannerImg from '../../assets/images/banners/customer/queue waiting.png';
import './QueueWaitingBanner.css';

export const QueueWaitingBanner = () => {
  return (
    <div className="queue-waiting-banner-card">
      {/* Background illustration banner image */}
      <img
        src={queueWaitingBannerImg}
        alt="You're in the Queue"
        className="queue-waiting-banner-bg"
      />

      {/* Text overlay content matching exact reference layout */}
      <div className="queue-waiting-banner-content">
        <h1 className="queue-waiting-banner-title">
          You’re in the Queue
        </h1>
        <p className="queue-waiting-banner-description">
          Sit back and relax. We’ll keep you updated in real-time<br className="banner-br" />
          until your turn.
        </p>
      </div>
    </div>
  );
};

export default QueueWaitingBanner;
