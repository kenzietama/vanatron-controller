import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import Header from "../component/header";
import { Download } from "lucide-react";
import { usePLTSStore } from "../store/usePLTSStore";

const PLTS = () => {
  const {
    latestVFD,
    latestInverterSolis,
    latestInverterSRNE,
    getLatestVFD,
    getLatestInverterSolis,
    getLatestInverterSRNE,
  } = usePLTSStore();

  const [tarifPerKWH, setTarifPerKWH] = useState(1700);

  useEffect(() => {
    getLatestVFD();
    getLatestInverterSolis();
    getLatestInverterSRNE();
  }, [getLatestVFD, getLatestInverterSolis, getLatestInverterSRNE]);

  const generateHistory = (currentValue) => {
    return [
      { label: "A", value: currentValue - 40 },
      { label: "B", value: currentValue - 30 },
      { label: "C", value: currentValue - 20 },
      { label: "D", value: currentValue - 10 },
      { label: "E", value: currentValue },
    ];
  };

  const handleDownload = (chartId) => {
    const chart = document.getElementById(chartId);
    if (chart) {
      const link = document.createElement("a");
      link.href = chart.toDataURL("image/png");
      link.download = `${chartId}.png`;
      link.click();
    } else {
      console.error("Chart tidak ditemukan:", chartId);
    }
  };

  const pvPower = latestInverterSRNE?.pv_power || 0;
  const batteryLevel = latestInverterSRNE?.battery_level || 0;
  const vfdOutputPower = latestVFD?.output_power || 0;
  const thismonthenergy = latestInverterSolis?.this_month_energy || 0;
  const totalBiayaKWH = thismonthenergy * tarifPerKWH;

  return (
    <div className="flex min-h-screen bg-[#F9F4F4]">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <Header pageName="PLTS" databaseName="Database / PLTS" notifications={0} />

        {/* Konten utama */}
        <div className="flex flex-col items-center justify-center w-full p-6">
          {/* Grid utama mirip dengan halaman Monitoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1300px]">
            {/* Watt Panel Surya */}
            <div className="flex flex-col items-center p-5 bg-white border border-gray-300 shadow-md rounded-xl">
              <h2 className="text-lg font-bold text-gray-800">Watt Panel Surya</h2>
              <p className="mt-2 text-4xl font-bold text-blue-600">{pvPower}</p>
              <p className="mb-2 text-sm text-gray-500">WATT</p>
              <div className="relative w-full h-[180px]">
                <button
                  className="absolute top-[-25px] right-[8px] cursor-pointer p-1 rounded hover:bg-gray-200"
                  onClick={() => handleDownload("chart-1")}
                >
                  <Download className="w-5 h-5 text-blue-600" />
                </button>
                <Line
                  id="chart-1"
                  data={{
                    labels: generateHistory(pvPower).map((p) => p.label),
                    datasets: [
                      {
                        label: "Watt Panel Surya History",
                        data: generateHistory(pvPower).map((p) => p.value),
                        borderColor: "rgba(53, 162, 235, 1)",
                        backgroundColor: "rgba(53, 162, 235, 0.3)",
                        fill: true,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { display: false },
                      y: { beginAtZero: true, ticks: { stepSize: 50 } },
                    },
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Watt Turbin */}
            <div className="flex flex-col items-center p-5 bg-white border border-gray-300 shadow-md rounded-xl">
              <h2 className="text-lg font-bold text-gray-800">Watt Turbin</h2>
              <p className="mt-2 text-4xl font-bold text-blue-600">{vfdOutputPower}</p>
              <p className="mb-2 text-sm text-gray-500">WATT</p>
              <div className="relative w-full h-[180px]">
                <button
                  className="absolute top-[-25px] right-[8px] cursor-pointer p-1 rounded hover:bg-gray-200"
                  onClick={() => handleDownload("chart-2")}
                >
                  <Download className="w-5 h-5 text-blue-600" />
                </button>
                <Line
                  id="chart-2"
                  data={{
                    labels: generateHistory(vfdOutputPower).map((p) => p.label),
                    datasets: [
                      {
                        label: "Watt Turbin History",
                        data: generateHistory(vfdOutputPower).map((p) => p.value),
                        borderColor: "rgba(53, 162, 235, 1)",
                        backgroundColor: "rgba(53, 162, 235, 0.3)",
                        fill: true,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { display: false },
                      y: { beginAtZero: true, ticks: { stepSize: 50 } },
                    },
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>

            {/* Battery Capacity */}
            <div className="flex flex-col items-center p-5 bg-white border border-gray-300 shadow-md rounded-xl">
              <h2 className="text-lg font-bold text-gray-800">Battery Capacity</h2>
              <p className="mt-2 text-4xl font-bold text-blue-600">{batteryLevel}</p>
              <p className="mb-2 text-sm text-gray-500">%</p>
              <div className="relative w-full h-[180px]">
                <button
                  className="absolute top-[-25px] right-[8px] cursor-pointer p-1 rounded hover:bg-gray-200"
                  onClick={() => handleDownload("chart-3")}
                >
                  <Download className="w-5 h-5 text-blue-600" />
                </button>
                <Line
                  id="chart-3"
                  data={{
                    labels: generateHistory(batteryLevel).map((p) => p.label),
                    datasets: [
                      {
                        label: "Battery Capacity History",
                        data: generateHistory(batteryLevel).map((p) => p.value),
                        borderColor: "rgba(53, 162, 235, 1)",
                        backgroundColor: "rgba(53, 162, 235, 0.3)",
                        fill: true,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { display: false },
                      y: { beginAtZero: true, ticks: { stepSize: 50 } },
                    },
                    plugins: { legend: { display: false } },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bagian bawah: total KWH dan penghematan */}
          <div className="w-full max-w-[1300px] bg-white rounded-xl shadow-md border border-gray-300 mt-8 p-6">
            <h2 className="mb-4 text-xl font-bold text-center text-gray-800">
              Total KWH & Penghematan Listrik
            </h2>

            <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Total KWH yang Dihasilkan
                </h3>
                <p className="mt-2 text-4xl font-bold text-blue-600">{thismonthenergy}</p>
                <p className="text-sm text-gray-600">KWH dalam satu bulan</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Total Pengeluaran yang Dihemat
                </h3>
                <p className="mt-2 text-4xl font-bold text-green-600">
                  Rp {totalBiayaKWH.toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-gray-600">Berdasarkan tarif saat ini</p>
              </div>
            </div>

            {/* Input Tarif */}
            <div className="flex flex-col items-center justify-center gap-3 mt-6 sm:flex-row">
              <label className="text-sm font-medium text-gray-700">
                Tarif per KWH (Rp):
              </label>
              <input
                type="number"
                className="w-40 px-4 py-2 text-center text-gray-800 transition-all duration-200 ease-in-out border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={tarifPerKWH}
                onChange={(e) => setTarifPerKWH(Number(e.target.value))}
                placeholder="Masukkan tarif"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PLTS;
