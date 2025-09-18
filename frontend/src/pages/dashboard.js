import React from "react";
import Header from "../component/header";
import ImageSlider from "../component/slide";
import SCADADiagram from "../component/scada";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-[#F9F4F4]">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          pageName="Dashboard"
          databaseName="Home / Dashboard"
          notifications={3}
        />

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

        {/* Gambar dari Internet */}
        <div className="flex justify-center mt-8">
          <img
            src="https://www.google.com/url?sa=i&url=https%3A%2F%2Funair.ac.id%2Fmengapa-dampak-probiotik-yang-diaplikasikan-di-tambak-udang-sering-kali-bervariasi%2F&psig=AOvVaw1zSfKSeMYwXz6T2V2Znj-f&ust=1758182498241000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCNj0gqyq348DFQAAAAAdAAAAABAE"
            alt="Tambak Udang"
            className="rounded-2xl shadow-lg w-2/3"
          />
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
