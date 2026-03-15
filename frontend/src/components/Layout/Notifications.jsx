import React, { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";

const Notifications = () => {
  const { notifications, markAsRead, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative px-3 py-2 rounded hover:bg-gray-200"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="p-4 text-center text-gray-500">No notifications</p>
          )}
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => markAsRead(n._id)}
              className={`p-3 border-b cursor-pointer ${n.read ? "bg-gray-100" : "bg-white"}`}
            >
              {n.message}
              <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;