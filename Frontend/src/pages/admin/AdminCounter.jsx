import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Store,
  Plus,
  ListFilter,
  Layers,
  Users,
  UserCheck,
  Search,
  Filter,
  Check,
  X,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hash,
  Tv,
  Radio,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import counterUiImg from '../../assets/images/UI/counter.png';
import './AdminCounter.css';

// Pre-defined Services List matching QueueLess system
const SERVICES_LIST = [
  { id: 'srv-1', title: 'General Consultation', code: 'GEN-01', status: 'Active', icon: Layers },
  { id: 'srv-2', title: 'Blood Test & Diagnostics', code: 'DIAG-01', status: 'Active', icon: Layers },
  { id: 'srv-3', title: 'Vaccination & Immunization', code: 'VAC-01', status: 'Active', icon: Layers },
  { id: 'srv-4', title: 'Dental Checkup & Cleaning', code: 'DEN-01', status: 'Active', icon: Layers },
  { id: 'srv-5', title: 'Eye & Vision Checkup', code: 'EYE-01', status: 'Active', icon: Layers },
  { id: 'srv-6', title: 'Physiotherapy & Rehab', code: 'PHY-01', status: 'Active', icon: Layers },
  { id: 'srv-7', title: 'Dermatology & Skin Care', code: 'DERM-01', status: 'Active', icon: Layers },
  { id: 'srv-8', title: 'Follow-up Consultation', code: 'FOL-01', status: 'Active', icon: Layers },
];

// Pre-defined Staff Members matching Manage Users seed data
const STAFF_LIST = [
  { id: 'staff-1', name: 'Rohan Das', email: 'rohan.das@qless.com', status: 'Active', role: 'Staff' },
  { id: 'staff-2', name: 'Ananya Sen', email: 'ananya.sen@qless.com', status: 'Inactive', role: 'Staff' },
  { id: 'staff-3', name: 'Souvik Roy', email: 'souvik.roy@qless.com', status: 'Active', role: 'Staff' },
  { id: 'staff-4', name: 'Priya Shah', email: 'priya.shah@qless.com', status: 'Active', role: 'Staff' },
  { id: 'staff-5', name: 'Arjun Mehta', email: 'arjun.mehta@qless.com', status: 'Inactive', role: 'Staff' },
  { id: 'staff-6', name: 'Neha Verma', email: 'neha.verma@qless.com', status: 'Active', role: 'Staff' },
  { id: 'staff-7', name: 'Karan Tiwari', email: 'karan.tiwari@qless.com', status: 'Active', role: 'Staff' },
  { id: 'staff-8', name: 'Mitali Singh', email: 'mitali.singh@qless.com', status: 'Inactive', role: 'Staff' },
];

// Initial Counter Seed Data (15 Dummy Counters)
const INITIAL_COUNTERS = [
  {
    id: 'cnt-1',
    name: 'Counter 1',
    code: 'CNT-01',
    serviceId: 'srv-1',
    serviceTitle: 'General Consultation',
    serviceCode: 'GEN-01',
    staffId: 'staff-1',
    staffName: 'Rohan Das',
    staffEmail: 'rohan.das@qless.com',
    status: 'Active',
    assignedAt: 'Today, 08:30 AM',
  },
  {
    id: 'cnt-2',
    name: 'Counter 2',
    code: 'CNT-02',
    serviceId: 'srv-4',
    serviceTitle: 'Dental Checkup & Cleaning',
    serviceCode: 'DEN-01',
    staffId: 'staff-3',
    staffName: 'Souvik Roy',
    staffEmail: 'souvik.roy@qless.com',
    status: 'Active',
    assignedAt: 'Today, 08:45 AM',
  },
  {
    id: 'cnt-3',
    name: 'Counter 3',
    code: 'CNT-03',
    serviceId: 'srv-2',
    serviceTitle: 'Blood Test & Diagnostics',
    serviceCode: 'DIAG-01',
    staffId: 'staff-4',
    staffName: 'Priya Shah',
    staffEmail: 'priya.shah@qless.com',
    status: 'Active',
    assignedAt: 'Today, 09:00 AM',
  },
  {
    id: 'cnt-4',
    name: 'Counter 4',
    code: 'CNT-04',
    serviceId: 'srv-3',
    serviceTitle: 'Vaccination & Immunization',
    serviceCode: 'VAC-01',
    staffId: 'staff-2',
    staffName: 'Ananya Sen',
    staffEmail: 'ananya.sen@qless.com',
    status: 'Inactive',
    assignedAt: 'Yesterday, 04:15 PM',
  },
  {
    id: 'cnt-5',
    name: 'Counter 5',
    code: 'CNT-05',
    serviceId: 'srv-5',
    serviceTitle: 'Eye & Vision Checkup',
    serviceCode: 'EYE-01',
    staffId: 'staff-6',
    staffName: 'Neha Verma',
    staffEmail: 'neha.verma@qless.com',
    status: 'Active',
    assignedAt: 'Today, 09:15 AM',
  },
  {
    id: 'cnt-6',
    name: 'Counter 6',
    code: 'CNT-06',
    serviceId: 'srv-8',
    serviceTitle: 'Follow-up Consultation',
    serviceCode: 'FOL-01',
    staffId: 'staff-7',
    staffName: 'Karan Tiwari',
    staffEmail: 'karan.tiwari@qless.com',
    status: 'Inactive',
    assignedAt: 'Yesterday, 05:00 PM',
  },
  {
    id: 'cnt-7',
    name: 'Counter 7',
    code: 'CNT-07',
    serviceId: 'srv-7',
    serviceTitle: 'Dermatology & Skin Care',
    serviceCode: 'DERM-01',
    staffId: 'staff-5',
    staffName: 'Arjun Mehta',
    staffEmail: 'arjun.mehta@qless.com',
    status: 'Active',
    assignedAt: 'Today, 09:30 AM',
  },
  {
    id: 'cnt-8',
    name: 'Counter 8',
    code: 'CNT-08',
    serviceId: 'srv-9',
    serviceTitle: 'Account Assistance',
    serviceCode: 'ACC-01',
    staffId: 'staff-8',
    staffName: 'Sneha Roy',
    staffEmail: 'sneha.roy@qless.com',
    status: 'Active',
    assignedAt: 'Today, 09:45 AM',
  },
  {
    id: 'cnt-9',
    name: 'Counter 9',
    code: 'CNT-09',
    serviceId: 'srv-10',
    serviceTitle: 'Document Verification',
    serviceCode: 'DOC-01',
    staffId: 'staff-9',
    staffName: 'Debanjan Roy',
    staffEmail: 'debanjan.roy@qless.com',
    status: 'Inactive',
    assignedAt: 'Yesterday, 03:30 PM',
  },
  {
    id: 'cnt-10',
    name: 'Counter 10',
    code: 'CNT-10',
    serviceId: 'srv-6',
    serviceTitle: 'Physiotherapy & Rehab',
    serviceCode: 'PHY-01',
    staffId: 'staff-3',
    staffName: 'Souvik Roy',
    staffEmail: 'souvik.roy@qless.com',
    status: 'Active',
    assignedAt: 'Today, 10:00 AM',
  },
  {
    id: 'cnt-11',
    name: 'Counter 11',
    code: 'CNT-11',
    serviceId: 'srv-1',
    serviceTitle: 'General Consultation',
    serviceCode: 'GEN-01',
    staffId: 'staff-2',
    staffName: 'Ananya Sen',
    staffEmail: 'ananya.sen@qless.com',
    status: 'Active',
    assignedAt: 'Today, 10:15 AM',
  },
  {
    id: 'cnt-12',
    name: 'Counter 12',
    code: 'CNT-12',
    serviceId: 'srv-2',
    serviceTitle: 'Blood Test & Diagnostics',
    serviceCode: 'DIAG-01',
    staffId: 'staff-4',
    staffName: 'Priya Shah',
    staffEmail: 'priya.shah@qless.com',
    status: 'Inactive',
    assignedAt: 'Yesterday, 02:00 PM',
  },
  {
    id: 'cnt-13',
    name: 'Counter 13',
    code: 'CNT-13',
    serviceId: 'srv-4',
    serviceTitle: 'Dental Checkup & Cleaning',
    serviceCode: 'DEN-01',
    staffId: 'staff-1',
    staffName: 'Rohan Das',
    staffEmail: 'rohan.das@qless.com',
    status: 'Active',
    assignedAt: 'Today, 10:45 AM',
  },
  {
    id: 'cnt-14',
    name: 'Counter 14',
    code: 'CNT-14',
    serviceId: 'srv-5',
    serviceTitle: 'Eye & Vision Checkup',
    serviceCode: 'EYE-01',
    staffId: 'staff-6',
    staffName: 'Neha Verma',
    staffEmail: 'neha.verma@qless.com',
    status: 'Active',
    assignedAt: 'Today, 11:00 AM',
  },
  {
    id: 'cnt-15',
    name: 'Counter 15',
    code: 'CNT-15',
    serviceId: 'srv-3',
    serviceTitle: 'Vaccination & Immunization',
    serviceCode: 'VAC-01',
    staffId: 'staff-7',
    staffName: 'Karan Tiwari',
    staffEmail: 'karan.tiwari@qless.com',
    status: 'Inactive',
    assignedAt: 'Today, 11:15 AM',
  },
];

export const AdminCounter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'add' (Add / Modify Counter) or 'assigned' (Assigned Counters)
  const initialTab = searchParams.get('tab') === 'assigned' ? 'assigned' : 'add';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Counters State
  const [counters, setCounters] = useState(INITIAL_COUNTERS);

  // Edit / Modify State
  const [editingId, setEditingId] = useState(null);

  // Form Fields State
  const [counterName, setCounterName] = useState('');
  const [counterCode, setCounterCode] = useState('');
  const [selectedService, setSelectedService] = useState(SERVICES_LIST[0]);
  const [selectedStaff, setSelectedStaff] = useState(STAFF_LIST[0]);
  const [counterStatus, setCounterStatus] = useState('Active'); // 'Active' or 'Inactive'

  // Dropdown Open States
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Search, Filter & Pagination State for Tab 2
  const ITEMS_PER_PAGE = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Delete Confirmation Modal State
  const [counterToDelete, setCounterToDelete] = useState(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  // Dropdown Refs
  const serviceDropdownRef = useRef(null);
  const staffDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const statusFilterRef = useRef(null);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'assigned' || tabParam === 'add') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Handle outside clicks to close popovers
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target)) {
        setIsServiceDropdownOpen(false);
      }
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(e.target)) {
        setIsStaffDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target)) {
        setIsStatusFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Show Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  // Clear Form Helper
  const handleClearForm = () => {
    setCounterName('');
    setCounterCode('');
    setSelectedService(SERVICES_LIST[0]);
    setSelectedStaff(STAFF_LIST[0]);
    setCounterStatus('Active');
    setEditingId(null);
  };

  // Pre-fill Form for Modify / Edit
  const handleModifyCounter = (counter) => {
    setEditingId(counter.id);
    setCounterName(counter.name);
    setCounterCode(counter.code);

    const srv = SERVICES_LIST.find((s) => s.id === counter.serviceId) || {
      id: counter.serviceId,
      title: counter.serviceTitle,
      code: counter.serviceCode,
      status: 'Active',
      icon: Layers,
    };
    setSelectedService(srv);

    const stf = STAFF_LIST.find((s) => s.id === counter.staffId) || {
      id: counter.staffId,
      name: counter.staffName,
      email: counter.staffEmail,
      status: 'Active',
      role: 'Staff',
    };
    setSelectedStaff(stf);

    setCounterStatus(counter.status);
    setActiveTab('add');
    setSearchParams({ tab: 'add' });
  };

  // Save / Update Counter
  const handleSaveCounter = (e) => {
    e.preventDefault();

    if (!counterName.trim()) {
      showToast('Please enter a valid counter name.');
      return;
    }

    if (!counterCode.trim()) {
      showToast('Please provide a counter code.');
      return;
    }

    if (editingId) {
      // Modify Existing Counter
      setCounters((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: counterName.trim(),
                code: counterCode.trim().toUpperCase(),
                serviceId: selectedService.id,
                serviceTitle: selectedService.title,
                serviceCode: selectedService.code,
                staffId: selectedStaff.id,
                staffName: selectedStaff.name,
                staffEmail: selectedStaff.email,
                status: counterStatus,
              }
            : c
        )
      );
      showToast(`Counter "${counterName.trim()}" updated successfully!`);
    } else {
      // Create New Counter
      const newCounter = {
        id: `cnt-${Date.now()}`,
        name: counterName.trim(),
        code: counterCode.trim().toUpperCase(),
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        serviceCode: selectedService.code,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        staffEmail: selectedStaff.email,
        status: counterStatus,
        assignedAt: 'Just now',
      };
      setCounters((prev) => [newCounter, ...prev]);
      showToast(`Counter "${counterName.trim()}" created and assigned successfully!`);
    }

    handleClearForm();
    setActiveTab('assigned');
    setSearchParams({ tab: 'assigned' });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!counterToDelete) return;
    setCounters((prev) => prev.filter((c) => c.id !== counterToDelete.id));
    showToast(`Counter "${counterToDelete.name}" deleted.`);
    setCounterToDelete(null);
  };

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filtered Counters for Tab 2
  const filteredCounters = useMemo(() => {
    return counters.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.serviceTitle.toLowerCase().includes(q) ||
        c.staffName.toLowerCase().includes(q) ||
        c.staffEmail.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        c.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [counters, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredCounters.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCounters = useMemo(() => {
    return filteredCounters.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCounters, startIndex]);

  return (
    <div className="admin-counter-page">
      {/* Toast Floating Notification */}
      {toastMessage && (
        <div className="admin-counter-toast-notification">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Unified Card Container */}
      <div className="admin-counter-main-card">
        {/* Navigation Tabs Header */}
        <div className="admin-counter-tabs-header">
          <button
            type="button"
            className={`admin-counter-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('add');
              setSearchParams({ tab: 'add' });
            }}
          >
            <Store size={18} className="tab-btn-icon" />
            <span>{editingId ? 'Modify Counter' : 'Add / Modify Counter'}</span>
          </button>

          <button
            type="button"
            className={`admin-counter-tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('assigned');
              setSearchParams({ tab: 'assigned' });
            }}
          >
            <ListFilter size={18} className="tab-btn-icon" />
            <span>Assigned Counters</span>
            {counters.length > 0 && (
              <span className="counter-tab-count-badge">{counters.length}</span>
            )}
          </button>
        </div>

        {/* Card Body */}
        <div className="admin-counter-card-body">
          {activeTab === 'add' ? (
            /* TAB 1: ADD / MODIFY COUNTER (Split Layout) */
            <div className="admin-counter-split-layout">
              {/* LEFT PANEL: 3D Illustration & Guidance */}
              <div className="admin-counter-left-panel">
                <div className="counter-left-illustration-wrapper">
                  <div className="counter-decor-circle-1" aria-hidden="true" />
                  <div className="counter-decor-circle-2" aria-hidden="true" />
                  <div className="counter-decor-circle-3" aria-hidden="true" />
                  <img
                    src={counterUiImg}
                    alt="Service Counter Station Booth"
                    className="counter-left-illustration-img"
                  />
                </div>

                <h3 className="counter-left-heading">
                  {editingId ? 'Modify Counter Desk' : 'Add Service Counter'}
                </h3>
                <p className="counter-left-subheading">
                  Configure physical service booths, link service queues, and assign active staff members.
                </p>

                {/* Guidance Feature List */}
                <div className="counter-guidance-list">
                  <div className="counter-guidance-item">
                    <div className="guidance-icon-bubble bubble-green">
                      <UserCheck size={18} />
                    </div>
                    <div className="guidance-text-block">
                      <h4 className="guidance-title">Assign Dedicated Staff</h4>
                      <p className="guidance-desc">Direct staff personnel to manage customer token calls.</p>
                    </div>
                  </div>

                  <div className="counter-guidance-item">
                    <div className="guidance-icon-bubble bubble-purple">
                      <Layers size={18} />
                    </div>
                    <div className="guidance-text-block">
                      <h4 className="guidance-title">Route Specific Services</h4>
                      <p className="guidance-desc">Connect counter to service queues.</p>
                    </div>
                  </div>

                  <div className="counter-guidance-item">
                    <div className="guidance-icon-bubble bubble-blue">
                      <Radio size={18} />
                    </div>
                    <div className="guidance-text-block">
                      <h4 className="guidance-title">Live Status Control</h4>
                      <p className="guidance-desc">Balance patient flow by set counter Active or Inactive.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: Counter Configuration Form */}
              <div className="admin-counter-right-form-panel">
                {/* Header Line */}
                <div className="admin-counter-form-header">
                  <div className="counter-header-badge-icon">
                    <Store size={22} />
                  </div>
                  <div>
                    <h3 className="counter-form-title">
                      {editingId ? 'Modify Counter Details' : 'Configure New Counter'}
                    </h3>
                    <p className="counter-form-subtitle">
                      {editingId
                        ? 'Update the counter assignment, service queue link, or operational status.'
                        : 'Fill in the information below to register a counter and assign active staff.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveCounter} className="counter-interactive-form">
                  {/* Two Column Row: Counter Name & Counter Code */}
                  <div className="counter-form-two-col-row">
                    {/* Field 1: Counter Name */}
                    <div className="counter-form-group">
                      <label className="counter-field-label">
                        Counter Name <span className="counter-required-star">*</span>
                      </label>
                      <div className="counter-input-icon-wrapper">
                        <Store size={16} className="counter-input-icon" />
                        <input
                          type="text"
                          required
                          value={counterName}
                          onChange={(e) => setCounterName(e.target.value)}
                          placeholder="e.g. Counter 1, Desk A"
                          className="counter-text-input"
                        />
                      </div>
                    </div>

                    {/* Field 2: Counter Code */}
                    <div className="counter-form-group">
                      <label className="counter-field-label">
                        Counter Code <span className="counter-required-star">*</span>
                      </label>
                      <div className="counter-input-icon-wrapper">
                        <Hash size={16} className="counter-input-icon" />
                        <input
                          type="text"
                          required
                          value={counterCode}
                          onChange={(e) => setCounterCode(e.target.value)}
                          placeholder="e.g. CNT-01, DESK-1"
                          className="counter-text-input code-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field 3: Select Service */}
                  <div className="counter-form-group" ref={serviceDropdownRef}>
                    <label className="counter-field-label">
                      Select Service <span className="counter-required-star">*</span>
                    </label>

                    <div
                      className="counter-custom-selector-box"
                      onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="counter-selector-left-content">
                        <div className="service-leading-icon-box">
                          <Layers size={16} />
                        </div>
                        <div className="selector-text-stack">
                          <span className="selector-text-title">{selectedService.title}</span>
                          <span className="selector-text-subcode">{selectedService.code}</span>
                        </div>
                        <span className="selector-service-tag">Active Service</span>
                      </div>
                      <ChevronDown
                        size={17}
                        className={`selector-chevron ${isServiceDropdownOpen ? 'rotated' : ''}`}
                      />
                    </div>

                    {/* Service Dropdown Menu */}
                    {isServiceDropdownOpen && (
                      <div className="counter-floating-dropdown-menu">
                        {SERVICES_LIST.map((srv) => {
                          const isSelected = selectedService.id === srv.id;
                          return (
                            <div
                              key={srv.id}
                              className={`counter-dropdown-option-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedService(srv);
                                setIsServiceDropdownOpen(false);
                              }}
                            >
                              <div className="option-leading-content">
                                <div className="option-icon-box">
                                  <Layers size={15} />
                                </div>
                                <div className="option-text-stack">
                                  <span className="option-title">{srv.title}</span>
                                  <span className="option-subtext">{srv.code}</span>
                                </div>
                              </div>
                              {isSelected && <Check size={16} className="option-check-icon" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Two Column Row: Select Staff & Status */}
                  <div className="counter-form-two-col-row">
                    {/* Field 4: Select Staff */}
                    <div
                      className={`counter-form-group ${isStaffDropdownOpen ? 'dropdown-active-z' : ''}`}
                      ref={staffDropdownRef}
                    >
                      <label className="counter-field-label">
                        Select Staff <span className="counter-required-star">*</span>
                      </label>

                      <div
                        className="counter-custom-selector-box"
                        onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="counter-selector-left-content">
                          <div className="staff-leading-avatar">
                            {selectedStaff.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div className="selector-text-stack">
                            <span className="selector-text-title">{selectedStaff.name}</span>
                            <span className="selector-text-subcode">{selectedStaff.email}</span>
                          </div>
                          <span
                            className={`selector-status-badge ${
                              selectedStaff.status === 'Active' ? 'badge-green' : 'badge-gray'
                            }`}
                          >
                            {selectedStaff.status}
                          </span>
                        </div>
                        <ChevronDown
                          size={17}
                          className={`selector-chevron ${isStaffDropdownOpen ? 'rotated' : ''}`}
                        />
                      </div>

                      {/* Staff Dropdown Menu */}
                      {isStaffDropdownOpen && (
                        <div className="counter-floating-dropdown-menu staff-menu">
                          {STAFF_LIST.map((stf) => {
                            const isSelected = selectedStaff.id === stf.id;
                            return (
                              <div
                                key={stf.id}
                                className={`counter-dropdown-option-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedStaff(stf);
                                  setIsStaffDropdownOpen(false);
                                }}
                              >
                                <div className="option-leading-content">
                                  <div className="staff-option-avatar">
                                    {stf.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join('')}
                                  </div>
                                  <div className="option-text-stack">
                                    <span className="option-title">{stf.name}</span>
                                    <span className="option-subtext">{stf.email}</span>
                                  </div>
                                </div>
                                <div className="option-trailing-content">
                                  <span
                                    className={`staff-pill-mini ${
                                      stf.status === 'Active' ? 'pill-active' : 'pill-inactive'
                                    }`}
                                  >
                                    {stf.status}
                                  </span>
                                  {isSelected && <Check size={16} className="option-check-icon" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Field 5: Status (Active / Inactive) */}
                    <div
                      className={`counter-form-group ${isStatusDropdownOpen ? 'dropdown-active-z' : ''}`}
                      ref={statusDropdownRef}
                    >
                      <label className="counter-field-label">
                        Status <span className="counter-required-star">*</span>
                      </label>

                      <div
                        className="counter-custom-selector-box"
                        onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="counter-selector-left-content">
                          <span
                            className={`counter-status-dot ${
                              counterStatus === 'Active' ? 'dot-active' : 'dot-inactive'
                            }`}
                          />
                          <span className="selector-text-title">{counterStatus}</span>
                        </div>
                        <ChevronDown
                          size={17}
                          className={`selector-chevron ${isStatusDropdownOpen ? 'rotated' : ''}`}
                        />
                      </div>

                      {/* Status Dropdown Options */}
                      {isStatusDropdownOpen && (
                        <div className="counter-floating-dropdown-menu">
                          {[
                            {
                              val: 'Active',
                              dotClass: 'dot-active',
                            },
                            {
                              val: 'Inactive',
                              dotClass: 'dot-inactive',
                            },
                          ].map((st) => (
                            <div
                              key={st.val}
                              className={`counter-dropdown-option-item ${
                                counterStatus === st.val ? 'selected' : ''
                              }`}
                              onClick={() => {
                                setCounterStatus(st.val);
                                setIsStatusDropdownOpen(false);
                              }}
                            >
                              <div className="option-leading-content">
                                <span className={`counter-status-dot ${st.dotClass}`} />
                                <span className="option-title">{st.val}</span>
                              </div>
                              {counterStatus === st.val && (
                                <Check size={16} className="option-check-icon" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Footer Action Buttons (3 Buttons as requested) */}
                  <div className="counter-form-footer-action-bar">
                    {/* Button 1: Clear Form */}
                    <div className="footer-left-buttons">
                      <button
                        type="button"
                        className="counter-btn-clear"
                        onClick={handleClearForm}
                      >
                        <RotateCcw size={14} />
                        <span>Clear Form</span>
                      </button>
                    </div>

                    <div className="footer-right-buttons">
                      {/* Button 2: Cancel */}
                      <button
                        type="button"
                        className="counter-btn-cancel"
                        onClick={() => {
                          handleClearForm();
                          setActiveTab('assigned');
                          setSearchParams({ tab: 'assigned' });
                        }}
                      >
                        Cancel
                      </button>

                      {/* Button 3: Add Counter / Update Counter */}
                      <button type="submit" className="counter-btn-submit">
                        <Store size={16} />
                        <span>{editingId ? 'Update Counter' : 'Add Counter'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* TAB 2: ASSIGNED COUNTERS DETAILS TABLE */
            <div className="admin-counter-assigned-content">
              {/* Controls Bar: Search + Status Filter + Add Quick Button */}
              <div className="counter-controls-bar">
                <div className="counter-search-input-wrapper">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by counter name, code, service, or staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="counter-search-field"
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

                <div className="counter-filters-group">
                  {/* Status Filter Dropdown */}
                  <div className="status-filter-dropdown-wrapper" ref={statusFilterRef}>
                    <button
                      type="button"
                      className={`status-filter-toggle-btn ${
                        statusFilter !== 'all' ? 'active' : ''
                      }`}
                      onClick={() => setIsStatusFilterOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isStatusFilterOpen}
                    >
                      <Filter size={14} className="filter-btn-icon" />
                      <span>
                        {statusFilter === 'all'
                          ? 'All Status'
                          : statusFilter === 'active'
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`filter-btn-chevron ${
                          isStatusFilterOpen ? 'rotated' : ''
                        }`}
                      />
                    </button>

                    {isStatusFilterOpen && (
                      <div className="status-filter-menu" role="listbox">
                        {[
                          { id: 'all', label: 'All Status' },
                          { id: 'active', label: 'Active', dotClass: 'dot-green' },
                          { id: 'inactive', label: 'Inactive', dotClass: 'dot-red' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`status-filter-option ${
                              statusFilter === item.id ? 'selected' : ''
                            }`}
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

                  {/* Add Counter Quick Button */}
                  <button
                    type="button"
                    className="add-counter-quick-btn"
                    onClick={() => {
                      handleClearForm();
                      setActiveTab('add');
                      setSearchParams({ tab: 'add' });
                    }}
                  >
                    <Plus size={16} strokeWidth={2.4} />
                    <span>Add Counter</span>
                  </button>
                </div>
              </div>

              {/* Table of Assigned Counters */}
              {filteredCounters.length > 0 ? (
                <div className="counter-table-responsive-wrapper">
                  <table className="counter-data-table">
                    <thead>
                      <tr>
                        <th className="th-col-num">#</th>
                        <th className="th-col-counter">Counter Name & Code</th>
                        <th className="th-col-service">Assigned Service</th>
                        <th className="th-col-staff">Assigned Staff</th>
                        <th className="th-col-status">Status</th>
                        <th className="th-col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCounters.map((item, idx) => {
                        return (
                          <tr key={item.id} className="counter-table-row">
                            {/* # Index */}
                            <td className="cell-col-num">
                              <span className="row-num-badge">{startIndex + idx + 1}</span>
                            </td>

                            {/* Counter Name & Code with all-purpose counter booth icon */}
                            <td className="cell-col-counter">
                              <div className="counter-identity-inner">
                                <div className="counter-allpurpose-icon-box">
                                  <Store size={18} className="counter-booth-icon" />
                                </div>
                                <div className="counter-identity-meta">
                                  <span className="counter-name-text">{item.name}</span>
                                  <span className="counter-code-badge">{item.code}</span>
                                </div>
                              </div>
                            </td>

                            {/* Assigned Service */}
                            <td className="cell-col-service">
                              <div className="counter-service-cell-inner">
                                <div className="service-mini-icon-box">
                                  <Layers size={14} />
                                </div>
                                <div className="service-meta-block">
                                  <span className="service-cell-title">{item.serviceTitle}</span>
                                  <span className="service-cell-code">{item.serviceCode}</span>
                                </div>
                              </div>
                            </td>

                            {/* Assigned Staff */}
                            <td className="cell-col-staff">
                              <div className="counter-staff-cell-inner">
                                <div className={`staff-table-avatar avatar-tone-${idx % 5}`}>
                                  {item.staffName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join('')}
                                </div>
                                <div className="staff-meta-block">
                                  <span className="staff-cell-name">{item.staffName}</span>
                                  <span className="staff-cell-email">{item.staffEmail}</span>
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="cell-col-status">
                              <span
                                className={`counter-status-pill ${
                                  item.status === 'Active' ? 'status-active' : 'status-inactive'
                                }`}
                              >
                                <span
                                  className={`status-circle-dot ${
                                    item.status === 'Active' ? 'dot-green' : 'dot-red'
                                  }`}
                                />
                                <span>{item.status}</span>
                              </span>
                            </td>

                            {/* Actions: Modify & Delete */}
                            <td className="cell-col-actions">
                              <div className="row-action-buttons">
                                <button
                                  type="button"
                                  className="action-icon-btn modify"
                                  onClick={() => handleModifyCounter(item)}
                                  title="Modify Counter"
                                  aria-label={`Modify ${item.name}`}
                                >
                                  <Edit3 size={16} strokeWidth={1.8} />
                                </button>

                                <button
                                  type="button"
                                  className="action-icon-btn delete"
                                  onClick={() => setCounterToDelete(item)}
                                  title="Delete Counter"
                                  aria-label={`Delete ${item.name}`}
                                >
                                  <Trash2 size={16} strokeWidth={1.8} />
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
                /* Empty State Card */
                <div className="counter-empty-state-card">
                  <Store size={44} className="empty-state-icon" />
                  <h4 className="empty-state-title">No Counters Found</h4>
                  <p className="empty-state-desc">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No counters match your search or status filter criteria.'
                      : 'Get started by configuring your first service counter desk.'}
                  </p>
                  <button
                    type="button"
                    className="empty-state-action-btn"
                    onClick={() => {
                      handleClearForm();
                      setActiveTab('add');
                      setSearchParams({ tab: 'add' });
                    }}
                  >
                    <Plus size={16} />
                    <span>Create New Counter</span>
                  </button>
                </div>
              )}

              {/* Table Footer Count & Pagination */}
              {filteredCounters.length > 0 && (
                <div className="counter-table-footer">
                  <span className="footer-count-text">
                    Showing {startIndex + 1} to{' '}
                    {Math.min(startIndex + ITEMS_PER_PAGE, filteredCounters.length)} of{' '}
                    {filteredCounters.length} assigned counters
                  </span>

                  <div className="table-footer-pagination">
                    <button
                      type="button"
                      className="pagination-step-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`pagination-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="pagination-step-btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
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
      {counterToDelete && (
        <div className="counter-modal-backdrop" onClick={() => setCounterToDelete(null)}>
          <div className="counter-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-icon-box danger">
              <AlertTriangle size={24} />
            </div>
            <h3 className="modal-card-title">Delete Counter?</h3>
            <p className="modal-card-message">
              Are you sure you want to remove <strong>{counterToDelete.name}</strong> ({counterToDelete.code})?
              Any active token lines linked to this booth will be unassigned.
            </p>
            <div className="modal-actions-bar">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setCounterToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn-confirm-delete"
                onClick={handleConfirmDelete}
              >
                Yes, Delete Counter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCounter;
