import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Play,
  RefreshCw,
  AlertCircle,
  UserX,
  Filter
} from 'lucide-react';
import MyBookingBanner from '../../components/customer/MyBookingBanner';
import ServiceCard from '../../components/common/ServiceCard';
import appointmentApi from '../../services/api/appointment.api';

import generalConsultImg from '../../assets/images/bookings/general_consultation.jpg';
import documentVerifImg from '../../assets/images/bookings/document_verification.jpg';
import accountAssistImg from '../../assets/images/bookings/account_assistance.jpg';
import bloodTestImg from '../../assets/images/bookings/blood_test.jpg';
import dentalCheckupImg from '../../assets/images/bookings/dental_checkup.jpg';
import eyeCheckupImg from '../../assets/images/bookings/eye_checkup.jpg';
import vaccinationImg from '../../assets/images/bookings/vaccination.jpg';
import vehicleServiceImg from '../../assets/images/bookings/vehicle_service.jpg';

import './MyBookings.css';

/**
 * Maps service name keywords to appropriate fallback images
 */
function getFallbackImage(name = '') {
  const lower = (name || '').toLowerCase();
  if (lower.includes('blood') || lower.includes('donation')) return bloodTestImg;
  if (lower.includes('dental') || lower.includes('tooth') || lower.includes('teeth')) return dentalCheckupImg;
  if (lower.includes('vaccin') || lower.includes('immun')) return vaccinationImg;
  if (lower.includes('document') || lower.includes('verif') || lower.includes('certif')) return documentVerifImg;
  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('bike') || lower.includes('auto')) return vehicleServiceImg;
  if (lower.includes('eye') || lower.includes('vision') || lower.includes('optic')) return eyeCheckupImg;
  if (lower.includes('account') || lower.includes('assist')) return accountAssistImg;
  return generalConsultImg;
}

/**
 * Formats ISO date/time to a clean, readable string (e.g., "12 Oct 2026, 10:15 AM")
 */
const formatDateTime = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return (
    d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  );
};

/**
 * Formats YYYY-MM-DD string to "12 Oct 2026"
 */
const formatAppointmentDate = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && dateVal.includes('-') && dateVal.length === 10) {
    const parts = dateVal.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  return String(dateVal);
};

/**
 * Clean status string label without icons
 */
const formatStatusLabel = (status = '') => {
  const norm = (status || '').toUpperCase();
  if (norm === 'NO_SHOW') return 'No Show';
  if (norm === 'IN_SERVICE') return 'In Service';
  if (norm === 'CHECKED_IN') return 'Checked In';
  if (norm === 'BOOKED') return 'Booked';
  if (norm === 'COMPLETED') return 'Completed';
  if (norm === 'CANCELLED') return 'Cancelled';
  return norm ? norm.charAt(0).toUpperCase() + norm.slice(1).toLowerCase() : 'Unknown';
};

/**
 * Maps database appointment document to frontend booking structure
 */
const mapAppointmentToBooking = (appt) => {
  const service = appt.serviceId || {};
  const queueEntry = appt.queueEntryId || {};

  const bookedAtStr = formatDateTime(appt.createdAt);
  const checkedInAtStr = formatDateTime(appt.checkedInAt || queueEntry.joinedAt);
  const calledAtStr = formatDateTime(queueEntry.calledAt);
  const servingAtStr = formatDateTime(queueEntry.servingAt);
  const completedAtStr = formatDateTime(appt.completedAt || queueEntry.completedAt);
  const cancelledAtStr = formatDateTime(appt.cancelledAt);
  const noShowAtStr = formatDateTime(appt.noShowAt || (appt.status === 'NO_SHOW' ? appt.updatedAt : null));

  const formattedDate = formatAppointmentDate(appt.appointmentDate);
  const prefix = service.code || 'T';
  const formattedToken = queueEntry.token || (typeof appt.tokenNumber === 'string' && appt.tokenNumber.includes('-')
    ? appt.tokenNumber
    : (queueEntry.tokenNumber ? `${prefix}-${String(queueEntry.tokenNumber).padStart(3, '0')}` : null));

  return {
    id: appt.appointmentId || appt._id,
    _id: appt._id,
    appointmentId: appt.appointmentId,
    title: service.name || 'Service Consultation',
    name: service.name || 'Service Consultation',
    description: service.description || 'Professional service scheduled at your convenience.',
    image: service.imageUrl || getFallbackImage(service.name),
    appointmentDate: formattedDate,
    rawDate: appt.appointmentDate,
    duration: service.duration ? `${service.duration} mins` : '15 mins',
    schedule: service.service_time || 'Mon - Sat, 09:00 AM - 05:00 PM',
    status: (appt.status || 'BOOKED').toUpperCase(),
    tokenNumber: formattedToken,
    rawTokenNumber: queueEntry.tokenNumber,
    queueId: queueEntry.queueId?._id || queueEntry.queueId || appt.queueId,
    counterName: queueEntry.counterId?.name || (queueEntry.counterId ? `Counter #${queueEntry.counterId}` : null),
    bookedAt: bookedAtStr,
    checkedInAt: checkedInAtStr,
    calledAt: calledAtStr,
    servingAt: servingAtStr,
    completedAt: completedAtStr,
    cancelledAt: cancelledAtStr,
    noShowAt: noShowAtStr,
    cancelReason: appt.cancelledAt ? 'Cancelled by customer' : null,
    createdAt: appt.createdAt,
  };
};

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
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'completed' | 'cancelled' | 'no_show'
  const [showHistoryFilterDropdown, setShowHistoryFilterDropdown] = useState(false);
  const [historySort, setHistorySort] = useState('latest'); // 'latest' | 'oldest'
  const [showHistorySortDropdown, setShowHistorySortDropdown] = useState(false);

  const filterDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setShowHistoryFilterDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setShowSortDropdown(false);
        setShowHistorySortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Backend data state
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modals state
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const [selectedDetailsBooking, setSelectedDetailsBooking] = useState(null);
  const [copiedModalId, setCopiedModalId] = useState(false);
  const [copiedListId, setCopiedListId] = useState(null);

  // Fetch appointments from real Backend API
  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await appointmentApi.getMyAppointments();
      const list = Array.isArray(res?.data) ? res.data : [];
      setAppointments(list);
    } catch (err) {
      console.error('Failed to load appointments from database:', err);
      setFetchError(err.message || 'Unable to fetch appointments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Prevent background page from scrolling when any modal is showing
  useEffect(() => {
    if (cancelModalBooking || selectedDetailsBooking) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = (originalOverflow && originalOverflow !== 'hidden') ? originalOverflow : '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [cancelModalBooking, selectedDetailsBooking]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const mappedBookings = useMemo(() => {
    return appointments.map(mapAppointmentToBooking);
  }, [appointments]);

  // Tab 1: Upcoming Bookings (Active visits: BOOKED, CHECKED_IN, IN_SERVICE)
  const upcomingBookings = useMemo(() => {
    return mappedBookings
      .filter((b) => {
        const st = (b.status || '').toUpperCase();
        return st === 'BOOKED' || st === 'CHECKED_IN' || st === 'IN_SERVICE';
      })
      .sort((a, b) => {
        const dateA = a.rawDate || a.createdAt || '';
        const dateB = b.rawDate || b.createdAt || '';
        if (sortOption === 'nearest') {
          return dateA.localeCompare(dateB);
        }
        return dateB.localeCompare(dateA);
      });
  }, [mappedBookings, sortOption]);

  // Tab 2: Appointment History (All bookings, specially previous visits)
  const historyBookings = useMemo(() => {
    return mappedBookings
      .filter((b) => {
        if (historyFilter === 'all') return true;
        return (b.status || '').toUpperCase() === historyFilter.toUpperCase();
      })
      .sort((a, b) => {
        const dateA = a.rawDate || a.createdAt || '';
        const dateB = b.rawDate || b.createdAt || '';
        if (historySort === 'latest') {
          return dateB.localeCompare(dateA);
        }
        return dateA.localeCompare(dateB);
      });
  }, [mappedBookings, historyFilter, historySort]);

  const handleTabSwitch = (tab) => {
    setInternalTab(tab);
    if (tab === 'upcoming' && location.pathname !== '/my-bookings') {
      navigate('/my-bookings');
    } else if (tab === 'history' && location.pathname !== '/appointment-history') {
      navigate('/appointment-history');
    }
  };

  const handleJoinQueue = (booking) => {
    if (booking.status === 'CHECKED_IN' || booking.status === 'IN_SERVICE') {
      navigate('/virtual-queue', {
        state: {
          queueData: {
            tokenNumber: booking.tokenNumber,
            serviceName: booking.title,
            appointmentId: booking.appointmentId,
            serviceImage: booking.image,
            appointmentSchedule: booking.schedule,
            joinedAt: booking.checkedInAt || 'Today',
            status: booking.status === 'IN_SERVICE' ? 'In Service' : 'In Queue'
          }
        }
      });
    } else {
      // Navigate to Join Queue page with prefilled appointmentId to perform check-in
      navigate('/join-queue', {
        state: {
          appointmentId: booking.appointmentId,
          booking
        }
      });
    }
  };

  const handleOpenCancelModal = (booking) => {
    setCancelModalBooking(booking);
    setCancelError(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const apptId = cancelModalBooking.appointmentId || cancelModalBooking.id;
      await appointmentApi.cancelAppointment(apptId);

      // Update state locally
      setAppointments((prev) =>
        prev.map((a) =>
          (a.appointmentId === apptId || a._id === apptId)
            ? { ...a, status: 'CANCELLED', cancelledAt: new Date().toISOString() }
            : a
        )
      );

      // Clean up localStorage cached bookings if present
      try {
        const stored = localStorage.getItem('queueless_upcoming_bookings');
        if (stored) {
          const list = JSON.parse(stored);
          const filtered = list.filter((b) => b.id !== apptId && b.appointmentId !== apptId);
          localStorage.setItem('queueless_upcoming_bookings', JSON.stringify(filtered));
        }
      } catch (err) {
        console.warn('LocalStorage update warning:', err);
      }

      setCancelModalBooking(null);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      setCancelError(err.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setCancelModalBooking(null);
    setCancelError(null);
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

  // Generate milestone timestamps for vertical progress track in Details Pop-up
  const getTimelineSteps = (booking) => {
    if (!booking) return [];
    const isCancelled = booking.status?.toUpperCase() === 'CANCELLED';
    const isNoShow = booking.status?.toUpperCase() === 'NO_SHOW';

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

    if (isNoShow) {
      return [
        {
          id: 'booked',
          label: 'Appointment Booked',
          time: booking.bookedAt,
          desc: 'Confirmed via QueueLess online portal',
          status: 'completed',
          icon: CalendarCheck,
        },
        ...(booking.checkedInAt ? [{
          id: 'checkin',
          label: 'Check-in Time',
          time: booking.checkedInAt,
          desc: 'Customer check-in verified at reception kiosk',
          status: 'completed',
          icon: LogIn,
        }] : []),
        ...(booking.calledAt ? [{
          id: 'called',
          label: 'Called Time',
          time: booking.calledAt,
          desc: booking.counterName ? `Called to ${booking.counterName}` : 'Customer called to counter',
          status: 'completed',
          icon: Megaphone,
        }] : []),
        {
          id: 'no_show',
          label: 'No Show Marked',
          time: booking.noShowAt || 'Marked as No Show',
          desc: 'Customer missed their appointment window or was absent when called',
          status: 'no_show',
          icon: UserX,
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
        time: booking.checkedInAt || 'Pending',
        desc: booking.checkedInAt ? 'Customer check-in verified at reception kiosk' : 'Awaiting check-in at reception',
        status: booking.checkedInAt ? 'completed' : 'pending',
        icon: LogIn,
      },
      {
        id: 'called',
        label: 'Called Time',
        time: booking.calledAt || 'Pending',
        desc: booking.calledAt 
          ? (booking.counterName ? `Called to ${booking.counterName}` : 'Customer called to counter')
          : 'Waiting to be called to service counter',
        status: booking.calledAt ? 'completed' : 'pending',
        icon: Megaphone,
      },
      {
        id: 'serving',
        label: 'Service Time',
        time: booking.servingAt || 'Pending',
        desc: booking.servingAt ? 'Service consultation commenced' : 'Service consultation not yet started',
        status: booking.servingAt ? 'completed' : 'pending',
        icon: Play,
      },
      {
        id: 'completed',
        label: 'Completion Time',
        time: booking.completedAt || 'Pending',
        desc: booking.completedAt ? 'Service finished & token cleared successfully' : 'Awaiting service completion',
        status: booking.completedAt ? 'completed' : 'pending',
        icon: CheckCircle2,
      },
    ];
  };

  return (
    <div className="my-bookings-page">
      {/* 1. Standardized Hero Banner */}
      <MyBookingBanner />

      {/* 2. Main Appointments Card Container (Enclosing Navigation Tabs & Body, matching Admin Portal) */}
      <section className="my-bookings-content-card" aria-label="Appointments Section">
        {/* Navigation Tabs Header - Placed inside the white box */}
        <div className="my-bookings-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            className={`booking-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('upcoming')}
          >
            <CalendarDays size={18} className="tab-btn-icon" />
            <span className="tab-desktop-label">Upcoming Appointments</span>
            <span className="tab-mobile-label">Upcoming</span>
            <span className={`tab-badge ${activeTab === 'upcoming' ? 'blue-badge' : 'gray-badge'}`}>
              {upcomingBookings.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            className={`booking-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('history')}
          >
            <CalendarClock size={18} className="tab-btn-icon" />
            <span className="tab-desktop-label">Appointment History</span>
            <span className="tab-mobile-label">History</span>
            <span className={`tab-badge ${activeTab === 'history' ? 'blue-badge' : 'gray-badge'}`}>
              {historyBookings.length}
            </span>
          </button>
        </div>

        {/* Card Body Container */}
        <div className="my-bookings-card-body">
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

          {/* Section Actions: Filter dropdown and sort dropdown */}
          <div className="section-header-right-actions">
            {activeTab === 'history' && (
              <div className="section-filter-wrapper" ref={filterDropdownRef}>
                <button
                  type="button"
                  className="filter-dropdown-btn"
                  onClick={() => setShowHistoryFilterDropdown(prev => !prev)}
                  aria-label="Filter appointment history by status"
                  aria-expanded={showHistoryFilterDropdown}
                >
                  <Filter size={15} className="filter-dropdown-icon" />
                  <span>
                    {historyFilter === 'completed'
                      ? 'Completed'
                      : historyFilter === 'cancelled'
                      ? 'Cancelled'
                      : historyFilter === 'no_show'
                      ? 'No Show'
                      : 'All'}
                  </span>
                  <ChevronDown 
                    size={15} 
                    className={`sort-chevron ${showHistoryFilterDropdown ? 'open' : ''}`} 
                  />
                </button>

                {showHistoryFilterDropdown && (
                  <div className="filter-dropdown-menu">
                    <button
                      type="button"
                      className={`filter-menu-item ${historyFilter === 'all' ? 'selected' : ''}`}
                      onClick={() => {
                        setHistoryFilter('all');
                        setShowHistoryFilterDropdown(false);
                      }}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`filter-menu-item ${historyFilter === 'completed' ? 'selected' : ''}`}
                      onClick={() => {
                        setHistoryFilter('completed');
                        setShowHistoryFilterDropdown(false);
                      }}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      className={`filter-menu-item ${historyFilter === 'cancelled' ? 'selected' : ''}`}
                      onClick={() => {
                        setHistoryFilter('cancelled');
                        setShowHistoryFilterDropdown(false);
                      }}
                    >
                      Cancelled
                    </button>
                    <button
                      type="button"
                      className={`filter-menu-item ${historyFilter === 'no_show' ? 'selected' : ''}`}
                      onClick={() => {
                        setHistoryFilter('no_show');
                        setShowHistoryFilterDropdown(false);
                      }}
                    >
                      No Show
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="section-sort-wrapper" ref={sortDropdownRef}>
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

        {/* Loading Spinner */}
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            gap: 14,
            color: '#64748B'
          }}>
            <RefreshCw size={26} className="spin-icon" color="#1D68F2" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading your appointments from database...</span>
          </div>
        ) : fetchError ? (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={20} />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={loadAppointments}
              style={{
                background: '#B91C1C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : activeTab === 'upcoming' ? (
          /* Upcoming Bookings Grid */
          upcomingBookings.length > 0 ? (
            <div className="my-bookings-grid">
              {upcomingBookings.map((booking) => (
                <ServiceCard
                  key={booking.id}
                  service={{
                    ...booking,
                    status: booking.status || 'Booked',
                    statusLabel: formatStatusLabel(booking.status),
                  }}
                  onJoinQueue={handleJoinQueue}
                  onCancel={handleOpenCancelModal}
                  onDetails={handleOpenDetailsModal}
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
          /* Appointment History Table */
          historyBookings.length > 0 ? (
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
                  {historyBookings.map((booking) => (
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
                          <span>{booking.appointmentDate}</span>
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
                          <span>{formatStatusLabel(booking.status)}</span>
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
        </div>
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

            {cancelError && (
              <div style={{
                color: '#DC2626',
                fontSize: 13,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                padding: '8px 12px',
                borderRadius: 8,
                marginBottom: 14
              }}>
                {cancelError}
              </div>
            )}

            <div className="cancel-modal-actions">
              <button 
                type="button" 
                className="cancel-modal-back-btn" 
                onClick={handleCloseCancelModal}
                disabled={isCancelling}
              >
                Keep Appointment
              </button>
              <button 
                type="button" 
                className="cancel-modal-confirm-btn" 
                onClick={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
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
                      <span>{formatStatusLabel(selectedDetailsBooking.status)}</span>
                    </span>
                  </div>
                  {selectedDetailsBooking.description && (
                    <p className="history-modal-desc">{selectedDetailsBooking.description}</p>
                  )}
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
                {selectedDetailsBooking.status === 'NO_SHOW' && (
                  <>
                    <div className="history-meta-divider" />
                    <div className="history-meta-item no-show-meta-item">
                      <UserX size={15} className="history-meta-icon no-show-icon" />
                      <div className="history-meta-data">
                        <span className="history-meta-label">No Show Recorded</span>
                        <span className="history-meta-value no-show-value">
                          {selectedDetailsBooking.noShowAt || 'Marked as No Show'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Vertical Progress Track Section */}
              <div className="history-modal-timeline-section">
                <div className="timeline-section-header">
                  <span className="timeline-section-title">VISIT PROGRESS & AUDIT TIMELINE</span>
                  <span className="timeline-section-caption">
                    {selectedDetailsBooking.status.toLowerCase() === 'completed' 
                      ? 'All captured milestone timestamps'
                      : 'Milestone timestamps & records'}
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
                            <div className={`timeline-connector-line line-${isCancelStep ? 'cancelled' : step.status}`} />
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
