import React, { useState } from 'react';
import { Clock, Calendar, Ticket, Copy, Check, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import './ServiceCard.css';

/**
 * Common reusable ServiceCard component
 * Designed to represent service items across customer, staff, and admin dashboards.
 * Supports both service browsing, booked appointments, and appointment history modes.
 */
export const ServiceCard = ({
  service,
  onAction,
  onBook,
  onDetails,
  onCancel,
  onJoinQueue,
  bookText = 'Book',
  detailsText = 'Details',
  cancelText = 'Cancel',
  joinQueueText = 'Join Queue',
  showAction = true,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  if (!service) return null;

  const {
    title,
    name,
    description = '',
    duration,
    schedule,
    availability,
    scheduleType = 'blue',
    image,
    imageUrl,
    appointmentDate,
    appointmentId,
    relativeBadge,
    status,
    statusLabel,
  } = service;

  const displayTitle = title || name || 'Service';
  const displayImage = image || imageUrl;
  const displaySchedule = schedule || availability;
  const displayDuration = typeof duration === 'number' ? `${duration} minutes` : duration;
  const isBookingMode = Boolean(appointmentDate || appointmentId || onJoinQueue || onCancel);
  const effectiveStatus = status || (isBookingMode ? 'Booked' : null);

  const handleBook = () => {
    if (onBook) {
      onBook(service);
    } else if (onAction) {
      onAction(service);
    }
  };

  const handleDetails = () => {
    if (onDetails) {
      onDetails(service);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel(service);
    }
  };

  const handleJoinQueue = () => {
    if (onJoinQueue) {
      onJoinQueue(service);
    }
  };

  const handleCopyId = (e) => {
    e.stopPropagation();
    if (appointmentId && navigator.clipboard) {
      navigator.clipboard.writeText(appointmentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`ql-service-card ${className}`}>
      {/* Top Poster Image Area */}
      <div className="ql-service-card-media">
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayTitle}
            className="ql-service-card-img"
            loading="lazy"
          />
        ) : (
          <div className="ql-service-card-img-placeholder" />
        )}

        {/* Floating Status Pill (with Green Background for Booked), Relative Badge, or Duration Badge */}
        {effectiveStatus ? (
          <div className={`ql-service-status-badge status-${effectiveStatus.toLowerCase()}`} aria-label={`Status: ${effectiveStatus}`}>
            {effectiveStatus.toLowerCase() === 'cancelled' ? (
              <XCircle size={13.5} strokeWidth={2.5} className="ql-status-badge-icon" />
            ) : (
              <CheckCircle2 size={13.5} strokeWidth={2.5} className="ql-status-badge-icon" />
            )}
            <span>{statusLabel || (effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1).toLowerCase())}</span>
          </div>
        ) : relativeBadge ? (
          <div className="ql-service-relative-badge" aria-label={`Due: ${relativeBadge}`}>
            <span>{relativeBadge}</span>
          </div>
        ) : displayDuration ? (
          <div className="ql-service-duration-badge" aria-label={`Duration: ${displayDuration}`}>
            <Clock size={13.5} strokeWidth={2.2} className="ql-duration-icon" />
            <span>{displayDuration}</span>
          </div>
        ) : null}
      </div>

      {/* Card Content Body */}
      <div className="ql-service-card-body">
        <h3 className="ql-service-card-title">{displayTitle}</h3>

        {description && (
          <p className="ql-service-card-desc">{description}</p>
        )}

        {/* If in booking mode: Appointment Date & ID Rows (No status section in main content area) */}
        {isBookingMode ? (
          <div className="ql-service-appointment-meta">
            {appointmentDate && (
              <div className="ql-appointment-meta-row">
                <div className="ql-appointment-meta-icon">
                  <Calendar size={17} strokeWidth={2} />
                </div>
                <div className="ql-appointment-meta-info">
                  <span className="ql-appointment-meta-label">Appointment Date</span>
                  <span className="ql-appointment-meta-val">{appointmentDate}</span>
                </div>
              </div>
            )}

            {appointmentId && (
              <div className="ql-appointment-meta-row">
                <div className="ql-appointment-meta-icon">
                  <Ticket size={17} strokeWidth={2} />
                </div>
                <div className="ql-appointment-meta-info">
                  <span className="ql-appointment-meta-label">Appointment ID</span>
                  <span className="ql-appointment-meta-val mono">{appointmentId}</span>
                </div>
                <button
                  type="button"
                  className="ql-copy-id-btn"
                  onClick={handleCopyId}
                  title="Copy Appointment ID"
                  aria-label="Copy Appointment ID"
                >
                  {copied ? <Check size={14} className="copied-check" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Schedule Availability Pill (Green / Blue) */
          displaySchedule && (
            <div className={`ql-service-schedule-pill schedule-${scheduleType}`}>
              <Calendar size={15} strokeWidth={2} className="ql-schedule-icon" />
              <span>{displaySchedule}</span>
            </div>
          )
        )}

        {/* Action Buttons Row: Cancel & Join Queue for booking cards */}
        {showAction && (
          (onCancel || onJoinQueue || isBookingMode) && !onBook ? (
            <div className="ql-service-card-actions ql-booking-actions">
              <button
                type="button"
                className="ql-service-btn ql-btn-cancel"
                onClick={handleCancel}
                aria-label={`${cancelText} for ${displayTitle}`}
              >
                <span>{cancelText}</span>
              </button>
              <button
                type="button"
                className="ql-service-btn ql-btn-join-queue"
                onClick={handleJoinQueue}
                aria-label={`${joinQueueText} for ${displayTitle}`}
              >
                <span>{joinQueueText}</span>
                <ArrowRight size={15} strokeWidth={2.2} className="ql-service-btn-arrow" />
              </button>
            </div>
          ) : (status && (status.toLowerCase() === 'completed' || status.toLowerCase() === 'cancelled')) || (onDetails && !onBook) ? (
            <div className="ql-service-card-actions ql-history-actions">
              <button
                type="button"
                className="ql-service-btn ql-btn-view-details"
                onClick={handleDetails}
                aria-label={`${detailsText} for ${displayTitle}`}
              >
                <Clock size={15} strokeWidth={2.2} />
                <span>{detailsText}</span>
              </button>
            </div>
          ) : (
            <div className="ql-service-card-actions">
              <button
                type="button"
                className="ql-service-btn ql-btn-details"
                onClick={handleDetails}
                aria-label={`${detailsText} for ${displayTitle}`}
              >
                <span>{detailsText}</span>
              </button>
              <button
                type="button"
                className="ql-service-btn ql-btn-book"
                onClick={handleBook}
                aria-label={`${bookText} for ${displayTitle}`}
              >
                <span>{bookText}</span>
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
