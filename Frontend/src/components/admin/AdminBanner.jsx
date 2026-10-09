import React from 'react';
import adminBannerBg from '../../assets/images/banners/admin/admin dashboard.png';
import './AdminBanner.css';

export const AdminBanner = ({
  title = "Manage Appointments.\nServe People Better.",
  description = "Create services, manage availability, assign counters and keep your organization running smoothly."
}) => {
  return (
    <div className="admin-banner-card">
      {/* Background Graphic Illustration on Right */}
      <img 
        src={adminBannerBg} 
        alt="Admin Dashboard Illustration" 
        className="admin-banner-bg" 
      />

      {/* Text Content Overlay on Left */}
      <div className="admin-banner-content">
        <h1 className="admin-banner-title">
          Manage Appointments.<br />
          Serve People Better.
        </h1>
        <p className="admin-banner-description">
          {description}
        </p>
      </div>
    </div>
  );
};

export default AdminBanner;
