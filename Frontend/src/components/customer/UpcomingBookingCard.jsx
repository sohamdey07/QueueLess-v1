import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';
import generalConsultImg from '../../assets/images/bookings/general_consultation.jpg';
import './UpcomingBookingCard.css';

export const UpcomingBookingCard = ({
  booking = {
    title: 'General Consultation',
    date: '26 Sep 2026',
    duration: '15 minutes',
    status: 'UPCOMING',
    image: generalConsultImg,
  },
  onViewAll,
  onBookingClick
}) => {
  const navigate = useNavigate();

  const handleViewAll = (e) => {
    e.preventDefault();
    if (onViewAll) onViewAll();
    navigate('/my-bookings');
  };

  const handleCardClick = () => {
    if (onBookingClick) onBookingClick();
    navigate('/my-bookings');
  };

  return (
    <div className="upcoming-booking-outer-card">
      {/* Top Header inside the white card */}
      <div className="upcoming-booking-card-header">
        <div className="upcoming-header-title-group">
          <Calendar size={18} className="upcoming-header-icon" />
          <h2 className="upcoming-header-title">Upcoming Booking</h2>
        </div>
        <a
          href="#/my-bookings"
          className="upcoming-view-all-link"
          onClick={handleViewAll}
        >
          <span>View All</span>
          <ArrowRight size={14} className="upcoming-view-all-arrow" />
        </a>
      </div>

      {/* Inner Card Box with clean border & padding */}
      <div
        className="upcoming-booking-inner-box"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
      >
        {/* Left Thumbnail (Stethoscope) */}
        <div className="upcoming-booking-image-wrap">
          <img
            src={booking.image || generalConsultImg}
            alt={booking.title}
            className="upcoming-booking-image"
          />
        </div>

        {/* Center Details */}
        <div className="upcoming-booking-details">
          <Badge variant="upcoming" className="upcoming-status-badge">
            {booking.status}
          </Badge>

          <h3 className="upcoming-booking-title">{booking.title}</h3>

          {/* Meta Row: Date/Time & Duration */}
          <div className="upcoming-booking-meta-row">
            <div className="upcoming-meta-item">
              <Calendar size={16} className="meta-icon" />
              <div className="meta-text-group">
                <span className="meta-highlight">{booking.date}</span>
              </div>
            </div>

            <div className="upcoming-meta-item">
              <Clock size={16} className="meta-icon" />
              <div className="meta-text-group">
                <span className="meta-highlight">{booking.duration}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UpcomingBookingCard;
