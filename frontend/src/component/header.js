// Header.jsx
import React from "react";
import NotificationDropdown from "./notificationdropdown";
import notifications from "./notification"; // Import notifikasi contoh

const Header = ({ pageName, databaseName }) => {
  return (
    <header className="bg-gray-200 shadow p-4 flex justify-between items-center relative">
      {/* Bagian kiri */}
      <div>
        <h1 className="text-xl font-bold">{pageName}</h1>
        <p className="text-sm text-gray-600">{databaseName}</p>
      </div>

      {/* Bagian kanan: Notifikasi */}
      <NotificationDropdown notifications={notifications} />
    </header>
  );
};

export default Header;
