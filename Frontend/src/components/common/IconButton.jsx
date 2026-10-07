import React from 'react';
import './IconButton.css';

/**
 * Common circular/square icon button component
 * @param {'blue' | 'green' | 'purple' | 'amber' | 'light' | 'ghost'} variant
 */
export const IconButton = ({
  icon: Icon,
  variant = 'light',
  size = 32,
  badge = null,
  onClick,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <button
      type="button"
      className={`ql-icon-btn ql-icon-btn-${variant} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={onClick}
      aria-label={ariaLabel}
      {...props}
    >
      {Icon && <Icon className="ql-icon-svg" size={Math.round(size * 0.52)} />}
      {badge && <span className="ql-icon-badge">{badge}</span>}
    </button>
  );
};

export default IconButton;
