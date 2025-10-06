import React, {useEffect, useState} from "react";
import Header from "../component/header";
import { useControlStore } from "../store/useControlStore";
import {Loader, ChevronLeft, ChevronRight} from "lucide-react";

const ManualKontrol = () => {
  const {
    settings,
    history,
    pagination,
    isSettingsLoading,
    isHistoryLoading,
    isUpdatingSetting,
    getSettings,
    setSettings,
    getHistory
  } = useControlStore();

  const [speed, setSpeed] = useState(50);
  const [target, setTarget] = useState(4);
  const [inputTarget, setInputTarget] = useState(4);
  const [inputSpeed, setInputSpeed] = useState(50);
  const [mode, setMode] = useState("manual");
  const [status, setStatus] = useState("off");
  const [pendingChange, setPendingChange] = useState(null);
  const [tempSpeed, setTempSpeed] = useState(50);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([
        getSettings(),
        getHistory(1, 10)
      ]);
      setIsInitialLoading(false);
    };

    loadInitialData();
  }, []);

  // Sync state with settings
  useEffect(() => {
    if (settings) {
      setStatus(settings.state);
      setMode(settings.mode);
      setSpeed(settings.power_set_point);
      setTarget(settings.do_set_point);
      setInputSpeed(settings.power_set_point);
      setInputTarget(settings.do_set_point);
      setTempSpeed(settings.power_set_point);
    }
  }, [settings]);

  const handleModeChange = (newMode) => {
    if (newMode !== mode) {
      setPendingChange({ type: "mode", value: newMode });
    }
  };

  const handlePowerToggle = () => {
    const newStatus = status === "on" ? "off" : "on";
    setPendingChange({ type: "status", value: newStatus });
  };

  const handleSliderChange = (e) => {
    const newSpeed = parseInt(e.target.value, 10);
    setTempSpeed(newSpeed);
  };

  const handleSliderRelease = () => {
    if (tempSpeed !== speed) {
      setPendingChange({ type: "speed", value: tempSpeed });
    }
  };

  const handleInputChange = (e) => {
    setInputSpeed(e.target.value);
  };

  const handleTargetChange = (e) => {
    setInputTarget(e.target.value);
  };

  const handleInputConfirm = () => {
    const newSpeed = parseInt(inputSpeed, 10);
    if (!isNaN(newSpeed) && newSpeed >= 0 && newSpeed <= 100) {
      setPendingChange({ type: "speed", value: newSpeed });
    }
  };

  const handleTargetConfirm = () => {
    const newTarget = parseFloat(inputTarget);
    if (!isNaN(newTarget) && newTarget >= 0 && newTarget <= 100) {
      setPendingChange({ type: "target", value: newTarget });
    }
  };

  const handleConfirmChange = async () => {
    if (!pendingChange) return;

    let newSettings = {
      state: status,
      mode: mode,
      power_set_point: speed,
      do_set_point: target
    };

    if (pendingChange.type === "speed") {
      setSpeed(pendingChange.value);
      setInputSpeed(pendingChange.value);
      setTempSpeed(pendingChange.value);
      newSettings.power_set_point = pendingChange.value;
    }

    if (pendingChange.type === "target") {
      setTarget(pendingChange.value);
      setInputTarget(pendingChange.value);
      newSettings.do_set_point = pendingChange.value;
    }

    if (pendingChange.type === "mode") {
      setMode(pendingChange.value);
      newSettings.mode = pendingChange.value;
    }

    if (pendingChange.type === "status") {
      setStatus(pendingChange.value);
      newSettings.state = pendingChange.value;
    }

    await setSettings(newSettings);
    setPendingChange(null);
  };

  const handleCancelChange = () => {
    setTempSpeed(speed);
    setPendingChange(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      getHistory(newPage, pagination.itemsPerPage);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Loading skeleton for control section
  const ControlSkeleton = () => (
      <div className="flex flex-col items-center border-2 border-gray-400 p-6 rounded-lg bg-white shadow-lg w-full max-w-2xl animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
        <div className="h-12 bg-gray-300 rounded w-32 mb-6"></div>
        <div className="flex gap-6 mb-6">
          <div className="h-10 bg-gray-300 rounded w-24"></div>
          <div className="h-10 bg-gray-300 rounded w-24"></div>
        </div>
        <div className="w-full h-20 bg-gray-300 rounded-lg mb-6"></div>
        <div className="w-full bg-gray-200 p-6 rounded-lg">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4 mx-auto"></div>
          <div className="h-2 bg-gray-300 rounded w-full mb-4"></div>
          <div className="h-6 bg-gray-300 rounded w-56 mb-2 mx-auto"></div>
          <div className="flex items-center gap-4 justify-center">
            <div className="h-10 bg-gray-300 rounded w-20"></div>
            <div className="h-10 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
      </div>
  );

  // Full page loading state
  if (isInitialLoading) {
    return (
        <div className="flex flex-col h-screen bg-[#F9F4F4]">
          <Header
              pageName="Manual Kontrol"
              databaseName="Database / Manual Kontrol"
              notifications={3}
          />

          <div className="flex flex-1 flex-col items-center justify-start p-6">
            {/* Control Section Skeleton */}
            <ControlSkeleton />

            {/* History Table Skeleton */}
            <div className="mt-8 w-full max-w-6xl">
              <div className="h-8 bg-gray-300 rounded w-48 mb-4 animate-pulse"></div>
              <div className="overflow-x-auto border border-gray-300 rounded-lg shadow bg-white">
                <div className="p-4">
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="flex flex-col h-screen bg-[#F9F4F4]">
        <Header
            pageName="Manual Kontrol"
            databaseName="Database / Manual Kontrol"
            notifications={3}
        />

        <div className="flex flex-1 flex-col items-center justify-start p-6">
          {/* Kontrol */}
          <div className="flex flex-col items-center border-2 border-gray-400 p-6 rounded-lg bg-white shadow-lg w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Kontrol Speed Turbin
            </h1>

            {/* Tombol ON / OFF */}
            <div className="mb-6">
              <button
                  onClick={handlePowerToggle}
                  disabled={isUpdatingSetting}
                  className={`px-8 py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      status === "on"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                  }`}
              >
                {status === "on" ? "Matikan (OFF)" : "Nyalakan (ON)"}
              </button>
            </div>

            {/* Mode */}
            <div className="flex items-center gap-6 mb-6">
              <button
                  onClick={() => handleModeChange("manual")}
                  disabled={isUpdatingSetting}
                  className={`px-6 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                      mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-300"
                  }`}
              >
                Manual
              </button>
              <button
                  onClick={() => handleModeChange("auto")}
                  disabled={isUpdatingSetting}
                  className={`px-6 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed ${
                      mode === "auto" ? "bg-green-600 text-white" : "bg-gray-300"
                  }`}
              >
                Auto
              </button>
            </div>

            {/* Tampilan Speed */}
            <div className="w-full h-20 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center text-4xl font-bold text-gray-700 mb-6">
              {isSettingsLoading ? (
                  <Loader className="size-10 animate-spin text-gray-500" />
              ) : (
                  status === "on" ? `${tempSpeed} %` : "OFF"
              )}
            </div>

            {/* Kontrol Speed - Manual Mode */}
            {mode === "manual" && status === "on" && (
                <div className="w-full bg-gray-100 p-6 rounded-lg shadow-lg border border-gray-300 text-center">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Kecepatan: {tempSpeed} %
                  </h2>

                  <input
                      type="range"
                      min="0"
                      max="100"
                      value={tempSpeed}
                      onChange={handleSliderChange}
                      onMouseUp={handleSliderRelease}
                      onTouchEnd={handleSliderRelease}
                      disabled={isUpdatingSetting}
                      className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  <div className="mt-4 flex flex-col items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Input Manual Kecepatan
                    </h2>
                    <div className="flex items-center gap-4">
                      <input
                          type="number"
                          min="0"
                          max="100"
                          value={inputSpeed}
                          onChange={handleInputChange}
                          disabled={isUpdatingSetting}
                          className="p-2 border rounded w-20 text-center border-gray-400 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                          onClick={handleInputConfirm}
                          disabled={isUpdatingSetting}
                          className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Set Speed
                      </button>
                    </div>
                  </div>
                </div>
            )}

            {/* Kontrol Target - Auto Mode */}
            {mode === "auto" && status === "on" && (
                <div className="w-full bg-gray-100 p-6 rounded-lg shadow-lg border border-gray-300 text-center">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Target: {target} mg/L
                  </h2>

                  <div className="mt-4 flex flex-col items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Input Setpoint Dissolved Oxygen
                    </h2>
                    <div className="flex items-center gap-4">
                      <input
                          type="number"
                          min="3"
                          max="10"
                          step="0.1"
                          value={inputTarget}
                          onChange={handleTargetChange}
                          disabled={isUpdatingSetting}
                          className="p-2 border rounded w-20 text-center border-gray-400 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                          onClick={handleTargetConfirm}
                          disabled={isUpdatingSetting}
                          className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                </div>
            )}
          </div>

          {/* Tabel Riwayat with Pagination */}
          <div className="mt-8 w-full max-w-6xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Riwayat Perubahan
            </h2>
            <div className="overflow-x-auto border border-gray-300 rounded-lg shadow bg-white">
              <table className="w-full table-auto border-collapse">
                <thead className="bg-gray-200">
                <tr>
                  <th className="border px-4 py-2">Waktu</th>
                  <th className="border px-4 py-2">Status</th>
                  <th className="border px-4 py-2">Mode</th>
                  <th className="border px-4 py-2">Power Set Point (%)</th>
                  <th className="border px-4 py-2">DO Set Point (mg/L)</th>
                  <th className="border px-4 py-2">Diubah Oleh</th>
                </tr>
                </thead>
                <tbody>
                {isHistoryLoading ? (
                    <tr>
                      <td colSpan="6" className="py-4">
                        <div className="flex items-center text-center justify-center">
                          <Loader className="size-8 animate-spin"/>
                        </div>
                      </td>
                    </tr>
                ) : !history.length ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-500">
                        Belum ada riwayat perubahan
                      </td>
                    </tr>
                ) : (
                    history.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-100">
                          <td className="border px-4 py-2">{formatDate(item.createdAt)}</td>
                          <td className="border px-4 py-2">
                        <span className={`px-2 py-1 rounded ${
                            item.state === 'on' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {item.state.toUpperCase()}
                        </span>
                          </td>
                          <td className="border px-4 py-2">
                        <span className={`px-2 py-1 rounded ${
                            item.mode === 'auto' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {item.mode.toUpperCase()}
                        </span>
                          </td>
                          <td className="border px-4 py-2 text-center">{item.power_set_point}</td>
                          <td className="border px-4 py-2 text-center">{item.do_set_point}</td>
                          <td className="border px-4 py-2">{item.createdBy?.name || 'Unknown'}</td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {!isHistoryLoading && history.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                    <div className="text-sm text-gray-700">
                      Menampilkan {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} data
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <div className="flex gap-1">
                        {[...Array(pagination.totalPages)].map((_, index) => {
                          const page = index + 1;
                          if (
                              page === 1 ||
                              page === pagination.totalPages ||
                              (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)
                          ) {
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-1 rounded border ${
                                        page === pagination.currentPage
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'border-gray-300 hover:bg-gray-100'
                                    }`}
                                >
                                  {page}
                                </button>
                            );
                          } else if (
                              page === pagination.currentPage - 2 ||
                              page === pagination.currentPage + 2
                          ) {
                            return <span key={page} className="px-2">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.totalPages}
                          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Konfirmasi */}
        {pendingChange && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Konfirmasi Perubahan
                </h2>
                <p className="mb-6 text-gray-700">
                  Apakah yakin ingin mengubah{" "}
                  {pendingChange.type === "mode"
                      ? `Mode → ${pendingChange.value}`
                      : pendingChange.type === "status"
                          ? `Status → ${pendingChange.value}`
                          : pendingChange.type === "target"
                              ? `DO Set Point → ${pendingChange.value} mg/L`
                              : `Power Set Point → ${pendingChange.value}%`}
                  ?
                </p>
                <div className="flex justify-center gap-4">
                  <button
                      onClick={handleConfirmChange}
                      disabled={isUpdatingSetting}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdatingSetting && <Loader className="size-4 animate-spin" />}
                    {isUpdatingSetting ? 'Menyimpan...' : 'Konfirmasi'}
                  </button>
                  <button
                      onClick={handleCancelChange}
                      disabled={isUpdatingSetting}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default ManualKontrol;