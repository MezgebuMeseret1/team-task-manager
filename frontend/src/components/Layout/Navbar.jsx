import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { Bell, Moon, Sun } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [notifOpen, setNotifOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleNotifClick = (id) => markAsRead(id);
  const handleNotifHeaderClick = () => markAllAsRead();

  return (
    <nav className="bg-gray-800 dark:bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow">
      <div className="text-xl font-bold">Enterprise Task & Invoice Management</div>

      <div className="flex items-center space-x-4 relative">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded hover:bg-gray-700 transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 text-black dark:text-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
              {notifications.length > 0 && (
                <div
                  className="p-2 text-center text-sm text-blue-500 cursor-pointer border-b hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleNotifHeaderClick}
                >
                  Mark all as read
                </div>
              )}

              {notifications.length === 0 ? (
                <p className="p-4 text-center text-gray-500 dark:text-gray-300">
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleNotifClick(n._id)}
                    className={`p-3 border-b cursor-pointer ${
                      n.isRead ? "bg-gray-100 dark:bg-gray-700" : "bg-white dark:bg-gray-600"
                    } hover:bg-gray-200 dark:hover:bg-gray-500 transition`}
                  >
                    <div className="font-medium">{n.message}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-300">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button onClick={toggleDarkMode} className="p-2 rounded hover:bg-gray-700 transition">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Greeting */}
        {user && <span className="hidden md:inline">Welcome, {user.name}</span>}

        {/* Logout */}
        {user && (
          <button
            onClick={logout}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;