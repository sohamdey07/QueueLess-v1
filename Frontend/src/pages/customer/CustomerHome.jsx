import React, { useState, useEffect, useMemo, useCallback } from 'react';
import HeroBanner from '../../components/customer/HeroBanner';
import QuickActions from '../../components/customer/QuickActions';
import UpcomingBookingCard from '../../components/customer/UpcomingBookingCard';
import RecentBookingsCard from '../../components/customer/RecentBookingsCard';
import NeedHelpBanner from '../../components/customer/NeedHelpBanner';
import appointmentApi from '../../services/api/appointment.api';

import generalConsultImg from '../../assets/images/bookings/general_consultation.jpg';
import documentVerifImg from '../../assets/images/bookings/document_verification.jpg';
import accountAssistImg from '../../assets/images/bookings/account_assistance.jpg';
import bloodTestImg from '../../assets/images/bookings/blood_test.jpg';
import dentalCheckupImg from '../../assets/images/bookings/dental_checkup.jpg';
import eyeCheckupImg from '../../assets/images/bookings/eye_checkup.jpg';
import vaccinationImg from '../../assets/images/bookings/vaccination.jpg';
import vehicleServiceImg from '../../assets/images/bookings/vehicle_service.jpg';

import './CustomerHome.css';

/**
 * Maps service name keywords to appropriate fallback images
 */
function getFallbackImage(name = '') {
  const lower = (name || '').toLowerCase();
  if (lower.includes('blood') || lower.includes('donation')) return bloodTestImg;
  if (lower.includes('dental') || lower.includes('tooth') || lower.includes('teeth')) return dentalCheckupImg;
  if (lower.includes('vaccin') || lower.includes('immun')) return vaccinationImg;
  if (lower.includes('document') || lower.includes('verif')) return documentVerifImg;
  if (lower.includes('account') || lower.includes('assist')) return accountAssistImg;
  if (lower.includes('eye') || lower.includes('vision') || lower.includes('optom')) return eyeCheckupImg;
  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('auto')) return vehicleServiceImg;
  return generalConsultImg;
}

/**
 * Formats YYYY-MM-DD string to "12 Oct 2026"
 */
function formatAppointmentDate(dateVal) {
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
}

/**
 * Status display badge text
 */
function formatStatusLabel(status = '') {
  const norm = (status || '').toUpperCase();
  if (norm === 'NO_SHOW') return 'No Show';
  if (norm === 'IN_SERVICE') return 'In Service';
  if (norm === 'CHECKED_IN') return 'Checked In';
  if (norm === 'BOOKED') return 'Booked';
  if (norm === 'COMPLETED') return 'Completed';
  if (norm === 'CANCELLED') return 'Cancelled';
  return norm ? norm.charAt(0).toUpperCase() + norm.slice(1).toLowerCase() : 'Booked';
}

/**
 * Badge CSS variant
 */
function getStatusVariant(status = '') {
  const norm = (status || '').toUpperCase();
  if (norm === 'COMPLETED') return 'completed';
  if (norm === 'CANCELLED') return 'cancelled';
  if (norm === 'NO_SHOW') return 'no_show';
  if (norm === 'CHECKED_IN') return 'checked_in';
  if (norm === 'IN_SERVICE') return 'in_service';
  if (norm === 'CONFIRMED' || norm === 'BOOKED') return 'confirmed';
  return 'upcoming';
}

/**
 * Today's date string in YYYY-MM-DD format
 */
function getTodayDateStr() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const CustomerHome = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real appointments from backend API
  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await appointmentApi.getMyAppointments();
      const list = Array.isArray(res?.data) ? res.data : [];
      setAppointments(list);
    } catch (err) {
      console.error('Failed to load customer dashboard appointments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Transform raw appointments
  const mappedBookings = useMemo(() => {
    return appointments.map((appt) => {
      const service = appt.serviceId || {};
      const dateFormatted = formatAppointmentDate(appt.appointmentDate);
      const rawDate = appt.appointmentDate || '';
      const duration = service.duration ? `${service.duration} mins` : '15 mins';

      return {
        id: appt.appointmentId || appt._id,
        appointmentId: appt.appointmentId,
        title: service.name || 'Service Consultation',
        date: dateFormatted,
        rawDate,
        duration,
        status: formatStatusLabel(appt.status),
        rawStatus: (appt.status || '').toUpperCase(),
        statusVariant: getStatusVariant(appt.status),
        image: service.imageUrl || getFallbackImage(service.name),
        createdAt: appt.createdAt,
      };
    });
  }, [appointments]);

  // Section 1: Nearest Upcoming Booking only
  // (Active bookings with appointmentDate >= today, sorted nearest first, pick [0])
  const nearestUpcomingBooking = useMemo(() => {
    const todayStr = getTodayDateStr();
    const upcomingList = mappedBookings
      .filter((b) => {
        const isActive = ['BOOKED', 'CHECKED_IN', 'IN_SERVICE'].includes(b.rawStatus);
        if (!isActive) return false;
        // Date must be today or in future
        return b.rawDate >= todayStr;
      })
      .sort((a, b) => (a.rawDate || '').localeCompare(b.rawDate || ''));

    return upcomingList[0] || null;
  }, [mappedBookings]);

  // Section 2: Recent 3 Booking Activity
  // (Sorted newest by appointmentDate/createdAt descending, top 3 items)
  const recentThreeBookings = useMemo(() => {
    return [...mappedBookings]
      .sort((a, b) => {
        const timeA = new Date(a.rawDate || a.createdAt).getTime();
        const timeB = new Date(b.rawDate || b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 3);
  }, [mappedBookings]);

  return (
    <div className="customer-home-page">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Quick Actions Grid */}
      <QuickActions />

      {/* 3. Upcoming Booking & Recent Bookings Columns */}
      <div className="bookings-columns-grid">
        <UpcomingBookingCard 
          booking={nearestUpcomingBooking}
          isLoading={isLoading}
        />
        <RecentBookingsCard 
          bookings={recentThreeBookings}
          isLoading={isLoading}
        />
      </div>

      {/* 4. Need Help Banner */}
      <NeedHelpBanner />
    </div>
  );
};

export default CustomerHome;
