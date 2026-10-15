import React, { useState, useEffect } from 'react';
import AppointmentBanner from '../../components/customer/AppointmentBanner';
import ServiceCard from '../../components/common/ServiceCard';
import BookingModal from '../../components/customer/BookingModal';
import serviceApi from '../../services/api/service.api';
import { RefreshCw, AlertCircle, Calendar, Layers } from 'lucide-react';

// Fallback images for services that do not have custom uploaded photos
import generalConsultationImg from '../../assets/images/bookings/general_consultation.jpg';
import bloodTestImg from '../../assets/images/bookings/blood_test.jpg';
import dentalCheckupImg from '../../assets/images/bookings/dental_checkup.jpg';
import vaccinationImg from '../../assets/images/bookings/vaccination.jpg';
import documentVerificationImg from '../../assets/images/bookings/document_verification.jpg';
import vehicleServiceImg from '../../assets/images/bookings/vehicle_service.jpg';
import eyeCheckupImg from '../../assets/images/bookings/eye_checkup.jpg';
import haircutGroomingImg from '../../assets/images/bookings/haircut_grooming.jpg';

import './BookAppointment.css';

/**
 * Maps service name keywords to appropriate fallback images
 */
function getFallbackImage(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('blood') || lower.includes('donation')) return bloodTestImg;
  if (lower.includes('dental') || lower.includes('tooth') || lower.includes('teeth')) return dentalCheckupImg;
  if (lower.includes('vaccin') || lower.includes('immun')) return vaccinationImg;
  if (lower.includes('document') || lower.includes('verif') || lower.includes('certif')) return documentVerificationImg;
  if (lower.includes('vehicle') || lower.includes('car') || lower.includes('bike') || lower.includes('auto')) return vehicleServiceImg;
  if (lower.includes('eye') || lower.includes('vision') || lower.includes('optic')) return eyeCheckupImg;
  if (lower.includes('hair') || lower.includes('groom') || lower.includes('salon') || lower.includes('barber')) return haircutGroomingImg;
  return generalConsultationImg;
}

export const BookAppointment = () => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedBookingService, setSelectedBookingService] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Fetch all active services from backend database
  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await serviceApi.getAllServices({ isActive: true });
        if (!isMounted) return;

        const list = Array.isArray(res?.data) 
          ? res.data 
          : (res?.data?.services || []);

        const formatted = list.map((srv, idx) => ({
          id: srv._id,
          _id: srv._id,
          title: srv.name,
          name: srv.name,
          code: srv.code,
          description: srv.description || 'Professional service scheduled at your convenience.',
          duration: srv.duration ? `${srv.duration} minutes` : '15 minutes',
          schedule: srv.service_time || 'Mon - Sat, 09:00 AM - 05:00 PM',
          scheduleType: idx % 2 === 0 ? 'blue' : 'green',
          image: srv.imageUrl || getFallbackImage(srv.name),
          capacity: srv.capacity,
          isActive: srv.isActive,
        }));

        setServices(formatted);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load services:', err);
        setError(err.message || 'Unable to load services at this time.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchServices();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure body scroll is unlocked when leaving page
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleBook = (service) => {
    setSelectedBookingService(service);
    setIsBookingModalOpen(true);
  };

  const handleDetails = (service) => {
    setSelectedBookingService(service);
    setIsBookingModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsBookingModalOpen(false);
    setSelectedBookingService(null);
    document.body.style.overflow = '';
  };

  return (
    <div className="book-appointment-page">
      {/* 1. Hero Banner with Image & Exact Layout */}
      <AppointmentBanner />

      {/* 2. Error Banner */}
      {error && (
        <div className="book-appointment-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Available Services White Box Container (Matching Admin Services Layout) */}
      <div className="book-appointment-content-box">
        {/* Section Title Row */}
        <div className="book-appointment-header-row">
          <h2 className="book-appointment-section-title">
            <Layers size={20} className="section-title-icon" />
            <span>Available Services {!isLoading && `(${services.length})`}</span>
          </h2>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="book-appointment-empty" style={{ borderStyle: 'none' }}>
            <div className="book-appointment-empty-icon-box spin-icon">
              <RefreshCw size={28} color="#1D68F2" />
            </div>
            <h3 className="book-appointment-empty-title">Loading services...</h3>
            <p className="book-appointment-empty-desc">Fetching live services from database.</p>
          </div>
        ) : services.length > 0 ? (
          <div className="appointment-services-grid">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onBook={handleBook}
                onDetails={handleDetails}
              />
            ))}
          </div>
        ) : (
          <div className="book-appointment-empty">
            <div className="book-appointment-empty-icon-box">
              <Calendar size={32} color="#94A3B8" />
            </div>
            <h3 className="book-appointment-empty-title">No services found</h3>
            <p className="book-appointment-empty-desc">
              Please check back soon as new appointment slots and services are added regularly.
            </p>
          </div>
        )}
      </div>

      {/* 4. Book Appointment Modal */}
      <BookingModal
        service={selectedBookingService}
        isOpen={isBookingModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default BookAppointment;
