import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MoreVertical,
  Edit3,
  Trash2,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2
} from 'lucide-react';
import userApi from '../../services/api/user.api';
import './AdminManageUsers.css';

const ITEMS_PER_PAGE = 8;

export const AdminManageUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation Tabs: 'staff' | 'customers' - persisted in URL search param and localStorage
  const [activeTab, setActiveTabState] = useState(() => {
    const urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab === 'customers' || urlTab === 'staff') {
      return urlTab;
    }
    const savedTab = localStorage.getItem('admin_users_active_tab');
    if (savedTab === 'customers' || savedTab === 'staff') {
      return savedTab;
    }
    return 'staff';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setCurrentPage(1);
    setActiveActionMenuId(null);
    localStorage.setItem('admin_users_active_tab', tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    localStorage.setItem('admin_users_active_tab', activeTab);
    const urlTab = searchParams.get('tab');
    if (urlTab !== activeTab) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', activeTab);
          return next;
        },
        { replace: true }
      );
    }
  }, [activeTab]);

  // Main State for Members
  const [staffList, setStaffList] = useState([]);
  const [customerList, setCustomerList] = useState([]);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const [staffRes, customerRes] = await Promise.allSettled([
        userApi.getStaffUsers(),
        userApi.getCustomerUsers(),
      ]);

      if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value?.data)) {
        setStaffList(
          staffRes.value.data.map((u) => ({
            id: u._id || u.id,
            _id: u._id || u.id,
            name: u.name || 'Unnamed',
            email: u.email || '',
            phoneNumber: u.phone || u.phoneNumber || 'Not provided',
            role: u.role || 'STAFF',
            status: u.isActive !== false ? 'Active' : 'Inactive',
            joinedOn: u.createdAt
              ? new Intl.DateTimeFormat('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(u.createdAt))
              : 'N/A',
          }))
        );
      }

      if (customerRes.status === 'fulfilled' && Array.isArray(customerRes.value?.data)) {
        setCustomerList(
          customerRes.value.data.map((u) => ({
            id: u._id || u.id,
            _id: u._id || u.id,
            name: u.name || 'Unnamed',
            email: u.email || '',
            phoneNumber: u.phone || u.phoneNumber || 'Not provided',
            role: u.role || 'CUSTOMER',
            status: u.isActive !== false ? 'Active' : 'Inactive',
            joinedOn: u.createdAt
              ? new Intl.DateTimeFormat('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(u.createdAt))
              : 'N/A',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load user directory:', err);
      showToast('Failed to load user directory');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  // Table Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Floating Action Popover
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingUser, setCurrentEditingUser] = useState(null);

  // Confirmation Modal State (for Activate/Deactivate & Delete)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // 'toggle_status' | 'delete'
    user: null,
    title: '',
    message: '',
    confirmText: '',
    variant: 'danger', // 'danger' | 'warning' | 'success'
  });

  // Form fields for Add / Edit
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState('Active');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2800);
  };

  // Close dropdowns and dialogs when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target)
      ) {
        setIsFilterDropdownOpen(false);
      }
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target) &&
        !e.target.closest('.user-action-more-btn')
      ) {
        setActiveActionMenuId(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveActionMenuId(null);
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Compute Active/Inactive counts dynamically across both datasets
  const metrics = useMemo(() => {
    const totalStaff = staffList.length;
    const totalUsers = customerList.length;

    const activeStaff = staffList.filter((s) => s.status === 'Active').length;
    const activeCustomers = customerList.filter((c) => c.status === 'Active').length;
    const totalActive = activeStaff + activeCustomers;

    const inactiveStaff = staffList.filter((s) => s.status === 'Inactive').length;
    const inactiveCustomers = customerList.filter((c) => c.status === 'Inactive').length;
    const totalInactive = inactiveStaff + inactiveCustomers;

    return {
      totalStaff,
      totalUsers,
      totalActive,
      totalInactive,
    };
  }, [staffList, customerList]);

  // Active list based on selected Tab
  const activeList = activeTab === 'staff' ? staffList : customerList;

  // Filtered list based on Search & Status Filter
  const filteredList = useMemo(() => {
    return activeList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.phoneNumber.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [activeList, searchQuery, statusFilter]);

  // Pagination calculation
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedItems = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Prompt confirmation for Status Toggle
  const handleRequestToggle = (user) => {
    const isActivating = user.status === 'Inactive';
    const roleName = activeTab === 'staff' ? 'staff member' : 'customer';

    setConfirmDialog({
      isOpen: true,
      type: 'toggle_status',
      user,
      title: isActivating
        ? `Activate ${activeTab === 'staff' ? 'Staff Member' : 'Customer'}`
        : `Deactivate ${activeTab === 'staff' ? 'Staff Member' : 'Customer'}`,
      message: isActivating
        ? `Are you sure you want to activate ${user.name}? This ${roleName} will be granted full active access.`
        : `Are you sure you want to deactivate ${user.name}? This ${roleName} will be marked inactive and prevented from signing in.`,
      confirmText: isActivating ? 'Activate Account' : 'Deactivate Account',
      variant: isActivating ? 'success' : 'warning',
    });
  };

  // Prompt confirmation for Delete
  const handleRequestDelete = (user) => {
    setActiveActionMenuId(null);
    const roleName = activeTab === 'staff' ? 'staff member' : 'customer';

    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      user,
      title: `Delete ${activeTab === 'staff' ? 'Staff Member' : 'Customer'}`,
      message: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone and will remove this ${roleName} from the database.`,
      confirmText: 'Delete Permanently',
      variant: 'danger',
    });
  };

  // Cancel Confirmation
  const handleCancelConfirm = () => {
    setConfirmDialog({
      isOpen: false,
      type: null,
      user: null,
      title: '',
      message: '',
      confirmText: '',
      variant: 'danger',
    });
  };

  // Confirm Action Execution
  const handleConfirmAction = async () => {
    if (!confirmDialog.user) return;
    const { type, user } = confirmDialog;

    if (type === 'toggle_status') {
      const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      const isActivating = nextStatus === 'Active';
      try {
        await userApi.toggleUserStatus(user.id || user._id, isActivating);
        showToast(
          `${user.name} has been ${isActivating ? 'activated' : 'deactivated'} successfully`
        );
        await fetchUsers();
      } catch (err) {
        console.error('Toggle status error:', err);
        showToast(err.message || 'Failed to update user status');
      }
    } else if (type === 'delete') {
      try {
        await userApi.deleteUser(user.id || user._id);
        showToast(`${user.name} has been removed successfully`);
        await fetchUsers();
      } catch (err) {
        console.error('Delete user error:', err);
        showToast(err.message || 'Failed to delete user');
      }
    }

    handleCancelConfirm();
  };

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setCurrentEditingUser(user);
    setFormName(user.name);
    setFormPhone(user.phoneNumber === 'Not provided' ? '' : user.phoneNumber);
    setFormEmail(user.email);
    setFormStatus(user.status);
    setActiveActionMenuId(null);
    setIsEditModalOpen(true);
  };

  // Save Edit Changes
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Name is required');
      return;
    }

    try {
      await userApi.updateUser(currentEditingUser.id || currentEditingUser._id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        isActive: formStatus === 'Active',
      });

      setIsEditModalOpen(false);
      setCurrentEditingUser(null);
      showToast('User details updated successfully');
      await fetchUsers();
    } catch (err) {
      console.error('Edit user error:', err);
      showToast(err.message || 'Failed to update user details');
    }
  };

  return (
    <div className="admin-manage-users-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-users-toast-notification">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Top Metric Cards (4 Cards Row) */}
      <div className="admin-user-metric-cards-grid">
        {/* Card 1: Total Staff */}
        <div className="admin-user-metric-card card-blue-soft">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-blue">
              <Users size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-blue">Staff</span>
          </div>
          <div className="metric-info-block">
            <span className="metric-info-label">Total Staff</span>
            <span className="metric-info-value">{metrics.totalStaff}</span>
            <span className="metric-info-subtext">Active staff directory</span>
          </div>
        </div>

        {/* Card 2: Total Users */}
        <div className="admin-user-metric-card card-purple-soft">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-purple">
              <Users size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-purple">Customers</span>
          </div>
          <div className="metric-info-block">
            <span className="metric-info-label">Total Users</span>
            <span className="metric-info-value">{metrics.totalUsers}</span>
            <span className="metric-info-subtext">Registered customer accounts</span>
          </div>
        </div>

        {/* Card 3: Total Active */}
        <div className="admin-user-metric-card card-green-soft">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-green">
              <UserCheck size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-green">Active</span>
          </div>
          <div className="metric-info-block">
            <span className="metric-info-label">Total Active</span>
            <span className="metric-info-value">{metrics.totalActive}</span>
            <span className="metric-info-subtext">Full platform access enabled</span>
          </div>
        </div>

        {/* Card 4: Total Inactive */}
        <div className="admin-user-metric-card card-red-soft">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-red">
              <UserX size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-red">Inactive</span>
          </div>
          <div className="metric-info-block">
            <span className="metric-info-label">Total Inactive</span>
            <span className="metric-info-value">{metrics.totalInactive}</span>
            <span className="metric-info-subtext">Deactivated or restricted</span>
          </div>
        </div>
      </div>

      {/* 3. Main Card Container (Containing identical tabs and table section) */}
      <div className="admin-users-main-card">
        {/* Navigation Tabs Header - Identical to Availability Page */}
        <div className="admin-users-tabs-header">
          <button
            type="button"
            className={`admin-users-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            <Users size={18} className="tab-btn-icon" />
            <span>Registered Staff</span>
            <span className="users-tab-counter-badge">{staffList.length}</span>
          </button>

          <button
            type="button"
            className={`admin-users-tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <UserCheck size={18} className="tab-btn-icon" />
            <span>Registered Customers</span>
            <span className="users-tab-counter-badge">{customerList.length}</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="admin-users-card-body">
          {/* Controls Bar: Search, Status Filter & Add Button */}
          <div className="admin-users-controls-bar">
            {/* Search Input Box */}
            <div className="admin-users-search-box">
              <Search size={16} className="search-field-icon" />
              <input
                type="text"
                placeholder={
                  activeTab === 'staff'
                    ? 'Search staff by name, phone or email...'
                    : 'Search customers by name, phone or email...'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-users-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-cross-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter & Action Buttons */}
            <div className="admin-users-actions-group">
              {/* Status Filter Dropdown */}
              <div className="users-status-filter-wrapper" ref={filterDropdownRef}>
                <button
                  type="button"
                  className={`users-status-filter-btn ${statusFilter !== 'all' ? 'active' : ''}`}
                  onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isFilterDropdownOpen}
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
                    className={`filter-btn-chevron ${isFilterDropdownOpen ? 'rotated' : ''}`}
                  />
                </button>

                {isFilterDropdownOpen && (
                  <div className="users-status-filter-menu" role="listbox">
                    {[
                      { id: 'all', label: 'All Status' },
                      { id: 'active', label: 'Active', dotClass: 'dot-green' },
                      { id: 'inactive', label: 'Inactive', dotClass: 'dot-red' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`users-status-filter-option ${statusFilter === item.id ? 'selected' : ''}`}
                        onClick={() => {
                          setStatusFilter(item.id);
                          setCurrentPage(1);
                          setIsFilterDropdownOpen(false);
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
            </div>
          </div>

          {/* Table Container */}
          <div className="admin-users-table-responsive">
            <table className="admin-users-data-table">
              <thead>
                <tr>
                  <th className="th-col-num">#</th>
                  <th className="th-col-name">Name</th>
                  <th className="th-col-phone">Phone Number</th>
                  <th className="th-col-email">Email Address</th>
                  <th className="th-col-date">Joined On</th>
                  <th className="th-col-status">Status</th>
                  <th className="th-col-toggle">Activeness</th>
                  <th className="th-col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((user, idx) => {
                    const rowNumber = startIndex + idx + 1;
                    const isActionOpen = activeActionMenuId === user.id;

                    return (
                      <tr key={user.id} className="admin-users-table-row">
                        <td className="cell-col-num">
                          <span className="row-num-badge">{rowNumber}</span>
                        </td>
                        <td className="cell-col-name">
                          <div className="user-name-cell-wrapper">
                            <div className={`user-avatar-circle avatar-tone-${idx % 5}`}>
                              {(user.name || 'U')
                                .split(' ')
                                .filter(Boolean)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div className="user-name-meta">
                              <span className="user-name-text">{user.name}</span>
                              <span className="user-role-badge-sub">
                                {activeTab === 'staff' ? 'Staff' : 'Customer'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="cell-col-phone">
                          <div className="contact-item-inner">
                            <span className="contact-icon-pill">
                              <Phone size={13} className="contact-blue-icon" />
                            </span>
                            <span className="contact-val-text">{user.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="cell-col-email">
                          <div className="contact-item-inner">
                            <span className="contact-icon-pill">
                              <Mail size={13} className="contact-blue-icon" />
                            </span>
                            <span className="contact-val-text">{user.email}</span>
                          </div>
                        </td>
                        <td className="cell-col-date">
                          <span className="joined-date-text">{user.joinedOn}</span>
                        </td>
                        <td className="cell-col-status">
                          <span
                            className={`user-status-pill ${
                              user.status === 'Active' ? 'status-active' : 'status-inactive'
                            }`}
                          >
                            <span
                              className={`status-circle-dot ${
                                user.status === 'Active' ? 'dot-green' : 'dot-red'
                              }`}
                            />
                            <span>{user.status}</span>
                          </span>
                        </td>
                        <td className="cell-col-toggle">
                          <button
                            type="button"
                            className={`ios-toggle-switch ${
                              user.status === 'Active' ? 'checked' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestToggle(user);
                            }}
                            role="switch"
                            aria-checked={user.status === 'Active'}
                            aria-label={`Toggle active status for ${user.name}`}
                            title={
                              user.status === 'Active'
                                ? 'Click to deactivate'
                                : 'Click to activate'
                            }
                          >
                            <span className="ios-toggle-thumb" />
                          </button>
                        </td>
                        <td className="cell-col-action">
                          <div className="user-action-cell-container">
                            <button
                              type="button"
                              className={`user-action-more-btn ${isActionOpen ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId((prev) =>
                                  prev === user.id ? null : user.id
                                );
                              }}
                              aria-label="User actions"
                              aria-expanded={isActionOpen}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Floating Action Popover - only Edit and Delete */}
                            {isActionOpen && (
                              <div
                                className="user-action-popover-menu"
                                ref={actionMenuRef}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Row 1: Edit Action */}
                                <button
                                  type="button"
                                  className="popover-action-item item-edit"
                                  onClick={() => handleOpenEdit(user)}
                                >
                                  <Edit3 size={14} className="popover-item-icon" />
                                  <span>Edit</span>
                                </button>

                                {/* Row 2: Delete Action */}
                                <button
                                  type="button"
                                  className="popover-action-item item-delete"
                                  onClick={() => handleRequestDelete(user)}
                                >
                                  <Trash2 size={14} className="popover-item-icon" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="no-users-empty-cell">
                      <div className="empty-state-wrapper">
                        <Users size={32} className="empty-state-icon" />
                        <p className="empty-state-title">No matching records found</p>
                        <p className="empty-state-subtitle">
                          Try adjusting your search query or status filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination & Count Footer */}
          <div className="admin-users-table-footer">
            <div className="table-footer-count-text">
              Showing {totalItems > 0 ? startIndex + 1 : 0} to{' '}
              {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems}{' '}
              {activeTab === 'staff' ? 'staff members' : 'registered customers'}
            </div>

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
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="admin-user-modal-overlay">
          <div className="admin-user-modal-box">
            <div className="modal-header-row">
              <h3 className="modal-title">
                Edit {activeTab === 'staff' ? 'Staff Member' : 'Customer'}
              </h3>
              <button
                type="button"
                className="modal-close-x-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-form-content">
              <div className="modal-input-group">
                <label className="modal-label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="modal-text-input"
                  placeholder="e.g. Rohan Das"
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="modal-text-input"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="modal-text-input"
                  placeholder="name@qless.com"
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Account Status</label>
                <div className="modal-status-toggle-row">
                  <button
                    type="button"
                    className={`status-choice-btn ${formStatus === 'Active' ? 'selected green' : ''}`}
                    onClick={() => setFormStatus('Active')}
                  >
                    <span className="status-dot-mini dot-green" />
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    className={`status-choice-btn ${formStatus === 'Inactive' ? 'selected red' : ''}`}
                    onClick={() => setFormStatus('Inactive')}
                  >
                    <span className="status-dot-mini dot-red" />
                    <span>Inactive</span>
                  </button>
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Activate / Deactivate & Delete */}
      {confirmDialog.isOpen && confirmDialog.user && (
        <div className="admin-confirm-modal-overlay" onClick={handleCancelConfirm}>
          <div
            className="admin-confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="confirm-modal-top-bar">
              <div className={`confirm-icon-circle ${confirmDialog.variant}`}>
                {confirmDialog.variant === 'danger' && <Trash2 size={20} />}
                {confirmDialog.variant === 'warning' && <AlertTriangle size={20} />}
                {confirmDialog.variant === 'success' && <UserCheck size={20} />}
              </div>
              <button
                type="button"
                className="modal-close-x-btn"
                onClick={handleCancelConfirm}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="confirm-modal-body">
              <h3 id="confirm-modal-title" className="confirm-modal-title">
                {confirmDialog.title}
              </h3>
              <p className="confirm-modal-message">{confirmDialog.message}</p>

              {/* User preview badge */}
              <div className="confirm-user-info-card">
                <div className="confirm-user-avatar">
                  {confirmDialog.user.name.charAt(0)}
                </div>
                <div className="confirm-user-details">
                  <span className="confirm-user-name">{confirmDialog.user.name}</span>
                  <span className="confirm-user-meta">
                    {confirmDialog.user.email} • {confirmDialog.user.phoneNumber}
                  </span>
                </div>
                <span
                  className={`user-status-pill ${
                    confirmDialog.user.status === 'Active' ? 'status-active' : 'status-inactive'
                  }`}
                >
                  <span
                    className={`status-circle-dot ${
                      confirmDialog.user.status === 'Active' ? 'dot-green' : 'dot-red'
                    }`}
                  />
                  <span>{confirmDialog.user.status}</span>
                </span>
              </div>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-btn-cancel"
                onClick={handleCancelConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`confirm-btn-action ${confirmDialog.variant}`}
                onClick={handleConfirmAction}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminManageUsers;
