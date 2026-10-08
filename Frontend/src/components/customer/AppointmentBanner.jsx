import React from 'react';
import appointmentBannerImg from '../../assets/images/banners/customer/appointment booking.png';
import './AppointmentBanner.css';

export const AppointmentBanner = () => {
  return (
    <div className="appointment-banner-card">
      {/* Background illustration banner image */}
      <img
        src={appointmentBannerImg}
        alt="Book Your Appointment"
        className="appointment-banner-bg"
      />

      {/* Text overlay content matching exact reference */}
      <div className="appointment-banner-content">
        <span className="appointment-banner-eyebrow">
          YOUR TIME, OUR PRIORITY
        </span>
        <h1 className="appointment-banner-title">
          Book. Join. Get Served.
        </h1>
        <p className="appointment-banner-description">
          Schedule your visit, join the queue, and get served without the wait.
        </p>
      </div>
    </div>
  );
};

export default AppointmentBanner;
