import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  CalendarCheck,
  Ban,
  PartyPopper
} from 'lucide-react';
import './BookingModal.css';

/**
 * Triggers multi-stage celebratory confetti poppers across the screen
 */
const triggerCelebrationPoppers = () => {
  try {
    // Stage 1: Big Center Cannon Blast
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#1D68F2', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'],
      disableForReducedMotion: true,
      zIndex: 1600,
    });

    // Stage 2: Left corner cannon popper angled upwards
    setTimeout(() => {
      confetti({
        particleCount: 55,
        angle: 60,
        spread: 60,
        origin: { x: 0.12, y: 0.75 },
        colors: ['#1D68F2', '#3B82F6', '#10B981', '#FBBF24', '#F43F5E'],
        zIndex: 1600,
      });
    }, 150);

    // Stage 3: Right corner cannon popper angled upwards
    setTimeout(() => {
      confetti({
        particleCount: 55,
        angle: 120,
        spread: 60,
        origin: { x: 0.88, y: 0.75 },
        colors: ['#8B5CF6', '#EC4899', '#10B981', '#1D68F2', '#F59E0B'],
        zIndex: 1600,
      });
    }, 300);

    // Stage 4: Shower of celebratory floating circles and shapes
    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 100,
        origin: { y: 0.45 },
        shapes: ['circle', 'square'],
        scalar: 1.2,
        colors: ['#1D68F2', '#10B981', '#F59E0B', '#A855F7'],
        zIndex: 1600,
      });
    }, 450);
  } catch (err) {
    console.warn('Poppers animation error:', err);
  }
};

/**
 * Generate present and future dates starting from Today.
 * Past dates are strictly excluded.
 * Some dates have available slots (Blue), some have 0 slots (Grey).
 */
const generateAvailableDates = () => {
  const dates = [];
  const baseDate = new Date();

  for (let i = 0; i < 10; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    const dayName = i === 0
      ? 'Today'
      : i === 1
        ? 'Tomorrow'
        : d.toLocaleDateString('en-US', { weekday: 'short' });

    const formattedDay = d.toLocaleDateString('en-US', { day: '2-digit' });
    const formattedMonth = d.toLocaleDateString('en-US', { month: 'short' });
    const fullDateText = d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // Realistic slot distribution:
    // Sunday (day 0) or day index 4 is full (0 slots = Grey)
    // Other days have active booking capacity (4 to 14 slots = Blue)
    const isSunday = d.getDay() === 0;
    const isFull = isSunday || i === 4;
    const slotsCount = isFull ? 0 : Math.max(4, 14 - ((i * 3) % 9));

    dates.push({
      dateStr: isoDate,
      dayName,
      formattedDay,
      formattedMonth,
      fullDateText,
      isToday: i === 0,
      slotsAvailable: slotsCount,
      isAvailable: slotsCount > 0,
    });
  }

  return dates;
};

export const BookingModal = ({
  service,
  isOpen,
  onClose,
  onBookingSuccess
}) => {
  const navigate = useNavigate();
  const dateOptions = useMemo(() => generateAvailableDates(), []);

  // Default selected date to first available date with open slots
  const firstAvailableDate = useMemo(() => {
    return dateOptions.find(d => d.isAvailable) || dateOptions[0];
  }, [dateOptions]);

  const [selectedDateStr, setSelectedDateStr] = useState(() => firstAvailableDate?.dateStr || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Keep track of currently chosen date object
  const currentSelectedDate = useMemo(() => {
    return dateOptions.find(d => d.dateStr === selectedDateStr) || firstAvailableDate;
  }, [dateOptions, selectedDateStr, firstAvailableDate]);

  // Prevent background page from scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Trigger screen-wide celebration poppers when appointment is booked successfully
  useEffect(() => {
    if (bookingConfirmed) {
      triggerCelebrationPoppers();
    }
  }, [bookingConfirmed]);

  if (!isOpen || !service) return null;

  const handleSelectDate = (dateItem) => {
    if (!dateItem.isAvailable) return; // Cannot select dates without slots
    setSelectedDateStr(dateItem.dateStr);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!currentSelectedDate?.isAvailable) return;

    setIsSubmitting(true);

    // Simulated instantaneous backend appointment booking response
    setTimeout(() => {
      const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
      const generatedId = `QL-${currentSelectedDate.dateStr.replace(/-/g, '')}-${randomHex}`;

      const newAppointment = {
        id: generatedId,
        appointmentId: generatedId,
        title: service.title,
        description: service.description,
        image: service.image,
        appointmentDate: currentSelectedDate.fullDateText,
        duration: service.duration,
        schedule: service.schedule,
        status: 'Booked',
        createdAt: new Date().toISOString(),
      };

      // Persist to localStorage so My Bookings page sees this new appointment
      try {
        const stored = localStorage.getItem('queueless_upcoming_bookings');
        const list = stored ? JSON.parse(stored) : [];
        localStorage.setItem(
          'queueless_upcoming_bookings',
          JSON.stringify([newAppointment, ...list])
        );
      } catch (err) {
        console.warn('Could not persist booking to localStorage:', err);
      }

      setConfirmedData(newAppointment);
      setIsSubmitting(false);
      setBookingConfirmed(true);

      if (onBookingSuccess) {
        onBookingSuccess(newAppointment);
      }
    }, 500);
  };

  const handleClose = () => {
    setBookingConfirmed(false);
    setConfirmedData(null);
    onClose();
  };

  const handleCopyId = () => {
    if (confirmedData?.appointmentId && navigator.clipboard) {
      navigator.clipboard.writeText(confirmedData.appointmentId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleNavigateToBookings = () => {
    handleClose();
    navigate('/my-bookings');
  };

  return (
    <div className="booking-modal-backdrop" onClick={handleClose}>
      <div
        className="booking-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Modal Header */}
        <div className="booking-modal-header">
          <h2 id="booking-modal-title" className="booking-modal-title">
            {bookingConfirmed ? 'Appointment Confirmed!' : 'Book Appointment'}
          </h2>
          <button
            type="button"
            className="booking-modal-close-btn"
            onClick={handleClose}
            aria-label="Close booking modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="booking-modal-body">
          {!bookingConfirmed ? (
            <form onSubmit={handleConfirmBooking} className="booking-modal-form">
              {/* 1. Service Details Ribbon */}
              <div className="booking-service-card">
                <img
                  src={service.image}
                  alt={service.title}
                  className="booking-service-card-img"
                />
                <div className="booking-service-card-body">
                  <h3 className="booking-service-card-title">{service.title}</h3>
                  {service.description && (
                    <p className="booking-service-card-desc">{service.description}</p>
                  )}
                  <div className="booking-service-card-badges">
                    <span className="booking-service-badge duration-badge">
                      <Clock size={12.5} />
                      <span>{service.duration}</span>
                    </span>
                    {service.schedule && (
                      <span className="booking-service-badge schedule-badge">
                        <Calendar size={12.5} />
                        <span>{service.schedule}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Customer Auto-Fetch Reassurance Note (No customer inputs required) */}
              <div className="booking-auto-account-note">
                <div className="auto-account-icon">
                  <ShieldCheck size={18} />
                </div>
                <div className="auto-account-text">
                  <span className="auto-account-title">Verified Customer Account</span>
                  <span className="auto-account-desc">
                    Customer name, email address, and phone number are automatically retrieved from your verified profile.
                  </span>
                </div>
              </div>

              {/* 3. Available Dates Section (Present & Future Only) */}
              <div className="booking-section">
                <div className="booking-section-header">
                  <div className="section-header-title-group">
                    <Calendar size={15} className="section-header-icon" />
                    <span className="section-title">Select Appointment Date</span>
                  </div>
                  <div className="slots-legend">
                    <span className="legend-item legend-blue">
                      <span className="legend-dot dot-blue" />
                      <span>Slots Available (Blue)</span>
                    </span>
                    <span className="legend-item legend-grey">
                      <span className="legend-dot dot-grey" />
                      <span>No Slots / Full (Grey)</span>
                    </span>
                  </div>
                </div>

                {/* Dates Horizontal Grid / Scroller */}
                <div className="booking-dates-grid" role="radiogroup" aria-label="Available dates">
                  {dateOptions.map((opt) => {
                    const isSelected = selectedDateStr === opt.dateStr;
                    const hasSlots = opt.isAvailable;

                    return (
                      <button
                        type="button"
                        key={opt.dateStr}
                        disabled={!hasSlots}
                        className={`date-slot-card ${hasSlots ? 'slots-available' : 'slots-empty'} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectDate(opt)}
                        aria-checked={isSelected}
                        aria-disabled={!hasSlots}
                      >
                        {/* Day Label (e.g. Today / Tomorrow / Fri) */}
                        <span className="date-card-day">{opt.dayName}</span>

                        {/* Date Number & Month */}
                        <div className="date-card-main">
                          <span className="date-card-number">{opt.formattedDay}</span>
                          <span className="date-card-month">{opt.formattedMonth}</span>
                        </div>

                        {/* Slots Availability Badge: Blue if available, Grey if full */}
                        <div className={`date-card-slots-pill ${hasSlots ? 'pill-blue' : 'pill-grey'}`}>
                          {hasSlots ? (
                            <>
                              <span className="slot-indicator-dot" />
                              <span>{opt.slotsAvailable} slots</span>
                            </>
                          ) : (
                            <>
                              <Ban size={10} className="slot-ban-icon" />
                              <span>Full</span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Live Booking Summary Box */}
              <div className="booking-selection-summary">
                <div className="summary-item">
                  <span className="summary-label">Selected Date</span>
                  <span className="summary-value">
                    <Calendar size={13} />
                    {currentSelectedDate?.fullDateText || 'None'}
                  </span>
                </div>
                <div className="summary-divider" />
                <div className="summary-item">
                  <span className="summary-label">Availability</span>
                  <span className={`summary-value ${currentSelectedDate?.isAvailable ? 'highlight' : ''}`}>
                    {currentSelectedDate?.isAvailable
                      ? `${currentSelectedDate.slotsAvailable} slots open`
                      : 'No slots available'}
                  </span>
                </div>
                <div className="summary-divider" />
                <div className="summary-item">
                  <span className="summary-label">Estimated Service</span>
                  <span className="summary-value highlight">
                    {service.duration}
                  </span>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="booking-modal-footer">
                <button
                  type="button"
                  className="booking-footer-btn booking-cancel-btn"
                  onClick={handleClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !currentSelectedDate?.isAvailable}
                  className="booking-footer-btn booking-submit-btn"
                >
                  <CalendarCheck size={16} />
                  <span>{isSubmitting ? 'Confirming...' : 'Confirm'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          ) : (
            /* Booking Confirmed Success Screen with Celebration Poppers */
            <div className="booking-success-view">
              <div className="booking-success-animation-wrap">
                <div className="booking-success-icon-ring">
                  <CheckCircle2 size={48} className="booking-success-check-icon" />
                </div>
              </div>

              <h3 className="booking-success-heading">Appointment Booked!</h3>
              <p className="booking-success-subtext">
                Your appointment for <strong>{confirmedData?.title}</strong> is confirmed. A notification with your token has been logged to your account.
              </p>

              {/* Official Ticket Confirmation Card */}
              <div className="booking-ticket-card">
                <div className="ticket-header-row">
                  <div className="ticket-id-group">
                    <span className="ticket-id-label">Appointment ID / Token</span>
                    <span className="ticket-id-value mono">{confirmedData?.appointmentId}</span>
                  </div>
                  <button
                    type="button"
                    className="ticket-copy-btn"
                    onClick={handleCopyId}
                    title="Copy Appointment ID"
                    aria-label="Copy Appointment ID"
                  >
                    {copiedId ? <Check size={13} className="copied-check" /> : <Copy size={13} />}
                  </button>
                </div>

                <div className="ticket-dashed-line" />

                <div className="ticket-details-grid">
                  <div className="ticket-cell">
                    <span className="ticket-cell-label">Service</span>
                    <span className="ticket-cell-value">{confirmedData?.title}</span>
                  </div>
                  <div className="ticket-cell">
                    <span className="ticket-cell-label">Duration</span>
                    <span className="ticket-cell-value">{confirmedData?.duration}</span>
                  </div>
                  <div className="ticket-cell">
                    <span className="ticket-cell-label">Appointment Date</span>
                    <span className="ticket-cell-value">{confirmedData?.appointmentDate}</span>
                  </div>
                  <div className="ticket-cell">
                    <span className="ticket-cell-label">Schedule Hours</span>
                    <span className="ticket-cell-value">{confirmedData?.schedule}</span>
                  </div>
                </div>

                <div className="ticket-footer-status">
                  <span className="ticket-status-pill">
                    <CheckCircle2 size={13} />
                    <span>Confirmed • Status: BOOKED</span>
                  </span>
                </div>
              </div>

              {/* Post-booking action buttons */}
              <div className="booking-success-actions">
                <button
                  type="button"
                  className="booking-action-btn view-bookings-btn"
                  onClick={handleNavigateToBookings}
                >
                  <CalendarCheck size={16} />
                  <span>View in My Bookings</span>
                </button>
                <button
                  type="button"
                  className="booking-action-btn done-btn"
                  onClick={handleClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
