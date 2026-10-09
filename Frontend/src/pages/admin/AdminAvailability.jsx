import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  CalendarPlus, 
  CalendarCheck, 
  ListFilter, 
  Layers, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Sparkles, 
  RotateCcw, 
  Search, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  ShieldCheck, 
  Eye, 
  HeartPulse, 
  FileText,
  Filter,
  Plus
} from 'lucide-react';
import availabilityUiImg from '../../assets/images/UI/availability.png';
import './AdminAvailability.css';

// Pre-defined Services List matching QueueLess services with all-purpose Layers icon
const serviceOptions = [
  { id: 'srv-1', title: 'General Consultation', code: 'GEN-01', status: 'Active', icon: Layers },
  { id: 'srv-2', title: 'Blood Test & Diagnostics', code: 'DIAG-01', status: 'Active', icon: Layers },
  { id: 'srv-3', title: 'Vaccination & Immunization', code: 'VAC-01', status: 'Active', icon: Layers },
  { id: 'srv-4', title: 'Follow-up Consultation', code: 'FOL-01', status: 'Active', icon: Layers },
  { id: 'srv-5', title: 'Dental Checkup & Cleaning', code: 'DEN-01', status: 'Active', icon: Layers },
  { id: 'srv-6', title: 'Eye & Vision Checkup', code: 'EYE-01', status: 'Active', icon: Layers },
  { id: 'srv-7', title: 'Physiotherapy & Rehab', code: 'PHY-01', status: 'Active', icon: Layers },
  { id: 'srv-8', title: 'Dermatology & Skin Care', code: 'DERM-01', status: 'Active', icon: Layers },
];

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

// Initial Mock Availability Records
const initialAvailabilities = [
  {
    id: 'avail-1',
    serviceId: 'srv-1',
    serviceTitle: 'General Consultation',
    serviceCode: 'GEN-01',
    date: '2026-10-08',
    capacity: 20,
    bookedCount: 14,
    status: 'OPEN',
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'avail-2',
    serviceId: 'srv-5',
    serviceTitle: 'Dental Checkup & Cleaning',
    serviceCode: 'DEN-01',
    date: '2026-10-08',
    capacity: 15,
    bookedCount: 15,
    status: 'FULL',
    createdAt: '2026-10-01T09:15:00Z',
  },
  {
    id: 'avail-3',
    serviceId: 'srv-3',
    serviceTitle: 'Vaccination & Immunization',
    serviceCode: 'VAC-01',
    date: '2026-10-09',
    capacity: 30,
    bookedCount: 8,
    status: 'OPEN',
    createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'avail-4',
    serviceId: 'srv-2',
    serviceTitle: 'Blood Test & Diagnostics',
    serviceCode: 'DIAG-01',
    date: '2026-10-09',
    capacity: 25,
    bookedCount: 20,
    status: 'OPEN',
    createdAt: '2026-10-02T10:30:00Z',
  },
  {
    id: 'avail-5',
    serviceId: 'srv-7',
    serviceTitle: 'Physiotherapy & Rehab',
    serviceCode: 'PHY-01',
    date: '2026-10-10',
    capacity: 10,
    bookedCount: 0,
    status: 'CLOSED',
    createdAt: '2026-10-03T11:00:00Z',
  },
  {
    id: 'avail-6',
    serviceId: 'srv-6',
    serviceTitle: 'Eye & Vision Checkup',
    serviceCode: 'EYE-01',
    date: '2026-10-12',
    capacity: 18,
    bookedCount: 6,
    status: 'OPEN',
    createdAt: '2026-10-04T11:30:00Z',
  },
];

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
  const [selectedService, setSelectedService] = useState(serviceOptions[0]);
  const [selectedDate, setSelectedDate] = useState('2026-10-08');
  const [capacity, setCapacity] = useState(20);
  const [status, setStatus] = useState('OPEN'); // 'OPEN' | 'FULL' | 'CLOSED'

  // Dropdown Open States
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  // Existing Availabilities List State
  const [availabilities, setAvailabilities] = useState(initialAvailabilities);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'full' | 'closed'
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
    setSelectedService(serviceOptions[0]);
    setSelectedDate('2026-10-08');
    setCapacity(20);
    setStatus('OPEN');
    setEditingId(null);
    showToast('Availability form cleared');
  };

  // Handle Save Availability
  const handleSaveAvailability = (e) => {
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

    if (editingId) {
      // Update existing record
      setAvailabilities((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                serviceId: selectedService.id,
                serviceTitle: selectedService.title,
                serviceCode: selectedService.code,
                date: selectedDate,
                capacity: finalCapacity,
                status: status,
              }
            : item
        )
      );
      showToast(`Updated availability for ${selectedService.title}`);
      setEditingId(null);
    } else {
      // Check if availability for this service and date already exists
      const existing = availabilities.find(
        (a) => a.serviceId === selectedService.id && a.date === selectedDate
      );

      if (existing) {
        // Update existing instead of creating duplicate
        setAvailabilities((prev) =>
          prev.map((item) =>
            item.id === existing.id
              ? { ...item, capacity: finalCapacity, status: status }
              : item
          )
        );
        showToast(`Updated existing availability for ${selectedDate}`);
      } else {
        // Create new
        const newRecord = {
          id: `avail-${Date.now()}`,
          serviceId: selectedService.id,
          serviceTitle: selectedService.title,
          serviceCode: selectedService.code,
          date: selectedDate,
          capacity: finalCapacity,
          bookedCount: 0,
          status: status,
          createdAt: new Date().toISOString(),
        };
        setAvailabilities((prev) => [newRecord, ...prev]);
        showToast(`Availability added for ${selectedService.title}`);
      }
    }

    // Switch to Existing view to show newly added item
    setTimeout(() => {
      setActiveTab('existing');
    }, 600);
  };

  // Quick edit existing record
  const handleEditRecord = (record) => {
    const srv = serviceOptions.find((s) => s.id === record.serviceId) || serviceOptions[0];
    setSelectedService(srv);
    setSelectedDate(record.date);
    setCapacity(record.capacity);
    setStatus(record.status);
    setEditingId(record.id);
    setActiveTab('add');
    showToast(`Editing ${record.serviceTitle} (${record.date})`);
  };

  // Delete record
  const handleDeleteRecord = (id) => {
    setAvailabilities((prev) => prev.filter((a) => a.id !== id));
    showToast('Availability deleted successfully');
  };

  // Toggle record status (OPEN <-> CLOSED)
  const handleToggleStatus = (id) => {
    setAvailabilities((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStatus = a.status?.toUpperCase() === 'OPEN' ? 'CLOSED' : 'OPEN';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  // Filtered availabilities for the list tab
  const filteredAvailabilities = useMemo(() => {
    return availabilities.filter((item) => {
      const matchesSearch =
        item.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.serviceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.date.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'all' ||
        item.status?.toUpperCase() === statusFilter?.toUpperCase() ||
        (statusFilter?.toUpperCase() === 'CLOSE' && item.status?.toUpperCase() === 'CLOSED') ||
        (statusFilter?.toUpperCase() === 'CLOSED' && item.status?.toUpperCase() === 'CLOSE');

      return matchesSearch && matchesStatus;
    });
  }, [availabilities, searchQuery, statusFilter]);

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
            <span>Add / Edit Availability</span>
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
                      <span className="selector-text-title">{selectedService.title}</span>
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
                      {serviceOptions.map((srv) => {
                        const IconComponent = srv.icon;
                        const isSelected = selectedService.id === srv.id;
                        return (
                          <div
                            key={srv.id}
                            className={`avail-dropdown-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedService(srv);
                              setIsServiceDropdownOpen(false);
                            }}
                          >
                            <div className="option-leading-content">
                              <IconComponent size={16} className="option-icon" />
                              <span className="option-title">{srv.title}</span>
                              <span className="option-code-pill">{srv.code}</span>
                            </div>
                            <span className="selector-status-tag">Active</span>
                          </div>
                        );
                      })}
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
                    >
                      Cancel
                    </button>

                    <button type="submit" className="avail-btn-submit">
                      <CalendarCheck size={16} />
                      <span>{editingId ? 'Update Availability' : 'Save Availability'}</span>
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

          {/* Table of Availabilities */}
          {filteredAvailabilities.length > 0 ? (
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
                  {filteredAvailabilities.map((item) => {
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
                          >
                            <span className="status-dot-mini" />
                            {item.status}
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
                              onClick={() => handleDeleteRecord(item.id)}
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
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminAvailability;
