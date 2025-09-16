// File: CardSensor.jsx
import React, { useState } from "react";
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
import { X, Download } from "lucide-react"; // Gunakan lucide-react

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

const CardSensor = ({ name, displayName, value, data, unit }) => {
  const [showDetail, setShowDetail] = useState(false);

  // Fungsi untuk menghitung nilai tertinggi, terendah, dan rata-rata
  const getHighestValue = () => Math.max(...data.map(item => item.value));
  const getLowestValue = () => Math.min(...data.map(item => item.value));
  const getAverageValue = () =>
    (data.reduce((acc, curr) => acc + curr.value, 0) / data.length).toFixed(2);

  // Konfigurasi untuk grafik garis
  const chartData = {
    labels: data.map(item => {
      try {
        const date = new Date(item.createdAt);
        if (isNaN(date)) throw new Error("Invalid date format");
        return date.toLocaleString();
      } catch (error) {
        console.error("Error parsing date:", error);
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

  const getValueColor = () => {
    if (displayName.toLowerCase().includes("do")) {
      return value < 4 ? "text-red-500" : "text-green-600";
    }
    if (displayName.toLowerCase().includes("temperatur")) {
      return value < 25 || value > 40 ? "text-red-500" : "text-green-600";
    }
    if (displayName.toLowerCase().includes("sun radiation")) {
      return value < 300 || value > 800 ? "text-red-500" : "text-green-600";
    }
    if (displayName.toLowerCase().includes("humidity")) {
      return value < 21 || value > 100 ? "text-red-500" : "text-green-600";
    }
    if (displayName.toLowerCase().includes("battery voltage")) {
      return value < 40 || value > 53 ? "text-red-500" : "text-green-600";
    }
    return "text-blue-500";
  };

  const unitLabel = unit || "Unit";
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
        title: {
          display: true,
          text: "Waktu",
          font: { size: 14, weight: "bold" },
        },
      },
      y: {
        ticks: { stepSize: 5 },
        min: 50,
        max: 100,
        title: {
          display: true,
          text: unitLabel,
          font: { size: 14, weight: "bold" },
        },
      },
    },
  };

  const downloadChart = () => {
    const link = document.createElement("a");
    link.download = `${name}-chart.png`;
    link.href = document.querySelector("canvas").toDataURL("image/png");
    link.click();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg text-center border border-gray-300">
      <h2 className="text-xl font-bold" style={{ fontFamily: "Inter, sans-serif" }}>
        {name}
      </h2>
      <p
        className={`text-4xl font-semibold ${getValueColor()}`}
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

      {/* Pop-up Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[70%] md:w-[65%] lg:w-[45%] max-w-5xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-left">{name} Details</h3>
              <div className="flex gap-2">
                {/* Tombol Download */}
                <button
                  className="p-2 rounded-lg hover:bg-gray-200 transition"
                  onClick={downloadChart}
                  title="Download Chart"
                >
                  <Download className="h-6 w-6 text-blue-600" />
                </button>

                {/* Tombol Close */}
                <button
                  className="p-2 rounded-lg hover:bg-gray-200 transition"
                  onClick={() => setShowDetail(false)}
                  title="Close"
                >
                  <X className="h-6 w-6 text-blue-600" />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 text-left">
              {/* Kotak Data */}
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

              {/* Grafik Line */}
              <div className="w-full md:w-2/3">
                <div style={{ height: "300px", width: "100%" }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSensor;
