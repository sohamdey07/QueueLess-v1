import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  Check,
  Clock,
  X,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Stethoscope,
  Smile,
  Glasses,
  Activity,
  Wrench,
  Search,
  Filter
} from 'lucide-react';
import './AdminQueueLogs.css';

// Predefined Services list
const SERVICES_LIST = [
  { id: 'bar-service', name: 'Bar Service', icon: <Coffee size={15} /> },
  { id: 'general-consultation', name: 'General Consultation', icon: <Stethoscope size={15} /> },
  { id: 'dental-checkup', name: 'Dental Checkup', icon: <Smile size={15} /> },
  { id: 'eye-checkup', name: 'Eye Checkup', icon: <Glasses size={15} /> },
  { id: 'blood-test', name: 'Blood Test & Diagnostics', icon: <Activity size={15} /> },
  { id: 'vehicle-service', name: 'Vehicle Servicing', icon: <Wrench size={15} /> },
];

// Predefined Dates list
const DATE_PRESETS = [
  { label: '08 Oct 2026', tag: 'Selected' },
  { label: '07 Oct 2026', tag: 'Yesterday' },
  { label: '06 Oct 2026', tag: null },
  { label: '05 Oct 2026', tag: null },
  { label: '04 Oct 2026', tag: null },
];

// Seed Data for Bar Service (Exactly 68 tokens: 55 Completed, 8 Waiting, 5 No Show)
// The first 10 rows EXACTLY match the provided user screenshot
const seedBarServiceLogs = [
  {
    id: 1,
    tokenNo: 'B001',
    customerName: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    phoneNumber: '+91 98765 43210',
    joinedAt: '09:05 AM',
    servedAt: '09:18 AM',
    noShowAt: '-',
    completedAt: '09:28 AM',
    counter: 'Counter 1',
    status: 'Completed',
  },
  {
    id: 2,
    tokenNo: 'B002',
    customerName: 'Meera Das',
    email: 'meera.das@gmail.com',
    phoneNumber: '+91 98765 43211',
    joinedAt: '09:08 AM',
    servedAt: '09:26 AM',
    noShowAt: '-',
    completedAt: '09:35 AM',
    counter: 'Counter 2',
    status: 'Completed',
  },
  {
    id: 3,
    tokenNo: 'B003',
    customerName: 'Rohan Mehta',
    email: 'rohan.mehta@gmail.com',
    phoneNumber: '+91 98765 43212',
    joinedAt: '09:12 AM',
    servedAt: '-',
    noShowAt: '09:40 AM',
    completedAt: '-',
    counter: 'Counter 1',
    status: 'No Show',
  },
  {
    id: 4,
    tokenNo: 'B004',
    customerName: 'Sneha Roy',
    email: 'sneha.roy@gmail.com',
    phoneNumber: '+91 98765 43213',
    joinedAt: '09:15 AM',
    servedAt: '-',
    noShowAt: '-',
    completedAt: '-',
    counter: '-',
    status: 'Waiting',
  },
  {
    id: 5,
    tokenNo: 'B005',
    customerName: 'Karan Verma',
    email: 'karan.verma@gmail.com',
    phoneNumber: '+91 98765 43214',
    joinedAt: '09:20 AM',
    servedAt: '09:55 AM',
    noShowAt: '-',
    completedAt: '10:05 AM',
    counter: 'Counter 3',
    status: 'Completed',
  },
  {
    id: 6,
    tokenNo: 'B006',
    customerName: 'Priya Sen',
    email: 'priya.sen@gmail.com',
    phoneNumber: '+91 98765 43215',
    joinedAt: '09:28 AM',
    servedAt: '-',
    noShowAt: '-',
    completedAt: '-',
    counter: '-',
    status: 'Waiting',
  },
  {
    id: 7,
    tokenNo: 'B007',
    customerName: 'Aditya Gupta',
    email: 'aditya.gupta@gmail.com',
    phoneNumber: '+91 98765 43216',
    joinedAt: '09:32 AM',
    servedAt: '10:05 AM',
    noShowAt: '-',
    completedAt: '10:22 AM',
    counter: 'Counter 2',
    status: 'Completed',
  },
  {
    id: 8,
    tokenNo: 'B008',
    customerName: 'Neha Singh',
    email: 'neha.singh@gmail.com',
    phoneNumber: '+91 98765 43217',
    joinedAt: '09:40 AM',
    servedAt: '-',
    noShowAt: '10:15 AM',
    completedAt: '-',
    counter: 'Counter 1',
    status: 'No Show',
  },
  {
    id: 9,
    tokenNo: 'B009',
    customerName: 'Vikram Das',
    email: 'vikram.das@gmail.com',
    phoneNumber: '+91 98765 43218',
    joinedAt: '09:45 AM',
    servedAt: '10:20 AM',
    noShowAt: '-',
    completedAt: '10:38 AM',
    counter: 'Counter 1',
    status: 'Completed',
  },
  {
    id: 10,
    tokenNo: 'B010',
    customerName: 'Isha Malhotra',
    email: 'isha.malhotra@gmail.com',
    phoneNumber: '+91 98765 43219',
    joinedAt: '09:50 AM',
    servedAt: '-',
    noShowAt: '-',
    completedAt: '-',
    counter: '-',
    status: 'Waiting',
  },
  {
    id: 11,
    tokenNo: 'B011',
    customerName: 'Rahul Kapoor',
    email: 'rahul.kapoor@gmail.com',
    phoneNumber: '+91 98765 43220',
    joinedAt: '09:55 AM',
    servedAt: '10:28 AM',
    noShowAt: '-',
    completedAt: '10:45 AM',
    counter: 'Counter 2',
    status: 'Completed',
  },
  {
    id: 12,
    tokenNo: 'B012',
    customerName: 'Pooja Sharma',
    email: 'pooja.sharma@gmail.com',
    phoneNumber: '+91 98765 43221',
    joinedAt: '10:02 AM',
    servedAt: '10:35 AM',
    noShowAt: '-',
    completedAt: '10:52 AM',
    counter: 'Counter 3',
    status: 'Completed',
  },
  {
    id: 13,
    tokenNo: 'B013',
    customerName: 'Ankit Patel',
    email: 'ankit.patel@gmail.com',
    phoneNumber: '+91 98765 43222',
    joinedAt: '10:10 AM',
    servedAt: '-',
    noShowAt: '-',
    completedAt: '-',
    counter: '-',
    status: 'Waiting',
  },
  {
    id: 14,
    tokenNo: 'B014',
    customerName: 'Kavita Reddy',
    email: 'kavita.reddy@gmail.com',
    phoneNumber: '+91 98765 43223',
    joinedAt: '10:15 AM',
    servedAt: '10:45 AM',
    noShowAt: '-',
    completedAt: '11:02 AM',
    counter: 'Counter 1',
    status: 'Completed',
  },
  {
    id: 15,
    tokenNo: 'B015',
    customerName: 'Suresh Chopra',
    email: 'suresh.chopra@gmail.com',
    phoneNumber: '+91 98765 43224',
    joinedAt: '10:20 AM',
    servedAt: '10:52 AM',
    noShowAt: '-',
    completedAt: '11:10 AM',
    counter: 'Counter 2',
    status: 'Completed',
  },
];

const ITEMS_PER_PAGE = 10;

export const AdminQueueLogs = () => {
  // Service filter state
  const [selectedService, setSelectedService] = useState('Bar Service');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef(null);

  // Date filter state
  const [selectedDate, setSelectedDate] = useState('08 Oct 2026');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(e.target)
      ) {
        setIsServiceDropdownOpen(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(e.target)
      ) {
        setIsDateDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsServiceDropdownOpen(false);
        setIsDateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute live metrics based on seed dataset (strictly 15 records)
  const currentLogs = useMemo(() => {
    const prefix = selectedService === 'Bar Service' ? 'B' : selectedService.charAt(0);
    return seedBarServiceLogs.map((item, idx) => ({
      ...item,
      tokenNo: `${prefix}${(idx + 1).toString().padStart(3, '0')}`,
    }));
  }, [selectedService, selectedDate]);

  const metrics = useMemo(() => {
    const totalTokens = currentLogs.length;
    const completed = currentLogs.filter((l) => l.status === 'Completed').length;
    const waiting = currentLogs.filter((l) => l.status === 'Waiting').length;
    const noShow = currentLogs.filter((l) => l.status === 'No Show').length;

    return {
      totalTokens,
      completed,
      waiting,
      noShow,
    };
  }, [currentLogs]);

  // Pagination calculation
  const totalItems = currentLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedItems = currentLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Helper to render pagination numbers with ellipsis (e.g. 1 2 3 4 5 ... 7)
  const renderPaginationItems = () => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <button
          key={pageNum}
          type="button"
          className={`queue-log-page-btn ${currentPage === pageNum ? 'active' : ''}`}
          onClick={() => setCurrentPage(pageNum)}
        >
          {pageNum}
        </button>
      ));
    }

    // When total pages > 6 (e.g. 7 pages as in screenshot)
    const pages = [];
    const showEllipsis = totalPages > 5;

    // In user screenshot: 1, 2, 3, 4, 5, ..., 7
    if (currentPage <= 4) {
      for (let i = 1; i <= Math.min(5, totalPages - 1); i++) {
        pages.push(
          <button
            key={i}
            type="button"
            className={`queue-log-page-btn ${currentPage === i ? 'active' : ''}`}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </button>
        );
      }
      if (showEllipsis) {
        pages.push(
          <span key="ellipsis" className="queue-log-page-ellipsis">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          type="button"
          className={`queue-log-page-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </button>
      );
    } else {
      // Middle or near end
      pages.push(
        <button
          key={1}
          type="button"
          className="queue-log-page-btn"
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
      );
      pages.push(
        <span key="ellipsis-start" className="queue-log-page-ellipsis">
          ...
        </span>
      );

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(
          <button
            key={i}
            type="button"
            className={`queue-log-page-btn ${currentPage === i ? 'active' : ''}`}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </button>
        );
      }

      if (end < totalPages - 1) {
        pages.push(
          <span key="ellipsis-end" className="queue-log-page-ellipsis">
            ...
          </span>
        );
      }

      pages.push(
        <button
          key={totalPages}
          type="button"
          className={`queue-log-page-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="admin-queue-logs-page">
      {/* 1. 4-Card Metrics Row (Placed First) */}
      <div className="queue-logs-metrics-grid">
        {/* Card 1: Total Tokens */}
        <div className="queue-metric-card card-total-tokens">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-blue">
              <Users size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-blue">Today</span>
          </div>
          <div className="metric-content-block">
            <span className="metric-label">Total Tokens</span>
            <span className="metric-value">{metrics.totalTokens}</span>
            <span className="metric-subtext">Logged queue entries</span>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="queue-metric-card card-completed">
          <div className="metric-card-header-line">
            <div className="metric-icon-circle icon-green">
              <Check size={18} strokeWidth={3} />
            </div>
            <span className="metric-card-pill pill-green">Served</span>
          </div>
          <div className="metric-content-block">
            <span className="metric-label">Completed</span>
            <span className="metric-value">{metrics.completed}</span>
            <span className="metric-subtext">Successfully resolved</span>
          </div>
        </div>

        {/* Card 3: Waiting */}
        <div className="queue-metric-card card-waiting">
          <div className="metric-card-header-line">
            <div className="metric-icon-circle icon-amber">
              <Clock size={18} strokeWidth={2.6} />
            </div>
            <span className="metric-card-pill pill-amber">Live</span>
          </div>
          <div className="metric-content-block">
            <span className="metric-label">Waiting</span>
            <span className="metric-value">{metrics.waiting}</span>
            <span className="metric-subtext">Currently in queue line</span>
          </div>
        </div>

        {/* Card 4: No Show */}
        <div className="queue-metric-card card-noshow">
          <div className="metric-card-header-line">
            <div className="metric-icon-circle icon-red">
              <X size={18} strokeWidth={3} />
            </div>
            <span className="metric-card-pill pill-red">Missed</span>
          </div>
          <div className="metric-content-block">
            <span className="metric-label">No Show</span>
            <span className="metric-value">{metrics.noShow}</span>
            <span className="metric-subtext">Unattended call turns</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar (Select Service & Select Date) */}
      <div className="queue-logs-filters-card">
        {/* Left Filter: Select Service */}
        <div className="filter-item-wrapper">
          <label className="filter-item-label">Select Service</label>
          <div className="filter-dropdown-relative" ref={serviceDropdownRef}>
            <button
              type="button"
              className="filter-dropdown-button"
              onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isServiceDropdownOpen}
            >
              <div className="filter-button-content">
                <span className="filter-service-icon-box">
                  <Coffee size={14} className="filter-coffee-icon" />
                </span>
                <span className="filter-button-text">{selectedService}</span>
              </div>
              <ChevronDown
                size={16}
                className={`filter-chevron-icon ${isServiceDropdownOpen ? 'rotated' : ''}`}
              />
            </button>

            {/* Dropdown Options */}
            {isServiceDropdownOpen && (
              <div className="filter-popover-menu service-popover">
                {SERVICES_LIST.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    className={`filter-popover-item ${
                      selectedService === srv.name ? 'selected' : ''
                    }`}
                    onClick={() => {
                      setSelectedService(srv.name);
                      setIsServiceDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                  >
                    <span className="popover-item-icon">{srv.icon}</span>
                    <span className="popover-item-label">{srv.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Filter: Select Date */}
        <div className="filter-item-wrapper">
          <label className="filter-item-label">Select Date</label>
          <div className="filter-dropdown-relative" ref={dateDropdownRef}>
            <button
              type="button"
              className="filter-dropdown-button"
              onClick={() => setIsDateDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isDateDropdownOpen}
            >
              <div className="filter-button-content">
                <Calendar size={15} className="filter-calendar-icon" />
                <span className="filter-button-text">{selectedDate}</span>
              </div>
              <ChevronDown
                size={16}
                className={`filter-chevron-icon ${isDateDropdownOpen ? 'rotated' : ''}`}
              />
            </button>

            {/* Date Presets Dropdown */}
            {isDateDropdownOpen && (
              <div className="filter-popover-menu date-popover">
                <div className="date-popover-header">
                  <span className="date-popover-title">Recent Dates</span>
                </div>
                {DATE_PRESETS.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    className={`filter-popover-item ${
                      selectedDate === d.label ? 'selected' : ''
                    }`}
                    onClick={() => {
                      setSelectedDate(d.label);
                      setIsDateDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                  >
                    <Calendar size={14} className="popover-item-icon" />
                    <span className="popover-item-label">{d.label}</span>
                    {d.tag && <span className="popover-date-tag">{d.tag}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Queue Logs Table Card */}
      <div className="queue-logs-table-card">
        <div className="queue-logs-table-responsive-wrapper">
          <table className="queue-logs-data-table">
            <thead>
              <tr>
                <th className="th-col-num">#</th>
                <th className="th-col-token">Token No.</th>
                <th className="th-col-name">Customer Name</th>
                <th className="th-col-email">Email Address</th>
                <th className="th-col-phone">Phone Number</th>
                <th className="th-col-time">Joined At</th>
                <th className="th-col-time">Served At</th>
                <th className="th-col-time">No Show At</th>
                <th className="th-col-time">Completed At</th>
                <th className="th-col-counter">Counter</th>
                <th className="th-col-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.length > 0 ? (
                displayedItems.map((log, idx) => {
                  const rowNumber = startIndex + idx + 1;
                  return (
                    <tr key={log.id} className="queue-logs-table-row">
                      <td className="cell-col-num">{rowNumber}</td>
                      <td className="cell-col-token">
                        <span className="token-number-text">{log.tokenNo}</span>
                      </td>
                      <td className="cell-col-name">
                        <span className="customer-name-text">{log.customerName}</span>
                      </td>
                      <td className="cell-col-email">
                        <span className="customer-email-text">{log.email}</span>
                      </td>
                      <td className="cell-col-phone">
                        <span className="customer-phone-text">{log.phoneNumber}</span>
                      </td>
                      <td className="cell-col-time">
                        <span className="time-text">{log.joinedAt}</span>
                      </td>
                      <td className="cell-col-time">
                        <span className={log.servedAt === '-' ? 'dash-text' : 'time-text'}>
                          {log.servedAt}
                        </span>
                      </td>
                      <td className="cell-col-time">
                        <span className={log.noShowAt === '-' ? 'dash-text' : 'time-text'}>
                          {log.noShowAt}
                        </span>
                      </td>
                      <td className="cell-col-time">
                        <span className={log.completedAt === '-' ? 'dash-text' : 'time-text'}>
                          {log.completedAt}
                        </span>
                      </td>
                      <td className="cell-col-counter">
                        <span className={log.counter === '-' ? 'dash-text' : 'counter-text'}>
                          {log.counter}
                        </span>
                      </td>
                      <td className="cell-col-status">
                        {log.status === 'Completed' && (
                          <span className="log-status-badge status-completed">
                            <span className="status-badge-circle circle-green">
                              <Check size={9} strokeWidth={3.5} />
                            </span>
                            <span>Completed</span>
                          </span>
                        )}
                        {log.status === 'No Show' && (
                          <span className="log-status-badge status-noshow">
                            <span className="status-badge-circle circle-red">
                              <X size={9} strokeWidth={3.5} />
                            </span>
                            <span>No Show</span>
                          </span>
                        )}
                        {log.status === 'Waiting' && (
                          <span className="log-status-badge status-waiting">
                            <span className="status-badge-circle circle-amber">
                              <Clock size={9} strokeWidth={3} />
                            </span>
                            <span>Waiting</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="no-logs-empty-cell">
                    <p className="no-logs-text">No queue logs recorded for this service and date.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination & Footer */}
        <div className="queue-logs-table-footer">
          <div className="footer-count-text">
            Showing {totalItems > 0 ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} queue logs
          </div>

          <div className="footer-pagination-controls">
            {/* Previous Page Button */}
            <button
              type="button"
              className="queue-log-step-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page Number Buttons */}
            {renderPaginationItems()}

            {/* Next Page Button */}
            <button
              type="button"
              className="queue-log-step-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQueueLogs;
