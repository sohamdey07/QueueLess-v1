import React from 'react';
import { ArrowRight } from 'lucide-react';
import './SectionHeader.css';

/**
 * Reusable Section Header with icon, title, optional subtitle and right action
 */
export const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  actionText,
  actionHref = '#',
  onActionClick,
  className = ''
}) => {
  return (
    <div className={`ql-section-header ${className}`}>
      <div className="ql-section-header-left">
        {Icon && (
          <div className="ql-section-header-icon-wrap">
            <Icon className="ql-section-header-icon" size={20} />
          </div>
        )}
        <div className="ql-section-header-titles">
          <h2 className="ql-section-title">{title}</h2>
          {subtitle && <p className="ql-section-subtitle">{subtitle}</p>}
        </div>
      </div>

      {actionText && (
        <a 
          href={actionHref} 
          onClick={onActionClick}
          className="ql-section-action-link"
        >
          <span>{actionText}</span>
          <ArrowRight size={15} className="ql-section-action-arrow" />
        </a>
      )}
    </div>
  );
};

export default SectionHeader;
