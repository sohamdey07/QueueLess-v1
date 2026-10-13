import React from 'react';
import { UserCog, KeyRound, LogOut } from 'lucide-react';
import CommonAvatar from './CommonAvatar';
import './UserMenuDropdown.css';

/**
 * UserMenuDropdown - Universal, modern profile dropdown matching the design system
 * across Staff, Customer, and Admin portals.
 */
export const UserMenuDropdown = ({
  isOpen,
  userName = 'User',
  userRole = 'Account',
  isActive = true,
  onManageAccount,
  onChangePassword,
  onSignOut
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="user-menu-dropdown-card" 
      role="menu" 
      aria-orientation="vertical"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Identity Header: Avatar, Name, and Role */}
      <div className="user-menu-header-row">
        <CommonAvatar 
          size={46} 
          showRing={true} 
          showStatusDot={true} 
          isActive={isActive} 
          alt={userName} 
        />
        <div className="user-menu-info-col">
          <span className="user-menu-name" title={userName}>{userName}</span>
          <span className="user-menu-role" title={userRole}>{userRole}</span>
        </div>
      </div>

      <div className="user-menu-divider" />

      {/* Options List */}
      <div className="user-menu-options-list">
        {/* Option 1: Manage Account */}
        <button
          type="button"
          className="user-menu-item-btn"
          onClick={onManageAccount}
          role="menuitem"
        >
          <UserCog size={18} className="user-menu-item-icon" />
          <span>Manage Account</span>
        </button>

        {/* Option 2: Change Password */}
        <button
          type="button"
          className="user-menu-item-btn"
          onClick={onChangePassword}
          role="menuitem"
        >
          <KeyRound size={18} className="user-menu-item-icon" />
          <span>Change Password</span>
        </button>

        <div className="user-menu-divider" />

        {/* Option 3: Sign Out */}
        <button
          type="button"
          className="user-menu-item-btn sign-out-item"
          onClick={onSignOut}
          role="menuitem"
        >
          <LogOut size={18} className="user-menu-item-icon sign-out-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenuDropdown;
