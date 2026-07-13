import React from 'react';
import './MailTemplateCard.css';

const MailTemplateCard = ({ template, onClick, onSendClick }) => {
  const handleSend = (e) => {
    e.stopPropagation();
    onSendClick(template);
  };

  return (
    <div className="col-md-4 mb-4">
      <div
        className="mail-template-card"
        onClick={() => onClick(template)}
      >
        <div className="card-header-accent"></div>
        <div className="card-content">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h5 className="card-subject">{template.subject}</h5>
          <div className="card-recipients">
            <span className="recipient-label">To:</span>
            <span className="recipient-list">
              {template.to.slice(0, 2).join(', ')}
              {template.to.length > 2 && <span className="recipient-badge">+{template.to.length - 2}</span>}
            </span>
          </div>
          <div className="card-footer">
            <span className="card-date">{new Date(template.createdAt).toLocaleDateString('en-GB')}</span>
            <button className="card-send-btn" onClick={handleSend}>Dispatch</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailTemplateCard;
