import React from 'react';
import myBookingBannerImg from '../../assets/images/banners/customer/my booking.png';
import './MyBookingBanner.css';

export const MyBookingBanner = () => {
  return (
    <div className="my-booking-banner-card">
      {/* Background illustration banner image */}
      <img
        src={myBookingBannerImg}
        alt="Your Appointments"
        className="my-booking-banner-bg"
      />

      {/* Text overlay content matching exact reference layout */}
      <div className="my-booking-banner-content">
        <h1 className="my-booking-banner-title">
          Your Appointments
        </h1>
        <p className="my-booking-banner-description">
          Keep track of your appointments and<br className="banner-br" />
          join the queue when it’s time.
        </p>
      </div>
    </div>
  );
};

export default MyBookingBanner;
