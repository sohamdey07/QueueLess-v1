import React from 'react';
import ServiceCard from '../common/ServiceCard';

/**
 * ServiceBookingCard
 * Re-exports the standardized common ServiceCard for customer booking pages.
 */
export const ServiceBookingCard = ({ service, onBook, onAction, ...props }) => {
  return (
    <ServiceCard
      service={service}
      onAction={onAction || onBook}
      {...props}
    />
  );
};

export default ServiceBookingCard;
