import React from 'react';
import { Construction } from 'lucide-react';
import './CustomerHome.css';

export const UnderDevelopment = () => {
  return (
    <div className="customer-home-page">
      <div 
        className="ql-card" 
        style={{ 
          padding: '64px 24px', 
          textAlign: 'center', 
          backgroundColor: '#FFFFFF',
          borderRadius: '18px',
          border: '1px solid #EEF2F6',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.03)'
        }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#EBF3FE',
          color: '#1D68F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <Construction size={28} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
          Under Development
        </h2>
        <p style={{ color: '#64748B', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
          This feature is currently under development and will be available soon.
        </p>
      </div>
    </div>
  );
};

export default UnderDevelopment;
