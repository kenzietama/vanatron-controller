import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import Header from "../component/header";
import { Download } from "lucide-react";
import { usePLTSStore } from "../store/usePLTSStore";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const PLTS = () => {

  const {
    latestVFD,
    latestInverterSRNE,
    graphVFD,
    graphInverterSRNE,
    getLatestData,
    getGraph,
    subscribe
  } = usePLTSStore();

  const [tarifPerKWH, setTarifPerKWH] = useState(1700);

  useEffect(() => {
    getLatestData();
    getGraph();
    subscribe();
  }, []);

  // ================================
  // FORMAT WAKTU
  // ================================
  const formatTime = (data) => {

    const time =
      data.created_at ||
      data.createdAt ||
      data.timestamp ||
      data.time ||
      data.date;

    if (!time) return "-";

    const d = new Date(time);

    if (isNaN(d)) return "-";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    const hour = String(d.getHours()).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    const second = String(d.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hour}.${minute}.${second}`;
  };

  // ================================
  // DATA TERAKHIR
  // ================================

  const last10PV = graphInverterSRNE.slice(-10);
  const last10VFD = graphVFD.slice(-10);

  const pvPower = latestInverterSRNE?.pv_power || 0;
  const batteryLevel = latestInverterSRNE?.battery_level || 0;
  const vfdOutputPower = latestVFD?.output_power || 0;

  const totalBiayaKWH = vfdOutputPower * tarifPerKWH;

  // ================================
  // DOWNLOAD CHART
  // ================================

  const handleDownload = (chartId) => {

    const chart = document.getElementById(chartId);

    if (chart) {
      const link = document.createElement("a");
      link.href = chart.toDataURL("image/png");
      link.download = `${chartId}.png`;
      link.click();
    }
  };

  // ================================
  // OPTIONS DASAR CHART
  // ================================

  const baseChartOptions = (yMax, label) => ({
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: { display: false }
    },

    scales: {

      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },

      y: {
        min: 0,
        max: yMax,
        title: {
          display: true,
          text: label
        }
      }

    },

    elements: {
      point: {
        radius: 5,
        borderWidth: 2
      },
      line: {
        tension: 0, // garis lurus
        borderWidth: 3
      }
    }

  });

  return (

    <div className="flex min-h-screen bg-[#F9F4F4]">

      <div className="flex flex-col flex-1">

        <Header pageName="PLTS"/>

        <div className="flex flex-col items-center justify-center w-full p-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1300px]">

            {/* ================= PANEL SURYA ================= */}

            <div className="flex flex-col items-center p-5 bg-white border border-gray-300 shadow-md rounded-xl">

              <h2 className="text-lg font-bold text-gray-800">
                Watt Panel Surya
              </h2>

              <p className="mt-2 text-4xl font-bold text-blue-600">
                {pvPower}
              </p>

              <p className="mb-2 text-sm text-gray-500">
                WATT
              </p>

              <div className="relative w-full h-[220px]">

                <button
                  className="absolute top-[-25px] right-[8px] p-1 rounded hover:bg-gray-200"
                  onClick={() => handleDownload("chart-1")}
                >
                  <Download className="w-5 h-5 text-blue-600"/>
                </button>

                <Line
                  id="chart-1"
                  data={{
                    labels: last10PV.map(d => formatTime(d)),
                    datasets: [
                      {
                        data: last10PV.map(d => d.pv_power),
                        borderColor: "#3366cc",
                        backgroundColor: "rgba(51,102,204,0.2)",
                        fill: true
                      }
                    ]
                  }}
                  options={baseChartOptions(1000, "Watt")}
                />

              </div>
            </div>

            {/* ================= TURBIN ================= */}

            <div className="flex flex-col items-center p-5 bg-white border border-gray-300 shadow-md rounded-xl">

              <h2 className="text-lg font-bold text-gray-800">
                Watt Turbin
              </h2>

              <p className="mt-2 text-4xl font-bold text-blue-600">
                {vfdOutputPower}
              </p>

              <p className="mb-2 text-sm text-gray-500">
                WATT
              </p>

              <div className="relative w-full h-[220px]">

                <button
                  className="absolute top-[-25px] right-[8px] p-1 rounded hover:bg-gray-200"
                  onClick={() => handleDownload("chart-2")}
                >
                  <Download className="w-5 h-5 text-blue-600"/>
                </button>

                <Line
                  id="chart-2"
                  data={{
                    labels: last10VFD.map(d => formatTime(d)),
                    datasets: [
                      {
                        data: last10VFD.map(d => d.output_power),
                        borderColor: "#3366cc",
                        backgroundColor: "rgba(51,102,204,0.2)",
                        fill: true
                      }
                    ]
                  }}
                  options={baseChartOptions(1000, "Watt")}
                />

              </div>
            </div>

            {/* ================= BATTERY ================= */}

            <div className="flex flex-col items-center p-5 bg-white border border-gray-300 shadow-md rounded-xl">

              <h2 className="text-lg font-bold text-gray-800">
                Battery Capacity
              </h2>

              <p className="mt-2 text-4xl font-bold text-blue-600">
                {batteryLevel}
              </p>

              <p className="mb-2 text-sm text-gray-500">
                %
              </p>

              <div className="relative w-full h-[220px]">

                <button
                  className="absolute top-[-25px] right-[8px] p-1 rounded hover:bg-gray-200"
                  onClick={() => handleDownload("chart-3")}
                >
                  <Download className="w-5 h-5 text-blue-600"/>
                </button>

                <Line
                  id="chart-3"
                  data={{
                    labels: last10PV.map(d => formatTime(d)),
                    datasets: [
                      {
                        data: last10PV.map(d => d.battery_level),
                        borderColor: "#3366cc",
                        backgroundColor: "rgba(51,102,204,0.2)",
                        fill: true
                      }
                    ]
                  }}
                  options={baseChartOptions(100, "%")}
                />

              </div>
            </div>

          </div>

          {/* ================= KWH ================= */}

          <div className="w-full max-w-[1300px] bg-white rounded-xl shadow-md border border-gray-300 mt-8 p-6">

            <h2 className="mb-4 text-xl font-bold text-center text-gray-800">
              Total KWH & Penghematan Listrik
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">

              <div>

                <h3 className="text-lg font-semibold text-gray-700">
                  Total KWH yang Dihasilkan
                </h3>

                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {vfdOutputPower}
                </p>

                <p className="text-sm text-gray-600">
                  KWH dalam satu bulan
                </p>

              </div>

              <div>

                <h3 className="text-lg font-semibold text-gray-700">
                  Total Pengeluaran yang Dihemat
                </h3>

                <p className="text-4xl font-bold text-green-600 mt-2">
                  Rp {totalBiayaKWH.toLocaleString("id-ID")}
                </p>

                <p className="text-sm text-gray-600">
                  Berdasarkan tarif saat ini
                </p>

              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">

              <label className="text-sm font-medium text-gray-700">
                Tarif per KWH (Rp)
              </label>

              <input
                type="number"
                value={tarifPerKWH}
                onChange={(e) => setTarifPerKWH(Number(e.target.value))}
                className="w-40 px-4 py-2 border rounded-lg text-center"
              />

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default PLTS;