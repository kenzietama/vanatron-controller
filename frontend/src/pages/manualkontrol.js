import React, {useEffect, useState} from "react";
import Header from "../component/header";
import { useControlStore } from "../store/useControlStore";
import {Loader} from "lucide-react";

const ManualKontrol = () => {
  const { settings, isSettingsLoading, isSettingsUpdating, getSettings, setSettings } = useControlStore();

  const [speed, setSpeed] = useState(50); // Nilai awal speed
  const [target, setTarget] = useState(4); // Nilai awal target dissolved oxygen
  const [inputTarget, setInputTarget] = useState(4); // Nilai input sementara
  const [inputSpeed, setInputSpeed] = useState(50); // Nilai input sementara
  const [mode, setMode] = useState("manual"); // mode: manual / auto
  const [status, setStatus] = useState("OFF"); // status: ON / OFF
  const [pendingChange, setPendingChange] = useState(null); // simpan perubahan sebelum konfirmasi
  const [riwayat, setRiwayat] = useState([]); // daftar perubahan

  const akunAktif = "Admin1"; // bisa diganti sesuai sistem login

  useEffect(()  => {
    getSettings();
  }, []);

  // handle perubahan mode
  const handleModeChange = (newMode) => {
    if (newMode !== mode) {
      setPendingChange({ type: "mode", value: newMode });
    }
  };

  // handle tombol ON / OFF
  const handlePowerToggle = () => {
    const newStatus = status === "ON" ? "OFF" : "ON";
    setPendingChange({ type: "status", value: newStatus });
  };

  // handle perubahan slider
  const handleSliderChange = (e) => {
    const newSpeed = parseInt(e.target.value, 10);
    setPendingChange({ type: "speed", value: newSpeed });
  };

  // handle input manual
  const handleInputChange = (e) => {
    setInputSpeed(e.target.value);
  };

  const handleTargetChange = (e) => {
    setInputTarget(e.target.value);
  };

  // konfirmasi input manual
  const handleInputConfirm = () => {
    const newSpeed = parseInt(inputSpeed, 10);
    if (!isNaN(newSpeed) && newSpeed >= 0 && newSpeed <= 100) {
      setPendingChange({ type: "speed", value: newSpeed });
    }
  };

  const handleTargetConfirm = () => {
    const newTarget = parseInt(inputTarget, 10);
    if (!isNaN(newTarget) && newTarget >= 0 && newTarget <= 100) {
      setPendingChange({ type: "target", value: newTarget });
    }
  }

  // konfirmasi perubahan (baik mode, speed, maupun status)
  const handleConfirmChange = () => {
    if (!pendingChange) return;

    const waktuSekarang = new Date().toLocaleString();

    if (pendingChange.type === "speed") {
      const oldSpeed = speed;
      setSpeed(pendingChange.value);
      setRiwayat((prev) => [
        ...prev,
        {
          akun: akunAktif,
          waktu: waktuSekarang,
          perubahan: `Speed: ${oldSpeed} → ${pendingChange.value}`,
          mode: mode,
        },
      ]);
    }

    if (pendingChange.type === "target") {
      const oldTarget = target;
      setTarget(pendingChange.value);
      setRiwayat((prev) => [
        ...prev,
        {
          akun: akunAktif,
          waktu: waktuSekarang,
          perubahan: `Target: ${oldTarget} → ${pendingChange.value}`,
          mode: mode,
        },
      ]);
    }

    if (pendingChange.type === "mode") {
      const oldMode = mode;
      setMode(pendingChange.value);
      setRiwayat((prev) => [
        ...prev,
        {
          akun: akunAktif,
          waktu: waktuSekarang,
          perubahan: `Mode: ${oldMode} → ${pendingChange.value}`,
          mode: pendingChange.value,
        },
      ]);
    }

    if (pendingChange.type === "status") {
      const oldStatus = status;
      setStatus(pendingChange.value);
      setRiwayat((prev) => [
        ...prev,
        {
          akun: akunAktif,
          waktu: waktuSekarang,
          perubahan: `Status: ${oldStatus} → ${pendingChange.value}`,
          mode: mode,
        },
      ]);
    }

    setPendingChange(null); // reset setelah konfirmasi
  };

  // batal perubahan
  const handleCancelChange = () => {
    setPendingChange(null);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9F4F4]">
      {/* Header */}
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
              className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                status === "ON"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {status === "ON" ? "Matikan (OFF)" : "Nyalakan (ON)"}
            </button>
          </div>

          {/* Mode */}
          <div className="flex items-center gap-6 mb-6">
            <button
              onClick={() => handleModeChange("manual")}
              className={`px-6 py-2 rounded-lg font-bold ${
                mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => handleModeChange("auto")}
              className={`px-6 py-2 rounded-lg font-bold ${
                mode === "auto" ? "bg-green-600 text-white" : "bg-gray-300"
              }`}
            >
              Auto
            </button>
          </div>

          {/* Tampilan Speed */}
          <div className="w-full h-20 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center text-4xl font-bold text-gray-700 mb-6">
            {status === "ON" ? `${speed} %` : "OFF"}
          </div>

          {/* Kontrol Speed hanya aktif di mode manual & status ON */}
          {mode === "manual" && status === "ON" && (
            <div className="w-full bg-gray-100 p-6 rounded-lg shadow-lg border border-gray-300 text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Kecepatan: {speed} %
              </h2>

              <input
                type="range"
                min="0"
                max="100"
                value={speed}
                onChange={handleSliderChange}
                className="w-full cursor-pointer"
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
                    className="p-2 border rounded w-20 text-center border-gray-400 text-gray-700"
                  />
                  <button
                    onClick={handleInputConfirm}
                    className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Set Speed
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "auto" && status === "ON" && (
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
                        value={inputTarget}
                        onChange={handleTargetChange}
                        className="p-2 border rounded w-20 text-center border-gray-400 text-gray-700"
                    />
                    <button
                        onClick={handleTargetConfirm}
                        className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-all"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Tabel Riwayat */}
        <div className="mt-8 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Riwayat Perubahan
          </h2>
          <div className="overflow-x-auto border border-gray-300 rounded-lg shadow">
            <table className="w-full table-auto border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-4 py-2">Akun</th>
                  <th className="border px-4 py-2">Waktu</th>
                  <th className="border px-4 py-2">Perubahan</th>
                  <th className="border px-4 py-2">Mode</th>
                </tr>
              </thead>
              <tbody>
                {!riwayat.length && !isSettingsLoading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      Belum ada perubahan
                    </td>
                  </tr>
                ) : isSettingsLoading ? (
                    <tr>
                      <td colSpan="4" className="py-4">
                        <div className="flex items-center text-center justify-center">
                          <Loader className="size-8 animate-spin"/>
                        </div>
                      </td>
                    </tr>
                ) : (
                    riwayat.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="border px-4 py-2">{item.akun}</td>
                      <td className="border px-4 py-2">{item.waktu}</td>
                      <td className="border px-4 py-2">{item.perubahan}</td>
                      <td className="border px-4 py-2">{item.mode}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                : `Speed → ${pendingChange.value}`}
              ?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleConfirmChange}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
              >
                Konfirmasi
              </button>
              <button
                onClick={handleCancelChange}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition"
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
