import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  CalendarDays, 
  CalendarClock, 
  CalendarCheck,
  ChevronDown, 
  AlertTriangle,
  X,
  Clock,
  Ticket,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  LogIn,
  Megaphone,
  Play
} from 'lucide-react';
import MyBookingBanner from '../../components/customer/MyBookingBanner';
import ServiceCard from '../../components/common/ServiceCard';

import generalConsultImg from '../../assets/images/bookings/general_consultation.jpg';
import documentVerifImg from '../../assets/images/bookings/document_verification.jpg';
import accountAssistImg from '../../assets/images/bookings/account_assistance.jpg';
import bloodTestImg from '../../assets/images/bookings/blood_test.jpg';
import dentalCheckupImg from '../../assets/images/bookings/dental_checkup.jpg';
import eyeCheckupImg from '../../assets/images/bookings/eye_checkup.jpg';
import vaccinationImg from '../../assets/images/bookings/vaccination.jpg';
import vehicleServiceImg from '../../assets/images/bookings/vehicle_service.jpg';

import './MyBookings.css';

export const MyBookings = ({ defaultTab = 'upcoming' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [internalTab, setInternalTab] = useState(defaultTab);
  const routeTab = location.pathname === '/appointment-history' 
    ? 'history' 
    : (location.pathname === '/my-bookings' ? 'upcoming' : null);
  const activeTab = routeTab || internalTab;

  const [sortOption, setSortOption] = useState('nearest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // History filters & sort
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'completed' | 'cancelled'
  const [historySort, setHistorySort] = useState('latest'); // 'latest' | 'oldest'
  const [showHistorySortDropdown, setShowHistorySortDropdown] = useState(false);

  // Modals state
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [selectedDetailsBooking, setSelectedDetailsBooking] = useState(null);
  const [copiedModalId, setCopiedModalId] = useState(false);
  const [copiedListId, setCopiedListId] = useState(null);

  // Prevent background page from scrolling when any modal is showing
  useEffect(() => {
    if (cancelModalBooking || selectedDetailsBooking) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [cancelModalBooking, selectedDetailsBooking]);

  // Upcoming appointments list (persists newly booked appointments from BookingModal)
  const [bookings, setBookings] = useState(() => {
    const defaultList = [
      {
        id: 'QL-20260926-8F42K1',
        title: 'General Consultation',
        description: 'Consult with our experienced doctors for general health issues.',
        image: generalConsultImg,
        relativeBadge: 'In 2 days',
        appointmentDate: '28 Sep 2026, 10:00 AM',
        appointmentId: 'QL-20260926-8F42K1',
      },
      {
        id: 'QL-20261001-5D21P9',
        title: 'Document Verification',
        description: 'Submit and verify your documents with our team.',
        image: documentVerifImg,
        relativeBadge: 'In 5 days',
        appointmentDate: '01 Oct 2026, 11:30 AM',
        appointmentId: 'QL-20261001-5D21P9',
      },
      {
        id: 'QL-20261003-9K77L2',
        title: 'Account Assistance',
        description: 'Get help with account related services and updates.',
        image: accountAssistImg,
        relativeBadge: 'In 7 days',
        appointmentDate: '03 Oct 2026, 03:00 PM',
        appointmentId: 'QL-20261003-9K77L2',
      },
    ];

    try {
      const stored = localStorage.getItem('queueless_upcoming_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return defaultList;
  });

  // Previous booked appointments history list
  const [historyBookings] = useState([
    {
      id: 'QL-20260920-7A39B1',
      title: 'General Consultation',
      description: 'Routine general health consultation and wellness screening.',
      image: generalConsultImg,
      appointmentDate: '20 Sep 2026',
      appointmentId: 'QL-20260920-7A39B1',
      status: 'COMPLETED',
      bookedAt: '17 Sep 2026, 02:15 PM',
      checkedInAt: '20 Sep 2026, 09:18 AM',
      calledAt: '20 Sep 2026, 09:28 AM',
      counterName: 'Counter #3 (Room 102)',
      servingAt: '20 Sep 2026, 09:32 AM',
      servedBy: 'Dr. Sarah Mitchell, MD',
      completedAt: '20 Sep 2026, 09:55 AM',
    },
    {
      id: 'QL-20260914-4G11R7',
      title: 'Blood Test & Diagnostics',
      description: 'Complete blood count (CBC) and metabolic lipid panel test.',
      image: bloodTestImg,
      appointmentDate: '14 Sep 2026',
      appointmentId: 'QL-20260914-4G11R7',
      status: 'COMPLETED',
      bookedAt: '11 Sep 2026, 05:40 PM',
      checkedInAt: '14 Sep 2026, 08:05 AM',
      calledAt: '14 Sep 2026, 08:12 AM',
      counterName: 'Phlebotomy Station #1',
      servingAt: '14 Sep 2026, 08:15 AM',
      servedBy: 'Technician David Chen',
      completedAt: '14 Sep 2026, 08:28 AM',
    },
    {
      id: 'QL-20260908-9B22M4',
      title: 'Dental Checkup & Cleaning',
      description: 'Comprehensive dental examination, tartar cleaning, and x-ray.',
      image: dentalCheckupImg,
      appointmentDate: '08 Sep 2026',
      appointmentId: 'QL-20260908-9B22M4',
      status: 'CANCELLED',
      bookedAt: '03 Sep 2026, 11:20 AM',
      cancelledAt: '06 Sep 2026, 04:45 PM',
      cancelReason: 'Cancelled by customer (Scheduling conflict with work)',
    },
    {
      id: 'QL-20260828-6K90N3',
      title: 'Eye Examination & Vision Test',
      description: 'Comprehensive refractive vision assessment and retinal imaging.',
      image: eyeCheckupImg,
      appointmentDate: '28 Aug 2026',
      appointmentId: 'QL-20260828-6K90N3',
      status: 'COMPLETED',
      bookedAt: '24 Aug 2026, 01:10 PM',
      checkedInAt: '28 Aug 2026, 10:48 AM',
      calledAt: '28 Aug 2026, 10:58 AM',
      counterName: 'Optometry Suite #2',
      servingAt: '28 Aug 2026, 11:02 AM',
      servedBy: 'Dr. Elena Vance, OD',
      completedAt: '28 Aug 2026, 11:35 AM',
    },
    {
      id: 'QL-20260815-1X55T8',
      title: 'Vaccination & Immunization',
      description: 'Seasonal influenza booster shot and vaccine record updating.',
      image: vaccinationImg,
      appointmentDate: '15 Aug 2026',
      appointmentId: 'QL-20260815-1X55T8',
      status: 'CANCELLED',
      bookedAt: '12 Aug 2026, 09:00 AM',
      cancelledAt: '14 Aug 2026, 11:20 AM',
      cancelReason: 'Cancelled by customer (Already received vaccine elsewhere)',
    },
    {
      id: 'QL-20260802-8L33Z5',
      title: 'Vehicle Inspection & Service',
      description: 'Periodic multipoint safety inspection, oil change, and diagnostics.',
      image: vehicleServiceImg,
      appointmentDate: '02 Aug 2026',
      appointmentId: 'QL-20260802-8L33Z5',
      status: 'COMPLETED',
      bookedAt: '29 Jul 2026, 05:30 PM',
      checkedInAt: '02 Aug 2026, 09:50 AM',
      calledAt: '02 Aug 2026, 10:02 AM',
      counterName: 'Service Bay #4',
      servingAt: '02 Aug 2026, 10:06 AM',
      servedBy: 'Lead Mechanic Mark Reynolds',
      completedAt: '02 Aug 2026, 10:48 AM',
    },
  ]);

  const handleTabSwitch = (tab) => {
    setInternalTab(tab);
    if (tab === 'upcoming' && location.pathname !== '/my-bookings') {
      navigate('/my-bookings');
    } else if (tab === 'history' && location.pathname !== '/appointment-history') {
      navigate('/appointment-history');
    }
  };

  const handleJoinQueue = () => {
    navigate('/virtual-queue');
  };

  const handleOpenCancelModal = (booking) => {
    setCancelModalBooking(booking);
  };

  const handleConfirmCancel = () => {
    if (cancelModalBooking) {
      setBookings(prev => prev.filter(b => b.id !== cancelModalBooking.id));
      setCancelModalBooking(null);
    }
  };

  const handleCloseCancelModal = () => {
    setCancelModalBooking(null);
  };

  const handleOpenDetailsModal = (booking) => {
    setSelectedDetailsBooking(booking);
    setCopiedModalId(false);
  };

  const handleCloseDetailsModal = () => {
    setSelectedDetailsBooking(null);
    setCopiedModalId(false);
  };

  const handleCopyModalId = (e) => {
    e.stopPropagation();
    if (selectedDetailsBooking?.appointmentId && navigator.clipboard) {
      navigator.clipboard.writeText(selectedDetailsBooking.appointmentId);
      setCopiedModalId(true);
      setTimeout(() => setCopiedModalId(false), 2000);
    }
  };

  // Filter & sort history bookings
  const displayedHistory = historyBookings
    .filter((b) => {
      if (historyFilter === 'all') return true;
      return b.status.toLowerCase() === historyFilter.toLowerCase();
    })
    .sort((a, b) => {
      if (historySort === 'latest') {
        return b.id.localeCompare(a.id);
      }
      return a.id.localeCompare(b.id);
    });

  const completedCount = historyBookings.filter(b => b.status === 'COMPLETED').length;
  const cancelledCount = historyBookings.filter(b => b.status === 'CANCELLED').length;

  // Generate vertical progress track steps
  const getTimelineSteps = (booking) => {
    if (!booking) return [];
    const isCancelled = booking.status?.toUpperCase() === 'CANCELLED';

    if (isCancelled) {
      return [
        {
          id: 'booked',
          label: 'Appointment Booked',
          time: booking.bookedAt,
          desc: 'Confirmed via QueueLess online portal',
          status: 'completed',
          icon: CalendarCheck,
        },
        {
          id: 'cancelled',
          label: 'Cancellation Time',
          time: booking.cancelledAt,
          desc: booking.cancelReason || 'Cancelled by customer',
          status: 'cancelled',
          icon: XCircle,
        },
      ];
    }

    return [
      {
        id: 'booked',
        label: 'Appointment Booked',
        time: booking.bookedAt,
        desc: 'Confirmed via QueueLess online portal',
        status: 'completed',
        icon: CalendarCheck,
      },
      {
        id: 'checkin',
        label: 'Check-in Time',
        time: booking.checkedInAt,
        desc: 'Self check-in verified at reception kiosk',
        status: 'completed',
        icon: LogIn,
      },
      {
        id: 'called',
        label: 'Called Time',
        time: booking.calledAt,
        desc: booking.counterName ? `Called to ${booking.counterName}` : 'Customer called to counter',
        status: 'completed',
        icon: Megaphone,
      },
      {
        id: 'serving',
        label: 'Start Service Time',
        time: booking.servingAt,
        desc: booking.servedBy ? `Service commenced with ${booking.servedBy}` : 'Service consultation started',
        status: 'completed',
        icon: Play,
      },
      {
        id: 'completed',
        label: 'Complete at Time',
        time: booking.completedAt,
        desc: 'Service finished & token cleared successfully',
        status: 'completed',
        icon: CheckCircle2,
      },
    ];
  };

  return (
    <div className="my-bookings-page">
      {/* 1. Standardized Hero Banner */}
      <MyBookingBanner />

      {/* 2. Top Navigation Tabs */}
      <div className="my-bookings-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upcoming'}
          className={`booking-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('upcoming')}
        >
          <CalendarDays size={18} className="tab-btn-icon" />
          <span>Upcoming Appointments</span>
          <span className={`tab-badge ${activeTab === 'upcoming' ? 'blue-badge' : 'gray-badge'}`}>{bookings.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          className={`booking-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('history')}
        >
          <CalendarClock size={18} className="tab-btn-icon" />
          <span>Appointment History</span>
          <span className={`tab-badge ${activeTab === 'history' ? 'blue-badge' : 'gray-badge'}`}>{historyBookings.length}</span>
        </button>
      </div>

      {/* 3. Main Appointments Container */}
      <section className="my-bookings-content-card" aria-label="Appointments Section">
        {/* Section Header */}
        <div className="my-bookings-section-header">
          <div className="section-header-left">
            <div className={`section-calendar-badge ${activeTab === 'history' ? 'history-badge-icon' : ''}`}>
              {activeTab === 'upcoming' ? (
                <Calendar size={20} strokeWidth={2.2} />
              ) : (
                <CalendarClock size={20} strokeWidth={2.2} />
              )}
            </div>
            <div className="section-header-text">
              <h2 className="section-main-title">
                {activeTab === 'upcoming' ? 'Upcoming Appointments' : 'Appointment History'}
              </h2>
              <p className="section-main-subtitle">
                {activeTab === 'upcoming' 
                  ? 'Your latest booked appointments.' 
                  : 'Review all your previously completed and cancelled visits.'}
              </p>
            </div>
          </div>

          {/* Section Actions: Filter pills and sort dropdown */}
          <div className="section-header-right-actions">
            {activeTab === 'history' && (
              <div className="history-filter-pills" role="group" aria-label="Filter appointments by status">
                <button
                  type="button"
                  className={`history-filter-pill ${historyFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('all')}
                >
                  All ({historyBookings.length})
                </button>
                <button
                  type="button"
                  className={`history-filter-pill ${historyFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('completed')}
                >
                  Completed ({completedCount})
                </button>
                <button
                  type="button"
                  className={`history-filter-pill ${historyFilter === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setHistoryFilter('cancelled')}
                >
                  Cancelled ({cancelledCount})
                </button>
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="section-sort-wrapper">
              <button
                type="button"
                className="sort-dropdown-btn"
                onClick={() => {
                  if (activeTab === 'upcoming') {
                    setShowSortDropdown(prev => !prev);
                  } else {
                    setShowHistorySortDropdown(prev => !prev);
                  }
                }}
                aria-label="Sort order"
              >
                <span>
                  {activeTab === 'upcoming' 
                    ? (sortOption === 'nearest' ? 'Nearest First' : 'Latest First')
                    : (historySort === 'latest' ? 'Latest First' : 'Oldest First')}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`sort-chevron ${
                    (activeTab === 'upcoming' ? showSortDropdown : showHistorySortDropdown) ? 'open' : ''
                  }`} 
                />
              </button>

              {activeTab === 'upcoming' && showSortDropdown && (
                <div className="sort-dropdown-menu">
                  <button
                    type="button"
                    className={`sort-menu-item ${sortOption === 'nearest' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortOption('nearest');
                      setShowSortDropdown(false);
                    }}
                  >
                    Nearest First
                  </button>
                  <button
                    type="button"
                    className={`sort-menu-item ${sortOption === 'latest' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortOption('latest');
                      setShowSortDropdown(false);
                    }}
                  >
                    Latest First
                  </button>
                </div>
              )}

              {activeTab === 'history' && showHistorySortDropdown && (
                <div className="sort-dropdown-menu">
                  <button
                    type="button"
                    className={`sort-menu-item ${historySort === 'latest' ? 'selected' : ''}`}
                    onClick={() => {
                      setHistorySort('latest');
                      setShowHistorySortDropdown(false);
                    }}
                  >
                    Latest First
                  </button>
                  <button
                    type="button"
                    className={`sort-menu-item ${historySort === 'oldest' ? 'selected' : ''}`}
                    onClick={() => {
                      setHistorySort('oldest');
                      setShowHistorySortDropdown(false);
                    }}
                  >
                    Oldest First
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3-Column Grid of Service Cards */}
        {activeTab === 'upcoming' ? (
          bookings.length > 0 ? (
            <div className="my-bookings-grid">
              {bookings.map((booking) => (
                <ServiceCard
                  key={booking.id}
                  service={booking}
                  onJoinQueue={handleJoinQueue}
                  onCancel={handleOpenCancelModal}
                  cancelText="Cancel"
                  joinQueueText="Join Queue"
                />
              ))}
            </div>
          ) : (
            <div className="my-bookings-empty-state">
              <div className="empty-calendar-icon">
                <Calendar size={36} />
              </div>
              <h3 className="empty-title">No upcoming appointments</h3>
              <p className="empty-desc">You do not have any active appointments scheduled.</p>
              <button
                type="button"
                className="empty-book-btn"
                onClick={() => navigate('/book-appointment')}
              >
                Book an Appointment
              </button>
            </div>
          )
        ) : (
          displayedHistory.length > 0 ? (
            <div className="history-table-container">
              <table className="history-table" aria-label="Appointment History Table">
                <thead>
                  <tr>
                    <th scope="col" className="th-service-img">Service Image</th>
                    <th scope="col" className="th-service-name">Service Name</th>
                    <th scope="col" className="th-apt-date">Appointment Date</th>
                    <th scope="col" className="th-apt-id">Appointment Id</th>
                    <th scope="col" className="th-status">Status</th>
                    <th scope="col" className="th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedHistory.map((booking) => (
                    <tr key={booking.id} className="history-table-row">
                      {/* 1. Service Image */}
                      <td className="td-service-img">
                        <div className="table-service-thumb-wrap">
                          <img
                            src={booking.image}
                            alt={booking.title}
                            className="table-service-thumb"
                            loading="lazy"
                          />
                        </div>
                      </td>

                      {/* 2. Service Name */}
                      <td className="td-service-name">
                        <span className="table-service-title">{booking.title}</span>
                      </td>

                      {/* 3. Appointment Date */}
                      <td className="td-apt-date">
                        <div className="table-date-cell">
                          <Calendar size={14} className="table-date-icon" />
                          <span>{booking.appointmentDate ? booking.appointmentDate.split(',')[0].trim() : ''}</span>
                        </div>
                      </td>

                      {/* 4. Appointment Id */}
                      <td className="td-apt-id">
                        <div className="table-id-cell">
                          <Ticket size={13} className="table-id-icon" />
                          <span className="table-id-mono">{booking.appointmentId}</span>
                          <button
                            type="button"
                            className="table-copy-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(booking.appointmentId);
                                setCopiedListId(booking.id);
                                setTimeout(() => setCopiedListId(null), 2000);
                              }
                            }}
                            title="Copy Appointment ID"
                            aria-label="Copy Appointment ID"
                          >
                            {copiedListId === booking.id ? (
                              <Check size={12} className="copied-check" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="td-status">
                        <span className={`table-status-pill status-${booking.status.toLowerCase()}`}>
                          {booking.status.toLowerCase() === 'completed' ? (
                            <CheckCircle2 size={13} strokeWidth={2.4} />
                          ) : (
                            <XCircle size={13} strokeWidth={2.4} />
                          )}
                          <span>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                          </span>
                        </span>
                      </td>

                      {/* 6. Action */}
                      <td className="td-action">
                        <button
                          type="button"
                          className="table-details-btn"
                          onClick={() => handleOpenDetailsModal(booking)}
                          aria-label={`View details for ${booking.title}`}
                        >
                          <Clock size={14} strokeWidth={2.2} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="my-bookings-empty-state">
              <div className="empty-calendar-icon">
                <CalendarClock size={36} />
              </div>
              <h3 className="empty-title">No appointment records found</h3>
              <p className="empty-desc">
                {historyFilter !== 'all' 
                  ? `No ${historyFilter} appointments match your filter criteria.` 
                  : 'Your past completed and cancelled visits will appear here.'}
              </p>
              {historyFilter !== 'all' && (
                <button
                  type="button"
                  className="empty-book-btn"
                  onClick={() => setHistoryFilter('all')}
                >
                  Clear Status Filter
                </button>
              )}
            </div>
          )
        )}
      </section>

      {/* Cancel Upcoming Appointment Confirmation Modal */}
      {cancelModalBooking && (
        <div className="cancel-modal-backdrop" onClick={handleCloseCancelModal}>
          <div 
            className="cancel-modal-card" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="cancel-modal-header">
              <div className="cancel-warn-icon-wrap">
                <AlertTriangle size={24} />
              </div>
              <button 
                type="button" 
                className="cancel-modal-close" 
                onClick={handleCloseCancelModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="cancel-modal-title">Cancel Appointment?</h3>
            <p className="cancel-modal-desc">
              Are you sure you want to cancel your appointment for{' '}
              <strong>{cancelModalBooking.title}</strong> on{' '}
              <strong>{cancelModalBooking.appointmentDate}</strong>? This action cannot be undone.
            </p>

            <div className="cancel-modal-actions">
              <button 
                type="button" 
                className="cancel-modal-back-btn" 
                onClick={handleCloseCancelModal}
              >
                Keep Appointment
              </button>
              <button 
                type="button" 
                className="cancel-modal-confirm-btn" 
                onClick={handleConfirmCancel}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Details Modal: Vertical Progress Tracker & Timestamps */}
      {selectedDetailsBooking && (
        <div className="history-modal-backdrop" onClick={handleCloseDetailsModal}>
          <div 
            className="history-modal-card" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-heading"
          >
            {/* Modal Header */}
            <div className="history-modal-header">
              <div className="history-modal-service-info">
                <img 
                  src={selectedDetailsBooking.image} 
                  alt={selectedDetailsBooking.title}
                  className="history-modal-thumb"
                />
                <div className="history-modal-service-text">
                  <div className="history-modal-title-row">
                    <h3 id="history-modal-heading" className="history-modal-title">
                      {selectedDetailsBooking.title}
                    </h3>
                    <span className={`history-status-pill status-${selectedDetailsBooking.status.toLowerCase()}`}>
                      {selectedDetailsBooking.status.toLowerCase() === 'completed' ? (
                        <CheckCircle2 size={13} strokeWidth={2.4} />
                      ) : (
                        <XCircle size={13} strokeWidth={2.4} />
                      )}
                      <span>
                        {selectedDetailsBooking.status.charAt(0).toUpperCase() + 
                         selectedDetailsBooking.status.slice(1).toLowerCase()}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="history-modal-close-btn" 
                onClick={handleCloseDetailsModal}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body with Internal Scrollbar */}
            <div className="history-modal-body">
              {/* Appointment Meta Strip */}
              <div className="history-modal-meta-strip">
                <div className="history-meta-item">
                  <Calendar size={15} className="history-meta-icon" />
                  <div className="history-meta-data">
                    <span className="history-meta-label">Appointment Date</span>
                    <span className="history-meta-value">{selectedDetailsBooking.appointmentDate}</span>
                  </div>
                </div>
                <div className="history-meta-divider" />
                <div className="history-meta-item">
                  <Ticket size={15} className="history-meta-icon" />
                  <div className="history-meta-data">
                    <span className="history-meta-label">Appointment ID</span>
                    <span className="history-meta-value mono">{selectedDetailsBooking.appointmentId}</span>
                  </div>
                  <button
                    type="button"
                    className="history-copy-id-btn"
                    onClick={handleCopyModalId}
                    title="Copy ID"
                    aria-label="Copy ID"
                  >
                    {copiedModalId ? <Check size={13} className="copied-check" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Vertical Progress Track Section */}
              <div className="history-modal-timeline-section">
                <div className="timeline-section-header">
                  <span className="timeline-section-title">VISIT PROGRESS & AUDIT TIMELINE</span>
                  <span className="timeline-section-caption">
                    {selectedDetailsBooking.status.toLowerCase() === 'completed' 
                      ? 'All captured milestone timestamps'
                      : 'Booking & cancellation records'}
                  </span>
                </div>

                <div className="history-vertical-timeline">
                  {getTimelineSteps(selectedDetailsBooking).map((step, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    const IconComponent = step.icon;
                    const isCancelStep = step.status === 'cancelled';

                    return (
                      <div 
                        key={step.id} 
                        className={`timeline-step-row ${step.status} ${isLast ? 'is-last-step' : ''}`}
                      >
                        {/* Left indicator column */}
                        <div className="timeline-indicator-col">
                          <div className={`timeline-node-circle node-${step.status}`}>
                            <IconComponent size={16} strokeWidth={2.4} />
                          </div>
                          {!isLast && (
                            <div className={`timeline-connector-line line-${isCancelStep ? 'cancelled' : 'completed'}`} />
                          )}
                        </div>

                        {/* Right step details */}
                        <div className="timeline-content-card">
                          <div className="timeline-content-top">
                            <h4 className="timeline-step-title">{step.label}</h4>
                            {step.time && (
                              <span className={`timeline-timestamp-pill pill-${step.status}`}>
                                <Clock size={12} strokeWidth={2.2} />
                                <span>{step.time}</span>
                              </span>
                            )}
                          </div>
                          {step.desc && (
                            <p className="timeline-step-desc">{step.desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="history-modal-footer">
              <button 
                type="button" 
                className="history-modal-done-btn" 
                onClick={handleCloseDetailsModal}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
