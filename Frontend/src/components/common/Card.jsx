import React from 'react';
import './Card.css';

/**
 * Common Card container component
 */
export const Card = ({ 
  children, 
  className = '', 
  interactive = false, 
  padding = '20px',
  onClick,
  ...props 
}) => {
  return (
    <div 
      className={`ql-card ${interactive ? 'ql-card-interactive' : ''} ${className}`}
      style={{ padding }}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
