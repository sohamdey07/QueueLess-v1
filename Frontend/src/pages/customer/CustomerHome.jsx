import React from 'react';
import HeroBanner from '../../components/customer/HeroBanner';
import QuickActions from '../../components/customer/QuickActions';
import UpcomingBookingCard from '../../components/customer/UpcomingBookingCard';
import RecentBookingsCard from '../../components/customer/RecentBookingsCard';
import NeedHelpBanner from '../../components/customer/NeedHelpBanner';
import './CustomerHome.css';

export const CustomerHome = () => {
  const handleActionClick = (actionId) => {
    console.log('Action clicked:', actionId);
  };

  const handleBookingClick = () => {
    console.log('Upcoming booking clicked');
  };

  const handleRecentBookingClick = (bookingId) => {
    console.log('Recent booking clicked:', bookingId);
  };

  const handleViewAllBookings = () => {
    console.log('View all bookings clicked');
  };

  const handleGetHelp = () => {
    console.log('Get help clicked');
  };

  return (
    <div className="customer-home-page">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Quick Actions Grid */}
      <QuickActions onActionClick={handleActionClick} />

      {/* 3. Upcoming Booking & Recent Bookings Columns */}
      <div className="bookings-columns-grid">
        <UpcomingBookingCard 
          onViewAll={handleViewAllBookings}
          onBookingClick={handleBookingClick}
        />
        <RecentBookingsCard 
          onViewAll={handleViewAllBookings}
          onItemClick={handleRecentBookingClick}
        />
      </div>

      {/* 4. Need Help Banner */}
      <NeedHelpBanner onGetHelp={handleGetHelp} />
    </div>
  );
};

export default CustomerHome;
