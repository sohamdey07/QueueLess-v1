import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Users,
  Check,
  Clock,
  X,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Activity,
  Search,
  Layers,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import queueApi from '../../services/api/queue.api';
import serviceApi from '../../services/api/service.api';
import { onQueueUpdated } from '../../services/socket/socketClient';
import './AdminQueueLogs.css';

const ITEMS_PER_PAGE = 10;

// Helper to format date strings for display (e.g., '2026-10-10' -> '10 Oct 2026')
function formatDateLabel(isoDate) {
  if (!isoDate || isoDate === 'all') return 'All Dates';
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, monthIndex, day);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    }
    const d = new Date(isoDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch {
    // fallback
  }
  return isoDate;
}

// Helper to format time for table cells
function formatTime(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '—';
  }
}

export const AdminQueueLogs = () => {
  // Service list & selection
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState({ id: 'all', name: 'All Services', code: 'ALL' });
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const serviceDropdownRef = useRef(null);

  // Date selection & available dates
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('all'); // 'all' or 'YYYY-MM-DD'
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const dateDropdownRef = useRef(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Queue entries state
  const [rawLogs, setRawLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all registered services on mount
  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const res = await serviceApi.getAllServices();
        if (isMounted) {
          const list = Array.isArray(res?.data) ? res.data : (res?.data?.services || []);
          setServices(list);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    };
    fetchServices();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch queue logs based on selected service and date
  const loadQueueLogs = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = {};
      if (selectedService.id && selectedService.id !== 'all') {
        params.serviceId = selectedService.id;
      }
      if (selectedDate && selectedDate !== 'all') {
        params.date = selectedDate;
      }

      const res = await queueApi.getQueueLogs(params);
      const data = res?.data || {};
      const logs = Array.isArray(data.logs) ? data.logs : [];
      setRawLogs(logs);

      if (Array.isArray(data.availableDates)) {
        setAvailableDates(data.availableDates);
      }
    } catch (err) {
      console.error('Failed to fetch queue logs:', err);
      setFetchError(err.message || 'Unable to retrieve queue logs');
      setRawLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedService.id, selectedDate]);

  useEffect(() => {
    loadQueueLogs();

    // Listen for live queue updates (e.g. CUSTOMER_SKIPPED, CUSTOMER_CALLED)
    const unsubscribe = onQueueUpdated(() => {
      loadQueueLogs();
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadQueueLogs]);

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

  // Map & format queue logs for UI display
  const formattedLogs = useMemo(() => {
    return rawLogs.map((item) => {
      const service = item.serviceId;
      const appointment = item.appointmentId;
      const counter = item.counterId;

      // Token display formatting (e.g. BD-001 or T-001)
      let prefix = 'T';
      if (service?.code) {
        prefix = service.code;
      } else if (service?.name) {
        prefix = service.name.charAt(0).toUpperCase();
      }
      const tokenNumberStr = String(item.tokenNumber || 0).padStart(3, '0');
      const tokenNo = `${prefix}-${tokenNumberStr}`;

      // Customer details
      const customerName = appointment?.customerName || 'Anonymous Customer';
      const email = appointment?.customerEmail || '—';
      const phoneNumber = appointment?.customerPhone || '—';

      // Timestamps
      const joinedAt = formatTime(item.joinedAt);
      const servedAt = formatTime(item.servingAt || item.calledAt);
      const isNoShowOrSkipped =
        item.status === 'NO_SHOW' ||
        item.status === 'SKIPPED' ||
        appointment?.status === 'NO_SHOW' ||
        appointment?.status === 'SKIPPED';
      const noShowAt = isNoShowOrSkipped
        ? formatTime(appointment?.noShowAt || item.updatedAt)
        : '—';
      const completedAt = formatTime(item.completedAt || appointment?.completedAt);

      // Counter
      const counterName = counter?.name || (counter?.code ? `Counter ${counter.code}` : '—');

      // Status
      let normalizedStatus = 'Waiting';
      if (item.status === 'COMPLETED' || appointment?.status === 'COMPLETED') {
        normalizedStatus = 'Completed';
      } else if (isNoShowOrSkipped) {
        normalizedStatus = (item.status === 'SKIPPED' || appointment?.status === 'SKIPPED') ? 'Skipped' : 'No Show';
      } else if (item.status === 'SERVING' || appointment?.status === 'IN_SERVICE') {
        normalizedStatus = 'Serving';
      } else if (item.status === 'CALLED') {
        normalizedStatus = 'Called';
      } else if (item.status === 'WAITING' || appointment?.status === 'CHECKED_IN' || appointment?.status === 'BOOKED') {
        normalizedStatus = 'Waiting';
      }

      return {
        id: item._id,
        rawStatus: item.status,
        appointmentStatus: appointment?.status || null,
        isNoShow: isNoShowOrSkipped,
        status: normalizedStatus,
        tokenNo,
        tokenNumber: item.tokenNumber,
        customerName,
        email,
        phoneNumber,
        joinedAt,
        servedAt,
        noShowAt,
        completedAt,
        counter: counterName,
        serviceName: service?.name || 'Unknown Service',
      };
    });
  }, [rawLogs]);

  // Filter logs by search query (name, token, email, phone, counter)
  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return formattedLogs;

    return formattedLogs.filter((item) => {
      return (
        item.tokenNo.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phoneNumber.toLowerCase().includes(q) ||
        item.counter.toLowerCase().includes(q) ||
        item.serviceName.toLowerCase().includes(q)
      );
    });
  }, [formattedLogs, searchQuery]);

  // Compute live metrics based on fetched dataset
  const metrics = useMemo(() => {
    const totalTokens = formattedLogs.length;
    const completed = formattedLogs.filter((l) => l.status === 'Completed').length;
    const waiting = formattedLogs.filter((l) => l.status === 'Waiting').length;
    const noShow = formattedLogs.filter((l) =>
      l.isNoShow ||
      l.status === 'No Show' ||
      l.status === 'Skipped' ||
      l.rawStatus === 'NO_SHOW' ||
      l.rawStatus === 'SKIPPED' ||
      l.appointmentStatus === 'NO_SHOW' ||
      l.appointmentStatus === 'SKIPPED'
    ).length;

    return {
      totalTokens,
      completed,
      waiting,
      noShow,
    };
  }, [formattedLogs]);

  // Pagination calculation
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedItems = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Date Presets for dropdown
  const dateOptions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const uniqueDateStrings = Array.from(new Set([todayStr, ...availableDates])).filter(Boolean);

    const list = [
      { value: 'all', label: 'All Dates', tag: null }
    ];

    uniqueDateStrings.forEach((d) => {
      let tag = null;
      if (d === todayStr) tag = 'Today';
      else if (d === yesterdayStr) tag = 'Yesterday';

      list.push({
        value: d,
        label: formatDateLabel(d),
        tag
      });
    });

    return list;
  }, [availableDates]);

  // Helper to render pagination numbers with ellipsis
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

    const pages = [];
    const showEllipsis = totalPages > 5;

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
      {/* 1. 4-Card Metrics Row */}
      <div className="queue-logs-metrics-grid">
        {/* Card 1: Total Tokens */}
        <div className="queue-metric-card card-total-tokens">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-blue">
              <Users size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-blue">
              {selectedDate === 'all' ? 'All Time' : 'Filtered'}
            </span>
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

      {/* 3. Controls & Filter Bar (Select Service & Select Date + Search + Refresh) */}
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
                  <Layers size={14} className="filter-coffee-icon" />
                </span>
                <span className="filter-button-text">{selectedService.name}</span>
              </div>
              <ChevronDown
                size={16}
                className={`filter-chevron-icon ${isServiceDropdownOpen ? 'rotated' : ''}`}
              />
            </button>

            {/* Service Dropdown Options */}
            {isServiceDropdownOpen && (
              <div className="filter-popover-menu service-popover">
                {/* Option: All Services */}
                <button
                  type="button"
                  className={`filter-popover-item ${selectedService.id === 'all' ? 'selected' : ''
                    }`}
                  onClick={() => {
                    setSelectedService({ id: 'all', name: 'All Services', code: 'ALL' });
                    setIsServiceDropdownOpen(false);
                    setCurrentPage(1);
                  }}
                >
                  <span className="popover-item-icon">
                    <Layers size={15} />
                  </span>
                  <span className="popover-item-label">All Services</span>
                </button>

                {/* Dynamically loaded services */}
                {services.map((srv) => {
                  const srvId = srv._id || srv.id;
                  const isSelected = selectedService.id === srvId;
                  return (
                    <button
                      key={srvId}
                      type="button"
                      className={`filter-popover-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedService({ id: srvId, name: srv.name, code: srv.code });
                        setIsServiceDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      <span className="popover-item-icon">
                        <Activity size={14} />
                      </span>
                      <span className="popover-item-label">
                        {srv.name} {srv.code ? `(${srv.code})` : ''}
                      </span>
                    </button>
                  );
                })}
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
                <span className="filter-button-text">
                  {selectedDate === 'all' ? 'All Dates' : formatDateLabel(selectedDate)}
                </span>
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
                  <span className="date-popover-title">Available Dates</span>
                </div>

                {dateOptions.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`filter-popover-item ${selectedDate === d.value ? 'selected' : ''
                      }`}
                    onClick={() => {
                      setSelectedDate(d.value);
                      setIsDateDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                  >
                    <Calendar size={14} className="popover-item-icon" />
                    <span className="popover-item-label">{d.label}</span>
                    {d.tag && <span className="popover-date-tag">{d.tag}</span>}
                  </button>
                ))}

                {/* Custom Date Input Picker */}
                <div className="date-popover-custom">
                  <span className="date-popover-title">Pick Specific Date</span>
                  <input
                    type="date"
                    className="date-custom-input"
                    value={customDateInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomDateInput(val);
                      if (val) {
                        setSelectedDate(val);
                        setIsDateDropdownOpen(false);
                        setCurrentPage(1);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Search Box */}
        <div className="filter-search-box">
          <Search size={15} color="#94A3B8" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search token, customer, phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          className="queue-log-step-btn"
          onClick={() => loadQueueLogs()}
          title="Refresh queue logs"
          style={{ width: 42, height: 42, borderRadius: 10 }}
        >
          <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
        </button>
      </div>

      {/* 4. Queue Logs Table Card */}
      <div className="queue-logs-table-card">
        {fetchError && (
          <div style={{ padding: '16px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 10, color: '#B91C1C', fontSize: 13 }}>
            <AlertCircle size={18} />
            <span>{fetchError}</span>
          </div>
        )}

        <div className="queue-logs-table-responsive-wrapper">
          <table className="queue-logs-data-table">
            <thead>
              <tr>
                <th className="th-col-num">#</th>
                <th className="th-col-token">Token Number</th>
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
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="no-logs-empty-cell">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <RefreshCw size={24} className="spin-icon" color="#1D68F2" />
                      <p className="no-logs-text">Fetching queue entries from database...</p>
                    </div>
                  </td>
                </tr>
              ) : displayedItems.length > 0 ? (
                displayedItems.map((log, idx) => {
                  const rowNumber = startIndex + idx + 1;
                  const initials = log.customerName
                    ? log.customerName
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                    : 'U';

                  return (
                    <tr key={log.id} className="queue-logs-table-row">
                      <td className="cell-col-num">
                        <span className="row-num-badge">{rowNumber}</span>
                      </td>
                      <td className="cell-col-token">
                        <span className="token-number-badge">{log.tokenNo}</span>
                      </td>
                      <td className="cell-col-name">
                        <div className="queue-customer-name-wrapper">
                          <div className={`queue-avatar-circle avatar-tone-${idx % 5}`}>
                            {initials}
                          </div>
                          <span className="customer-name-text">{log.customerName}</span>
                        </div>
                      </td>
                      <td className="cell-col-email">
                        <span className="customer-email-text">{log.email}</span>
                      </td>
                      <td className="cell-col-phone">
                        <span className="customer-phone-text">{log.phoneNumber}</span>
                      </td>
                      <td className="cell-col-time">
                        <span className="time-pill-text">{log.joinedAt}</span>
                      </td>
                      <td className="cell-col-time">
                        {log.servedAt === '—' ? (
                          <span className="null-dash-pill">—</span>
                        ) : (
                          <span className="time-pill-text">{log.servedAt}</span>
                        )}
                      </td>
                      <td className="cell-col-time">
                        {log.noShowAt === '—' ? (
                          <span className="null-dash-pill">—</span>
                        ) : (
                          <span className="time-pill-text">{log.noShowAt}</span>
                        )}
                      </td>
                      <td className="cell-col-time">
                        {log.completedAt === '—' ? (
                          <span className="null-dash-pill">—</span>
                        ) : (
                          <span className="time-pill-text">{log.completedAt}</span>
                        )}
                      </td>
                      <td className="cell-col-counter">
                        {log.counter === '—' ? (
                          <span className="null-dash-pill">—</span>
                        ) : (
                          <span className="counter-pill-text">{log.counter}</span>
                        )}
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
                        {(log.status === 'Serving' || log.status === 'Called') && (
                          <span className="log-status-badge status-serving">
                            <span className="status-badge-circle circle-blue">
                              <Activity size={9} strokeWidth={3} />
                            </span>
                            <span>{log.status}</span>
                          </span>
                        )}
                        {log.status === 'Skipped' && (
                          <span className="log-status-badge status-skipped">
                            <span className="status-badge-circle circle-slate">
                              <Clock size={9} strokeWidth={3} />
                            </span>
                            <span>Skipped</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="no-logs-empty-cell">
                    <p className="no-logs-text">
                      {searchQuery
                        ? `No queue logs matching "${searchQuery}"`
                        : `No queue logs recorded for ${selectedService.name} on ${selectedDate === 'all' ? 'any date' : formatDateLabel(selectedDate)}.`}
                    </p>
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
