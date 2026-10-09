import React from 'react';
import adminBannerBg from '../../assets/images/banners/admin/admin dashboard.png';
import './AdminBanner.css';

export const AdminBanner = ({
  tag = 'MANAGE SMARTER, SERVE BETTER',
  title = "Manage Everything in One Place",
  description = "Manage services, availability, counters, and daily operations from one place.",
  bgImage
}) => {
  const displayBg = bgImage || adminBannerBg;

  return (
    <div className="admin-banner-card">
      {/* Background Graphic Illustration on Right */}
      <img 
        src={displayBg} 
        alt="Admin Illustration" 
        className="admin-banner-bg" 
      />

      {/* Text Content Overlay on Left */}
      <div className="admin-banner-content">
        {tag && (
          <span className="admin-banner-tag">{tag}</span>
        )}
        <h1 className="admin-banner-title">
          {typeof title === 'string' && title.includes('\n') ? (
            title.split('\n').map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < title.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))
          ) : (
            title
          )}
        </h1>
        <p className="admin-banner-description">
          {description}
        </p>
      </div>
    </div>
  );
};

export default AdminBanner;
