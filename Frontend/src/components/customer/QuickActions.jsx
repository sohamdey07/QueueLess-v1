import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  Users, 
  FileText, 
  RotateCcw, 
  ChevronRight,
  Zap
} from 'lucide-react';
import './QuickActions.css';

const actionItems = [
  {
    id: 'book-appointment',
    title: 'Book Appointment',
    description: 'Schedule your visit in advance.',
    icon: CalendarDays,
    theme: 'blue',
    path: '/book-appointment',
  },
  {
    id: 'join-queue',
    title: 'Join Queue',
    description: 'Already at the venue? Join the virtual queue.',
    icon: Users,
    theme: 'green',
    path: '/join-queue',
  },
  {
    id: 'my-bookings',
    title: 'My Bookings',
    description: 'View your upcoming and past appointments.',
    icon: FileText,
    theme: 'purple',
    path: '/my-bookings',
  },
  {
    id: 'appointment-history',
    title: 'Appointment History',
    description: 'Check your completed and cancelled bookings.',
    icon: RotateCcw,
    theme: 'amber',
    path: '/appointment-history',
  },
];

export const QuickActions = ({ onActionClick }) => {
  const navigate = useNavigate();

  const handleClick = (item) => {
    if (onActionClick) {
      onActionClick(item.id);
    }
    navigate(item.path);
  };

  return (
    <section className="quick-actions-white-container">
      {/* Section Header inside the White Box */}
      <div className="quick-actions-card-header">
        <div className="quick-actions-icon-badge">
          <Zap size={14} className="quick-actions-zap-icon" />
        </div>
        <div className="quick-actions-title-wrap">
          <h2 className="quick-actions-title">Quick Actions</h2>
          <p className="quick-actions-subtitle">Everything you need, just a click away.</p>
        </div>
      </div>

      {/* 4 Pastel Action Cards Grid */}
      <div className="quick-actions-grid">
        {actionItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className={`quick-action-card theme-${item.theme}`}
              onClick={() => handleClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClick(item);
                }
              }}
            >
              {/* Top Row: Circular Icon & Circular Chevron Button */}
              <div className="quick-action-top-row">
                <div className={`quick-action-icon-circle icon-circle-${item.theme}`}>
                  <Icon size={21} className={`action-icon icon-${item.theme}`} />
                </div>
                <div className={`quick-action-arrow-circle arrow-circle-${item.theme}`}>
                  <ChevronRight size={17} />
                </div>
              </div>

              {/* Title & Description */}
              <div className="quick-action-body">
                <h3 className="quick-action-card-title">{item.title}</h3>
                <p className="quick-action-card-desc">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActions;
