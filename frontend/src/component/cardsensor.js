// File: CardSensor.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import { X, Download, RotateCw, Loader2 } from "lucide-react";
import { useDataStore } from "../store/useDataStore";

// Daftarkan chart.js
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const CardSensor = ({
  name,
  displayName,
  value,
  data,
  minValue,
  maxValue,
  unit,
  currentInterval = 60,
  onIntervalChange,
  onRefresh
}) => {
  const { isGraphRefreshing } = useDataStore();
  const [showDetail, setShowDetail] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(currentInterval);

  useEffect(() => {
    setSelectedInterval(currentInterval);
  }, [currentInterval, showDetail]);

  // Fungsi untuk menghitung nilai tertinggi, terendah, dan rata-rata
  const getHighestValue = () => Math.max(...data.map(item => item.value));
  const getLowestValue = () => Math.min(...data.map(item => item.value));
  const getAverageValue = () =>
    (data.reduce((acc, curr) => acc + curr.value, 0) / data.length).toFixed(2);

  // Fungsi menentukan kelas warna angka
  const getValueClass = () => {
    if (value === null) return "text-gray-800";
    if (value < Number(minValue)) return "text-red-500";
    if (value > Number(maxValue)) return "text-green-700";
    return "text-green-400";
  };

  const minY = value !== null && minValue !== undefined ? Number(minValue) * 0.5 : 50;
  const maxY = value !== null && maxValue !== undefined ? Number(maxValue) * 1.5 : 100;

  // Konfigurasi chart
  const chartData = {
    labels: data.map(item => {
      try {
        const date = new Date(item.createdAt);
        return isNaN(date) ? "Invalid Date" : date.toLocaleString();
      } catch {
        return "Invalid Date";
      }
    }),
    datasets: [
      {
        label: "Sensor Value",
        data: data.map(item => item.value),
        borderColor: "#1d4ed8",
        backgroundColor: "rgba(29, 78, 216, 0.1)",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        reverse: true,
        title: { display: true, text: "Waktu", font: { size: 14, weight: "bold" } },
      },
      y: {
        ticks: { stepSize: 5 },
        min: minY,
        max: maxY,
        title: { display: true, text: unit || "Unit", font: { size: 14, weight: "bold" } },
      },
    },
  };

  const downloadChart = () => {
    const link = document.createElement("a");
    link.download = `${name}-chart.png`;
    link.href = document.querySelector("canvas").toDataURL("image/png");
    link.click();
  };

  const handleIntervalChange = (e) => {
    const minutes = Number(e.target.value);
    setSelectedInterval(minutes);
    onIntervalChange?.(minutes);
  };

  const handleRefresh = () => {
    onRefresh?.(selectedInterval);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg text-center border border-gray-300">
      <h2 className="text-xl font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
        {name}
      </h2>
      <p
        className={`text-4xl font-semibold ${getValueClass()}`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {value}
      </p>
      <button
        className="text-black-500 underline mt-2 font-bold"
        onClick={() => setShowDetail(true)}
      >
        Detail
      </button>

      {showDetail && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[70%] md:w-[65%] lg:w-[45%] max-w-5xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-left">{name} Details</h3>
              <div className="flex gap-2">
                <select
                  aria-label="Interval"
                  value={selectedInterval}
                  onChange={handleIntervalChange}
                  className="h-9 min-w-[140px] border border-gray-300 rounded-md px-2 py-1 text-sm disabled:opacity-60"
                  title="Select interval"
                  disabled={isGraphRefreshing}
                >
                  <option value={3}>3 seconds</option>
                  <option value={6}>6 seconds</option>
                  <option value={12}>12 seconds</option>
                  <option value={24}>24 seconds</option>
                </select>

                <button
                  type="button"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-200 transition disabled:opacity-60"
                  onClick={handleRefresh}
                  title={isGraphRefreshing ? "Refreshing..." : "Refresh"}
                  disabled={isGraphRefreshing}
                >
                  {isGraphRefreshing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : (
                    <RotateCw className="h-5 w-5 text-blue-600" />
                  )}
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-200 transition"
                  onClick={downloadChart}
                  title="Download Chart"
                >
                  <Download className="h-5 w-5 text-blue-600" />
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-200 transition"
                  onClick={() => setShowDetail(false)}
                  title="Close"
                >
                  <X className="h-5 w-5 text-blue-600" />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 text-left">
              <div className="flex flex-col gap-4 w-full md:w-1/4">
                <div className="p-4 rounded border border-gray-300 shadow-md text-left">
                  <p className="font-bold text-green-700">Highest</p>
                  <p className="text-3xl font-bold text-blue-500">{getHighestValue()}</p>
                </div>
                <div className="p-4 rounded border border-gray-300 shadow-md text-left">
                  <p className="font-bold text-yellow-700">Average</p>
                  <p className="text-3xl font-bold text-blue-500">{getAverageValue()}</p>
                </div>
                <div className="p-4 rounded border border-gray-300 shadow-md text-left">
                  <p className="font-bold text-red-700">Lowest</p>
                  <p className="text-3xl font-bold text-blue-500">{getLowestValue()}</p>
                </div>
              </div>

              <div className="w-full md:w-2/3" style={{ height: "300px" }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSensor;
