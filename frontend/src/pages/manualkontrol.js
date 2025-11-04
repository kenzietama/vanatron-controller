import {useEffect, useState} from "react";
import Header from "../component/header";
import { useControlStore } from "../store/useControlStore";
import {Loader, ChevronLeft, ChevronRight, AlertTriangle} from "lucide-react";
import toast from "react-hot-toast";

const ManualKontrol = () => {
  const {
    settings,
    history,
    pagination,
    vfdData,
    isSettingsLoading,
    isHistoryLoading,
    isUpdatingSetting,
    getSettings,
    setSettings,
    getHistory,
    subscribeToVFD,
    unsubscribeFromVFD
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

  // Safety constants
  const MIN_POWER = 30;
  const MAX_POWER = 100;
  const MIN_DO = 4;
  const MAX_DO = 10;
  const MAX_FREQUENCY_HZ = 50; // Maximum VFD frequency in Hz

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

    // Subscribe to VFD data
    subscribeToVFD();

    // Cleanup on unmount
    return () => {
      unsubscribeFromVFD();
    };
  }, [getHistory, getSettings, subscribeToVFD, unsubscribeFromVFD]);

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
      if (tempSpeed < MIN_POWER) {
        toast.error(`Power must be at least ${MIN_POWER}% for safety`);
        setTempSpeed(speed);
        return;
      }
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

    if (isNaN(newSpeed)) {
      toast.error("Please enter a valid number");
      return;
    }

    if (newSpeed < MIN_POWER) {
      toast.error(`Power must be at least ${MIN_POWER}% for safety`);
      setInputSpeed(speed);
      return;
    }

    if (newSpeed > MAX_POWER) {
      toast.error(`Power cannot exceed ${MAX_POWER}%`);
      setInputSpeed(speed);
      return;
    }

    setPendingChange({ type: "speed", value: newSpeed });
  };

  const handleTargetConfirm = () => {
    const newTarget = parseFloat(inputTarget);

    if (isNaN(newTarget)) {
      toast.error("Please enter a valid number");
      return;
    }

    if (newTarget < MIN_DO) {
      toast.error(`DO set point must be at least ${MIN_DO} mg/L for safety`);
      setInputTarget(target);
      return;
    }

    if (newTarget > MAX_DO) {
      toast.error(`DO set point cannot exceed ${MAX_DO} mg/L`);
      setInputTarget(target);
      return;
    }

    setPendingChange({ type: "target", value: newTarget });
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

    try {
      await setSettings(newSettings);
      setPendingChange(null);
    } catch (error) {
      if (pendingChange.type === "speed") {
        setSpeed(settings.power_set_point);
        setInputSpeed(settings.power_set_point);
        setTempSpeed(settings.power_set_point);
      }
      if (pendingChange.type === "target") {
        setTarget(settings.do_set_point);
        setInputTarget(settings.do_set_point);
      }
      if (pendingChange.type === "mode") {
        setMode(settings.mode);
      }
      if (pendingChange.type === "status") {
        setStatus(settings.state);
      }
    }
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

  // Convert Hz to Percentage (0-50Hz -> 0-100%)
  const convertHzToPercentage = (frequencyHz) => {
    if (frequencyHz === null || frequencyHz === undefined) return null;
    return ((frequencyHz / MAX_FREQUENCY_HZ) * 100).toFixed(1);
  };

  // Get current running frequency from VFD and convert to percentage
  const getCurrentFrequency = () => {
    if (status === "off") return "OFF";
    if (!vfdData || vfdData.running_frequency === null || vfdData.running_frequency === undefined) {
      return "---";
    }
    const percentage = convertHzToPercentage(vfdData.running_frequency);
    return `${percentage} %`;
  };

  // Get frequency info for display (shows both Hz and %)
  const getFrequencyInfo = () => {
    if (status === "off" || !vfdData || vfdData.running_frequency === null || vfdData.running_frequency === undefined) {
      return null;
    }
    return {
      hz: vfdData.running_frequency.toFixed(1),
      percentage: convertHzToPercentage(vfdData.running_frequency)
    };
  };

  const ControlSkeleton = () => (
      <div className="flex flex-col items-center w-full max-w-2xl p-6 bg-white border-2 border-gray-400 rounded-lg shadow-lg animate-pulse">
        <div className="w-64 h-8 mb-6 bg-gray-300 rounded"></div>
        <div className="w-32 h-12 mb-6 bg-gray-300 rounded"></div>
        <div className="flex gap-6 mb-6">
          <div className="w-24 h-10 bg-gray-300 rounded"></div>
          <div className="w-24 h-10 bg-gray-300 rounded"></div>
        </div>
        <div className="w-full h-20 mb-6 bg-gray-300 rounded-lg"></div>
        <div className="w-full p-6 bg-gray-200 rounded-lg">
          <div className="w-48 h-6 mx-auto mb-4 bg-gray-300 rounded"></div>
          <div className="w-full h-2 mb-4 bg-gray-300 rounded"></div>
          <div className="w-56 h-6 mx-auto mb-2 bg-gray-300 rounded"></div>
          <div className="flex items-center justify-center gap-4">
            <div className="w-20 h-10 bg-gray-300 rounded"></div>
            <div className="w-24 h-10 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
  );

  if (isInitialLoading) {
    return (
        <div className="flex flex-col h-screen bg-[#F9F4F4]">
          <Header
              pageName="Manual Kontrol"
              databaseName="Database / Manual Kontrol"
              notifications={3}
          />
          <div className="flex flex-col items-center justify-start flex-1 p-6">
            <ControlSkeleton />
            <div className="w-full max-w-6xl mt-8">
              <div className="w-48 h-8 mb-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg shadow">
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

  const frequencyInfo = getFrequencyInfo();

  return (
      <div className="flex flex-col h-screen bg-[#F9F4F4]">
        <Header
            pageName="Manual Kontrol"
            databaseName="Database / Manual Kontrol"
            notifications={3}
        />

        <div className="flex flex-col items-center justify-start flex-1 p-6">
          {/* Safety Notice */}
          <div className="w-full max-w-2xl mb-4">
            <div className="p-4 border-l-4 border-yellow-400 rounded bg-yellow-50">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  <p className="mb-1 font-semibold">Safety Thresholds Active:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Minimum Power Set Point: <strong>{MIN_POWER}%</strong></li>
                    <li>Maximum Power Set Point: <strong>{MAX_POWER}%</strong></li>
                    <li>Minimum DO Set Point: <strong>{MIN_DO} mg/L</strong></li>
                    <li>Maximum DO Set Point: <strong>{MAX_DO} mg/L</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Kontrol */}
          <div className="flex flex-col items-center w-full max-w-2xl p-6 bg-white border-2 border-gray-400 rounded-lg shadow-lg">
            <h1 className="mb-6 text-3xl font-bold text-center text-gray-800">
              Kontrol Kecepatan Turbin
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

            {/* Tampilan Speed - Real-time VFD Running Frequency */}
            <div className="w-full mb-6">
              <div className="mb-2 text-center">
                <p className="text-sm font-semibold text-gray-600">Kecepatan Aktual (Real-time)</p>
              </div>
              <div className="flex items-center justify-center w-full h-20 text-4xl font-bold text-blue-700 border-2 border-blue-400 rounded-lg shadow-inner bg-gradient-to-br from-blue-50 to-blue-100">
                {isSettingsLoading ? (
                    <Loader className="text-blue-500 size-10 animate-spin" />
                ) : (
                    getCurrentFrequency()
                )}
              </div>
              {status === "on" && frequencyInfo && (
                  <div className="mt-2 space-y-1 text-center">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Frequency:</span> {frequencyInfo.hz} Hz ({frequencyInfo.percentage}%)
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: {vfdData.createdAt ? new Date(vfdData.createdAt).toLocaleTimeString('id-ID') : 'N/A'}
                    </p>
                  </div>
              )}
            </div>

            {/* Target Speed Display */}
            {mode === "manual" && status === "on" && (
            <div className="w-full mb-6">
              <div className="mb-2 text-center">
                <p className="text-sm font-semibold text-gray-600">Target Kecepatan</p>
              </div>
              <div className="flex items-center justify-center w-full h-16 text-3xl font-bold text-gray-700 bg-gray-200 border border-gray-400 rounded-lg">
                {status === "on" ? `${tempSpeed} %` : "OFF"}
              </div>
            </div>
            )}

            {/* Kontrol Speed - Manual Mode */}
            {mode === "manual" && status === "on" && (
                <div className="w-full p-6 text-center bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-700">
                    Atur Target Kecepatan:
                  </h2>

                  <input
                      type="range"
                      min={MIN_POWER}
                      max={MAX_POWER}
                      value={tempSpeed}
                      onChange={handleSliderChange}
                      onMouseUp={handleSliderRelease}
                      onTouchEnd={handleSliderRelease}
                      disabled={isUpdatingSetting}
                      className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />

                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Min: {MIN_POWER}%</span>
                    <span>Max: {MAX_POWER}%</span>
                  </div>

                  <div className="flex flex-col items-center gap-4 mt-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Input Manual Kecepatan
                    </h2>
                    <div className="flex items-center gap-4">
                      <input
                          type="number"
                          min={MIN_POWER}
                          max={MAX_POWER}
                          value={inputSpeed}
                          onChange={handleInputChange}
                          disabled={isUpdatingSetting}
                          className="w-20 p-2 text-center text-gray-700 border border-gray-400 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                          onClick={handleInputConfirm}
                          disabled={isUpdatingSetting}
                          className="px-4 py-2 font-bold text-white transition-all bg-gray-500 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Set Speed
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Range: {MIN_POWER}% - {MAX_POWER}%</p>
                  </div>
                </div>
            )}

            {/* Kontrol Target - Auto Mode */}
            {mode === "auto" && status === "on" && (
                <div className="w-full p-6 text-center bg-gray-100 border border-gray-300 rounded-lg shadow-lg">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-700">
                    Target DO: {target} mg/L
                  </h2>

                  <div className="flex flex-col items-center gap-4 mt-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Input Setpoint Dissolved Oxygen
                    </h2>
                    <div className="flex items-center gap-4">
                      <input
                          type="number"
                          min={MIN_DO}
                          max={MAX_DO}
                          step="0.1"
                          value={inputTarget}
                          onChange={handleTargetChange}
                          disabled={isUpdatingSetting}
                          className="w-20 p-2 text-center text-gray-700 border border-gray-400 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                          onClick={handleTargetConfirm}
                          disabled={isUpdatingSetting}
                          className="px-4 py-2 font-bold text-white transition-all bg-gray-500 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Set
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Range: {MIN_DO} - {MAX_DO} mg/L</p>
                  </div>
                </div>
            )}
          </div>

          {/* Tabel Riwayat with Pagination */}
          <div className="w-full max-w-6xl mt-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">
              Riwayat Perubahan
            </h2>
            <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg shadow">
              <table className="w-full border-collapse table-auto">
                <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 border">Waktu</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Mode</th>
                  <th className="px-4 py-2 border">Power Set Point (%)</th>
                  <th className="px-4 py-2 border">DO Set Point (mg/L)</th>
                  <th className="px-4 py-2 border">Diubah Oleh</th>
                </tr>
                </thead>
                <tbody>
                {isHistoryLoading ? (
                    <tr>
                      <td colSpan="6" className="py-4">
                        <div className="flex items-center justify-center text-center">
                          <Loader className="size-8 animate-spin"/>
                        </div>
                      </td>
                    </tr>
                ) : !history.length ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500">
                        Belum ada riwayat perubahan
                      </td>
                    </tr>
                ) : (
                    history.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-100">
                          <td className="px-4 py-2 border">{formatDate(item.createdAt)}</td>
                          <td className="px-4 py-2 border">
                        <span className={`px-2 py-1 rounded ${
                            item.state === 'on' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {item.state.toUpperCase()}
                        </span>
                          </td>
                          <td className="px-4 py-2 border">
                        <span className={`px-2 py-1 rounded ${
                            item.mode === 'auto' ? 'bg-blue-200 text-blue-800' : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {item.mode.toUpperCase()}
                        </span>
                          </td>
                          <td className="px-4 py-2 text-center border">{item.power_set_point}</td>
                          <td className="px-4 py-2 text-center border">{item.do_set_point}</td>
                          <td className="px-4 py-2 border">{item.createdBy?.name || 'Unknown'}</td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {!isHistoryLoading && history.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <div className="text-sm text-gray-700">
                      Menampilkan {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} data
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-sm p-6 text-center bg-white rounded-lg shadow-lg">
                <h2 className="mb-4 text-xl font-bold text-gray-800">
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
                      className="flex items-center gap-2 px-4 py-2 font-bold text-white transition bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdatingSetting && <Loader className="size-4 animate-spin" />}
                    {isUpdatingSetting ? 'Menyimpan...' : 'Konfirmasi'}
                  </button>
                  <button
                      onClick={handleCancelChange}
                      disabled={isUpdatingSetting}
                      className="px-4 py-2 font-bold text-white transition bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
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