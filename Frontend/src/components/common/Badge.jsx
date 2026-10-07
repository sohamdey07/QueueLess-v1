import React from 'react';
import './Badge.css';

/**
 * Common Badge component for status tags
 * @param {'upcoming' | 'completed' | 'cancelled' | 'primary' | 'neutral'} variant
 */
export const Badge = ({ variant = 'primary', children, className = '' }) => {
  return (
    <span className={`ql-badge ql-badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
