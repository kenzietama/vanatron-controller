// File: Dashboard.js
import React from "react";
import Header from "../component/header";
import ImageSlider from "../component/slide";
import galeri1 from "../gambar/galeri1.jpg";
import vaname from "../gambar/vaname.jpg";
import rangkaian from "../gambar/rangkaian.png";

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9F4F4]">
      {/* Header */}
      <Header
        pageName="Dashboard"
        databaseName="Home / Dashboard"
        notifications={3}
      />

      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-cyan-100 to-blue-200 shadow-md">
        <h1 className="text-5xl font-extrabold text-gray-800 drop-shadow-lg">
          Selamat Datang di Smart Tambak Udang Vaname
        </h1>
        <p className="text-xl font-medium text-gray-600 mt-3">
          Pemantauan cerdas dengan energi terbarukan – Pemalang
        </p>
      </section>

      {/* Rangkaian Alat */}
      <section className="px-8 py-10 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Rangkaian Sistem
        </h2>
        <img
          src={rangkaian}
          alt="Rangkaian Sistem"
          className="rounded-2xl shadow-lg mx-auto w-3/4"
        />
      </section>

      {/* Latar Belakang + Video */}
      <section className="px-8 py-12 bg-white flex flex-col md:flex-row items-center gap-8">
        {/* Teks */}
        <div className="md:w-1/2 text-left">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Latar Belakang
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Tambak udang vaname membutuhkan sistem pemantauan yang efisien agar
            kualitas air tetap terjaga dan hasil panen optimal. Dengan
            menggabungkan teknologi IoT dan energi terbarukan, sistem ini
            dirancang untuk membantu petambak lebih hemat, ramah lingkungan, dan
            produktif.
          </p>
        </div>
        {/* Video */}
        <div className="md:w-1/2 h-[300px] md:h-[350px]">
          <iframe
            className="w-full h-full rounded-2xl shadow-lg"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Video Penjelasan"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* Tentang Udang Vaname */}
      <section className="px-8 py-12 bg-gradient-to-r from-gray-100 to-gray-200 flex flex-col md:flex-row items-center gap-8">
        {/* Gambar */}
        <div className="md:w-1/2">
          <img
            src={vaname}
            alt="Udang Vaname"
            className="rounded-2xl shadow-lg w-full object-cover"
          />
        </div>
        {/* Penjelasan */}
        <div className="md:w-1/2 text-left">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Mengenal Udang Vaname
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Udang Vaname (Litopenaeus vannamei) adalah salah satu komoditas
            unggulan budidaya perikanan. Pertumbuhannya cepat, tahan penyakit,
            dan memiliki permintaan pasar yang tinggi baik dalam negeri maupun
            ekspor. Karena itulah, vaname menjadi pilihan utama petambak di
            Indonesia.
          </p>
        </div>
      </section>

      {/* Galeri Sistem */}
      <section className="px-8 py-10">
        <h2 className="text-3xl font-bold text-gray-1000 text-center mb-8">
          Galeri Sistem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              src: galeri1,
              label: "Panel Surya",
            },
            {
              src: galeri1,
              label: "Turbin Air",
            },
            {
              src: galeri1,
              label: "Kontrol IoT",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:scale-105 transition-transform"
            >
              <img
                src={item.src}
                alt={item.label}
                className="w-full h-48 object-cover"
              />
              <p className="text-center font-semibold text-gray-700 py-3">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-sm">
        © 2025 Sistem Monitoring Tambak Udang – Energi Terbarukan
      </footer>
    </div>
  );
};

export default Dashboard;
