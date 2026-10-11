import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  CalendarPlus, 
  CalendarCheck, 
  ListFilter, 
  Layers, 
  Users, 
  ChevronUp,
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  RotateCcw, 
  Search, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  Plus,
  Loader2
} from 'lucide-react';
import availabilityUiImg from '../../assets/images/UI/availability.png';
import serviceApi from '../../services/api/service.api';
import availabilityApi from '../../services/api/availability.api';
import './AdminAvailability.css';

// Helper to format Date string to "08 Oct 2026 (Wednesday)"
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  if (isNaN(dateObj.getTime())) return dateStr;
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[dateObj.getDay()];
  const monthName = months[dateObj.getMonth()];
  const dayFormatted = String(dateObj.getDate()).padStart(2, '0');
  
  return `${dayFormatted} ${monthName} ${dateObj.getFullYear()} (${dayName})`;
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminAvailability = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation Tabs: 'add' | 'existing' - persisted in URL search param and localStorage
  const [activeTab, setActiveTabState] = useState(() => {
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab === 'existing' || urlTab === 'add') {
      return urlTab;
    }
    const savedTab = localStorage.getItem('admin_availability_active_tab');
    if (savedTab === 'existing' || savedTab === 'add') {
      return savedTab;
    }
    return 'add';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    localStorage.setItem('admin_availability_active_tab', tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    localStorage.setItem('admin_availability_active_tab', activeTab);
    const urlTab = searchParams.get('tab');
    if (urlTab !== activeTab) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', activeTab);
        return next;
      }, { replace: true });
    }
  }, [activeTab]);

  // Form State
  const [servicesList, setServicesList] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [capacity, setCapacity] = useState(20);
  const [status, setStatus] = useState('OPEN'); // 'OPEN' | 'FULL' | 'CLOSED'

  // Dropdown Open States
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Existing Availabilities List, Loading & Pagination State
  const ITEMS_PER_PAGE = 10;
  const [availabilities, setAvailabilities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availabilityToDelete, setAvailabilityToDelete] = useState(null);

  // Load Services from Backend
  const loadServices = async () => {
    try {
      const res = await serviceApi.getAllServices();
      const list = Array.isArray(res?.data) ? res.data : [];
      const normalized = list.map((s) => ({
        id: s._id || s.id,
        _id: s._id || s.id,
        title: s.name,
        name: s.name,
        code: s.code || 'SRV',
        status: s.isActive !== false ? 'Active' : 'Inactive',
        icon: Layers,
      }));
      setServicesList(normalized);
      if (normalized.length > 0 && !selectedService) {
        setSelectedService(normalized[0]);
      }
    } catch (err) {
      console.error('Failed to load services in availability:', err);
    }
  };

  // Load Availabilities from Backend
  const loadAvailabilities = async () => {
    try {
      setIsLoading(true);
      const res = await availabilityApi.getAllAvailabilities();
      const list = Array.isArray(res?.data) ? res.data : [];
      const normalized = list.map((item) => {
        const srv = typeof item.serviceId === 'object' && item.serviceId !== null ? item.serviceId : null;
        return {
          id: item._id || item.id,
          _id: item._id || item.id,
          serviceId: srv?._id || srv?.id || item.serviceId,
          serviceTitle: srv?.name || srv?.title || 'Unknown Service',
          serviceCode: srv?.code || 'SRV',
          date: item.date,
          capacity: item.capacity,
          bookedCount: item.bookedCount || 0,
          status: item.status || 'OPEN',
          createdAt: item.createdAt,
        };
      });
      setAvailabilities(normalized);
    } catch (err) {
      console.error('Failed to load availabilities from server:', err);
      showToast(err.message || 'Failed to load availabilities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    loadAvailabilities();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'full' | 'closed'
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState('');

  // Refs for clicking outside dropdowns
  const serviceDropdownRef = useRef(null);
  const datePickerRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const statusFilterRef = useRef(null);
  const dateInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target)) {
        setIsServiceDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target)) {
        setIsStatusFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Capacity Stepper
  const handleIncreaseCapacity = () => {
    setCapacity((prev) => (parseInt(prev, 10) || 0) + 1);
  };

  const handleDecreaseCapacity = () => {
    setCapacity((prev) => Math.max(1, (parseInt(prev, 10) || 20) - 1));
  };

  const handleCapacityChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setCapacity('');
    } else {
      const num = parseInt(val, 10);
      setCapacity(isNaN(num) ? '' : Math.max(1, num));
    }
  };

  const handleCapacityBlur = () => {
    if (capacity === '' || Number(capacity) < 1) {
      setCapacity(20);
    }
  };

  // Handle Form Reset / Clear
  const handleClearForm = () => {
    setSelectedService(servicesList[0] || null);
    setSelectedDate(getTodayDateString());
    setCapacity(20);
    setStatus('OPEN');
    setEditingId(null);
    showToast('Availability form cleared');
  };

  // Handle Save Availability (Create or Update on Backend)
  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    if (!selectedService) {
      showToast('Please select a service');
      return;
    }
    if (!selectedDate) {
      showToast('Please select a date');
      return;
    }

    const finalCapacity = Number(capacity) || 20;
    const srvId = selectedService._id || selectedService.id;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update existing availability
        await availabilityApi.updateAvailability(editingId, {
          serviceId: srvId,
          date: selectedDate,
          capacity: finalCapacity,
          status: status,
        });
        showToast(`Updated availability for ${selectedService.title || selectedService.name}`);
        setEditingId(null);
      } else {
        // Create new availability on server
        await availabilityApi.createAvailability(srvId, {
          date: selectedDate,
          capacity: finalCapacity,
          status: status,
        });
        showToast(`Availability added for ${selectedService.title || selectedService.name}`);
      }

      await loadAvailabilities();
      // Switch to Existing view to show newly saved item
      setTimeout(() => {
        setActiveTab('existing');
      }, 500);
    } catch (err) {
      console.error('Failed to save availability:', err);
      showToast(err.message || 'Failed to save availability');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick edit existing record
  const handleEditRecord = (record) => {
    const srv = servicesList.find((s) => (s._id || s.id) === record.serviceId) || servicesList[0] || record;
    setSelectedService(srv);
    setSelectedDate(record.date);
    setCapacity(record.capacity);
    setStatus(record.status);
    setEditingId(record._id || record.id);
    setActiveTab('add');
    showToast(`Editing ${record.serviceTitle} (${record.date})`);
  };

  // Confirm delete on backend
  const handleConfirmDelete = async () => {
    if (!availabilityToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = availabilityToDelete._id || availabilityToDelete.id;
      await availabilityApi.deleteAvailability(targetId);
      showToast('Availability deleted successfully');
      setAvailabilityToDelete(null);
      await loadAvailabilities();
    } catch (err) {
      console.error('Failed to delete availability:', err);
      showToast(err.message || 'Failed to delete availability');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle record status (OPEN <-> CLOSED) on backend
  const handleToggleStatus = async (record) => {
    try {
      const nextStatus = record.status?.toUpperCase() === 'OPEN' ? 'CLOSED' : 'OPEN';
      await availabilityApi.updateAvailability(record._id || record.id, {
        status: nextStatus,
      });
      showToast(`Status updated to ${nextStatus}`);
      await loadAvailabilities();
    } catch (err) {
      console.error('Failed to toggle status:', err);
      showToast(err.message || 'Failed to update status');
    }
  };

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filtered availabilities for the list tab
  const filteredAvailabilities = useMemo(() => {
    return availabilities.filter((item) => {
      const title = (item.serviceTitle || '').toLowerCase();
      const code = (item.serviceCode || '').toLowerCase();
      const date = item.date || '';
      const q = searchQuery.toLowerCase();

      const matchesSearch = title.includes(q) || code.includes(q) || date.includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        item.status?.toUpperCase() === statusFilter?.toUpperCase() ||
        (statusFilter?.toUpperCase() === 'CLOSE' && item.status?.toUpperCase() === 'CLOSED') ||
        (statusFilter?.toUpperCase() === 'CLOSED' && item.status?.toUpperCase() === 'CLOSE');

      return matchesSearch && matchesStatus;
    });
  }, [availabilities, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredAvailabilities.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAvailabilities = useMemo(() => {
    return filteredAvailabilities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAvailabilities, startIndex]);

  return (
    <div className="admin-availability-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-avail-toast-notification">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Main Card Container (Containing both Tabs & Active View) */}
      <div className="admin-avail-main-card">
        {/* Navigation Tabs Header */}
        <div className="admin-avail-tabs-header">
          <button
            type="button"
            className={`admin-avail-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <CalendarPlus size={18} className="tab-btn-icon" />
            <span>{editingId ? 'Edit Availability' : 'Add Availability'}</span>
          </button>

          <button
            type="button"
            className={`admin-avail-tab-btn ${activeTab === 'existing' ? 'active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            <ListFilter size={18} className="tab-btn-icon" />
            <span>Existing Availability</span>
            {availabilities.length > 0 && (
              <span className="avail-tab-counter-badge">{availabilities.length}</span>
            )}
          </button>
        </div>

        {/* Card Body */}
        <div className="admin-avail-card-body">
          {activeTab === 'add' ? (
            <div className="admin-avail-split-layout">
              {/* LEFT PORTION: Visual Illustration & Guidance Features */}
              <div className="admin-avail-left-panel">
                <div className="avail-left-illustration-wrapper">
                  <div className="avail-decor-circle-1" aria-hidden="true" />
                  <div className="avail-decor-circle-2" aria-hidden="true" />
                  <div className="avail-decor-circle-3" aria-hidden="true" />
                  <img
                    src={availabilityUiImg}
                    alt="Service Availability Calendar Illustration"
                    className="avail-left-illustration-img"
                  />
                </div>

                <h3 className="avail-left-heading">Add Service Availability</h3>
                <p className="avail-left-subheading">
                  Select a service, choose the date, set the capacity and status for that day.
                </p>

                {/* Guidance Feature List */}
                <div className="avail-guidance-list">
                  <div className="avail-guidance-item">
                    <div className="guidance-icon-bubble bubble-green">
                      <Calendar size={18} />
                    </div>
                    <div className="guidance-text-block">
                      <h4 className="guidance-title">Set slots for a specific date</h4>
                      <p className="guidance-desc">Define how many appointments can be booked.</p>
                    </div>
                  </div>

                  <div className="avail-guidance-item">
                    <div className="guidance-icon-bubble bubble-purple">
                      <Settings size={18} />
                    </div>
                    <div className="guidance-text-block">
                      <h4 className="guidance-title">Control service availability</h4>
                      <p className="guidance-desc">OPEN, FULL or CLOSED status.</p>
                    </div>
                  </div>

                  <div className="avail-guidance-item">
                    <div className="guidance-icon-bubble bubble-blue">
                      <Users size={18} />
                    </div>
                    <div className="guidance-text-block">
                      <h4 className="guidance-title">Keep your queue organized</h4>
                      <p className="guidance-desc">Manage availability for each service easily.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT PORTION: The Availability Configuration Form */}
              <div className="admin-avail-right-form-panel">
                {/* Form Section Header */}
                <div className="admin-avail-form-header">
                  <div className="avail-header-badge-icon">
                    <CalendarPlus size={22} />
                  </div>
                  <div>
                    <h3 className="avail-form-title">
                      {editingId ? 'Edit Availability' : 'Add Availability'}
                    </h3>
                    <p className="avail-form-subtitle">
                      Fill in the details below to set availability for a service on a specific date.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveAvailability} className="avail-interactive-form">
                  {/* Field 1: Select Service */}
                  <div className="avail-form-group" ref={serviceDropdownRef}>
                    <label className="avail-field-label">
                      Select Service <span className="avail-required-star">*</span>
                    </label>

                    <div
                      className="avail-custom-selector-box"
                      onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="avail-selector-left-content">
                        <Layers size={18} className="selector-icon-blue" />
                        <span className="selector-text-title">
                          {selectedService ? (selectedService.title || selectedService.name) : 'Select a service'}
                        </span>
                        <span className="selector-status-tag">Active</span>
                      </div>
                      <ChevronDown
                        size={17}
                        className={`selector-chevron ${isServiceDropdownOpen ? 'rotated' : ''}`}
                      />
                    </div>

                    {/* Service Dropdown Menu */}
                    {isServiceDropdownOpen && (
                      <div className="avail-floating-dropdown-menu">
                        {servicesList.length > 0 ? (
                          servicesList.map((srv) => {
                            const IconComponent = srv.icon || Layers;
                            const isSelected =
                              selectedService &&
                              (selectedService._id || selectedService.id) === (srv._id || srv.id);
                            return (
                              <div
                                key={srv._id || srv.id}
                                className={`avail-dropdown-option ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedService(srv);
                                  setIsServiceDropdownOpen(false);
                                }}
                              >
                                <div className="option-leading-content">
                                  <IconComponent size={16} className="option-icon" />
                                  <span className="option-title">{srv.title || srv.name}</span>
                                  <span className="option-code-pill">{srv.code}</span>
                                </div>
                                <span className="selector-status-tag">{srv.status || 'Active'}</span>
                              </div>
                            );
                          })
                        ) : (
                          <div
                            style={{
                              padding: '14px',
                              textAlign: 'center',
                              color: '#64748B',
                              fontSize: '13px',
                            }}
                          >
                            No services available. Create a service in Service Management first.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Field 2: Select Date */}
                  <div className="avail-form-group" ref={datePickerRef}>
                    <label className="avail-field-label">
                      Select Date <span className="avail-required-star">*</span>
                    </label>

                    <div
                      className="avail-custom-selector-box"
                      onClick={() => {
                        setIsDatePickerOpen((prev) => !prev);
                        if (dateInputRef.current) {
                          try {
                            dateInputRef.current.showPicker();
                          } catch (e) {
                            // Fallback for browsers that don't support showPicker()
                          }
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="avail-selector-left-content">
                        <Calendar size={18} className="selector-icon-slate" />
                        <span className="selector-text-title">
                          {formatDateDisplay(selectedDate)}
                        </span>
                      </div>
                      <ChevronDown
                        size={17}
                        className={`selector-chevron ${isDatePickerOpen ? 'rotated' : ''}`}
                      />
                    </div>

                    {/* Hidden Native Date Input for cross-browser picking */}
                    <input
                      type="date"
                      ref={dateInputRef}
                      className="avail-native-date-input"
                      value={selectedDate}
                      min={getTodayDateString()}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDate(e.target.value);
                          setIsDatePickerOpen(false);
                        }
                      }}
                    />
                  </div>

                  {/* Row: Field 3 (Capacity) & Field 4 (Status) */}
                  <div className="avail-form-two-col-row">
                    {/* Field 3: Capacity */}
                    <div className="avail-form-group flex-1">
                      <label className="avail-field-label">
                        Capacity <span className="avail-required-star">*</span>
                      </label>

                      <div className="avail-capacity-input-container">
                        <div className="capacity-input-leading">
                          <Users size={18} className="selector-icon-slate" />
                          <input
                            type="number"
                            min="1"
                            max="999"
                            required
                            className="avail-capacity-num-field"
                            value={capacity}
                            onChange={handleCapacityChange}
                            onBlur={handleCapacityBlur}
                          />
                        </div>

                        {/* Stepper Buttons (Up & Down Arrows) */}
                        <div className="avail-stepper-arrow-column">
                          <button
                            type="button"
                            className="capacity-step-arrow up"
                            onClick={handleIncreaseCapacity}
                            aria-label="Increase capacity"
                          >
                            <ChevronUp size={13} strokeWidth={2.6} />
                          </button>
                          <button
                            type="button"
                            className="capacity-step-arrow down"
                            onClick={handleDecreaseCapacity}
                            disabled={Number(capacity) <= 1}
                            aria-label="Decrease capacity"
                          >
                            <ChevronDown size={13} strokeWidth={2.6} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Field 4: Status */}
                    <div className="avail-form-group flex-1" ref={statusDropdownRef}>
                      <label className="avail-field-label">
                        Status <span className="avail-required-star">*</span>
                      </label>

                      <div
                        className="avail-custom-selector-box"
                        onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="avail-selector-left-content">
                          <span
                            className={`avail-status-dot ${
                              status?.toUpperCase() === 'OPEN'
                                ? 'dot-green'
                                : status?.toUpperCase() === 'FULL'
                                ? 'dot-orange'
                                : 'dot-red'
                            }`}
                          />
                          <span className="selector-text-title">{status}</span>
                        </div>
                        <ChevronDown
                          size={17}
                          className={`selector-chevron ${isStatusDropdownOpen ? 'rotated' : ''}`}
                        />
                      </div>

                      {/* Status Dropdown Menu */}
                      {isStatusDropdownOpen && (
                        <div className="avail-floating-dropdown-menu status-menu">
                          {[
                            { val: 'OPEN', color: 'dot-green' },
                            { val: 'FULL', color: 'dot-orange' },
                            { val: 'CLOSED', color: 'dot-red' },
                          ].map((st) => (
                            <div
                              key={st.val}
                              className={`avail-dropdown-option ${status === st.val ? 'selected' : ''}`}
                              onClick={() => {
                                setStatus(st.val);
                                setIsStatusDropdownOpen(false);
                              }}
                            >
                              <div className="option-leading-content">
                                <span className={`avail-status-dot ${st.color}`} />
                                <span className="option-title">{st.val}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Footer Action Buttons */}
                  <div className="avail-form-footer-action-bar">
                    <div className="footer-left-buttons">
                      <button
                        type="button"
                        className="avail-btn-clear"
                        onClick={handleClearForm}
                        disabled={isSubmitting}
                      >
                        <RotateCcw size={14} />
                        <span>Clear Form</span>
                      </button>
                    </div>

                    <div className="footer-right-buttons">
                      <button
                        type="button"
                        className="avail-btn-cancel"
                        onClick={() => {
                          handleClearForm();
                          setActiveTab('existing');
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>

                      <button type="submit" className="avail-btn-submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="button-spinner" />
                            <span>{editingId ? 'Updating...' : 'Saving...'}</span>
                          </>
                        ) : (
                          <>
                            <CalendarCheck size={16} />
                            <span>{editingId ? 'Update Availability' : 'Save Availability'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* EXISTING AVAILABILITY TAB CONTENT */
            <div className="admin-avail-existing-content">
              {/* Filter and Search Bar */}
              <div className="existing-controls-bar">
                <div className="existing-search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by service name, code, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="existing-search-field"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="existing-filters-group">
                  {/* Status Filter Dropdown */}
                  <div className="status-filter-dropdown-wrapper" ref={statusFilterRef}>
                    <button
                      type="button"
                      className={`status-filter-toggle-btn ${statusFilter !== 'all' ? 'active' : ''}`}
                      onClick={() => setIsStatusFilterOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isStatusFilterOpen}
                    >
                      <Filter size={14} className="filter-btn-icon" />
                      <span>
                        {statusFilter === 'all'
                          ? 'All Status'
                          : statusFilter.toUpperCase()}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`filter-btn-chevron ${isStatusFilterOpen ? 'rotated' : ''}`}
                      />
                    </button>

                    {isStatusFilterOpen && (
                      <div className="status-filter-menu" role="listbox">
                        {[
                          { id: 'all', label: 'All Status' },
                          { id: 'open', label: 'OPEN', dotClass: 'dot-green' },
                          { id: 'full', label: 'FULL', dotClass: 'dot-orange' },
                          { id: 'closed', label: 'CLOSED', dotClass: 'dot-red' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`status-filter-option ${statusFilter === item.id ? 'selected' : ''}`}
                            onClick={() => {
                              setStatusFilter(item.id);
                              setIsStatusFilterOpen(false);
                            }}
                          >
                            <div className="status-option-label">
                              {item.dotClass && (
                                <span className={`status-dot-mini ${item.dotClass}`} />
                              )}
                              <span>{item.label}</span>
                            </div>
                            {statusFilter === item.id && (
                              <Check size={14} className="option-check-icon" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="add-new-quick-btn"
                    onClick={() => {
                      handleClearForm();
                      setActiveTab('add');
                    }}
                  >
                    <Plus size={16} strokeWidth={2.4} />
                    <span>Add Availability</span>
                  </button>
                </div>
              </div>

              {/* Loading State or Table of Availabilities */}
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '14px' }}>
                  <Loader2 size={36} color="#1D68F2" className="button-spinner" />
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Loading availability slots...</span>
                </div>
              ) : filteredAvailabilities.length > 0 ? (
                <div className="avail-table-responsive-wrapper">
                  <table className="avail-data-table">
                    <thead>
                      <tr>
                        <th className="th-service">Service Name & Code</th>
                        <th className="th-date">Date</th>
                        <th className="th-capacity">Capacity / Booked</th>
                        <th className="th-status">Status</th>
                        <th className="th-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAvailabilities.map((item) => {
                        const booked = item.bookedCount || 0;
                        const percent = Math.min(100, Math.round((booked / item.capacity) * 100));
                        return (
                          <tr key={item.id} className="avail-table-row">
                            <td className="cell-service">
                              <div className="service-cell-inner">
                                <div className="service-cell-icon-box">
                                  <Layers size={16} />
                                </div>
                                <div>
                                  <div className="service-cell-title">{item.serviceTitle}</div>
                                  <span className="service-cell-code">{item.serviceCode}</span>
                                </div>
                              </div>
                            </td>

                            <td className="cell-date">
                              <div className="date-cell-badge">
                                <span>{formatDateDisplay(item.date)}</span>
                              </div>
                            </td>

                            <td className="cell-capacity">
                              <div className="capacity-bar-wrapper">
                                <div className="capacity-text-row">
                                  <span className="booked-count-bold">{booked}</span>
                                  <span className="capacity-total">/ {item.capacity} slots</span>
                                  <span className="capacity-percentage">({percent}%)</span>
                                </div>
                                <div className="capacity-progress-track">
                                  <div
                                    className={`capacity-progress-fill ${
                                      percent >= 100 ? 'fill-full' : 'fill-normal'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="cell-status">
                              <span
                                className={`status-pill ${
                                  item.status?.toUpperCase() === 'OPEN'
                                    ? 'status-open'
                                    : item.status?.toUpperCase() === 'FULL'
                                    ? 'status-full'
                                    : 'status-closed'
                                }`}
                                onClick={() => handleToggleStatus(item)}
                                title="Click to toggle OPEN / CLOSED"
                                style={{ cursor: 'pointer' }}
                              >
                                <span className="status-dot-mini" />
                                <span>{item.status}</span>
                              </span>
                            </td>

                            <td className="cell-actions">
                              <div className="row-action-buttons">
                                <button
                                  type="button"
                                  className="action-icon-btn edit"
                                  onClick={() => handleEditRecord(item)}
                                  title="Edit Availability"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="action-icon-btn delete"
                                  onClick={() => setAvailabilityToDelete(item)}
                                  title="Delete Availability"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="avail-empty-state-card">
                  <CalendarPlus size={44} className="empty-state-icon" />
                  <h4 className="empty-state-title">No Service Availability Found</h4>
                  <p className="empty-state-desc">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No records match your active search and filter criteria.'
                      : 'Get started by configuring availability for your clinic services.'}
                  </p>
                  <button
                    type="button"
                    className="empty-state-action-btn"
                    onClick={() => {
                      handleClearForm();
                      setActiveTab('add');
                    }}
                  >
                    <Plus size={16} />
                    <span>Create New Availability</span>
                  </button>
                </div>
              )}

              {/* Table Footer Count & Pagination */}
              {!isLoading && filteredAvailabilities.length > 0 && (
                <div className="avail-table-footer">
                  <span className="footer-count-text">
                    Showing {startIndex + 1} to{' '}
                    {Math.min(startIndex + ITEMS_PER_PAGE, filteredAvailabilities.length)} of{' '}
                    {filteredAvailabilities.length} availability records
                  </span>

                  <div className="table-footer-pagination">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                        <button
                          key={pg}
                          type="button"
                          className={`page-num-btn ${currentPage === pg ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pg)}
                        >
                          {pg}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {availabilityToDelete && (
        <div className="avail-modal-backdrop" onClick={() => !isDeleting && setAvailabilityToDelete(null)}>
          <div className="avail-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="avail-modal-header-icon">
              <AlertTriangle size={24} color="#DC2626" />
            </div>
            <h3 className="avail-modal-title">Delete Availability Slot</h3>
            <p className="avail-modal-desc">
              Are you sure you want to delete availability for <b>{availabilityToDelete.serviceTitle}</b> on{' '}
              <b>{availabilityToDelete.date}</b>? Patients will no longer be able to book for this day.
            </p>
            <div className="avail-modal-actions">
              <button
                type="button"
                className="avail-modal-btn-cancel"
                onClick={() => setAvailabilityToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="avail-modal-btn-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="button-spinner" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Availability</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAvailability;
