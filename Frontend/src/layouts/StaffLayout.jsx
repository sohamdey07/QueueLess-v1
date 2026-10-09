import React from 'react';
import { Outlet } from 'react-router-dom';
import StaffHeader from '../components/staff/StaffHeader';
import './StaffLayout.css';

export const StaffLayout = ({ children }) => {
  return (
    <div className="staff-layout-wrapper">
      {/* Top Sticky Header */}
      <StaffHeader 
        staffName="Arindam" 
        staffFullName="Arindam Mukherjee" 
        counterName="Counter 2" 
      />

      {/* Main Page Body */}
      <main className="staff-layout-content">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default StaffLayout;
