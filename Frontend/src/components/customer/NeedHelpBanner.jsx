import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';
import './NeedHelpBanner.css';

export const NeedHelpBanner = ({ onGetHelp }) => {
  return (
    <div className="need-help-banner">
      <div className="need-help-content-left">
        {/* Lightbulb Icon Box */}
        <div className="need-help-icon-wrap">
          <Lightbulb size={24} className="need-help-bulb-icon" />
        </div>

        {/* Text */}
        <div className="need-help-text-block">
          <h3 className="need-help-title">Need Help?</h3>
          <p className="need-help-desc">
            Have questions about booking, joining the queue or anything else? Visit our help center or contact support.
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="need-help-action-right">
        <button 
          type="button" 
          className="need-help-btn"
          onClick={onGetHelp}
        >
          <span>Get Help</span>
          <ArrowRight size={15} className="need-help-btn-arrow" />
        </button>
      </div>
    </div>
  );
};

export default NeedHelpBanner;
