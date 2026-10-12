import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import appointmentApi from '../../services/api/appointment.api';
import availabilityApi from '../../services/api/availability.api';
import './BookingModal.css';

/**
 * Triggers celebratory confetti poppers across the screen
 */
const triggerCelebrationPoppers = () => {
  try {
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#1D68F2', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'],
      disableForReducedMotion: true,
      zIndex: 1600,
    });

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
  } catch (err) {
    console.warn('Poppers animation error:', err);
  }
};

const getIsoDateString = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Builds 7 upcoming calendar days starting from today:
 * 1. If admin created an availability record with status === 'OPEN' and slotsAvailable > 0:
 *    -> Shown as BLUE in color with available slots (capacity - bookedCount).
 * 2. If admin created an availability record but status is full/closed or slotsAvailable <= 0:
 *    -> Shown as DARK GREY in color with 'Full' or 'Closed'.
 * 3. Otherwise (dummy days without admin availability):
 *    -> Shown as LIGHT GREY in color with 'No Slots'.
 */
const buildDateOptions = (availabilities = []) => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const isoDate = getIsoDateString(d);

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

    const match = Array.isArray(availabilities)
      ? availabilities.find((a) => a && a.date === isoDate)
      : null;

    if (match) {
      const capacity = Number(match.capacity) || 0;
      const bookedCount = Number(match.bookedCount) || 0;
      const slotsAvailable = capacity - bookedCount;
      const statusUpper = (match.status || 'OPEN').toUpperCase();

      if (statusUpper === 'OPEN' && slotsAvailable > 0) {
        // STATE 1: AVAILABLE -> BLUE
        dates.push({
          dateStr: isoDate,
          availabilityId: match._id,
          dayName,
          formattedDay,
          formattedMonth,
          fullDateText,
          slotsAvailable,
          isAvailable: true,
          themeClass: 'slots-available',
          pillClass: 'pill-blue',
          pillText: `${slotsAvailable} slots`,
        });
      } else {
        // STATE 2: FULL / STATUS OTHER THAN OPEN -> DARK GREY
        const isFull = slotsAvailable <= 0 || statusUpper === 'FULL';
        dates.push({
          dateStr: isoDate,
          availabilityId: match._id,
          dayName,
          formattedDay,
          formattedMonth,
          fullDateText,
          slotsAvailable: Math.max(0, slotsAvailable),
          isAvailable: false,
          themeClass: 'slots-dark-grey',
          pillClass: 'pill-dark-grey',
          pillText: isFull ? 'Full' : (statusUpper === 'CLOSED' ? 'Closed' : 'Unavailable'),
        });
      }
    } else {
      // STATE 3: DUMMY / NO RECORD CREATED BY ADMIN -> LIGHT GREY
      dates.push({
        dateStr: isoDate,
        availabilityId: null,
        dayName,
        formattedDay,
        formattedMonth,
        fullDateText,
        slotsAvailable: 0,
        isAvailable: false,
        themeClass: 'slots-light-grey',
        pillClass: 'pill-light-grey',
        pillText: 'No Slots',
      });
    }
  }

  return dates;
};

export const BookingModal = ({
  service,
  isOpen,
  onClose,
  onBookingSuccess
}) => {
  const [dbAvailabilities, setDbAvailabilities] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const serviceId = service?._id || service?.id;

  // Fetch real database availability for this service when modal opens
  const fetchAvailability = useCallback(async () => {
    if (!serviceId) return;
    setIsLoadingAvailability(true);
    try {
      const res = await availabilityApi.getAvailability(serviceId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setDbAvailabilities(list);
    } catch (err) {
      console.warn('Could not fetch real availability from database:', err);
      setDbAvailabilities([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (isOpen && serviceId) {
      fetchAvailability();
      setBookingError(null);
      setBookingConfirmed(false);
      setConfirmedData(null);
    }
  }, [isOpen, serviceId, fetchAvailability]);

  // Generate date options strictly from real database availability records
  const dateOptions = useMemo(() => {
    return buildDateOptions(dbAvailabilities);
  }, [dbAvailabilities]);

  // Default selected date to first available date with open slots
  useEffect(() => {
    const firstAvailable = dateOptions.find((d) => d.isAvailable);
    if (firstAvailable) {
      const stillValid = dateOptions.some((d) => d.dateStr === selectedDateStr && d.isAvailable);
      if (!stillValid) {
        setSelectedDateStr(firstAvailable.dateStr);
      }
    } else {
      setSelectedDateStr('');
    }
  }, [dateOptions, selectedDateStr]);

  // Keep track of currently chosen date object
  const currentSelectedDate = useMemo(() => {
    return dateOptions.find((d) => d.dateStr === selectedDateStr && d.isAvailable) || null;
  }, [dateOptions, selectedDateStr]);

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

  // Trigger celebration poppers when confirmed
  useEffect(() => {
    if (bookingConfirmed) {
      triggerCelebrationPoppers();
    }
  }, [bookingConfirmed]);

  if (!isOpen || !service) return null;

  const handleSelectDate = (dateItem) => {
    if (!dateItem.isAvailable) return;
    setSelectedDateStr(dateItem.dateStr);
    setBookingError(null);
  };

  // Submit booking to real Backend API
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!currentSelectedDate?.isAvailable) return;

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const srvId = service._id || service.id;
      const availId = currentSelectedDate.availabilityId || undefined;

      const res = await appointmentApi.bookAppointment(srvId, availId, {
        serviceId: srvId,
        availabilityId: availId,
        date: currentSelectedDate.dateStr,
      });

      const appointmentData = res?.data || {};
      const generatedId = appointmentData.appointmentId || appointmentData._id || 'BOOKED';

      const newAppointment = {
        id: generatedId,
        appointmentId: generatedId,
        title: service.title || service.name,
        description: service.description,
        image: service.image || service.imageUrl,
        appointmentDate: currentSelectedDate.fullDateText,
        duration: service.duration,
        schedule: service.schedule,
        status: 'Booked',
        createdAt: new Date().toISOString(),
      };

      // Persist to localStorage so My Bookings page displays this new appointment
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
      setBookingConfirmed(true);

      if (onBookingSuccess) {
        onBookingSuccess(newAppointment);
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setBookingError(err.message || 'Failed to complete appointment booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBookingConfirmed(false);
    setConfirmedData(null);
    setBookingError(null);
    setSelectedDateStr('');
    onClose();
  };

  const handleCopyId = () => {
    if (confirmedData?.appointmentId && navigator.clipboard) {
      navigator.clipboard.writeText(confirmedData.appointmentId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
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
                  alt={service.title || service.name}
                  className="booking-service-card-img"
                />
                <div className="booking-service-card-body">
                  <h3 className="booking-service-card-title">{service.title || service.name}</h3>
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

              {/* 2. Error Message if booking fails */}
              {bookingError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* 3. Customer Auto-Fetch Reassurance Note */}
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

              {/* 4. Available Dates Section */}
              <div className="booking-section">
                <div className="booking-section-header">
                  <div className="section-header-title-group">
                    <Calendar size={15} className="section-header-icon" />
                    <span className="section-title">Select Appointment Date</span>
                  </div>
                  <div className="slots-legend">
                    <span className="legend-item legend-blue">
                      <span className="legend-dot dot-blue" />
                      <span>Available (Blue)</span>
                    </span>
                    <span className="legend-item legend-dark-grey">
                      <span className="legend-dot dot-dark-grey" />
                      <span>Full / Closed (Dark Grey)</span>
                    </span>
                    <span className="legend-item legend-light-grey">
                      <span className="legend-dot dot-light-grey" />
                      <span>No Slots (Light Grey)</span>
                    </span>
                  </div>
                </div>

                {/* Dates Horizontal Grid / Scroller */}
                <div className="booking-dates-grid" role="radiogroup" aria-label="Available dates">
                  {isLoadingAvailability ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 10px', color: '#64748B', fontSize: 13 }}>
                      <RefreshCw size={16} className="spin-icon" color="#1D68F2" />
                      <span>Checking slot availability from database...</span>
                    </div>
                  ) : (
                    dateOptions.map((opt) => {
                      const isSelected = selectedDateStr === opt.dateStr && opt.isAvailable;

                      return (
                        <button
                          type="button"
                          key={opt.dateStr}
                          disabled={!opt.isAvailable}
                          className={`date-slot-card ${opt.themeClass} ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectDate(opt)}
                          aria-checked={isSelected}
                          aria-disabled={!opt.isAvailable}
                        >
                          {/* Day Label */}
                          <span className="date-card-day">{opt.dayName}</span>

                          {/* Date Number & Month */}
                          <div className="date-card-main">
                            <span className="date-card-number">{opt.formattedDay}</span>
                            <span className="date-card-month">{opt.formattedMonth}</span>
                          </div>

                          {/* Slots Availability Badge */}
                          <div className={`date-card-slots-pill ${opt.pillClass}`}>
                            {opt.isAvailable ? (
                              <>
                                <span className="slot-indicator-dot" />
                                <span>{opt.pillText}</span>
                              </>
                            ) : opt.themeClass === 'slots-dark-grey' ? (
                              <>
                                <Ban size={10} className="slot-ban-icon" />
                                <span>{opt.pillText}</span>
                              </>
                            ) : (
                              <>
                                <span className="slot-indicator-dot dot-light" />
                                <span>{opt.pillText}</span>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 5. Live Booking Summary Box */}
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
                  <span className={`summary-value ${currentSelectedDate ? 'highlight' : ''}`}>
                    {currentSelectedDate
                      ? `${currentSelectedDate.slotsAvailable} slots open`
                      : 'No slots available'}
                  </span>
                </div>
                <div className="summary-divider" />
                <div className="summary-item">
                  <span className="summary-label">Estimated Service</span>
                  <span className="summary-value highlight">
                    {service.duration || '15 minutes'}
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
                  disabled={isSubmitting || !currentSelectedDate || dateOptions.length === 0}
                  className="booking-footer-btn booking-submit-btn"
                >
                  <CalendarCheck size={16} />
                  <span>{isSubmitting ? 'Confirming with database...' : 'Confirm'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          ) : (
            /* Booking Confirmed Success Screen */
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
                    <span className="ticket-cell-label">Date & Day</span>
                    <span className="ticket-cell-value">{confirmedData?.appointmentDate}</span>
                  </div>
                  <div className="ticket-cell">
                    <span className="ticket-cell-label">Duration</span>
                    <span className="ticket-cell-value">{confirmedData?.duration}</span>
                  </div>
                  <div className="ticket-cell">
                    <span className="ticket-cell-label">Status</span>
                    <span className="ticket-cell-value status-booked-tag">
                      {confirmedData?.status || 'Booked'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Success Action Buttons */}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
