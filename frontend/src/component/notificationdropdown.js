// NotificationDropdown.jsx
import React, { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";

// const socket = io("process.env.REACT_APP_BACKEND_URL", { withCredentials: true });
const socket = io(process.env.REACT_APP_BACKEND_URL);

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Load awal notifikasi dari backend
  useEffect(() => {
    axios.get(process.env.REACT_APP_BACKEND_URL + "/api/notifications").then((res) => {
      setNotifications(res.data);
    });

    // Listener dari socket
    socket.on("new-notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    return () => {
      socket.off("new-notification");
    };
  }, []);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hapus notifikasi tertentu (hanya local, kalau mau sync ke backend perlu API delete)
  const removeNotification = (index) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-300 transition"
      >
        <Bell
          className={`h-6 w-6 ${
            notifications.length > 0 ? "text-red-600" : "text-gray-700"
          }`}
        />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b font-semibold text-gray-700 flex justify-between items-center">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif, index) => (
                <li
                  key={index}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b last:border-none flex justify-between items-start"
                >
                  <div>
                    <p className="font-bold text-red-600">⚠️ {notif.title}</p>
                    <p className="text-gray-700">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notif.timestamp}
                    </p>
                  </div>
                  <button
                    onClick={() => removeNotification(index)}
                    className="ml-2 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">
                No notifications
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
