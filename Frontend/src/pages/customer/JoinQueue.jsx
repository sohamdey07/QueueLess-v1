import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  ArrowRight, 
  Info, 
  Lightbulb, 
  CheckCircle2, 
  X,
  Users,
  Clock,
  ExternalLink
} from 'lucide-react';
import JoinQueueBanner from '../../components/customer/JoinQueueBanner';
import './JoinQueue.css';

export const JoinQueue = () => {
  const navigate = useNavigate();
  const [appointmentId, setAppointmentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queueTokenModal, setQueueTokenModal] = useState(null);

  // Prevent background page from scrolling when queue token modal is showing
  useEffect(() => {
    if (queueTokenModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [queueTokenModal]);

  // Active joined queue item for the user (matching illustration & live queue state)
  const [joinedQueue, setJoinedQueue] = useState({
    serviceName: 'General Consultation',
    appointmentId: 'QL-20260926-8F42K1',
    tokenNumber: 'A-042',
    counter: 'Counter 02',
    peopleAhead: 3,
    estimatedWait: '12 mins',
    status: 'In Queue'
  });

  const handleJoinQueue = (e) => {
    e.preventDefault();
    if (!appointmentId.trim()) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const newQueueData = {
        tokenNumber: 'A-042',
        serviceName: 'General Consultation',
        peopleAhead: 3,
        estimatedWait: '12 mins',
        appointmentId: appointmentId.trim(),
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'In Queue'
      };

      setJoinedQueue(newQueueData);
      setQueueTokenModal(newQueueData);
    }, 500);
  };

  const handleGoToQueue = () => {
    navigate('/virtual-queue');
  };

  const handleCloseModal = () => {
    setQueueTokenModal(null);
  };

  return (
    <div className="join-queue-page">
      {/* 1. Top Hero Banner matching exact dimensions & image */}
      <JoinQueueBanner />

      {/* 2. Main 2-Column Section */}
      <div className="join-queue-main-grid">
        {/* Left Column: Enter Appointment ID & Joined Queue Info */}
        <div className="join-queue-left-column">
          {/* Card: Enter Appointment ID */}
          <section className="join-queue-form-card" aria-label="Enter Appointment ID">
            <div className="join-queue-card-header">
              <div className="join-queue-icon-circle">
                <Ticket size={24} strokeWidth={2} className="join-queue-header-icon" />
              </div>
              <div className="join-queue-header-text">
                <h2 className="join-queue-card-title">Enter Your Appointment ID</h2>
                <p className="join-queue-card-subtitle">
                  Use the appointment ID you received after booking to join the queue.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinQueue} className="join-queue-form">
              <div className="join-queue-input-group">
                <label htmlFor="appointmentIdInput" className="join-queue-label">
                  Appointment ID
                </label>
                <div className="join-queue-input-wrapper">
                  <Ticket size={17} strokeWidth={2} className="join-queue-field-icon" />
                  <input
                    id="appointmentIdInput"
                    type="text"
                    value={appointmentId}
                    onChange={(e) => setAppointmentId(e.target.value)}
                    placeholder="e.g. QL-20260926-8F42K1"
                    className="join-queue-input"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="join-queue-submit-btn"
                disabled={isLoading}
                aria-label="Join Virtual Queue"
              >
                <span>{isLoading ? 'Verifying...' : 'Join Virtual Queue'}</span>
                <ArrowRight size={17} strokeWidth={2.2} className="join-queue-btn-arrow" />
              </button>
            </form>

            <div className="join-queue-info-footer">
              <Info size={15} strokeWidth={2} className="join-queue-info-icon" />
              <span>Make sure to use the exact appointment ID from your booking confirmation.</span>
            </div>
          </section>

          {/* Card: Joined Virtual Queue Info (Displayed at the bottom of Enter Appointment ID section) */}
          {joinedQueue && (
            <section className="joined-queue-status-card" aria-label="Joined Virtual Queue Information">
              <div className="joined-queue-card-header">
                <div className="joined-queue-header-left">
                  <div className="joined-queue-icon-circle">
                    <CheckCircle2 size={22} strokeWidth={2.2} />
                  </div>
                  <div className="joined-queue-header-text">
                    <h3 className="joined-queue-title">Your Joined Queue</h3>
                    <p className="joined-queue-subtitle">
                      You are currently active in this virtual queue.
                    </p>
                  </div>
                </div>
                <div className="joined-queue-live-badge">
                  <span className="live-pulse-dot" />
                  <span>IN QUEUE</span>
                </div>
              </div>

              {/* Info Summary: Service name, Appointment ID, Token Number */}
              <div className="joined-queue-details-box">
                <div className="joined-detail-item">
                  <span className="joined-detail-label">Service</span>
                  <span className="joined-detail-value">{joinedQueue.serviceName}</span>
                </div>
                <div className="joined-detail-item">
                  <span className="joined-detail-label">Appointment ID</span>
                  <span className="joined-detail-value mono-id">{joinedQueue.appointmentId}</span>
                </div>
                <div className="joined-detail-item token-highlight-item">
                  <span className="joined-detail-label">Token Number</span>
                  <span className="joined-detail-token">{joinedQueue.tokenNumber}</span>
                </div>
              </div>

              {/* Navigation Action to Queue Page */}
              <button
                type="button"
                className="go-to-queue-btn"
                onClick={handleGoToQueue}
                aria-label="Go to Queue Page"
              >
                <span>Go to Queue Page</span>
                <ExternalLink size={16} strokeWidth={2.2} className="go-to-queue-arrow" />
              </button>
            </section>
          )}
        </div>

        {/* Right Column: How it works & Important Information */}
        <div className="join-queue-right-column">
          {/* Card: How it works? */}
          <aside className="join-queue-steps-card" aria-label="How it works">
            <h2 className="join-queue-steps-heading">How it works?</h2>

            <div className="join-queue-steps-container">
              {/* Step 1 */}
              <div className="join-step-item">
                <div className="step-indicator-col">
                  <div className="step-number-circle">1</div>
                  <div className="step-connector-line" />
                </div>
                <div className="step-content-col">
                  <h3 className="step-title">Enter Appointment ID</h3>
                  <p className="step-desc">
                    Use the appointment ID you received while booking.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="join-step-item">
                <div className="step-indicator-col">
                  <div className="step-number-circle">2</div>
                  <div className="step-connector-line" />
                </div>
                <div className="step-content-col">
                  <h3 className="step-title">Verify Appointment</h3>
                  <p className="step-desc">
                    We'll check your appointment details and eligibility.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="join-step-item">
                <div className="step-indicator-col">
                  <div className="step-number-circle">3</div>
                </div>
                <div className="step-content-col">
                  <h3 className="step-title">Join the Queue</h3>
                  <p className="step-desc">
                    Get your queue token and start receiving real-time updates.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Card: Important Information (Aligned in the Right Side) */}
          <aside className="join-queue-important-card" aria-label="Important Information">
            <div className="important-card-header">
              <div className="important-icon-circle">
                <Lightbulb size={22} strokeWidth={2.2} className="important-bulb-icon" />
              </div>
              <h2 className="important-title">Important Information</h2>
            </div>

            <ul className="important-list">
              <li className="important-list-item">
                <span className="important-bullet" />
                <span>You can join the queue only for today’s appointment.</span>
              </li>
              <li className="important-list-item">
                <span className="important-bullet" />
                <span>Make sure your appointment is confirmed.</span>
              </li>
              <li className="important-list-item">
                <span className="important-bullet" />
                <span>You can join the queue within the allowed check-in time for your service.</span>
              </li>
              <li className="important-list-item">
                <span className="important-bullet" />
                <span>If you face any issue, please contact the front desk or support.</span>
              </li>
            </ul>
          </aside>
        </div>
      </div>

      {/* Modal: Live Queue Token Ticket on Successful Check-In */}
      {queueTokenModal && (
        <div className="queue-token-modal-backdrop" onClick={handleCloseModal}>
          <div 
            className="queue-token-modal-card" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="queue-token-modal-header">
              <div className="token-success-icon-wrap">
                <CheckCircle2 size={32} className="token-success-icon" />
              </div>
              <button 
                type="button" 
                className="token-modal-close-btn" 
                onClick={handleCloseModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="queue-token-modal-title">You're in the Queue!</h3>
            <p className="queue-token-modal-desc">
              Your appointment has been verified. Please keep this token handy.
            </p>

            <div className="queue-token-ticket">
              <span className="ticket-header-label">YOUR QUEUE TOKEN</span>
              <span className="ticket-huge-number">{queueTokenModal.tokenNumber}</span>
              <div className="ticket-dashed-sep" />
              <div className="ticket-meta-grid">
                <div className="ticket-meta-item">
                  <span className="ticket-meta-label">Service</span>
                  <span className="ticket-meta-val">{queueTokenModal.serviceName}</span>
                </div>
                <div className="ticket-meta-item">
                  <span className="ticket-meta-label">Wait Time</span>
                  <span className="ticket-meta-val flex-val"><Clock size={12} /> {queueTokenModal.estimatedWait}</span>
                </div>
                <div className="ticket-meta-item">
                  <span className="ticket-meta-label">Ahead of You</span>
                  <span className="ticket-meta-val flex-val"><Users size={12} /> {queueTokenModal.peopleAhead} People</span>
                </div>
                <div className="ticket-meta-item">
                  <span className="ticket-meta-label">Joined At</span>
                  <span className="ticket-meta-val">{queueTokenModal.joinedAt}</span>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              className="queue-token-action-btn"
              onClick={() => {
                handleCloseModal();
                navigate('/virtual-queue');
              }}
            >
              Go to Queue Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinQueue;
