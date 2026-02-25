// NotificationDropdown.jsx
import React, { useState, useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import { subscribeToPush } from "../lib/push";

const socket = io(process.env.REACT_APP_BACKEND_URL);

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Push permission
  useEffect(() => {
    if (typeof Notification === "undefined") return;

    if (Notification.permission === "granted") {
      subscribeToPush().catch(console.error);
    }
  }, []);

  // Load awal + socket listener
  useEffect(() => {
    axios
      .get(process.env.REACT_APP_BACKEND_URL + "/api/notifications")
      .then((res) => setNotifications(res.data));

    socket.on("new-notification", async (notif) => {
      setNotifications((prev) => [notif, ...prev]);

      if (typeof Notification === "undefined") return;

      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }

      if (Notification.permission === "granted") {
        await subscribeToPush().catch(console.error);

        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(notif.title, {
              body: notif.message,
              requireInteraction: true,
            });
          } catch (err) {
            console.error(err);
          }
        }
      }
    });

    return () => socket.off("new-notification");
  }, []);

  // Klik luar dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // DELETE notification (SYNC backend)
  const removeNotification = async (id) => {
    try {
      await axios.delete(
        process.env.REACT_APP_BACKEND_URL + `/api/notifications/${id}`
      );

      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== id)
      );
    } catch (error) {
      console.error("Gagal menghapus notifikasi:", error);
    }
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-300"
      >
        <Bell
          className={`h-6 w-6 ${
            notifications.length > 0 ? "text-red-600" : "text-gray-700"
          }`}
        />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b font-semibold">
            Notifications
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <li
                  key={notif._id}
                  className="px-4 py-2 border-b flex justify-between"
                >
                  <div>
                    <p className="font-bold text-red-600">
                      ⚠️ {notif.title}
                    </p>
                    <p>{notif.message}</p>
                    <p className="text-xs text-gray-500">
                      {notif.timestamp}
                    </p>
                  </div>
                  <button
                    onClick={() => removeNotification(notif._id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">
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
