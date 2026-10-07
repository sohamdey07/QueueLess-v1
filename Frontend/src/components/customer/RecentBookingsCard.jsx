import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, ChevronRight, ArrowRight } from 'lucide-react';
import Badge from '../common/Badge';
import bloodTestImg from '../../assets/images/bookings/blood_test.jpg';
import dentalCheckupImg from '../../assets/images/bookings/dental_checkup.jpg';
import vaccinationImg from '../../assets/images/bookings/vaccination.jpg';
import './RecentBookingsCard.css';

const recentBookingsData = [
  {
    id: 'b1',
    title: 'Blood Test',
    clinic: 'City Health Clinic',
    date: '12 Sep 2026',
    status: 'Completed',
    statusVariant: 'completed',
    image: bloodTestImg,
  },
  {
    id: 'b2',
    title: 'Dental Checkup',
    clinic: 'Smile Care Center',
    date: '05 Sep 2026',
    status: 'Cancelled',
    statusVariant: 'cancelled',
    image: dentalCheckupImg,
  },
  {
    id: 'b3',
    title: 'Vaccination',
    clinic: 'HealthPlus Clinic',
    date: '20 Aug 2026',
    status: 'Completed',
    statusVariant: 'completed',
    image: vaccinationImg,
  },
];

export const RecentBookingsCard = ({
  bookings = recentBookingsData,
  onViewAll,
  onItemClick
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

      {/* 3 Booking Rows with Divider Borders */}
      <div className="recent-bookings-body">
        <ul className="recent-bookings-list">
          {bookings.map((item) => (
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

              {/* Title & Clinic Info */}
              <div className="recent-booking-info">
                <h4 className="recent-booking-title">{item.title}</h4>
                <p className="recent-booking-sub">
                  <span className="recent-booking-clinic">{item.clinic}</span>
                  <span className="recent-booking-bullet">•</span>
                  <span className="recent-booking-date">{item.date}</span>
                </p>
              </div>

              {/* Status Badge */}
              <div className="recent-booking-badge-wrap">
                <Badge variant={item.statusVariant}>
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
      </div>
    </div>
  );
};

export default RecentBookingsCard;
