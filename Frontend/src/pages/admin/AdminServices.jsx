import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Layers, 
  X, 
  Check,
  CheckCircle2, 
  AlertTriangle,
  ArrowUpDown,
  Activity,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Clock,
  Calendar,
  Hash,
  Sparkles,
  FileText,
  Trash2
} from 'lucide-react';
import AdminBanner from '../../components/admin/AdminBanner';
import ServiceCard from '../../components/common/ServiceCard';
import serviceBannerImg from '../../assets/images/banners/admin/service.png';
import './AdminServices.css';

// Pre-loaded Service Images matching mockup
import generalConsultImg from '../../assets/images/bookings/general_consultation.jpg';
import bloodTestImg from '../../assets/images/bookings/blood_test.jpg';
import vaccinationImg from '../../assets/images/bookings/vaccination.jpg';
import followUpImg from '../../assets/images/bookings/follow_up_consultation.jpg';
import dentalCheckupImg from '../../assets/images/bookings/dental_checkup.jpg';
import eyeCheckupImg from '../../assets/images/bookings/eye_checkup.jpg';
import physiotherapyImg from '../../assets/images/bookings/physiotherapy.jpg';
import dermatologyImg from '../../assets/images/bookings/dermatology.jpg';

// Initial 8 Services matching the UI mockup with code, status, capacity and timestamps
const initialServices = [
  {
    id: 'srv-1',
    title: 'General Consultation',
    name: 'General Consultation',
    code: 'GEN-01',
    description: 'Consult with our experienced doctors for general health issues.',
    duration: 15,
    schedule: 'Mon - Sat, 09:00 AM - 05:00 PM',
    service_time: 'Mon - Sat, 09:00 AM - 05:00 PM',
    scheduleType: 'green',
    image: generalConsultImg,
    status: 'active',
    isActive: true,
    capacity: 10,
    createdAt: '2026-10-09T10:00:00Z',
  },
  {
    id: 'srv-2',
    title: 'Diagnostics',
    name: 'Diagnostics',
    code: 'DIAG-01',
    description: 'Blood tests, urine tests and other diagnostic services.',
    duration: 30,
    schedule: 'Mon - Sat, 08:00 AM - 04:00 PM',
    service_time: 'Mon - Sat, 08:00 AM - 04:00 PM',
    scheduleType: 'green',
    image: bloodTestImg,
    status: 'active',
    isActive: true,
    capacity: 15,
    createdAt: '2026-10-08T09:30:00Z',
  },
  {
    id: 'srv-3',
    title: 'Vaccination',
    name: 'Vaccination',
    code: 'VACC-01',
    description: 'Routine and travel vaccinations for all age groups.',
    duration: 10,
    schedule: 'Mon - Sat, 09:00 AM - 04:00 PM',
    service_time: 'Mon - Sat, 09:00 AM - 04:00 PM',
    scheduleType: 'green',
    image: vaccinationImg,
    status: 'active',
    isActive: true,
    capacity: 20,
    createdAt: '2026-10-07T14:15:00Z',
  },
  {
    id: 'srv-4',
    title: 'Follow-up Consultation',
    name: 'Follow-up Consultation',
    code: 'FOL-01',
    description: 'Review and follow-up with existing patients.',
    duration: 10,
    schedule: 'Mon - Sat, 09:00 AM - 05:00 PM',
    service_time: 'Mon - Sat, 09:00 AM - 05:00 PM',
    scheduleType: 'green',
    image: followUpImg,
    status: 'active',
    isActive: true,
    capacity: 12,
    createdAt: '2026-10-06T11:00:00Z',
  },
  {
    id: 'srv-5',
    title: 'Dental Checkup',
    name: 'Dental Checkup',
    code: 'DENT-01',
    description: 'Complete dental examination and basic oral care.',
    duration: 20,
    schedule: 'Mon - Sat, 09:00 AM - 05:00 PM',
    service_time: 'Mon - Sat, 09:00 AM - 05:00 PM',
    scheduleType: 'green',
    image: dentalCheckupImg,
    status: 'active',
    isActive: true,
    capacity: 8,
    createdAt: '2026-10-05T08:45:00Z',
  },
  {
    id: 'srv-6',
    title: 'Eye Checkup',
    name: 'Eye Checkup',
    code: 'EYE-01',
    description: 'Vision testing and eye health consultation.',
    duration: 20,
    schedule: 'Mon - Sat, 10:00 AM - 05:00 PM',
    service_time: 'Mon - Sat, 10:00 AM - 05:00 PM',
    scheduleType: 'green',
    image: eyeCheckupImg,
    status: 'inactive',
    isActive: false,
    capacity: 8,
    createdAt: '2026-10-04T16:20:00Z',
  },
  {
    id: 'srv-7',
    title: 'Physiotherapy',
    name: 'Physiotherapy',
    code: 'PHYS-01',
    description: 'Physical therapy and rehabilitation sessions.',
    duration: 30,
    schedule: 'Mon - Sat, 09:00 AM - 05:00 PM',
    service_time: 'Mon - Sat, 09:00 AM - 05:00 PM',
    scheduleType: 'green',
    image: physiotherapyImg,
    status: 'active',
    isActive: true,
    capacity: 6,
    createdAt: '2026-10-03T13:30:00Z',
  },
  {
    id: 'srv-8',
    title: 'Dermatology Consultation',
    name: 'Dermatology Consultation',
    code: 'DERM-01',
    description: 'Consultation for skin, hair and nail related issues.',
    duration: 15,
    schedule: 'Mon - Sat, 10:00 AM - 04:00 PM',
    service_time: 'Mon - Sat, 10:00 AM - 04:00 PM',
    scheduleType: 'green',
    image: dermatologyImg,
    status: 'active',
    isActive: true,
    capacity: 10,
    createdAt: '2026-10-02T10:00:00Z',
  },
];

const availableImages = [
  { label: 'General Consultation', img: generalConsultImg },
  { label: 'Diagnostics', img: bloodTestImg },
  { label: 'Vaccination', img: vaccinationImg },
  { label: 'Follow-up', img: followUpImg },
  { label: 'Dental', img: dentalCheckupImg },
  { label: 'Eye Checkup', img: eyeCheckupImg },
  { label: 'Physiotherapy', img: physiotherapyImg },
  { label: 'Dermatology', img: dermatologyImg },
];

const timeOptions = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
];

// Helper to convert 12-hour time format (e.g. "09:00 AM") to minutes from midnight for exact comparison
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const daysOfWeek = [
  { value: 'Mon', label: 'Mon' },
  { value: 'Tue', label: 'Tue' },
  { value: 'Wed', label: 'Wed' },
  { value: 'Thu', label: 'Thu' },
  { value: 'Fri', label: 'Fri' },
  { value: 'Sat', label: 'Sat' },
  { value: 'Sun', label: 'Sun' },
];

export const AdminServices = () => {
  const [services, setServices] = useState(initialServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateSort, setDateSort] = useState('newer'); // 'newer' | 'older'
  const [activenessFilter, setActivenessFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [toastMessage, setToastMessage] = useState('');

  // Custom Dropdown Open States & Refs (Opens strictly under the filter)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isActivenessDropdownOpen, setIsActivenessDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);
  const activenessDropdownRef = useRef(null);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateDropdownOpen(false);
      }
      if (activenessDropdownRef.current && !activenessDropdownRef.current.contains(e.target)) {
        setIsActivenessDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    code: '',
    description: '',
    duration: 15,
    schedule: 'Mon - Sat, 09:00 AM - 05:00 PM',
    service_time: 'Mon - Sat, 09:00 AM - 05:00 PM',
    status: 'active',
    isActive: true,
    capacity: 10,
    image: '',
  });

  // Schedule sub-fields (Start/End Day + Start/End Time)
  const [startDay, setStartDay] = useState('Mon');
  const [endDay, setEndDay] = useState('Fri');
  const [formStartTime, setFormStartTime] = useState('09:00 AM');
  const [formEndTime, setFormEndTime] = useState('05:00 PM');

  // Filter End Time options so End Time is always >= Start Time
  const availableEndTimeOptions = useMemo(() => {
    const startMins = parseTimeToMinutes(formStartTime);
    return timeOptions.filter((t) => parseTimeToMinutes(t) >= startMins);
  }, [formStartTime]);

  // When Start Time changes, ensure End Time is >= Start Time
  const handleStartTimeChange = (newStartTime) => {
    setFormStartTime(newStartTime);
    const startMins = parseTimeToMinutes(newStartTime);
    const endMins = parseTimeToMinutes(formEndTime);
    if (endMins < startMins) {
      setFormEndTime(newStartTime);
    }
  };

  // Image Upload & Library states
  const fileInputRef = useRef(null);
  const [imageFileName, setImageFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Delete Dialog State
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // Prevent background scrolling when pop up is opened
  useEffect(() => {
    if (isModalOpen || serviceToDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, serviceToDelete]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filtered & Sorted Services based on search (name, code, desc), activeness, and date sort
  const filteredServices = useMemo(() => {
    let result = [...services];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    // 2. Activeness filter (all, active, inactive)
    if (activenessFilter === 'active') {
      result = result.filter((s) => s.status !== 'inactive' && s.isActive !== false);
    } else if (activenessFilter === 'inactive') {
      result = result.filter((s) => s.status === 'inactive' || s.isActive === false);
    }

    // 3. Sort by date filter (newer, older)
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return dateSort === 'older' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [services, searchQuery, activenessFilter, dateSort]);

  // Open modal for new service
  const handleOpenAddModal = () => {
    setEditingService(null);
    setStartDay('Mon');
    setEndDay('Fri');
    setFormStartTime('09:00 AM');
    setFormEndTime('05:00 PM');
    setImageFileName('');
    setFormData({
      title: '',
      name: '',
      code: '',
      description: '',
      duration: 15,
      schedule: 'Mon - Fri, 09:00 AM - 05:00 PM',
      service_time: 'Mon - Fri, 09:00 AM - 05:00 PM',
      status: 'active',
      isActive: true,
      capacity: 10,
      image: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (service) => {
    setEditingService(service);
    
    // Parse existing schedule (e.g. "Mon - Sat, 09:00 AM - 05:00 PM")
    let parsedStartDay = 'Mon';
    let parsedEndDay = 'Sat';
    let parsedStart = '09:00 AM';
    let parsedEnd = '05:00 PM';
    
    const sched = service.schedule || service.service_time || '';
    if (sched.includes(',')) {
      const [daysPart, timePart] = sched.split(',').map((s) => s.trim());
      if (daysPart) {
        if (daysPart.includes('-')) {
          const [sDay, eDay] = daysPart.split('-').map((s) => s.trim());
          if (sDay && daysOfWeek.some((d) => d.value.toLowerCase() === sDay.toLowerCase())) {
            parsedStartDay = daysOfWeek.find((d) => d.value.toLowerCase() === sDay.toLowerCase()).value;
          }
          if (eDay && daysOfWeek.some((d) => d.value.toLowerCase() === eDay.toLowerCase())) {
            parsedEndDay = daysOfWeek.find((d) => d.value.toLowerCase() === eDay.toLowerCase()).value;
          }
        } else {
          const matched = daysOfWeek.find((d) => d.value.toLowerCase() === daysPart.toLowerCase());
          if (matched) {
            parsedStartDay = matched.value;
            parsedEndDay = matched.value;
          }
        }
      }
      if (timePart && timePart.includes('-')) {
        const [startP, endP] = timePart.split('-').map((s) => s.trim());
        if (startP && timeOptions.includes(startP)) parsedStart = startP;
        if (endP && timeOptions.includes(endP)) parsedEnd = endP;
      }
      if (parseTimeToMinutes(parsedEnd) < parseTimeToMinutes(parsedStart)) {
        parsedEnd = parsedStart;
      }
    }
    
    setStartDay(parsedStartDay);
    setEndDay(parsedEndDay);
    setFormStartTime(parsedStart);
    setFormEndTime(parsedEnd);
    setImageFileName('');
    
    setFormData({
      title: service.title || service.name || '',
      name: service.title || service.name || '',
      code: service.code || `SRV-${(service.id || '').slice(-2).toUpperCase() || '01'}`,
      description: service.description || '',
      duration: typeof service.duration === 'number' ? service.duration : parseInt(service.duration, 10) || 15,
      schedule: service.schedule || service.service_time || 'Mon - Sat, 09:00 AM - 05:00 PM',
      service_time: service.schedule || service.service_time || 'Mon - Sat, 09:00 AM - 05:00 PM',
      status: service.status || (service.isActive === false ? 'inactive' : 'active'),
      isActive: service.isActive !== false && service.status !== 'inactive',
      capacity: service.capacity || 10,
      image: service.image || service.imageUrl || '',
    });
    setIsModalOpen(true);
  };

  // Duration +/- stepper and keyboard typing handlers
  const handleDecreaseDuration = () => {
    const curr = parseInt(formData.duration, 10) || 15;
    const next = curr > 5 ? curr - 5 : Math.max(1, curr - 1);
    setFormData((prev) => ({ ...prev, duration: next }));
  };

  const handleIncreaseDuration = () => {
    const curr = parseInt(formData.duration, 10) || 0;
    const next = curr < 5 ? 5 : curr + 5;
    setFormData((prev) => ({ ...prev, duration: next }));
  };

  const handleDurationChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setFormData((prev) => ({ ...prev, duration: '' }));
    } else {
      const parsed = parseInt(val, 10);
      setFormData((prev) => ({ ...prev, duration: isNaN(parsed) ? '' : Math.max(1, parsed) }));
    }
  };

  const handleDurationBlur = () => {
    if (formData.duration === '' || Number(formData.duration) < 1) {
      setFormData((prev) => ({ ...prev, duration: 15 }));
    }
  };

  // Handle local image file upload
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file');
        return;
      }
      setImageFileName(file.name);
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image: previewUrl }));
    }
  };

  // Handle drag and drop image upload
  const handleDropImage = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please drop a valid image file');
        return;
      }
      setImageFileName(file.name);
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, image: previewUrl }));
    }
  };

  // Save new or updated service
  const handleSaveService = (e) => {
    e.preventDefault();
    const serviceName = (formData.title || formData.name || '').trim();
    if (!serviceName) {
      showToast('Please enter a service name');
      return;
    }

    const formattedDays = startDay === endDay ? startDay : `${startDay} - ${endDay}`;
    const validEndTime = parseTimeToMinutes(formEndTime) >= parseTimeToMinutes(formStartTime) 
      ? formEndTime 
      : formStartTime;
    const combinedServiceTime = `${formattedDays}, ${formStartTime} - ${validEndTime}`;
    const cleanCode = (formData.code.trim() 
      ? formData.code.trim().toUpperCase() 
      : `${serviceName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'SRV'}-01`);

    if (editingService) {
      // Update
      setServices((prev) =>
        prev.map((s) =>
          s.id === editingService.id
            ? {
                ...s,
                title: serviceName,
                name: serviceName,
                code: cleanCode,
                description: formData.description.trim(),
                duration: Number(formData.duration) || 15,
                schedule: combinedServiceTime,
                service_time: combinedServiceTime,
                status: formData.status,
                isActive: formData.status === 'active',
                capacity: Number(formData.capacity) || 10,
                image: formData.image,
                imageUrl: formData.image,
              }
            : s
        )
      );
      showToast(`Updated "${serviceName}" successfully`);
    } else {
      // Add
      const newService = {
        id: `srv-${Date.now()}`,
        title: serviceName,
        name: serviceName,
        code: cleanCode,
        description: formData.description.trim(),
        duration: Number(formData.duration) || 15,
        schedule: combinedServiceTime,
        service_time: combinedServiceTime,
        scheduleType: 'green',
        status: formData.status || 'active',
        isActive: (formData.status || 'active') === 'active',
        capacity: Number(formData.capacity) || 10,
        createdAt: new Date().toISOString(),
        image: formData.image,
        imageUrl: formData.image,
      };
      setServices((prev) => [newService, ...prev]);
      showToast(`Added "${serviceName}" successfully`);
    }

    setIsModalOpen(false);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!serviceToDelete) return;
    setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
    showToast(`Deleted "${serviceToDelete.title}"`);
    setServiceToDelete(null);
  };

  return (
    <div className="admin-service-page">
      {/* 1. Hero Banner */}
      <AdminBanner
        tag="SERVICE MANAGEMENT"
        title="Create and Manage Your Services"
        description="Add, edit and organize the services you offer. Set the duration and fixed timings for each service to keep everything up to date."
        bgImage={serviceBannerImg}
      />

      {/* 2. White Box Container: Search, Date Filter, Activeness Filter, Add Service */}
      <div className="admin-service-toolbar-box">
        {/* Search Input Box */}
        <div className="admin-service-search-box">
          <Search size={18} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search services by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search services"
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter 1: Sort by Date (Older, Newer) - Opens under the filter */}
        <div className="admin-toolbar-filter-group" ref={dateDropdownRef}>
          <button
            type="button"
            className={`admin-toolbar-dropdown-btn ${isDateDropdownOpen ? 'active' : ''}`}
            onClick={() => {
              setIsDateDropdownOpen((prev) => !prev);
              setIsActivenessDropdownOpen(false);
            }}
            aria-haspopup="listbox"
            aria-expanded={isDateDropdownOpen}
            aria-label="Sort by date"
          >
            <ArrowUpDown size={14} className="filter-select-icon" />
            <span>{dateSort === 'newer' ? 'Sort by Date: Newer' : 'Sort by Date: Older'}</span>
            <ChevronDown size={14} className={`filter-select-chevron ${isDateDropdownOpen ? 'open' : ''}`} />
          </button>

          {isDateDropdownOpen && (
            <div className="admin-toolbar-dropdown-menu" role="listbox">
              <button
                type="button"
                role="option"
                aria-selected={dateSort === 'newer'}
                className={`admin-dropdown-menu-item ${dateSort === 'newer' ? 'selected' : ''}`}
                onClick={() => {
                  setDateSort('newer');
                  setIsDateDropdownOpen(false);
                }}
              >
                <span>Sort by Date: Newer</span>
                {dateSort === 'newer' && <Check size={14} className="dropdown-check-icon" />}
              </button>
              <button
                type="button"
                role="option"
                aria-selected={dateSort === 'older'}
                className={`admin-dropdown-menu-item ${dateSort === 'older' ? 'selected' : ''}`}
                onClick={() => {
                  setDateSort('older');
                  setIsDateDropdownOpen(false);
                }}
              >
                <span>Sort by Date: Older</span>
                {dateSort === 'older' && <Check size={14} className="dropdown-check-icon" />}
              </button>
            </div>
          )}
        </div>

        {/* Filter 2: Activeness (All, Active, Inactive) - Opens under the filter */}
        <div className="admin-toolbar-filter-group" ref={activenessDropdownRef}>
          <button
            type="button"
            className={`admin-toolbar-dropdown-btn ${isActivenessDropdownOpen ? 'active' : ''}`}
            onClick={() => {
              setIsActivenessDropdownOpen((prev) => !prev);
              setIsDateDropdownOpen(false);
            }}
            aria-haspopup="listbox"
            aria-expanded={isActivenessDropdownOpen}
            aria-label="Filter by activeness"
          >
            <Activity size={14} className="filter-select-icon" />
            <span>
              {activenessFilter === 'active'
                ? 'Activeness: Active'
                : activenessFilter === 'inactive'
                ? 'Activeness: Inactive'
                : 'Activeness: All'}
            </span>
            <ChevronDown size={14} className={`filter-select-chevron ${isActivenessDropdownOpen ? 'open' : ''}`} />
          </button>

          {isActivenessDropdownOpen && (
            <div className="admin-toolbar-dropdown-menu" role="listbox">
              <button
                type="button"
                role="option"
                aria-selected={activenessFilter === 'all'}
                className={`admin-dropdown-menu-item ${activenessFilter === 'all' ? 'selected' : ''}`}
                onClick={() => {
                  setActivenessFilter('all');
                  setIsActivenessDropdownOpen(false);
                }}
              >
                <span>Activeness: All</span>
                {activenessFilter === 'all' && <Check size={14} className="dropdown-check-icon" />}
              </button>
              <button
                type="button"
                role="option"
                aria-selected={activenessFilter === 'active'}
                className={`admin-dropdown-menu-item ${activenessFilter === 'active' ? 'selected' : ''}`}
                onClick={() => {
                  setActivenessFilter('active');
                  setIsActivenessDropdownOpen(false);
                }}
              >
                <span>Activeness: Active</span>
                {activenessFilter === 'active' && <Check size={14} className="dropdown-check-icon" />}
              </button>
              <button
                type="button"
                role="option"
                aria-selected={activenessFilter === 'inactive'}
                className={`admin-dropdown-menu-item ${activenessFilter === 'inactive' ? 'selected' : ''}`}
                onClick={() => {
                  setActivenessFilter('inactive');
                  setIsActivenessDropdownOpen(false);
                }}
              >
                <span>Activeness: Inactive</span>
                {activenessFilter === 'inactive' && <Check size={14} className="dropdown-check-icon" />}
              </button>
            </div>
          )}
        </div>

        {/* Action Button: Add Service */}
        <button
          type="button"
          className="admin-add-service-btn"
          onClick={handleOpenAddModal}
        >
          <Plus size={18} strokeWidth={2.4} />
          <span>Add Service</span>
        </button>
      </div>

      {/* 3. Section Title Row */}
      <div className="admin-service-header-row">
        <h2 className="admin-service-section-title">
          <Layers size={20} className="section-title-icon" />
          <span>Available Services ({filteredServices.length})</span>
        </h2>
      </div>

      {/* 4. Services 4-Column Grid */}
      {filteredServices.length > 0 ? (
        <div className="admin-services-grid">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isAdmin={true}
              onEdit={handleOpenEditModal}
              onDelete={(srv) => setServiceToDelete(srv)}
            />
          ))}
        </div>
      ) : (
        <div className="admin-services-empty">
          <div className="admin-empty-icon-box">
            <Search size={28} />
          </div>
          <h3 className="admin-empty-title">No services found</h3>
          <p className="admin-empty-desc">
            No services matched "{searchQuery}". Try searching with a different term or reset your search.
          </p>
          <button
            type="button"
            className="admin-empty-reset-btn"
            onClick={() => setSearchQuery('')}
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* 5. Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-card admin-service-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div className="admin-modal-header-text">
                <h3 className="admin-modal-title">
                  {editingService ? 'Edit Service' : 'Add Service'}
                </h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveService}>
              <div className="admin-modal-body admin-service-modal-body">
                {/* Section 1: Service Name & Code */}
                <div className="admin-form-row">
                  <div className="admin-form-group flex-2">
                    <label className="admin-form-label">
                      Service Name <span className="admin-required-star">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="admin-form-input"
                      placeholder="e.g. Cardiology Consultation"
                      value={formData.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          title: val,
                          name: val,
                          // Auto-fill code if code is currently empty or matches previous prefix
                          code: prev.code ? prev.code : (val.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || ''),
                        }));
                      }}
                    />
                  </div>

                  <div className="admin-form-group flex-1">
                    <label className="admin-form-label">
                      Service Code <span className="admin-required-star">*</span>
                    </label>
                    <div className="admin-code-input-wrapper">
                      <Hash size={14} className="admin-code-hash-icon" />
                      <input
                        type="text"
                        required
                        className="admin-form-input admin-code-input"
                        placeholder="e.g. CARD-01"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Description */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    className="admin-form-textarea"
                    rows={2}
                    placeholder="Brief description of the consultation and services included..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Section 3: Service Time (Days of Week + Timings -> Combined String) */}
                <div className="admin-schedule-config-box">
                  <div className="admin-schedule-box-header">
                    <div>
                      <h4 className="schedule-box-title">Service Operating Hours</h4>
                      <p className="schedule-box-desc">Select working days and daily operating hours.</p>
                    </div>
                  </div>

                  <div className="admin-form-row">
                    {/* Subfield 1: Days of Week (Start Day to End Day) */}
                    <div className="admin-form-group flex-1">
                      <label className="admin-form-sublabel">
                        Days of the Week <span className="admin-required-star">*</span>
                      </label>
                      <div className="admin-time-range-group">
                        <div className="admin-time-select-unit">
                          <span className="time-select-hint">Start</span>
                          <select
                            className="admin-form-select time-dropdown"
                            value={startDay}
                            onChange={(e) => setStartDay(e.target.value)}
                            aria-label="Start day of week"
                          >
                            {daysOfWeek.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <span className="admin-time-to-separator">to</span>
                        <div className="admin-time-select-unit">
                          <span className="time-select-hint">End</span>
                          <select
                            className="admin-form-select time-dropdown"
                            value={endDay}
                            onChange={(e) => setEndDay(e.target.value)}
                            aria-label="End day of week"
                          >
                            {daysOfWeek.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Subfield 2: Timing (Start Time & End Time) */}
                    <div className="admin-form-group flex-1">
                      <label className="admin-form-sublabel">
                        Operating Timing <span className="admin-required-star">*</span>
                      </label>
                      <div className="admin-time-range-group">
                        <div className="admin-time-select-unit">
                          <span className="time-select-hint">Start</span>
                          <select
                            className="admin-form-select time-dropdown"
                            value={formStartTime}
                            onChange={(e) => handleStartTimeChange(e.target.value)}
                            aria-label="Start time"
                          >
                            {timeOptions.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <span className="admin-time-to-separator">to</span>
                        <div className="admin-time-select-unit">
                          <span className="time-select-hint">End</span>
                          <select
                            className="admin-form-select time-dropdown"
                            value={formEndTime}
                            onChange={(e) => setFormEndTime(e.target.value)}
                            aria-label="End time"
                          >
                            {availableEndTimeOptions.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Combined Result String Banner */}
                  <div className="admin-combined-schedule-banner">
                    <span className="combined-schedule-tag">Combined Schedule String:</span>
                    <div className="combined-schedule-preview-pill">
                      <Calendar size={13.5} className="combined-icon" />
                      <span className="combined-text">
                        {startDay === endDay ? startDay : `${startDay} - ${endDay}`}, {formStartTime} - {formEndTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Duration & Active Status */}
                <div className="admin-form-row">
                  {/* Duration Field */}
                  <div className="admin-form-group flex-1">
                    <label className="admin-form-label">
                      Duration (Minutes) <span className="admin-required-star">*</span>
                    </label>
                    <div className="admin-duration-control-container">
                      <div className="admin-duration-stepper">
                        <button
                          type="button"
                          className="duration-step-btn step-minus"
                          onClick={handleDecreaseDuration}
                          disabled={Number(formData.duration) <= 1}
                          aria-label="Decrease duration"
                          title="Decrease duration by 5 minutes"
                        >
                          <Minus size={15} />
                        </button>
                        <div className="admin-duration-input-wrapper">
                          <Clock size={16} className="duration-prefix-icon" />
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            required
                            className="admin-form-input admin-duration-num-input"
                            value={formData.duration}
                            onChange={handleDurationChange}
                            onBlur={handleDurationBlur}
                            placeholder="15"
                            aria-label="Duration in minutes"
                          />
                          <span className="duration-suffix-text">mins</span>
                        </div>
                        <button
                          type="button"
                          className="duration-step-btn step-plus"
                          onClick={handleIncreaseDuration}
                          aria-label="Increase duration"
                          title="Increase duration by 5 minutes"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <p className="admin-duration-hint-text">Use - / + or type directly to adjust duration</p>
                    </div>
                  </div>

                  {/* Active Status Field */}
                  <div className="admin-form-group flex-1">
                    <label className="admin-form-label">
                      Active Status <span className="admin-required-star">*</span>
                    </label>
                    <div className="admin-status-segmented-picker">
                      <button
                        type="button"
                        className={`status-segment-option ${formData.status === 'active' ? 'active-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, status: 'active', isActive: true })}
                      >
                        <span className="status-dot green-dot" />
                        <span>Active</span>
                      </button>
                      <button
                        type="button"
                        className={`status-segment-option ${formData.status === 'inactive' ? 'inactive-selected' : ''}`}
                        onClick={() => setFormData({ ...formData, status: 'inactive', isActive: false })}
                      >
                        <span className="status-dot red-dot" />
                        <span>Inactive</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 5: Service Image (2 Columns: Local Upload & Preview + Preset Sample Images) */}
                <div className="admin-form-group">
                  <label className="admin-form-label">
                    Service Image <span className="admin-required-star">*</span>
                  </label>

                  <div className="admin-image-split-container">
                    {/* Left Column: Local Upload & Live Preview */}
                    <div className="admin-image-split-col admin-image-left-col">
                      <div className="admin-image-col-header">
                        <span className="admin-image-col-title">
                          <Upload size={14} className="col-header-icon" />
                          Upload from Device
                        </span>
                        {imageFileName ? (
                          <span className="admin-image-file-badge" title={imageFileName}>
                            {imageFileName}
                          </span>
                        ) : formData.image ? (
                          <span className="admin-image-hint-badge">Active Preview</span>
                        ) : null}
                      </div>

                      <div
                        className={`admin-image-dropzone-card ${isDragging ? 'dragging' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDropImage}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleImageFileChange}
                        />

                        {/* Image Preview Box */}
                        <div
                          className="admin-image-preview-viewport"
                          onClick={() => fileInputRef.current?.click()}
                          title="Click to choose a file from device"
                        >
                          {formData.image ? (
                            <>
                              <img
                                src={formData.image}
                                alt="Selected service poster"
                                className="admin-image-preview-img"
                              />
                              <div className="admin-image-hover-overlay">
                                <Upload size={18} />
                                <span>Change Image</span>
                              </div>
                            </>
                          ) : (
                            <div className="admin-image-empty-placeholder">
                              <ImageIcon size={28} className="empty-placeholder-icon" />
                              <span>No image selected</span>
                              <span className="empty-placeholder-sub">Upload from device or pick a preset</span>
                            </div>
                          )}
                        </div>

                        {/* Upload Controls & Metadata */}
                        <div className="admin-image-upload-action-row">
                          <button
                            type="button"
                            className="admin-btn-browse-file"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload size={13} />
                            <span>Browse Device</span>
                          </button>
                          <span className="admin-upload-format-note">
                            PNG, JPG, or WebP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Preset Sample Images Library */}
                    <div className="admin-image-split-col admin-image-right-col">
                      <div className="admin-image-col-header">
                        <span className="admin-image-col-title">
                          <ImageIcon size={14} className="col-header-icon" />
                          Preset Sample Images
                        </span>
                        <span className="admin-image-hint-badge">
                          Click to select
                        </span>
                      </div>

                      <div className="admin-preset-samples-container">
                        <div className="admin-preset-samples-grid">
                          {availableImages.map((imgOpt, idx) => {
                            const isSelected = formData.image === imgOpt.img;
                            return (
                              <div
                                key={idx}
                                className={`admin-preset-sample-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  setFormData({ ...formData, image: imgOpt.img });
                                  setImageFileName('');
                                }}
                                title={`Select ${imgOpt.label}`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    setFormData({ ...formData, image: imgOpt.img });
                                    setImageFileName('');
                                  }
                                }}
                              >
                                <div className="admin-preset-thumb-frame">
                                  <img
                                    src={imgOpt.img}
                                    alt={imgOpt.label}
                                    className="admin-preset-thumb-img"
                                  />
                                  {isSelected && (
                                    <div className="admin-preset-check-badge">
                                      <Check size={10} strokeWidth={3} />
                                    </div>
                                  )}
                                </div>
                                <span className="admin-preset-label-text">
                                  {imgOpt.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="admin-modal-backdrop" onClick={() => setServiceToDelete(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <span>Delete Service</span>
              </h3>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setServiceToDelete(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: 0, fontSize: '14.5px', color: '#475569', lineHeight: 1.5 }}>
                Are you sure you want to delete <b>{serviceToDelete.title}</b>? This action cannot be undone and will remove this service from available appointments.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setServiceToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Floating Toast Notification */}
      {toastMessage && (
        <div className="admin-toast">
          <CheckCircle2 size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
