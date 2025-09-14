import React from "react";
import Header from "../component/header";
import ImageSlider from "../component/slide"; // Impor komponen slider
import SCADADiagram from "../component/scada"; // Impor komponen SCADA (pastikan file ini ada)

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-[#F9F4F4]">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header pageName="Dashboard" databaseName="Home / Dashboard" notifications={3} />

        {/* Judul Halaman */}
        <div className="text-center mt-6 drop-shadow-lg">
          <h1 className="text-6xl font-extrabold text-gray-800">Selamat Datang</h1>
          <h2 className="text-4xl font-extrabold text-gray-700 mt-4">
            Monitoring Tambak Udang Vaname
          </h2>
          <h3 className="text-2xl font-semibold text-gray-600 mt-4">
            Petarukan, Kabupaten Pemalang
          </h3>
        </div>

        {/* Rangkaian SCADA */}
        <div className="flex justify-center mt-8">
          <SCADADiagram />
        </div>

        {/* Slider Gambar */}
        <div className="p-4">
          <ImageSlider />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
