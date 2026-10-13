import React from 'react';
import userAvatarSvg from '../../assets/images/UI/user_image.svg';

/**
 * CommonAvatar - Universal vector user avatar persona used across all portals
 * in QueueLess (Header, Dropdown, and Profile Pop-up).
 * Uses the lightweight .svg format converted from user image.avif for fastest loading.
 */
export const CommonAvatar = ({
  size = 42,
  showRing = true,
  showStatusDot = false,
  isActive = true,
  className = '',
  style = {},
  alt = 'User Avatar'
}) => {
  const borderWidth = showRing ? Math.max(Math.round(size * 0.04), 2) : 0;
  const innerSize = showRing ? Math.max(size - borderWidth * 2, 18) : size;
  const dotSize = Math.max(Math.round(size * 0.22), 10);
  const dotBorder = Math.max(Math.round(dotSize * 0.18), 1.5);

  return (
    <div
      className={`common-user-avatar-wrap ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        background: '#FFFFFF',
        border: showRing ? `${borderWidth}px solid #BFDBFE` : 'none',
        boxShadow: showRing ? '0 2px 8px -1px rgba(29, 104, 242, 0.12)' : 'none',
        flexShrink: 0,
        userSelect: 'none',
        ...style
      }}
      title={alt}
      role="img"
      aria-label={alt}
    >
      {/* Inner Avatar Graphic from user_image.svg */}
      <div
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#EDEDEB',
          flexShrink: 0
        }}
      >
        <img
          src={userAvatarSvg}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover'
          }}
          loading="eager"
        />
      </div>

      {/* Online / Active Status Dot */}
      {showStatusDot && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: isActive ? '#10B981' : '#94A3B8',
            border: `${dotBorder}px solid #FFFFFF`,
            boxSizing: 'border-box',
            zIndex: 3
          }}
          title={isActive ? 'Active status' : 'Offline'}
        />
      )}
    </div>
  );
};

export default CommonAvatar;
