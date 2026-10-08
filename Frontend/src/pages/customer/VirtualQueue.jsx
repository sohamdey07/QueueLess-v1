import React from 'react';
import {
  Radio,
  User,
  Calendar,
  Clock,
  Stethoscope,
  Ticket,
  Check
} from 'lucide-react';
import QueueWaitingBanner from '../../components/customer/QueueWaitingBanner';
import generalConsultImg from '../../assets/images/bookings/general_consultation.jpg';
import './VirtualQueue.css';

export const VirtualQueue = ({
  queueData = {
    currentlyServing: 'A-041',
    counter: 'Counter 2',
    userToken: 'A-042',
    userPosition: 2,
    estimatedWaitTime: '~ 15 mins',
    serviceName: 'General Consultation',
    serviceDescription: 'Consult with our experienced doctors for general health issues.',
    serviceImage: generalConsultImg,
    appointmentId: 'QL-20260926-8F42K1',
    appointmentSchedule: '26 Sep 2026',
    checkInTime: '10:12 AM',
  }
}) => {
  return (
    <div className="virtual-queue-page">
      {/* 1. Standardized Hero Banner using queue waiting.png */}
      <QueueWaitingBanner />

      {/* 2. Main Sections Grid with Outer White Padding */}
      <div className="virtual-queue-grid">
        {/* Row 1, Col 1: Currently Serving (Theme: Light Blue) */}
        <section className="vq-card vq-serving-card" aria-label="Currently Serving">
          <div className="vq-card-inner vq-serving-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <Radio size={20} strokeWidth={2.4} className="vq-header-icon vq-serving-icon" />
                <h2 className="vq-card-title">Currently Serving</h2>
              </div>
              <div className="vq-live-badge" aria-label="Live Status">
                <span className="vq-live-dot" />
                <span>LIVE</span>
              </div>
            </div>

            <div className="vq-serving-body">
              <div className="vq-huge-number">{queueData.currentlyServing}</div>
              <div className="vq-counter-indicator">
                <Calendar size={18} strokeWidth={2.2} className="vq-counter-icon" />
                <span>{queueData.counter}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Row 1, Col 2: Your Token (Theme: Light Green) */}
        <section className="vq-card vq-token-card" aria-label="Your Token">
          <div className="vq-card-inner vq-token-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <User size={20} strokeWidth={2.4} className="vq-header-icon vq-token-icon" />
                <h2 className="vq-card-title">Your Token</h2>
              </div>
              <div className="vq-status-pill">
                <span>IN QUEUE</span>
              </div>
            </div>

            <div className="vq-token-body">
              <div className="vq-huge-token-number">{queueData.userToken}</div>

              <div className="vq-token-meta-split">
                {/* Left Column: Your Position */}
                <div className="vq-token-position-col">
                  <span className="vq-meta-label">Your Position</span>
                  <span className="vq-position-big-number">{queueData.userPosition}</span>
                  <span className="vq-meta-subtext">people ahead of you</span>
                </div>

                {/* Center Divider */}
                <div className="vq-token-divider" />

                {/* Right Column: Estimated Wait Time */}
                <div className="vq-token-wait-col">
                  <div className="vq-wait-header-line">
                    <span className="vq-meta-label">Estimated Wait Time</span>
                  </div>
                  <div className="vq-wait-big-time">
                    <span>{queueData.estimatedWaitTime}</span>
                  </div>
                  <span className="vq-meta-subtext">Based on current flow</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2, Col 1: Service (Theme: Light Violet) */}
        <section className="vq-card vq-service-card" aria-label="Service Details">
          <div className="vq-card-inner vq-service-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <Stethoscope size={20} strokeWidth={2.4} className="vq-header-icon vq-service-icon" />
                <h2 className="vq-card-title">Service</h2>
              </div>
            </div>

            <div className="vq-service-body">
              <img
                src={queueData.serviceImage}
                alt={queueData.serviceName}
                className="vq-service-poster"
              />
              <div className="vq-service-info">
                <h3 className="vq-service-name">{queueData.serviceName}</h3>
                <p className="vq-service-description">{queueData.serviceDescription}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2, Col 2: Appointment ID (Theme: Light Orange) */}
        <section className="vq-card vq-appointment-card" aria-label="Appointment ID Details">
          <div className="vq-card-inner vq-appointment-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <Ticket size={20} strokeWidth={2.4} className="vq-header-icon vq-appointment-icon" />
                <h2 className="vq-card-title">Appointment ID</h2>
              </div>
            </div>

            <div className="vq-appointment-body">
              <div className="vq-ticket-icon-box">
                <Ticket size={22} strokeWidth={2} />
              </div>
              <div className="vq-appointment-info">
                <span className="vq-appointment-code">{queueData.appointmentId}</span>
                <span className="vq-appointment-schedule">{queueData.appointmentSchedule}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Row 3: Your Queue Progress Tracker */}
        <section className="vq-card vq-progress-card" aria-label="Queue Progress Tracker">
          <div className="vq-card-inner vq-progress-inner">
            <div className="vq-card-header">
              <div className="vq-header-title-wrap">
                <Clock size={20} strokeWidth={2.4} className="vq-header-icon" />
                <h2 className="vq-card-title">Your Queue Progress</h2>
              </div>
            </div>

            <div className="vq-tracker-container">
              {/* Step 1: Checked In (Completed) */}
              <div className="vq-tracker-step completed">
                <div className="vq-step-line completed" />

                <div className="vq-step-top-timestamp">{queueData.checkInTime}</div>
                <div className="vq-node-circle completed">
                  <Check size={16} strokeWidth={3} className="vq-check-icon" />
                </div>
                <div className="vq-step-text-wrap">
                  <span className="vq-step-title completed">Checked In</span>
                  <span className="vq-step-desc">You joined the queue</span>
                </div>
              </div>

              {/* Step 2: Waiting (Current Active State with blinking animation) */}
              <div className="vq-tracker-step active">
                <div className="vq-step-line pending" />

                <div className="vq-step-top-timestamp spacer">&nbsp;</div>
                <div className="vq-node-circle active">
                  <span className="vq-active-pulse-ring" />
                  <span className="vq-active-inner-dot" />
                </div>
                <div className="vq-step-text-wrap">
                  <span className="vq-step-title active">Waiting</span>
                  <span className="vq-step-desc">Your turn is coming soon</span>
                </div>
              </div>

              {/* Step 3: Serving (Upcoming) */}
              <div className="vq-tracker-step pending">
                <div className="vq-step-line pending" />

                <div className="vq-step-top-timestamp spacer">&nbsp;</div>
                <div className="vq-node-circle pending" />
                <div className="vq-step-text-wrap">
                  <span className="vq-step-title pending">Serving</span>
                  <span className="vq-step-desc">You will be called at the counter</span>
                </div>
              </div>

              {/* Step 4: Completed (Upcoming - No connector line) */}
              <div className="vq-tracker-step pending">
                <div className="vq-step-top-timestamp spacer">&nbsp;</div>
                <div className="vq-node-circle pending" />
                <div className="vq-step-text-wrap">
                  <span className="vq-step-title pending">Completed</span>
                  <span className="vq-step-desc">Your service is finished</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VirtualQueue;
