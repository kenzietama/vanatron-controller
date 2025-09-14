import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import Header from "../component/header";
import downloadIcon from "../ikon/download.png";
import { usePLTSStore } from "../store/usePLTSStore"; // Mengimpor store PLTS

const PLTS = () => {
  const { 
    latestVFD, 
    latestInverterSolis,
    latestInverterSRNE, 
    getLatestVFD,
    getLatestInverterSolis, 
    getLatestInverterSRNE 
  } = usePLTSStore();

  const [tarifPerKWH, setTarifPerKWH] = useState(1700); // Tarif default dalam rupiah

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
  
  // Menghitung biaya KWH
  const totalBiayaKWH = thismonthenergy * tarifPerKWH;

  return (
    <div className="flex h-fullscreen bg-[#F9F4F4]">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header pageName="PLTS" databaseName="Database / PLTS" notifications={0} />
        <div className="p-4 flex flex-col items-center">
          
          {/* Container untuk dua box atas */}
          <div className="flex flex-row gap-4">
            {/* Watt Panel Surya */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-300 w-[440px] h-[300px]">
              <div className="text-center">
                <h2 className="text-lg font-bold">Watt Panel Surya</h2>
                <p className="text-3xl font-bold text-blue-600">{pvPower}</p>
                <p className="text-sm text-gray-500">WATT</p>
              </div>
              <div className="relative w-full h-[200px]">
                <img src={downloadIcon} alt="Download" className="absolute top-[-30px] right-[10px] cursor-pointer w-6 h-6" onClick={() => handleDownload("chart-1")} />
                <Line id="chart-1" data={{ labels: generateHistory(pvPower).map((point) => point.label), datasets: [{ label: "Watt Panel Surya History", data: generateHistory(pvPower).map((point) => point.value), borderColor: "rgba(53, 162, 235, 1)", backgroundColor: "rgba(53, 162, 235, 0.4)", fill: true, tension: 0.3 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: "Waktu (s)" } }, y: { title: { display: true, text: "Nilai" }, beginAtZero: true, ticks: { stepSize: 50 } } }, plugins: { legend: { display: false } } }} />
              </div>
            </div>

            {/* Watt Turbin */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-300 w-[440px] h-[300px]">
              <div className="text-center">
                <h2 className="text-lg font-bold">Watt Turbin</h2>
                <p className="text-3xl font-bold text-blue-600">{vfdOutputPower}</p>
                <p className="text-sm text-gray-500">WATT</p>
              </div>
              <div className="relative w-full h-[200px]">
                <img src={downloadIcon} alt="Download" className="absolute top-[-30px] right-[10px] cursor-pointer w-6 h-6" onClick={() => handleDownload("chart-2")} />
                <Line id="chart-2" data={{ labels: generateHistory(vfdOutputPower).map((point) => point.label), datasets: [{ label: "Watt Turbin History", data: generateHistory(vfdOutputPower).map((point) => point.value), borderColor: "rgba(53, 162, 235, 1)", backgroundColor: "rgba(53, 162, 235, 0.4)", fill: true, tension: 0.3 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: "Waktu (s)" } }, y: { title: { display: true, text: "Nilai" }, beginAtZero: true, ticks: { stepSize: 50 } } }, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>

          {/* Battery Capacity */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-300 w-[440px] h-[300px] mt-4">
            <div className="text-center">
              <h2 className="text-lg font-bold">Battery Capacity</h2>
              <p className="text-3xl font-bold text-blue-600">{batteryLevel}</p>
              <p className="text-sm text-gray-500">%</p>
            </div>
            <div className="relative w-full h-[200px]">
              <img src={downloadIcon} alt="Download" className="absolute top-[-30px] right-[10px] cursor-pointer w-6 h-6" onClick={() => handleDownload("chart-3")} />
              <Line id="chart-3" data={{ labels: generateHistory(batteryLevel).map((point) => point.label), datasets: [{ label: "Battery Capacity History", data: generateHistory(batteryLevel).map((point) => point.value), borderColor: "rgba(53, 162, 235, 1)", backgroundColor: "rgba(53, 162, 235, 0.4)", fill: true, tension: 0.3 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: "Waktu (s)" } }, y: { title: { display: true, text: "Nilai" }, beginAtZero: true, ticks: { stepSize: 50 } } }, plugins: { legend: { display: false } } }} />
            </div>
          </div>

          {/* Section untuk KWH & Penghematan */}
          <div className="w-full bg-white p-6 mt-6 rounded-lg shadow p-4 border border-gray-300">
            <h2 className="text-xl font-bold text-gray-800 text-center">
              Total KWH dan Penghematan Biaya Listrik 
            </h2>

            <div className="mt-4 flex justify-around items-center">
              {/* Total KWH yang Dihasilkan */}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-700">Total KWH yang Dihasilkan</h3>
                <p className="text-4xl font-bold text-blue-600">{thismonthenergy}</p>
                <p className="text-sm text-gray-600">KWH dalam satu bulan</p>
              </div>

              {/* Total Pengeluaran yang Dihemat */}
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-700">Total Pengeluaran yang Dihemat</h3>
                <p className="text-4xl font-bold text-green-600">Rp {totalBiayaKWH.toLocaleString("id-ID")}</p>
                <p className="text-sm text-gray-600">Berdasarkan tarif saat ini</p>
              </div>
            </div>

            {/* Input Tarif KWH */}
            <div className="mt-6 flex justify-center items-center">
              <label className="text-sm text-gray-700 mr-3 font-medium">
                Tarif per KWH (Rp):
              </label>
              <input
                type="number"
                className="border border-gray-300 rounded-lg px-4 py-2 w-32 text-center text-gray-800 shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
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
