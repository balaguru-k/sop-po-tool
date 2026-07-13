import React from 'react';
import MailTemplateCard from './MailTemplateCard';
import { Spin } from 'antd';

const MailTemplateList = ({ templates, onTemplateClick, onSendClick, isLoading }) => {
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{minHeight: '300px', width: '100%'}}>
        <Spin size="large" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{minHeight: '300px', width: '100%'}}>
        <div style={{
          animation: 'bounce 2s infinite',
          marginBottom: '20px'
        }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#eb043c" strokeWidth="2">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <p style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          color: '#2d3748',
          marginBottom: '8px'
        }}>No mail templates found</p>
        <p style={{
          fontSize: '0.9rem',
          color: '#718096'
        }}>Create your first template to get started</p>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="row p-3">
      {templates.map((template) => (
        <MailTemplateCard 
          key={template.id} 
          template={template} 
          onClick={onTemplateClick}
          onSendClick={onSendClick}
        />
      ))}
    </div>
  );
};

export default MailTemplateList;
