// Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";

const Header = ({ pageName, databaseName, notifications = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const notifRef = useRef(null);

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

  return (
    <header className="bg-gray-200 shadow p-4 flex justify-between items-center relative">
      {/* Bagian kiri */}
      <div>
        <h1 className="text-xl font-bold">{pageName}</h1>
        <p className="text-sm text-gray-600">{databaseName}</p>
      </div>

      {/* Bagian kanan: Notifikasi */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-full hover:bg-gray-300 transition"
        >
          <Bell className="h-6 w-6 text-gray-700" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {notifications.length}
            </span>
          )}
        </button>

        {/* Dropdown notifikasi */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b font-semibold text-gray-700">
              Notifications
            </div>
            <ul className="max-h-60 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b last:border-none"
                  >
                    ⚠️ {notif}
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
    </header>
  );
};

export default Header;
