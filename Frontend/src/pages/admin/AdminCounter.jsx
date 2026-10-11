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

import counterApi from '../../services/api/counter.api';
import serviceApi from '../../services/api/service.api';

// Fallback / default service placeholder
const DEFAULT_SERVICE_PLACEHOLDER = {
  id: '',
  _id: '',
  title: 'Select Service',
  name: 'Select Service',
  code: 'Choose a service queue',
  status: 'Inactive',
  isPlaceholder: true,
};

// Fallback / default staff options
const UNASSIGNED_STAFF = {
  id: '',
  _id: '',
  name: 'Unassigned (No Staff)',
  email: 'Assign a staff member later',
  status: 'Inactive',
  role: 'Staff'
};

export const AdminCounter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'add' (Add / Modify Counter) or 'assigned' (Assigned Counters)
  const initialTab = searchParams.get('tab') === 'assigned' ? 'assigned' : 'add';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Counters State
  const [counters, setCounters] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [isLoadingCounters, setIsLoadingCounters] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  // Form Fields State
  const [editingId, setEditingId] = useState(null);
  const [counterName, setCounterName] = useState('');
  const [counterCode, setCounterCode] = useState('');
  const [selectedService, setSelectedService] = useState(DEFAULT_SERVICE_PLACEHOLDER);
  const [selectedStaff, setSelectedStaff] = useState(UNASSIGNED_STAFF);
  const [counterStatus, setCounterStatus] = useState('Active'); // 'Active' or 'Inactive'

  const loadServices = async () => {
    try {
      setIsLoadingServices(true);
      const res = await serviceApi.getAllServices();
      const list = Array.isArray(res?.data) ? res.data : [];
      const normalized = list.map(s => ({
        id: s._id || s.id,
        _id: s._id || s.id,
        title: s.name,
        name: s.name,
        code: s.code,
        status: s.isActive !== false ? 'Active' : 'Inactive',
        icon: Layers
      }));
      setServicesList(normalized);
    } catch (e) {
      console.error('Failed to load services in counters:', e);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadStaff = async () => {
    try {
      setIsLoadingStaff(true);
      const res = await counterApi.getStaffList();
      const list = Array.isArray(res?.data) ? res.data : [];
      const normalized = list.map(s => ({
        id: s._id || s.id,
        _id: s._id || s.id,
        name: s.name,
        email: s.email,
        status: s.isActive !== false ? 'Active' : 'Inactive',
        role: s.role || 'Staff'
      }));
      setStaffList(normalized);
    } catch (e) {
      console.error('Failed to load staff in counters:', e);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const loadCounters = async () => {
    try {
      setIsLoadingCounters(true);
      const res = await counterApi.getAllCounters();
      const list = Array.isArray(res?.data) ? res.data : [];
      const normalized = list.map(c => ({
        id: c._id || c.id,
        _id: c._id || c.id,
        name: c.name,
        code: c.code,
        serviceId: c.serviceId?._id || c.serviceId || '',
        serviceTitle: c.serviceId?.name || 'General Service',
        serviceCode: c.serviceId?.code || 'GEN-01',
        staffId: c.assignedStaffId?._id || c.assignedStaffId || '',
        staffName: c.assignedStaffId?.name || 'Unassigned Staff',
        staffEmail: c.assignedStaffId?.email || 'staff@qless.com',
        status: c.isActive !== false ? 'Active' : 'Inactive',
        assignedAt: 'Active',
      }));
      setCounters(normalized);
    } catch (e) {
      console.error('Failed to load counters:', e);
    } finally {
      setIsLoadingCounters(false);
    }
  };

  useEffect(() => {
    loadServices();
    loadStaff();
    loadCounters();
  }, []);

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
    setSelectedService(DEFAULT_SERVICE_PLACEHOLDER);
    setSelectedStaff(UNASSIGNED_STAFF);
    setCounterStatus('Active');
    setEditingId(null);
  };

  // Pre-fill Form for Modify / Edit
  const handleModifyCounter = (counter) => {
    setEditingId(counter.id);
    setCounterName(counter.name);
    setCounterCode(counter.code);

    const srv = servicesList.find((s) => (s._id || s.id) === (counter.serviceId?._id || counter.serviceId)) || {
      id: counter.serviceId?._id || counter.serviceId,
      _id: counter.serviceId?._id || counter.serviceId,
      title: counter.serviceTitle || 'General Service',
      name: counter.serviceTitle || 'General Service',
      code: counter.serviceCode || 'GEN-01',
      status: 'Active',
      icon: Layers,
    };
    setSelectedService(srv);

    if (counter.staffId) {
      const stf = staffList.find((s) => (s._id || s.id) === counter.staffId) || {
        id: counter.staffId,
        _id: counter.staffId,
        name: counter.staffName,
        email: counter.staffEmail,
        status: 'Active',
        role: 'Staff',
      };
      setSelectedStaff(stf);
    } else {
      setSelectedStaff(UNASSIGNED_STAFF);
    }

    setCounterStatus(counter.status);
    setActiveTab('add');
    setSearchParams({ tab: 'add' });
  };

  // Save / Update Counter
  const handleSaveCounter = async (e) => {
    e.preventDefault();

    if (!counterName.trim()) {
      showToast('Please enter a valid counter name.');
      return;
    }

    if (!counterCode.trim()) {
      showToast('Please provide a counter code.');
      return;
    }

    const srvId = selectedService?._id || selectedService?.id;
    if (!srvId || srvId === 'none' || selectedService?.isPlaceholder) {
      showToast('Please select a valid service first.');
      return;
    }

    const assignedStaffId = (selectedStaff?.id || selectedStaff?._id) ? (selectedStaff._id || selectedStaff.id) : null;

    try {
      if (editingId) {
        await counterApi.updateCounter(editingId, {
          name: counterName.trim(),
          code: counterCode.trim().toUpperCase(),
          serviceId: srvId,
          assignedStaffId: assignedStaffId,
          isActive: counterStatus === 'Active',
        });
        showToast('Counter "' + counterName.trim() + '" updated successfully!');
      } else {
        await counterApi.createCounter({
          name: counterName.trim(),
          code: counterCode.trim().toUpperCase(),
          serviceId: srvId,
          assignedStaffId: assignedStaffId,
        });
        showToast('Counter "' + counterName.trim() + '" created successfully!');
      }
      await loadCounters();
      handleClearForm();
      setActiveTab('assigned');
      setSearchParams({ tab: 'assigned' });
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save counter.');
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!counterToDelete) return;
    try {
      await counterApi.deleteCounter(counterToDelete.id || counterToDelete._id);
      showToast('Counter "' + counterToDelete.name + '" deleted successfully.');
      setCounterToDelete(null);
      await loadCounters();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to delete counter.');
    }
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

                  {/* Field 3: Select Service (Upper position - opens downward) */}
                  <div
                    className={`counter-form-group open-downward ${isServiceDropdownOpen ? 'dropdown-active-z' : ''}`}
                    ref={serviceDropdownRef}
                  >
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
                        <div className={`service-leading-icon-box ${(!selectedService || selectedService.isPlaceholder) ? 'placeholder-icon' : ''}`}>
                          <Layers size={16} />
                        </div>
                        <div className="selector-text-stack">
                          <span className={`selector-text-title ${(!selectedService || selectedService.isPlaceholder) ? 'text-placeholder' : ''}`}>
                            {selectedService?.title || 'Select Service'}
                          </span>
                          <span className="selector-text-subcode">
                            {selectedService?.code || 'Choose a service queue'}
                          </span>
                        </div>
                        <span className={`selector-service-tag ${(!selectedService || selectedService.isPlaceholder) ? 'tag-required' : ''}`}>
                          {(!selectedService || selectedService.isPlaceholder) ? 'Required' : 'Active Service'}
                        </span>
                      </div>
                      <ChevronDown
                        size={17}
                        className={`selector-chevron ${isServiceDropdownOpen ? 'rotated' : ''}`}
                      />
                    </div>

                    {/* Service Dropdown Menu (Upper position - opens downward) */}
                    {isServiceDropdownOpen && (
                      <div className="counter-floating-dropdown-menu menu-downward">
                        {/* Option 1: Default 'Select Service' */}
                        <div
                          className={`counter-dropdown-option-item ${(!selectedService || !selectedService.id || selectedService.isPlaceholder) ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedService(DEFAULT_SERVICE_PLACEHOLDER);
                            setIsServiceDropdownOpen(false);
                          }}
                        >
                          <div className="option-leading-content">
                            <div className="option-icon-box placeholder-icon">
                              <Layers size={15} />
                            </div>
                            <div className="option-text-stack">
                              <span className="option-title">Select Service</span>
                              <span className="option-subtext">Choose a service queue</span>
                            </div>
                          </div>
                          {(!selectedService || !selectedService.id || selectedService.isPlaceholder) && (
                            <Check size={16} className="option-check-icon" />
                          )}
                        </div>

                        {/* Available Services */}
                        {servicesList.map((srv) => {
                          const isSelected = selectedService && !selectedService.isPlaceholder && (selectedService._id || selectedService.id) === (srv._id || srv.id);
                          return (
                            <div
                              key={srv.id || srv._id}
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

                  {/* Two Column Row: Select Staff & Status (Lower position - opens upward) */}
                  <div className={`counter-form-two-col-row ${isStaffDropdownOpen || isStatusDropdownOpen ? 'row-active-z' : ''}`}>
                    {/* Field 4: Select Staff (Lower position - opens upward) */}
                    <div
                      className={`counter-form-group open-upward ${isStaffDropdownOpen ? 'dropdown-active-z' : ''}`}
                      ref={staffDropdownRef}
                    >
                      <label className="counter-field-label">
                        Select Staff (Optional)
                      </label>

                      <div
                        className="counter-custom-selector-box"
                        onClick={() => setIsStaffDropdownOpen((prev) => !prev)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="counter-selector-left-content">
                          <div className={`staff-leading-avatar ${!selectedStaff || selectedStaff.id === '' ? 'unassigned-avatar' : ''}`}>
                            {selectedStaff && selectedStaff.name && selectedStaff.id !== ''
                              ? selectedStaff.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()
                              : 'UN'}
                          </div>
                          <div className="selector-text-stack">
                            <span className="selector-text-title">
                              {selectedStaff?.name || 'Unassigned (No Staff)'}
                            </span>
                            <span className="selector-text-subcode">
                              {selectedStaff?.email || 'Assign a staff member later'}
                            </span>
                          </div>
                          <span
                            className={`selector-status-badge ${
                              selectedStaff?.status === 'Active' ? 'badge-green' : 'badge-gray'
                            }`}
                          >
                            {selectedStaff?.id !== '' ? selectedStaff?.status : 'Unassigned'}
                          </span>
                        </div>
                        <ChevronDown
                          size={17}
                          className={`selector-chevron ${isStaffDropdownOpen ? 'rotated' : ''}`}
                        />
                      </div>

                      {/* Staff Dropdown Menu (Lower position - opens upward) */}
                      {isStaffDropdownOpen && (
                        <div className="counter-floating-dropdown-menu menu-upward staff-menu">
                          {/* Option 1: Unassigned / Clear staff */}
                          <div
                            className={`counter-dropdown-option-item ${
                              !selectedStaff || selectedStaff.id === '' ? 'selected' : ''
                            }`}
                            onClick={() => {
                              setSelectedStaff(UNASSIGNED_STAFF);
                              setIsStaffDropdownOpen(false);
                            }}
                          >
                            <div className="option-leading-content">
                              <div className="staff-option-avatar unassigned">
                                UN
                              </div>
                              <div className="option-text-stack">
                                <span className="option-title">Unassigned (No Staff)</span>
                                <span className="option-subtext">Leave booth unassigned for now</span>
                              </div>
                            </div>
                            <div className="option-trailing-content">
                              <span className="staff-pill-mini pill-inactive">
                                None
                              </span>
                              {(!selectedStaff || selectedStaff.id === '') && (
                                <Check size={16} className="option-check-icon" />
                              )}
                            </div>
                          </div>

                          {/* Real Staff from database */}
                          {staffList.map((stf) => {
                            const isSelected =
                              selectedStaff &&
                              (selectedStaff.id === stf.id || selectedStaff._id === stf._id);
                            return (
                              <div
                                key={stf.id || stf._id}
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
                                      .join('')
                                      .toUpperCase()}
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

                    {/* Field 5: Status (Active / Inactive) (Lower position - opens upward) */}
                    <div
                      className={`counter-form-group open-upward ${isStatusDropdownOpen ? 'dropdown-active-z' : ''}`}
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

                      {/* Status Dropdown Options (Lower position - opens upward) */}
                      {isStatusDropdownOpen && (
                        <div className="counter-floating-dropdown-menu menu-upward status-menu">
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
              {isLoadingCounters ? (
                <div className="counter-empty-state-card">
                  <div className="counter-spinner-ring" />
                  <h4 className="empty-state-title">Loading Counters...</h4>
                  <p className="empty-state-desc">Fetching active service counters from server.</p>
                </div>
              ) : filteredCounters.length > 0 ? (
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
                                  {item.staffName && item.staffName !== 'Unassigned Staff'
                                    ? item.staffName
                                        .trim()
                                        .split(/\s+/)
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase()
                                    : 'UN'}
                                </div>
                                <div className="staff-meta-block">
                                  <span className="staff-cell-name">{item.staffName || 'Unassigned Staff'}</span>
                                  <span className="staff-cell-email">{item.staffEmail || 'No staff assigned'}</span>
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
