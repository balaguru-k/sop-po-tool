import React from "react";

const NotificationModal = ({
  show,
  notifications,
  unreadCount,
  onClose,
  onClearNotification,
  onClearAllNotifications,
  onNotificationClick,
}) => {
  if (!show) return null;
  return (
    <div className="notification-modal">
      <div className="notification-header">
        <h6 className="notification-title">🔔 Notifications</h6>
        <button className="notification-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="notification-content">
        {notifications.length > 0 ? (
          <>
            <div className="notification-items">
              {notifications.map((notification) => (
                <div
                  className={`notification-item ${
                    notification.readtext ? "read" : "unread"
                  }`}
                  key={notification.id}
                >
                  <div className="notification-dot"></div>
                  <div
                    className="notification-text"
                    onClick={(e) => {
                      e.preventDefault();
                      onNotificationClick(notification);
                    }}
                  >
                    {notification.text || "No text available"}
                  </div>
                  <button
                    className="notification-delete-btn"
                    onClick={() => onClearNotification(notification)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button className="clear-all-btn" onClick={onClearAllNotifications}>
              Clear All
            </button>
          </>
        ) : (
          <div className="no-notifications">
            <div className="no-notifications-icon">🔕</div>
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;