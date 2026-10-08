import React, { useState } from 'react';
import AppointmentBanner from '../../components/customer/AppointmentBanner';
import ServiceCard from '../../components/common/ServiceCard';
import BookingModal from '../../components/customer/BookingModal';

// Images requested by user and generated to complete the 8-card UI
import generalConsultationImg from '../../assets/images/bookings/general_consultation.jpg';
import bloodTestImg from '../../assets/images/bookings/blood_test.jpg';
import dentalCheckupImg from '../../assets/images/bookings/dental_checkup.jpg';
import vaccinationImg from '../../assets/images/bookings/vaccination.jpg';
import documentVerificationImg from '../../assets/images/bookings/document_verification.jpg';
import vehicleServiceImg from '../../assets/images/bookings/vehicle_service.jpg';
import eyeCheckupImg from '../../assets/images/bookings/eye_checkup.jpg';
import haircutGroomingImg from '../../assets/images/bookings/haircut_grooming.jpg';

import './BookAppointment.css';

const servicesData = [
  {
    id: 'general-consultation',
    title: 'General Consultation',
    description: 'Consult with our experienced doctors for general health issues.',
    duration: '15 minutes',
    schedule: 'Mon - Sat, 09:00 AM - 05:00 PM',
    scheduleType: 'green',
    image: generalConsultationImg,
  },
  {
    id: 'blood-test',
    title: 'Blood Test',
    description: 'Quick and reliable laboratory testing services.',
    duration: '10 minutes',
    schedule: 'Mon - Sat, 08:00 AM - 04:00 PM',
    scheduleType: 'blue',
    image: bloodTestImg,
  },
  {
    id: 'dental-checkup',
    title: 'Dental Checkup',
    description: 'Comprehensive dental examination and cleaning.',
    duration: '20 minutes',
    schedule: 'Mon - Sat, 09:00 AM - 06:00 PM',
    scheduleType: 'green',
    image: dentalCheckupImg,
  },
  {
    id: 'vaccination',
    title: 'Vaccination',
    description: 'Get your routine and travel vaccinations.',
    duration: '10 minutes',
    schedule: 'Mon - Sat, 09:00 AM - 05:00 PM',
    scheduleType: 'blue',
    image: vaccinationImg,
  },
  {
    id: 'document-verification',
    title: 'Document Verification',
    description: 'Verification of official documents and certificates.',
    duration: '15 minutes',
    schedule: 'Mon - Fri, 09:00 AM - 05:00 PM',
    scheduleType: 'green',
    image: documentVerificationImg,
  },
  {
    id: 'vehicle-service',
    title: 'Vehicle Service',
    description: 'General vehicle checkup and maintenance.',
    duration: '30 minutes',
    schedule: 'Mon - Sat, 09:00 AM - 06:00 PM',
    scheduleType: 'blue',
    image: vehicleServiceImg,
  },
  {
    id: 'eye-checkup',
    title: 'Eye Checkup',
    description: 'Complete eye examination and vision assessment.',
    duration: '20 minutes',
    schedule: 'Mon - Sat, 09:00 AM - 05:00 PM',
    scheduleType: 'green',
    image: eyeCheckupImg,
  },
  {
    id: 'haircut-grooming',
    title: 'Haircut & Grooming',
    description: 'Professional haircut and grooming services.',
    duration: '30 minutes',
    schedule: 'Mon - Sat, 10:00 AM - 08:00 PM',
    scheduleType: 'blue',
    image: haircutGroomingImg,
  },
];

export const BookAppointment = () => {
  const [selectedBookingService, setSelectedBookingService] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

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
  };

  return (
    <div className="book-appointment-page">
      {/* 1. Hero Banner with Image & Exact Layout */}
      <AppointmentBanner />

      {/* 2. Text specifying number of available services */}
      <div className="available-services-header">
        <div className="available-services-text-group">
          <h2 className="available-services-title">Available Services</h2>
          <p className="available-services-subtitle">
            Choose from {servicesData.length} available services to schedule your appointment at a time that works for you.
          </p>
        </div>
        <div className="available-services-badge">
          <span className="badge-pulse-dot" />
          <span>{servicesData.length} Services Available</span>
        </div>
      </div>

      {/* 3. Services Grid - 3 cards per row with increased width */}
      <section className="appointment-services-section" aria-label="Available Services">
        <div className="appointment-services-grid">
          {servicesData.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onBook={handleBook}
              onDetails={handleDetails}
            />
          ))}
        </div>
      </section>

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
