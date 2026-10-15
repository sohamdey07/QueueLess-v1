import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ChevronRight, ArrowRight, Calendar } from 'lucide-react';
import Badge from '../common/Badge';
import './RecentBookingsCard.css';

export const RecentBookingsCard = ({
  bookings = [],
  isLoading = false,
  onViewAll,
  onItemClick,
}) => {
  const navigate = useNavigate();

  const handleViewAll = (e) => {
    e.preventDefault();
    if (onViewAll) onViewAll();
    navigate('/appointment-history');
  };

  const handleItemClick = (id) => {
    if (onItemClick) onItemClick(id);
    navigate('/appointment-history');
  };

  return (
    <div className="recent-bookings-outer-card">
      {/* Top Header inside the white card */}
      <div className="recent-bookings-card-header">
        <div className="recent-header-title-group">
          <RotateCcw size={18} className="recent-header-icon" />
          <h2 className="recent-header-title">Recent Bookings</h2>
        </div>
        <a
          href="#/appointment-history"
          className="recent-view-all-link"
          onClick={handleViewAll}
        >
          <span>View All</span>
          <ArrowRight size={14} className="recent-view-all-arrow" />
        </a>
      </div>

      {/* Body & List */}
      <div className="recent-bookings-body">
        {isLoading ? (
          <div className="recent-bookings-loading-box">
            <div className="recent-loading-spinner" />
            <span className="recent-loading-text">Loading recent bookings...</span>
          </div>
        ) : !bookings || bookings.length === 0 ? (
          <div className="recent-bookings-empty-box">
            <div className="recent-empty-icon-wrap">
              <RotateCcw size={24} />
            </div>
            <h3 className="recent-empty-title">No Recent Bookings</h3>
            <p className="recent-empty-desc">Your recent booking activities will appear here.</p>
          </div>
        ) : (
          <ul className="recent-bookings-list">
            {bookings.slice(0, 3).map((item) => (
              <li
                key={item.id}
                className="recent-booking-item"
                onClick={() => handleItemClick(item.id)}
              >
                {/* Wide Landscape Thumbnail */}
                <div className="recent-booking-image-wrap">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="recent-booking-image"
                  />
                </div>

                {/* Title & Date */}
                <div className="recent-booking-info">
                  <h4 className="recent-booking-title">{item.title}</h4>
                  <p className="recent-booking-sub">
                    <Calendar size={11.5} className="recent-date-icon" />
                    <span className="recent-booking-date">{item.date}</span>
                  </p>
                </div>

                {/* Status Badge */}
                <div className="recent-booking-badge-wrap">
                  <Badge variant={item.statusVariant || 'neutral'}>
                    {item.status}
                  </Badge>
                </div>

                {/* Circular Action Button with Chevron */}
                <div className="recent-booking-arrow-wrap">
                  <div className="recent-chevron-circle">
                    <ChevronRight size={15} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentBookingsCard;
