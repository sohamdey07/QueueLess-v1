import React from 'react';
import './Avatar.css';

/**
 * Common Avatar component supporting image or initials fallback
 */
export const Avatar = ({ 
  src, 
  alt = 'Avatar', 
  initials = 'JD', 
  size = 38, 
  className = '' 
}) => {
  return (
    <div 
      className={`ql-avatar ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px` }}
    >
      {src ? (
        <img src={src} alt={alt} className="ql-avatar-img" />
      ) : (
        <span className="ql-avatar-initials">{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
